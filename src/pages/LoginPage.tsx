import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f7f4',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        padding: '40px 36px',
        backgroundColor: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e4e7eb',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo 2.svg"
            alt="Kohan & Campos"
            style={{ height: 28, margin: '0 auto 20px', display: 'block' }}
          />
          <p style={{ fontSize: 14, color: '#828b9c', margin: 0 }}>
            Iniciar sesión
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e4e7eb',
                fontSize: 14,
                outline: 'none',
                color: '#1a1f2b',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e4e7eb',
                fontSize: 14,
                outline: 'none',
                color: '#1a1f2b',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '11px',
              borderRadius: 8,
              backgroundColor: '#14223A',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
