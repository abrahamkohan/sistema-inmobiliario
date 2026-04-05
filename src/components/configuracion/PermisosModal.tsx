// src/components/configuracion/PermisosModal.tsx
// Modal de permisos personalizados por usuario.
// Permite cambiar el rol del usuario y sobreescribir permisos a nivel individual.
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useBrand } from '@/context/BrandContext'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { useSetUserRole } from '@/hooks/useTeam'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'
import type { PermLevel, ModuleKey } from '@/types/consultant'

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

// Roles fijos de fallback cuando el tenant no tiene role_defaults
const FALLBACK_ROLES = ['admin', 'agente', 'cm', 'finanzas']

interface PermisosModalProps {
  user: TeamMember
  open: boolean
  onClose: () => void
}

export function PermisosModal({ user, open, onClose }: PermisosModalProps) {
  const setPermisos  = useSetPermisos()
  const setUserRole  = useSetUserRole()
  const { consultant, engine } = useBrand()
  const colors = engine.getColors()

  // Lista de roles disponibles — dinámicos desde role_defaults o fallback
  const availableRoles = consultant.role_defaults
    ? Object.keys(consultant.role_defaults)
    : FALLBACK_ROLES

  const [selectedRole,    setSelectedRole]    = useState<string>(user.role ?? '')
  const [permValues,      setPermValues]      = useState<Record<ModuleKey, PermLevel>>({} as Record<ModuleKey, PermLevel>)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  // Estado para confirmar reset al cambiar de rol
  const [pendingRole,     setPendingRole]     = useState<string | null>(null)

  // Inicializar al abrir
  useEffect(() => {
    if (!open) return

    setSelectedRole(user.role ?? '')
    setShowResetConfirm(false)
    setPendingRole(null)

    const savedPerms = (user.permisos as Record<string, string>) || {}
    const role       = user.role ?? 'viewer'
    const tenantRole = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[role] ?? {}
    const codeRole   = DEFAULT_PERMISSIONS[role] ?? {}

    const merged = {} as Record<ModuleKey, PermLevel>
    for (const { key } of MODULES) {
      merged[key] = (savedPerms[key] ?? tenantRole[key] ?? codeRole[key] ?? 'none') as PermLevel
    }
    setPermValues(merged)
  }, [open, user.permisos, user.role, consultant.role_defaults])

  // Nivel efectivo del rol (para detectar override personal)
  function getEffectiveDefault(mod: ModuleKey): PermLevel {
    const role   = selectedRole || user.role || 'viewer'
    const tenant = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[role]?.[mod]
    const code   = DEFAULT_PERMISSIONS[role]?.[mod]
    return (tenant ?? code ?? 'none') as PermLevel
  }

  // Al cambiar de rol en el select
  function handleRoleChange(newRole: string) {
    if (newRole === selectedRole) return
    if (user.permisos && Object.keys(user.permisos).length > 0) {
      // Tiene overrides → preguntar si resetear
      setPendingRole(newRole)
    } else {
      applyRoleChange(newRole, false)
    }
  }

  async function applyRoleChange(newRole: string, resetPerms: boolean) {
    try {
      await setUserRole.mutateAsync({ userId: user.id, role: newRole })
      if (resetPerms) {
        await setPermisos.mutateAsync({ userId: user.id, permisos: null })
      }
      setSelectedRole(newRole)
      setPendingRole(null)

      // Recalcular permValues con el nuevo rol
      const savedPerms = resetPerms ? {} : ((user.permisos as Record<string, string>) || {})
      const tenantRole = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[newRole] ?? {}
      const codeRole   = DEFAULT_PERMISSIONS[newRole] ?? {}
      const merged = {} as Record<ModuleKey, PermLevel>
      for (const { key } of MODULES) {
        merged[key] = (savedPerms[key] ?? tenantRole[key] ?? codeRole[key] ?? 'none') as PermLevel
      }
      setPermValues(merged)
      toast.success(`Rol cambiado a "${newRole}"`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cambiar rol')
    }
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

  const savedPerms  = (user.permisos as Record<string, string>) || {}
  const customCount = MODULES.filter(({ key }) =>
    savedPerms[key] !== undefined && savedPerms[key] !== getEffectiveDefault(key)
  ).length

  const isBusy = setPermisos.isPending || setUserRole.isPending

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
              <Dialog.Description className="sr-only">
                Configurar permisos del usuario
              </Dialog.Description>
              {customCount > 0 && (
                <span
                  className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: colors.accent + '18', color: colors.accent }}
                >
                  {customCount} permiso{customCount !== 1 ? 's' : ''} personalizado{customCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Contexto rol + overrides */}
          <div className="px-4 pt-3 pb-2 text-xs text-gray-500 space-y-0.5">
            <p>Rol base: <span className="font-semibold text-gray-700">{selectedRole || '—'}</span></p>
            {customCount > 0 && (
              <p>Este usuario tiene <span className="font-semibold text-gray-700">{customCount} permiso{customCount !== 1 ? 's' : ''} personalizado{customCount !== 1 ? 's' : ''}</span></p>
            )}
            <p className="text-gray-400">Los permisos personalizados sobrescriben el rol</p>
          </div>

          {/* Selector de rol */}
          <div className="px-4 pt-1 pb-2">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Rol
            </label>
            <select
              value={selectedRole}
              onChange={e => handleRoleChange(e.target.value)}
              disabled={isBusy || user.is_owner}
              title={user.is_owner ? 'El propietario no puede ser modificado' : undefined}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Confirmación al cambiar rol (si tiene overrides) */}
          {pendingRole && (
            <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-medium mb-2">
                ¿Resetear los permisos personalizados al cambiar a "{pendingRole}"?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => applyRoleChange(pendingRole, true)}
                  disabled={isBusy}
                  className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  Sí, resetear
                </button>
                <button
                  onClick={() => applyRoleChange(pendingRole, false)}
                  disabled={isBusy}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  No, mantener
                </button>
                <button
                  onClick={() => setPendingRole(null)}
                  className="text-xs px-2 py-1.5 text-gray-400 hover:text-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="px-4 pb-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Permisos por módulo
            </p>
          </div>

          {/* Lista de módulos */}
          <div className="px-4 pb-2 space-y-0.5">
            {MODULES.map(({ key, label, note }) => {
              const value      = permValues[key] ?? 'none'
              const def        = getEffectiveDefault(key)
              const hasOverride = savedPerms[key] !== undefined && savedPerms[key] !== def

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                    disabled={isBusy}
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
                disabled={isBusy}
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
