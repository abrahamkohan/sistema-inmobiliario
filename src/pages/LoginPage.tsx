import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setResetSent(true)
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

        {!recovering ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 14, outline: 'none', color: '#1a1f2b' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Contraseña</label>
                <button
                  type="button"
                  onClick={() => { setRecovering(true); setResetEmail(email) }}
                  style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 14, outline: 'none', color: '#1a1f2b' }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#ef4444', margin: 0, textAlign: 'center' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 4, padding: '11px', borderRadius: 8, backgroundColor: '#14223A', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!resetSent ? (
              <>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  Ingresá tu email y te mandamos un link para restablecer tu contraseña.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 14, outline: 'none', color: '#1a1f2b' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '11px', borderRadius: 8, backgroundColor: '#14223A', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
                <button
                  type="button"
                  onClick={() => setRecovering(false)}
                  style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  ← Volver
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#16a34a', textAlign: 'center', margin: 0 }}>
                  ✓ Revisá tu email, te mandamos el link.
                </p>
                <button
                  type="button"
                  onClick={() => { setRecovering(false); setResetSent(false) }}
                  style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center' }}
                >
                  ← Volver al login
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
