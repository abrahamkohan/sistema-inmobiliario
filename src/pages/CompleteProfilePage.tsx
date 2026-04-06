// src/pages/CompleteProfilePage.tsx
import { useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/profile'
import { useAuth } from '@/context/AuthContext'
import { useBrand } from '@/context/BrandContext'

export function CompleteProfilePage() {
  const { session } = useAuth()
  const { engine, nombre } = useBrand()
  const colors = engine.getColors()
  const logoUrl = engine.getLogo('crm')

  const [fullName, setFullName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = fullName.trim()

    if (trimmed.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return
    }

    if (!session?.user?.id) {
      setError('No hay sesión activa')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await updateProfile(session.user.id, { full_name: trimmed })
      toast.success('Perfil guardado correctamente')
      window.location.href = '/inicio'
    } catch (e) {
      console.error('[CompleteProfile] error:', e)
      setError(e instanceof Error ? e.message : 'Error al guardar')
      toast.error('Error al guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !isSaving) handleSave()
  }

  const canSave = fullName.trim().length >= 3 && !isSaving

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.secondary + '10' }}>
      <div className="w-full max-w-sm">

        {/* Brand header */}
        <div className="text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt={nombre} className="h-10 object-contain mx-auto mb-4" />
          ) : (
            <p className="text-lg font-bold mb-4" style={{ color: colors.secondary }}>{nombre}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: colors.primary + '18' }}
            >
              <User className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Completá tu perfil</h1>
            <p className="text-sm text-gray-500 mt-1">
              Necesitamos tu nombre para identificarte en el sistema
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
                style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                onFocus={e => e.target.style.borderColor = colors.primary}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                autoFocus
                disabled={isSaving}
              />
              {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full py-3 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
