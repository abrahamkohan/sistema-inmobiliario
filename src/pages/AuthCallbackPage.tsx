import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/context/BrandContext'

type Status = 'loading' | 'error'

export function AuthCallbackPage() {
  const navigate  = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [msg,    setMsg]    = useState('')
  const { engine, nombre }  = useBrand()
  const colors     = engine.getColors()
  const logoUrl    = engine.getLogo('landing')
  const logoFilter = engine.getLogoFilter('landing')

  useEffect(() => {
    let settled = false

    function settle(dest: string) {
      if (settled) return
      settled = true
      navigate(dest, { replace: true })
    }

    // El SDK procesa el hash (#access_token=...) al inicializar y lo limpia
    // antes de que este efecto corra. Puede que SIGNED_IN ya haya disparado.
    // Estrategia dual: getSession() captura si ya está listo, onAuthStateChange
    // captura si todavía está procesando.

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        settle('/reset-password')
      }
    })

    // Capturar sesión que el SDK ya procesó antes de que suscribiéramos
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !settled) settle('/reset-password')
    })

    // PKCE: si llegó ?code= hay que intercambiarlo explícitamente
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error && !settled) {
          setStatus('error')
          setMsg('El enlace expiró o ya fue utilizado.')
        } else if (data?.session && !settled) {
          settle('/reset-password')
        }
      })
    }

    // Timeout: si en 10 segundos no llegó nada, el link es inválido
    const timer = setTimeout(() => {
      if (!settled) {
        setStatus('error')
        setMsg('El enlace expiró o ya fue utilizado. Pedile al administrador que te reenvíe la invitación.')
      }
    }, 10_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Header branding */}
        <div style={{
          backgroundColor: colors.secondary,
          padding: '32px 24px 28px',
          borderBottom: `3px solid ${colors.primary}`,
        }}>
          {logoUrl
            ? <img src={logoUrl} alt={nombre} style={{ height: 36, maxWidth: 180, objectFit: 'contain', display: 'block', margin: '0 auto', filter: logoFilter }} />
            : <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em' }}>{nombre.toUpperCase()}</p>
          }
        </div>

        <div style={{ padding: '40px 32px' }}>
          {status === 'loading' && (
            <>
              <Spinner color={colors.primary} />
              <p style={{ margin: '20px 0 0', fontSize: 15, color: '#374151', fontWeight: 500 }}>
                Verificando tu acceso...
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9ca3af' }}>
                Un momento, por favor.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                backgroundColor: '#fef2f2', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p style={{ margin: '16px 0 8px', fontSize: 15, color: '#111827', fontWeight: 600 }}>
                Enlace inválido
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                {msg}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner({ color }: { color: string }) {
  return (
    <div style={{
      width: 40, height: 40, margin: '0 auto',
      border: `3px solid #e5e7eb`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
