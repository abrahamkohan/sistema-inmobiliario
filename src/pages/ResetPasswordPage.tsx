import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/context/BrandContext'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()
  const { engine, nombre } = useBrand()
  const colors  = engine.getColors()
  const logoUrl = engine.getLogo('crm')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6)  { setError('Mínimo 6 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('Error al actualizar la contraseña'); setLoading(false); return }
    navigate('/inicio', { replace: true })
  }

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
        maxWidth: 400,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>

        {/* Header con branding */}
        <div style={{
          backgroundColor: colors.secondary,
          padding: '32px 24px 28px',
          textAlign: 'center',
          borderBottom: `3px solid ${colors.primary}`,
        }}>
          {logoUrl
            ? <img src={logoUrl} alt={nombre} style={{ height: 36, maxWidth: 180, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            : <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em' }}>{nombre.toUpperCase()}</p>
          }
        </div>

        {/* Formulario */}
        <div style={{ padding: '32px 28px' }}>
          <p style={{ margin: '0 0 24px', fontSize: 15, color: '#374151', textAlign: 'center', fontWeight: 500 }}>
            Elegí tu contraseña para acceder al sistema
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                style={{
                  padding: '11px 14px', borderRadius: 8,
                  border: '1.5px solid #e4e7eb', fontSize: 14,
                  outline: 'none', color: '#1a1f2b',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = colors.primary}
                onBlur={e => e.target.style.borderColor = '#e4e7eb'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                required
                style={{
                  padding: '11px 14px', borderRadius: 8,
                  border: '1.5px solid #e4e7eb', fontSize: 14,
                  outline: 'none', color: '#1a1f2b',
                }}
                onFocus={e => e.target.style.borderColor = colors.primary}
                onBlur={e => e.target.style.borderColor = '#e4e7eb'}
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
                marginTop: 8,
                padding: '13px',
                borderRadius: 8,
                backgroundColor: colors.primary,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Guardando...' : 'Crear contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
