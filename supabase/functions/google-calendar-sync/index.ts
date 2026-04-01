// supabase/functions/google-calendar-sync/index.ts
// Crea un evento en Google Calendar para una tarea elegible.
// Llamado fire-and-forget desde el frontend al crear una tarea.
// Si Google no está conectado o falla, retorna silenciosamente (nunca bloquea).
// NUNCA se loguean tokens, access_token, refresh_token ni payloads OAuth.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ──────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// ── Crypto: AES-256-GCM ───────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function decrypt(encryptedBase64: string, keyHex: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
  const iv         = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const key = await crypto.subtle.importKey(
    'raw', hexToBytes(keyHex), { name: 'AES-GCM' }, false, ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', hexToBytes(keyHex), { name: 'AES-GCM' }, false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(12 + cipherBuffer.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(cipherBuffer), 12)
  return btoa(String.fromCharCode(...combined))
}

// ── Config ────────────────────────────────────────────────────────────────────

const DURATION_MIN: Record<string, number> = {
  call:    30,
  meeting: 60,
  visit:   60,
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { task_id } = await req.json()
    if (!task_id) return json({ error: 'Missing task_id' }, 400)

    const ENCRYPTION_KEY = Deno.env.get('GCAL_ENCRYPTION_KEY')!
    const CLIENT_ID      = Deno.env.get('GOOGLE_CLIENT_ID')!
    const CLIENT_SECRET  = Deno.env.get('GOOGLE_CLIENT_SECRET')!

    // ── Leer tarea ────────────────────────────────────────────────────────────
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, type, due_date, notes, meet_link, lead_id, google_event_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      console.error('google-calendar-sync: task not found', task_id)
      return json({ ok: false, reason: 'task_not_found' })
    }

    // Evitar duplicados: si ya tiene evento creado, no crear otro
    if (task.google_event_id) {
      return json({ ok: false, reason: 'already_synced' })
    }

    // ── Leer nombre del lead si aplica ────────────────────────────────────────
    let leadName: string | null = null
    if (task.lead_id) {
      const { data: lead } = await supabase
        .from('clients')
        .select('full_name')
        .eq('id', task.lead_id)
        .single()
      leadName = lead?.full_name ?? null
    }

    // ── Leer tokens cifrados ──────────────────────────────────────────────────
    const { data: tokenRow } = await supabase
      .from('consultora_google_tokens')
      .select('access_token_enc, refresh_token_enc, expires_at, calendar_id')
      .eq('id', 1)
      .maybeSingle()

    if (!tokenRow) {
      // Google no está conectado — silencioso, es sync opcional
      return json({ ok: false, reason: 'not_connected' })
    }

    // ── Descifrar y refrescar si expiró ───────────────────────────────────────
    let accessToken = await decrypt(tokenRow.access_token_enc, ENCRYPTION_KEY)

    if (new Date(tokenRow.expires_at).getTime() - Date.now() < 60_000) {
      const refreshToken = await decrypt(tokenRow.refresh_token_enc, ENCRYPTION_KEY)

      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token: refreshToken,
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      })

      if (!refreshRes.ok) {
        console.error('google-calendar-sync: token refresh failed, HTTP', refreshRes.status)
        return json({ ok: false, reason: 'refresh_failed' })
      }

      const refreshData = await refreshRes.json()
      accessToken = refreshData.access_token
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString()
      const newAccessEnc = await encrypt(accessToken, ENCRYPTION_KEY)

      await supabase
        .from('consultora_google_tokens')
        .update({ access_token_enc: newAccessEnc, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
        .eq('id', 1)
    }

    // ── Construir evento ──────────────────────────────────────────────────────
    const start      = new Date(task.due_date)
    const end        = new Date(start.getTime() + (DURATION_MIN[task.type] ?? 60) * 60_000)
    const title      = leadName ? `${task.title} — ${leadName}` : task.title
    const descParts: string[] = []
    if (leadName)       descParts.push(`Contacto: ${leadName}`)
    if (task.notes)     descParts.push(task.notes)
    if (task.meet_link) descParts.push(`Link de reunión: ${task.meet_link}`)

    const calendarId = tokenRow.calendar_id ?? 'primary'

    // ── Llamar a Google Calendar API ──────────────────────────────────────────
    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary:     title,
          description: descParts.length ? descParts.join('\n\n') : undefined,
          start: { dateTime: start.toISOString(), timeZone: 'America/Asuncion' },
          end:   { dateTime: end.toISOString(),   timeZone: 'America/Asuncion' },
        }),
      }
    )

    if (!eventRes.ok) {
      console.error('google-calendar-sync: event creation failed, HTTP', eventRes.status)
      return json({ ok: false, reason: 'event_creation_failed' })
    }

    const eventData = await eventRes.json()
    const googleEventId = eventData.id as string

    // ── Guardar ID del evento en la tarea ─────────────────────────────────────
    await supabase
      .from('tasks')
      .update({ google_event_id: googleEventId })
      .eq('id', task_id)

    return json({ ok: true })

  } catch (err) {
    console.error('google-calendar-sync error:', err instanceof Error ? err.message : 'unknown error')
    return json({ error: 'Internal error' }, 500)
  }
})
