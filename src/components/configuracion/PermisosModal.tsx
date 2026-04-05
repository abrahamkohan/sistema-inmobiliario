// src/components/configuracion/PermisosModal.tsx
// Modal de permisos personalizados por usuario.
// Permite sobreescribir los defaults de rol para un usuario específico.
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useBrand } from '@/context/BrandContext'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'
import type { PermLevel, ModuleKey, RoleKey } from '@/types/consultant'

// ── Módulos en orden del Sidebar ──────────────────────────────────────────────

const MODULES: { key: ModuleKey; label: string; note?: string }[] = [
  { key: 'crm',           label: 'Clientes'       },
  { key: 'tareas',        label: 'Tareas'         },
  { key: 'notas',         label: 'Notas'          },
  { key: 'propiedades',   label: 'Propiedades'    },
  { key: 'proyectos',     label: 'Proyectos'      },
  { key: 'finanzas',      label: 'Finanzas',      note: 'Ventas · Simulador · Flip · Presupuestos' },
  { key: 'reportes',      label: 'Informes'       },
  { key: 'marketing',     label: 'Marketing'      },
  { key: 'configuracion', label: 'Configuración', note: 'Recursos · Configuración' },
]

const PERM_OPTIONS: { value: PermLevel; label: string }[] = [
  { value: 'none',  label: 'Sin acceso'    },
  { value: 'read',  label: 'Lectura'       },
  { value: 'write', label: 'Editar'        },
  { value: 'full',  label: 'Control total' },
]

interface PermisosModalProps {
  user: TeamMember
  open: boolean
  onClose: () => void
}

export function PermisosModal({ user, open, onClose }: PermisosModalProps) {
  const setPermisos = useSetPermisos()
  const { consultant, engine } = useBrand()
  const colors = engine.getColors()

  const [permValues, setPermValues] = useState<Record<ModuleKey, PermLevel>>({} as Record<ModuleKey, PermLevel>)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Inicializar: override del usuario > tenant default > code default > 'none'
  useEffect(() => {
    if (!open) return

    const savedPerms  = (user.permisos as Record<string, string>) || {}
    const role        = (user.role ?? 'viewer') as RoleKey
    const tenantRole  = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[role] ?? {}
    const codeRole    = DEFAULT_PERMISSIONS[role] ?? {}

    const merged = {} as Record<ModuleKey, PermLevel>
    for (const { key } of MODULES) {
      merged[key] = (savedPerms[key] ?? tenantRole[key] ?? codeRole[key] ?? 'none') as PermLevel
    }

    setPermValues(merged)
    setShowResetConfirm(false)
  }, [open, user.permisos, user.role, consultant.role_defaults])

  // Nivel efectivo para comparar y detectar custom (tenant o code)
  function getEffectiveDefault(mod: ModuleKey): PermLevel {
    const role = (user.role ?? 'viewer') as RoleKey
    const tenant = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[role]?.[mod]
    const code   = DEFAULT_PERMISSIONS[role]?.[mod]
    return (tenant ?? code ?? 'none') as PermLevel
  }

  function updatePerm(mod: ModuleKey, value: PermLevel) {
    setPermValues(prev => ({ ...prev, [mod]: value }))
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
      await setPermisos.mutateAsync({ userId: user.id, permisos: null })
      toast.success('Permisos reseteados al rol por defecto')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al resetear')
    }
  }

  // Contar módulos con override personal (distinto del default efectivo)
  const savedPerms = (user.permisos as Record<string, string>) || {}
  const customCount = MODULES.filter(({ key }) =>
    savedPerms[key] !== undefined && savedPerms[key] !== getEffectiveDefault(key)
  ).length

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[95vw] max-w-md max-h-[85vh] overflow-y-auto z-50">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {user.full_name || 'Usuario'}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-gray-500 mt-0.5">
                Rol base: <span className="font-medium">{user.role ?? 'Sin rol'}</span>
                {customCount > 0 && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: colors.accent + '18', color: colors.accent }}
                  >
                    {customCount} personalizado{customCount !== 1 ? 's' : ''}
                  </span>
                )}
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Lista de módulos */}
          <div className="p-4 space-y-1">
            {MODULES.map(({ key, label, note }) => {
              const value      = permValues[key] ?? 'none'
              const def        = getEffectiveDefault(key)
              const hasOverride = savedPerms[key] !== undefined && savedPerms[key] !== def

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-800">{label}</span>
                      {hasOverride && (
                        <span
                          className="text-[9px] font-semibold px-1 py-0.5 rounded"
                          style={{ backgroundColor: colors.accent + '18', color: colors.accent }}
                        >
                          custom
                        </span>
                      )}
                    </div>
                    {note && (
                      <span className="text-[10px] text-gray-400">{note}</span>
                    )}
                  </div>
                  <select
                    value={value}
                    onChange={e => updatePerm(key, e.target.value as PermLevel)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-gray-400 min-w-[130px] flex-shrink-0"
                    style={hasOverride ? { borderColor: colors.accent + '60' } : {}}
                  >
                    {PERM_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50 gap-2">
            <div>
              {customCount > 0 && !showResetConfirm && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resetear a defaults
                </button>
              )}
              {showResetConfirm && (
                <div className="flex items-center gap-2">
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
