// src/hooks/usePushNotifications.ts
// Maneja suscripción a Web Push Notifications
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported]   = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (ok) setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    })
  }, [supported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false

    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return false

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer,
    })

    const json = subscription.toJSON()

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id:  user.id,
        endpoint: json.endpoint!,
        p256dh:   json.keys!.p256dh,
        auth_key: json.keys!.auth,
      },
      { onConflict: 'user_id,endpoint' }
    )

    if (!error) setSubscribed(true)
    return !error
  }, [supported])

  return { supported, permission, subscribed, subscribe }
}
