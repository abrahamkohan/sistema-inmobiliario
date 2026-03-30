/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Push notification handler ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data  = event.data?.json() ?? {}
  const title = data.title ?? 'K&C CRM'
  const body  = data.body  ?? 'Tenés tareas pendientes'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/pwa-192.png',
      badge: '/pwa-192.png',
      tag:   data.tag ?? 'kc-crm',
      data:  { url: data.url ?? '/inicio' },
    })
  )
})

// ── Notification click → abre la app en la URL correcta ───────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/inicio'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({ type: 'NAVIGATE', url })
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
