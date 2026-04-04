// src/pages/CompleteProfilePage.tsx
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/profile'
import { useAuth } from '@/context/AuthContext'

export function CompleteProfilePage() {
  const { session } = useAuth()
  const [fullName, setFullName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = fullName.trim()
    
    // Validación
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
      // Force reload to refresh all auth state and queries
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
    if (e.key === 'Enter' && !isSaving) {
      handleSave()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white font-bold">👤</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Completá tu perfil</h1>
            <p className="text-sm text-gray-500 mt-1">
              Necesitamos tu nombre para identificarte en el sistema
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                autoFocus
                disabled={isSaving}
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || fullName.trim().length < 3}
              className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-4">
            * Campo obligatorio
          </p>
        </div>
      </div>
    </div>
  )
}
