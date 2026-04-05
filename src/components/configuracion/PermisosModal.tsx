// src/components/configuracion/PermisosModal.tsx
// Modal de permisos por usuario. Checkboxes por módulo, sin niveles.
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useBrand } from '@/context/BrandContext'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { useSetUserRole } from '@/hooks/useTeam'
import type { TeamMember } from '@/lib/team'
import type { ModuleKey } from '@/types/consultant'

// ── Módulos en orden del Sidebar ──────────────────────────────────────────────

const MODULES: { key: ModuleKey; label: string; note?: string }[] = [
  { key: 'crm',           label: 'Clientes'      },
  { key: 'tareas',        label: 'Tareas'        },
  { key: 'notas',         label: 'Notas'         },
  { key: 'propiedades',   label: 'Propiedades'   },
  { key: 'proyectos',     label: 'Proyectos'     },
  { key: 'ventas',        label: 'Ventas'        },
  { key: 'simulador',     label: 'Simulador'     },
  { key: 'flip',          label: 'Flip'          },
  { key: 'presupuestos',  label: 'Presupuestos'  },
  { key: 'reportes',      label: 'Informes'      },
  { key: 'marketing',     label: 'Marketing'     },
  { key: 'configuracion', label: 'Configuración', note: 'Recursos · Configuración' },
]

interface PermisosModalProps {
  user: TeamMember
  open: boolean
  onClose: () => void
}

export function PermisosModal({ user, open, onClose }: PermisosModalProps) {
  const setPermisos = useSetPermisos()
  const setUserRole = useSetUserRole()
  const { engine } = useBrand()
  const colors = engine.getColors()

  const [role,   setRole]   = useState<string>(user.role ?? '')
  const [checks, setChecks] = useState<Record<ModuleKey, boolean>>({} as Record<ModuleKey, boolean>)

  // Inicializar al abrir
  useEffect(() => {
    if (!open) return
    setRole(user.role ?? '')

    const saved = (user.permisos as Record<string, boolean> | null) ?? {}
    const init = {} as Record<ModuleKey, boolean>
    for (const { key } of MODULES) {
      init[key] = saved[key] === true
    }
    setChecks(init)
  }, [open, user.permisos, user.role])

  function toggle(mod: ModuleKey) {
    setChecks(prev => ({ ...prev, [mod]: !prev[mod] }))
  }

  async function handleSave() {
    try {
      // Guardar rol si cambió
      if (role !== (user.role ?? '') && !user.is_owner) {
        await setUserRole.mutateAsync({ userId: user.id, role })
      }
      await setPermisos.mutateAsync({ userId: user.id, permisos: checks })
      toast.success('Permisos guardados')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  const isBusy = setPermisos.isPending || setUserRole.isPending
  const activeCount = MODULES.filter(({ key }) => checks[key]).length

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[95vw] max-w-sm max-h-[85vh] overflow-y-auto z-50">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {user.full_name || 'Usuario'}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-gray-400 mt-0.5">
                Activá los módulos que este usuario puede usar
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Rol (etiqueta) */}
          <div className="px-4 pt-3 pb-2">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Rol (etiqueta)
            </label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={isBusy || user.is_owner}
              placeholder="ej: agente, cm, finanzas..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Módulos */}
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Módulos
              </p>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: colors.accent + '18', color: colors.accent }}
              >
                {activeCount} de {MODULES.length} activos
              </span>
            </div>

            <div className="space-y-0.5">
              {MODULES.map(({ key, label, note }) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-sm text-gray-800">{label}</span>
                    {note && (
                      <span className="block text-[10px] text-gray-400">{note}</span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={checks[key] ?? false}
                    onChange={() => toggle(key)}
                    disabled={isBusy}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
                    style={{ accentColor: colors.primary }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
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
              {isBusy ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
