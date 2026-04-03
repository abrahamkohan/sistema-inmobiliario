// supabase/functions/notify-new-lead/index.ts
// Triggered by database webhook: clients INSERT
// Notifies all admins when a new lead is registered

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamada',
  meeting: 'Reunión',
  email: 'Email',
  visit: 'Visita',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const payload = await req.json()
    const record = payload.record

    // Solo leads
    if (record.tipo !== 'lead') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not a lead' }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener IDs de admins
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (rolesError) throw rolesError
    if (!adminRoles?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Obtener emails de los admins via Admin API
    const emailPromises = adminRoles.map(async ({ user_id }) => {
      const { data } = await supabase.auth.admin.getUserById(user_id)
      return data?.user?.email ?? null
    })
    const emails = (await Promise.all(emailPromises)).filter(Boolean) as string[]

    if (!emails.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no admin emails' }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
    const FROM = Deno.env.get('RESEND_FROM') ?? 'Kohan & Campos <onboarding@resend.dev>'

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #14223A; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <p style="color: #fff; font-weight: 700; font-size: 16px; margin: 0;">Kohan &amp; Campos</p>
          <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0 0;">Nuevo lead registrado</p>
        </div>
        <div style="background: #fff; border: 1px solid #e4e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 18px; color: #14223A; margin: 0 0 16px;">📋 ${record.full_name}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${record.phone ? `<tr><td style="padding: 6px 0; color: #6b7280;">Teléfono</td><td style="padding: 6px 0; color: #1a1f2b;">${record.phone}</td></tr>` : ''}
            ${record.fuente ? `<tr><td style="padding: 6px 0; color: #6b7280;">Fuente</td><td style="padding: 6px 0; color: #1a1f2b;">${record.fuente}</td></tr>` : ''}
            ${record.nationality ? `<tr><td style="padding: 6px 0; color: #6b7280;">Nacionalidad</td><td style="padding: 6px 0; color: #1a1f2b;">${record.nationality}</td></tr>` : ''}
            ${record.notes ? `<tr><td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Notas</td><td style="padding: 6px 0; color: #1a1f2b;">${record.notes}</td></tr>` : ''}
          </table>
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Registrado el ${new Date(record.created_at).toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}
            </p>
          </div>
        </div>
      </div>
    `

    const results = await Promise.allSettled(
      emails.map(email =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM,
            to: email,
            subject: `Nuevo lead: ${record.full_name}`,
            html,
          }),
        }).then(r => r.json())
      )
    )

    // Telegram
    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const TELEGRAM_CHATS = Deno.env.get('TELEGRAM_CHAT_IDS')
    if (TELEGRAM_TOKEN && TELEGRAM_CHATS) {
      const chatIds = TELEGRAM_CHATS.split(',').map(s => s.trim()).filter(Boolean)
      const text = [
        `📋 *Nuevo lead: ${record.full_name}*`,
        record.phone       ? `📞 ${record.phone}`        : null,
        record.fuente      ? `📌 Fuente: ${record.fuente}` : null,
        record.nationality ? `🌍 ${record.nationality}`   : null,
        record.notes       ? `💬 ${record.notes}`         : null,
      ].filter(Boolean).join('\n')

      await Promise.allSettled(
        chatIds.map(chatId =>
          fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
          })
        )
      )
    }

    const sent = results.filter(r => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ ok: true, sent, total: emails.length }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-new-lead error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
