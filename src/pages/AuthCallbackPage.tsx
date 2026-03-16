import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Escuchar eventos de auth — PASSWORD_RECOVERY llega cuando el link es de reset
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true })
      } else if (event === 'SIGNED_IN') {
        navigate('/', { replace: true })
      }
    })

    // PKCE flow: el código viene como query param ?code=XXX
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
    }

    return () => subscription.unsubscribe()
  }, [navigate])

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
      Verificando sesión...
    </div>
  )
}
