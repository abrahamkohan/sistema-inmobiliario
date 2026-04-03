// supabase/functions/notify-commission/index.ts
// DB webhook: commissions INSERT
// Notifica al equipo cuando se cierra una venta

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    .format(cents / 100)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const payload = await req.json()
    const record  = payload.record

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener nombre del agente
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', record.agent_id)
      .single()

    // Obtener nombre del cliente
    const { data: client } = await supabase
      .from('clients')
      .select('full_name')
      .eq('id', record.client_id)
      .single()

    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const TELEGRAM_CHATS = Deno.env.get('TELEGRAM_CHAT_IDS') ?? ''
    const chatIds = TELEGRAM_CHATS.split(',').map(s => s.trim()).filter(Boolean)

    if (!chatIds.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const commissionAmount = record.commission_usd_cents
      ? formatUsd(record.commission_usd_cents)
      : record.commission_pyg
        ? `₲ ${record.commission_pyg.toLocaleString('es-PY')}`
        : 'N/D'

    const text = [
      `🎉 *¡Venta cerrada!*`,
      `👤 Cliente: ${client?.full_name ?? 'N/D'}`,
      `🏠 Agente: ${profile?.full_name ?? 'N/D'}`,
      `💰 Comisión: ${commissionAmount}`,
      record.notes ? `📝 ${record.notes}` : null,
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
    console.error('notify-commission error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
