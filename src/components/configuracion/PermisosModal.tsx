// src/components/configuracion/PermisosModal.tsx
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useBrand } from '@/context/BrandContext'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'

// Módulos con etiquetas amigables
const PERM_MODULES: Record<string, string> = {
  crm: 'CRM',
  propiedades: 'Propiedades',
  proyectos: 'Proyectos',
  media_props: 'Media (Prop/Proj)',
  marketing_media: 'Marketing (media)',
  finanzas: 'Finanzas',
  marketing: 'Marketing',
  tareas: 'Tareas',
  reportes: 'Reportes',
  configuracion: 'Configuración',
}

const PERM_OPTIONS = [
  { value: 'none', label: 'Sin acceso' },
  { value: 'read', label: 'Lectura' },
  { value: 'write', label: 'Editar' },
  { value: 'full', label: 'Total' },
]

interface PermisosModalProps {
  user: TeamMember
  open: boolean
  onClose: () => void
}

export function PermisosModal({ user, open, onClose }: PermisosModalProps) {
  const setPermisos = useSetPermisos()
  const { engine } = useBrand()
  const colors = engine.getColors()
  const [permValues, setPermValues] = useState<Record<string, string>>({})
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (open) {
      setPermValues((user.permisos as Record<string, string>) || {})
      setShowResetConfirm(false)
    }
  }, [open, user.permisos])

  function updatePerm(module: string, value: string) {
    setPermValues(prev => ({ ...prev, [module]: value }))
  }

  async function handleSave() {
    try {
      await setPermisos.mutateAsync({ userId: user.id, permisos: permValues })
      toast.success('Permisos actualizados')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function handleReset() {
    try {
      // Enviar null para borrar los permisos custom y volver al default del rol
      await setPermisos.mutateAsync({ userId: user.id, permisos: null })
      toast.success('Permisos reseteados al rol por defecto')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al resetear')
    }
  }

  // Obtener el default del rol base del usuario
  const roleDefaults = user.role ? DEFAULT_PERMISSIONS[user.role] : null
  const hasCustomPerms = Object.keys(permValues).length > 0

  // Contar cuántos módulos tienen permisos distintos al default
  let customCount = 0
  if (roleDefaults) {
    for (const [mod, perm] of Object.entries(permValues)) {
      if (perm !== roleDefaults[mod]) customCount++
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {user.full_name || 'Usuario'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500">
                Rol base: <span className="font-medium">{user.role ?? 'Sin rol'}</span>
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Helper text */}
          <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600">
            {customCount > 0 
              ? `Tenés ${customCount} módulo${customCount !== 1 ? 's' : ''} con permisos personalizados`
              : 'Este usuario tiene los permisos estándar de su rol'}
          </div>

          {/* Lista de permisos con dropdowns */}
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(PERM_MODULES).map(([key, label]) => {
                const currentValue = permValues[key] ?? roleDefaults?.[key] ?? 'none'
                const isCustom = roleDefaults && permValues[key] !== undefined && permValues[key] !== roleDefaults[key]
                
                return (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-700 truncate">{label}</span>
                      {isCustom && (
                        <span 
                          className="text-[9px] font-medium px-1 py-0.5 rounded flex-shrink-0"
                          style={{ 
                            backgroundColor: colors.accent + '15', 
                            color: colors.accent + 'cc',
                          }}
                        >
                          custom
                        </span>
                      )}
                    </div>
                    <select
                      value={currentValue}
                      onChange={e => updatePerm(key, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-gray-900 min-w-[100px]"
                      style={isCustom ? { borderColor: colors.accent + '50' } : {}}
                    >
                      {PERM_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50 gap-2">
            <div>
              {hasCustomPerms && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resetear a defaults
                </button>
              )}
              {showResetConfirm && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">¿Confirmar?</span>
                  <button
                    onClick={handleReset}
                    disabled={setPermisos.isPending}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={setPermisos.isPending}
                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                style={{ backgroundColor: colors.primary }}
              >
                {setPermisos.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
