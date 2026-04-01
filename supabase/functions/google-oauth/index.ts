// supabase/functions/google-oauth/index.ts
// Maneja el flujo OAuth de Google Calendar para la consultora.
// Acciones: status | authorize | callback
// Los tokens se cifran con AES-256-GCM antes de persistir.
// NUNCA se loguean tokens ni payloads OAuth sensibles.

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

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // ── Auth: requiere sesión activa ──────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    // ── Clientes y env vars ───────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const CLIENT_ID      = Deno.env.get('GOOGLE_CLIENT_ID')!
    const CLIENT_SECRET  = Deno.env.get('GOOGLE_CLIENT_SECRET')!
    const REDIRECT_URI   = Deno.env.get('GOOGLE_REDIRECT_URI')!
    const ENCRYPTION_KEY = Deno.env.get('GCAL_ENCRYPTION_KEY')!

    const body = await req.json().catch(() => ({}))
    const action = body?.action as string | undefined

    // ── STATUS ────────────────────────────────────────────────────────────────
    if (action === 'status') {
      const { data } = await supabase
        .from('consultora_google_tokens')
        .select('id')
        .eq('id', 1)
        .maybeSingle()
      return json({ connected: !!data })
    }

    // ── AUTHORIZE ─────────────────────────────────────────────────────────────
    if (action === 'authorize') {
      const state = body?.state as string | undefined
      if (!state) return json({ error: 'Missing state' }, 400)

      const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         'https://www.googleapis.com/auth/calendar.events',
        access_type:   'offline',
        prompt:        'consent',
        state,
      })
      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
    }

    // ── CALLBACK ──────────────────────────────────────────────────────────────
    if (action === 'callback') {
      const code = body?.code as string | undefined
      if (!code) return json({ error: 'Missing code' }, 400)

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri:  REDIRECT_URI,
          grant_type:    'authorization_code',
        }),
      })

      if (!tokenRes.ok) {
        // Solo se logua el status code, nunca el body (puede contener tokens)
        console.error('google-oauth callback: token exchange failed, HTTP', tokenRes.status)
        return json({ error: 'Token exchange failed' }, 502)
      }

      const tokens = await tokenRes.json()

      if (!tokens.access_token || !tokens.refresh_token) {
        console.error('google-oauth callback: incomplete token response')
        return json({ error: 'Incomplete token response' }, 502)
      }

      // Cifrar antes de persistir
      const accessEnc  = await encrypt(tokens.access_token,  ENCRYPTION_KEY)
      const refreshEnc = await encrypt(tokens.refresh_token, ENCRYPTION_KEY)
      const expiresAt  = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()

      const { error: upsertError } = await supabase
        .from('consultora_google_tokens')
        .upsert({
          id:                1,
          access_token_enc:  accessEnc,
          refresh_token_enc: refreshEnc,
          expires_at:        expiresAt,
          updated_at:        new Date().toISOString(),
        })

      if (upsertError) {
        console.error('google-oauth callback: upsert error', upsertError.code)
        return json({ error: 'Storage error' }, 500)
      }

      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (err) {
    console.error('google-oauth error:', err instanceof Error ? err.message : 'unknown error')
    return json({ error: 'Internal error' }, 500)
  }
})
