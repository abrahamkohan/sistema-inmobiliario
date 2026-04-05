// src/components/configuracion/PermisosModal.tsx
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useBrand } from '@/context/BrandContext'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { useSetUserRole } from '@/hooks/useTeam'
import type { TeamMember } from '@/lib/team'
import type { ModuleKey } from '@/types/consultant'

// ── Módulos agrupados ─────────────────────────────────────────────────────────

const GRUPOS: {
  label: string
  modules: { key: ModuleKey; label: string }[]
}[] = [
  {
    label: 'CRM',
    modules: [
      { key: 'crm',    label: 'Clientes' },
      { key: 'tareas', label: 'Tareas'   },
      { key: 'notas',  label: 'Notas'    },
    ],
  },
  {
    label: 'Inventario',
    modules: [
      { key: 'propiedades', label: 'Propiedades' },
      { key: 'proyectos',   label: 'Proyectos'   },
    ],
  },
  {
    label: 'Análisis',
    modules: [
      { key: 'ventas',       label: 'Ventas'       },
      { key: 'simulador',    label: 'Simulador'    },
      { key: 'flip',         label: 'Flip'         },
      { key: 'presupuestos', label: 'Presupuestos' },
      { key: 'reportes',     label: 'Informes'     },
    ],
  },
  {
    label: 'Sistema',
    modules: [
      { key: 'marketing',     label: 'Marketing'     },
      { key: 'configuracion', label: 'Configuración' },
    ],
  },
]

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  value, onChange, disabled, primaryColor,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  primaryColor: string
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      style={{ backgroundColor: value ? primaryColor : '#d1d5db' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!open) return
    setRole(user.role ?? '')
    const saved = (user.permisos as Record<string, boolean> | null) ?? {}
    const init = {} as Record<ModuleKey, boolean>
    for (const grupo of GRUPOS) {
      for (const { key } of grupo.modules) {
        init[key] = saved[key] === true
      }
    }
    setChecks(init)
  }, [open, user.permisos, user.role])

  function toggle(mod: ModuleKey) {
    setChecks(prev => ({ ...prev, [mod]: !prev[mod] }))
  }

  async function handleSave() {
    try {
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

  const isBusy      = setPermisos.isPending || setUserRole.isPending
  const totalActive = GRUPOS.flatMap(g => g.modules).filter(({ key }) => checks[key]).length
  const totalMods   = GRUPOS.flatMap(g => g.modules).length

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {user.full_name || 'Usuario'}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-gray-400 mt-0.5">
                Activá los módulos que este usuario puede usar
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.accent + '18', color: colors.accent }}
              >
                {totalActive} / {totalMods} activos
              </span>
              <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </Dialog.Close>
            </div>
          </div>

          <div className="px-6 py-4 space-y-6">

            {/* Rol */}
            <div>
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

            {/* Grupos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GRUPOS.map(grupo => {
                // activos primero dentro del grupo
                const sorted = [...grupo.modules].sort(
                  (a, b) => Number(checks[b.key] ?? false) - Number(checks[a.key] ?? false)
                )
                return (
                  <div key={grupo.label} className="border border-gray-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      {grupo.label}
                    </p>
                    <div className="space-y-2.5">
                      {sorted.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <span className={`text-sm ${checks[key] ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            {label}
                          </span>
                          <Toggle
                            value={checks[key] ?? false}
                            onChange={() => toggle(key)}
                            disabled={isBusy}
                            primaryColor={colors.primary}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50 sticky bottom-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isBusy}
              className="px-5 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
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
