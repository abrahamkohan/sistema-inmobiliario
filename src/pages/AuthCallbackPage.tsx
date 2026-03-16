import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Parsear el hash de la URL para detectar el tipo
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')

    if (type === 'recovery') {
      // Procesar la sesión del hash y redirigir a reset
      supabase.auth.getSession().then(() => {
        navigate('/reset-password', { replace: true })
      })
      return
    }

    // Para invite u otros tipos, iniciar sesión y redirigir al inicio
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    })
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
