// supabase/functions/telegram-bot/index.ts
// Webhook receptor de mensajes del bot de Telegram
// Comandos: /start, /tareas, /leads, /resumen

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function paraguayToday(): string {
  const d = new Date()
  d.setUTCHours(d.getUTCHours() - 4)
  return d.toISOString().split('T')[0]
}

async function sendMessage(token: string, chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

serve(async (req) => {
  try {
    const body = await req.json()
    const message = body.message
    if (!message?.text) return new Response('ok')

    const chatId   = message.chat.id
    const text     = message.text.trim()
    const command  = text.split(' ')[0].toLowerCase()

    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar usuario por telegram_chat_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('telegram_chat_id', String(chatId))
      .single()

    if (command === '/start') {
      if (profile) {
        await sendMessage(TELEGRAM_TOKEN, chatId,
          `👋 ¡Hola ${profile.full_name ?? 'de nuevo'}!\n\nComandos disponibles:\n/tareas — tus tareas de hoy\n/leads — últimos leads\n/resumen — resumen del día`)
      } else {
        await sendMessage(TELEGRAM_TOKEN, chatId,
          `👋 ¡Hola! Para vincular tu cuenta, pedile a tu admin que configure tu Telegram ID en el sistema.\n\nTu chat ID es: \`${chatId}\``)
      }
      return new Response('ok')
    }

    if (!profile) {
      await sendMessage(TELEGRAM_TOKEN, chatId,
        `⚠️ Tu cuenta no está vinculada al sistema.\nTu chat ID es: \`${chatId}\`\nPedile a tu admin que lo configure.`)
      return new Response('ok')
    }

    const today = paraguayToday()

    if (command === '/tareas') {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, type, priority, due_date, status')
        .eq('assigned_to', profile.id)
        .lte('due_date', today)
        .not('status', 'eq', 'closed')
        .order('due_date')

      if (!tasks?.length) {
        await sendMessage(TELEGRAM_TOKEN, chatId, '✅ No tenés tareas pendientes para hoy.')
        return new Response('ok')
      }

      const overdue  = tasks.filter(t => t.due_date < today)
      const dueToday = tasks.filter(t => t.due_date === today)
      const lines = [`📋 *Tus tareas (${tasks.length})*`]
      if (overdue.length)  lines.push(`\n⚠️ *Vencidas*\n` + overdue.map(t => `• ${t.title}`).join('\n'))
      if (dueToday.length) lines.push(`\n📅 *Hoy*\n` + dueToday.map(t => `• ${t.title}`).join('\n'))

      await sendMessage(TELEGRAM_TOKEN, chatId, lines.join('\n'))
      return new Response('ok')
    }

    if (command === '/leads') {
      const { data: leads } = await supabase
        .from('clients')
        .select('full_name, fuente, created_at')
        .eq('tipo', 'lead')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!leads?.length) {
        await sendMessage(TELEGRAM_TOKEN, chatId, '📭 No hay leads registrados.')
        return new Response('ok')
      }

      const lines = [`👥 *Últimos leads (${leads.length})*`, '']
      leads.forEach(l => {
        const fecha = new Date(l.created_at).toLocaleDateString('es-PY')
        lines.push(`• ${l.full_name}${l.fuente ? ` — ${l.fuente}` : ''} (${fecha})`)
      })

      await sendMessage(TELEGRAM_TOKEN, chatId, lines.join('\n'))
      return new Response('ok')
    }

    if (command === '/resumen') {
      const [tasksRes, leadsRes] = await Promise.all([
        supabase.from('tasks')
          .select('id, status, due_date', { count: 'exact' })
          .eq('assigned_to', profile.id)
          .not('status', 'eq', 'closed')
          .lte('due_date', today),
        supabase.from('clients')
          .select('id', { count: 'exact' })
          .eq('tipo', 'lead')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at',  `${today}T23:59:59`),
      ])

      const pendientes = tasksRes.count ?? 0
      const vencidas   = tasksRes.data?.filter(t => t.due_date < today).length ?? 0
      const leadsHoy   = leadsRes.count ?? 0

      const lines = [
        `📊 *Resumen de hoy — ${today}*`,
        ``,
        `📋 Tareas pendientes: ${pendientes}`,
        vencidas > 0 ? `⚠️ Vencidas: ${vencidas}` : null,
        `👥 Leads hoy: ${leadsHoy}`,
      ].filter(Boolean)

      await sendMessage(TELEGRAM_TOKEN, chatId, lines.join('\n'))
      return new Response('ok')
    }

    // Comando desconocido
    await sendMessage(TELEGRAM_TOKEN, chatId,
      `Comandos disponibles:\n/tareas — tus tareas de hoy\n/leads — últimos leads\n/resumen — resumen del día`)

    return new Response('ok')
  } catch (err) {
    console.error('telegram-bot error:', err)
    return new Response('ok') // Telegram requiere 200 siempre
  }
})
