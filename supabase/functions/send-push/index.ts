// supabase/functions/send-push/index.ts
// Envía Web Push notifications a las suscripciones de un usuario
// Llamado internamente por notify-overdue-tasks y otros triggers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // Solo llamadas internas (service role) o con DIGEST_TOKEN
  const token = req.headers.get('x-digest-token')
  const auth  = req.headers.get('authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const digestToken = Deno.env.get('DIGEST_TOKEN')!

  const isService = auth.includes(serviceKey)
  const isDigest  = token === digestToken

  if (!isService && !isDigest) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
  }

  try {
    const { user_id, title, body, url } = await req.json() as {
      user_id: string
      title:   string
      body:    string
      url?:    string
    }

    const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

    webpush.setVapidDetails(
      'mailto:admin@kohancampos.com.py',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceKey
    )

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', user_id)

    if (!subs?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: CORS })
    }

    const payload = JSON.stringify({ title, body, url: url ?? '/inicio' })
    const staleEndpoints: string[] = []

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload
          )
        } catch (err: unknown) {
          // 410 = suscripción expirada, limpiar
          if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
            staleEndpoints.push(sub.endpoint)
          }
        }
      })
    )

    if (staleEndpoints.length) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints)
    }

    return new Response(
      JSON.stringify({ ok: true, sent: subs.length - staleEndpoints.length }),
      { headers: CORS }
    )
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
