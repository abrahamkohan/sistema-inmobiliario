// src/pages/GoogleCallbackPage.tsx
// Página pública — recibe el callback de Google OAuth.
// Lee el code del query string, lo intercambia via Edge Function, redirige a /configuracion.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

export function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params     = new URLSearchParams(window.location.search)
    const code       = params.get('code')
    const errorParam = params.get('error')

    if (errorParam) {
      setError('Google rechazó la autorización. Podés reintentar desde Configuración.')
      return
    }

    if (!code) {
      setError('No se recibió el código de autorización.')
      return
    }

    // Validar state para protección CSRF — siempre limpiar sessionStorage
    const stateFromUrl     = params.get('state')
    const stateFromStorage = sessionStorage.getItem('gcal_oauth_state')
    sessionStorage.removeItem('gcal_oauth_state')

    if (!stateFromUrl || !stateFromStorage || stateFromUrl !== stateFromStorage) {
      setError('Error de validación de seguridad. Reintentá el proceso desde Configuración.')
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('No hay sesión activa. Iniciá sesión e intentá de nuevo.')
        return
      }

      supabase.functions
        .invoke('google-oauth', {
          body: { action: 'callback', code },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        .then(({ error: fnError }) => {
          if (fnError) {
            setError('Error al guardar la conexión con Google Calendar. Reintentá desde Configuración.')
            return
          }
          navigate('/configuracion', { replace: true })
        })
        .catch(() => {
          setError('Error inesperado. Reintentá desde Configuración.')
        })
    })
  }, [navigate])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
        <a
          href="/configuracion"
          style={{ color: '#6b7280', fontSize: 14, textDecoration: 'underline' }}
        >
          Volver a Configuración
        </a>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      color: '#828b9c',
      fontSize: 14,
    }}>
      Conectando Google Calendar...
    </div>
  )
}
