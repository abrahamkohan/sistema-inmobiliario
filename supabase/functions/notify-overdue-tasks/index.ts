// supabase/functions/notify-overdue-tasks/index.ts
// Called by GitHub Actions every hour
// Notifies users via Telegram when their tasks become overdue

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function paraguayToday(): string {
  const d = new Date()
  d.setUTCHours(d.getUTCHours() - 4)
  return d.toISOString().split('T')[0]
}

serve(async (req) => {
  const token = req.headers.get('x-digest-token')
  if (!token || token !== Deno.env.get('DIGEST_TOKEN')) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today = paraguayToday()

    // Tareas vencidas que aún no fueron notificadas
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, type, priority, due_date, assigned_to')
      .lt('due_date', today)
      .not('status', 'eq', 'closed')
      .eq('overdue_notified', false)

    if (error) throw error
    if (!tasks?.length) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

    // Agrupar por usuario
    const byUser = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
      if (!acc[t.assigned_to]) acc[t.assigned_to] = []
      acc[t.assigned_to].push(t)
      return acc
    }, {})

    const notifiedIds: string[] = []

    await Promise.allSettled(
      Object.entries(byUser).map(async ([userId, userTasks]) => {
        // Obtener telegram_chat_id del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id, full_name')
          .eq('id', userId)
          .single()

        if (!profile?.telegram_chat_id) return

        const text = [
          `⚠️ *Tareas vencidas (${userTasks.length})*`,
          '',
          ...userTasks.map(t => `• ${t.title} — vencía el ${t.due_date}`),
        ].join('\n')

        const res = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: profile.telegram_chat_id,
              text,
              parse_mode: 'Markdown',
            }),
          }
        )

        if (res.ok) {
          notifiedIds.push(...userTasks.map(t => t.id))
        }

        // Web Push — en paralelo con Telegram
        const pushBody = userTasks.length === 1
          ? `"${userTasks[0].title}" venció el ${userTasks[0].due_date}`
          : `Tenés ${userTasks.length} tareas vencidas`

        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              user_id: userId,
              title:   '⚠️ Tareas vencidas',
              body:    pushBody,
              url:     '/tareas',
            }),
          }
        ).catch(() => { /* push falla silenciosamente */ })
      })
    )

    // Marcar como notificadas
    if (notifiedIds.length) {
      await supabase
        .from('tasks')
        .update({ overdue_notified: true })
        .in('id', notifiedIds)
    }

    return new Response(JSON.stringify({ ok: true, notified: notifiedIds.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-overdue-tasks error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
