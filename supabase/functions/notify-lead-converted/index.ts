// supabase/functions/notify-lead-converted/index.ts
// DB webhook: clients UPDATE
// Notifica cuando un lead pasa a cliente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const payload = await req.json()
    const record     = payload.record
    const old_record = payload.old_record

    // Solo cuando tipo cambia de 'lead' a 'cliente'
    if (old_record?.tipo !== 'lead' || record.tipo !== 'cliente') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const TELEGRAM_CHATS = Deno.env.get('TELEGRAM_CHAT_IDS') ?? ''
    const chatIds = TELEGRAM_CHATS.split(',').map(s => s.trim()).filter(Boolean)

    if (!chatIds.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const text = [
      `✅ *Lead convertido a cliente*`,
      `👤 ${record.full_name}`,
      record.phone ? `📞 ${record.phone}` : null,
      record.fuente ? `📌 Fuente: ${record.fuente}` : null,
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

    return new Response(JSON.stringify({ ok: true, sent: chatIds.length }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-lead-converted error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
