// src/components/configuracion/PermisosModal.tsx
import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Eye, Pencil, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useBrand } from '@/context/BrandContext'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { useSetUserRole } from '@/hooks/useTeam'
import { updateProfile } from '@/lib/profile'
import type { TeamMember } from '@/lib/team'
import type { ModuleKey, PermissionLevel } from '@/types/consultant'

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
      { key: 'marketing', label: 'Marketing' },
    ],
  },
]

// ── Niveles ───────────────────────────────────────────────────────────────────

const LEVELS: {
  level: PermissionLevel
  icon: React.ReactNode
  tooltip: string
  color: string
  bgLight: string
}[] = [
  {
    level:   'read',
    icon:    <Eye className="w-3.5 h-3.5" />,
    tooltip: 'Ver',
    color:   '#6b7280',
    bgLight: '#f3f4f6',
  },
  {
    level:   'write',
    icon:    <Pencil className="w-3.5 h-3.5" />,
    tooltip: 'Editar',
    color:   '#C9A34E',
    bgLight: '#fef3c7',
  },
  {
    level:   'full',
    icon:    <Zap className="w-3.5 h-3.5" />,
    tooltip: 'Control total',
    color:   '#ef4444',
    bgLight: '#fee2e2',
  },
]

// ── Tooltip simple ────────────────────────────────────────────────────────────

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-20">
        {text}
      </div>
    </div>
  )
}

// ── Fila de módulo ────────────────────────────────────────────────────────────

function ModuleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: PermissionLevel | null
  onChange: (level: PermissionLevel | null) => void
  disabled?: boolean
}) {
  const active = value !== null

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className={`text-sm flex-1 min-w-0 truncate ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {LEVELS.map(({ level, icon, tooltip, color }) => {
          const selected = value === level
          return (
            <Tip key={level} text={tooltip}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(selected ? null : level)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={
                  selected
                    ? { backgroundColor: color, color: '#fff' }
                    : { backgroundColor: 'transparent', color: '#d1d5db' }
                }
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.color = color }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.color = '#d1d5db' }}
              >
                {icon}
              </button>
            </Tip>
          )
        })}
      </div>
    </div>
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

  const [name,     setName]     = useState<string>(user.full_name ?? '')
  const [whatsapp, setWhatsapp] = useState<string>(user.whatsapp ?? '')
  const [role,     setRole]     = useState<string>(user.role ?? '')
  const [checks,   setChecks]   = useState<Record<ModuleKey, PermissionLevel | null>>(
    {} as Record<ModuleKey, PermissionLevel | null>
  )

  useEffect(() => {
    if (!open) return
    setName(user.full_name ?? '')
    setWhatsapp(user.whatsapp ?? '')
    setRole(user.role ?? '')
    const saved = (user.permisos as Record<string, boolean | PermissionLevel> | null) ?? {}
    const init = {} as Record<ModuleKey, PermissionLevel | null>
    for (const grupo of GRUPOS) {
      for (const { key } of grupo.modules) {
        const val = saved[key]
        if (val === true)                                         init[key] = 'write'  // retrocompat
        else if (val === 'read' || val === 'write' || val === 'full') init[key] = val
        else                                                          init[key] = null
      }
    }
    setChecks(init)
  }, [open, user.permisos, user.role])

  function handleChange(key: ModuleKey, level: PermissionLevel | null) {
    setChecks(prev => ({ ...prev, [key]: level }))
  }

  async function handleSave() {
    try {
      await updateProfile(user.id, {
        full_name: name.trim() || null,
        whatsapp:  whatsapp.trim() || null,
      })
      if (role !== (user.role ?? '') && !user.is_owner) {
        await setUserRole.mutateAsync({ userId: user.id, role })
      }
      const permisos: Record<string, PermissionLevel> = {}
      for (const [key, level] of Object.entries(checks)) {
        if (level !== null) permisos[key] = level as PermissionLevel
      }
      await setPermisos.mutateAsync({ userId: user.id, permisos })
      toast.success('Cambios guardados')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  const isBusy      = setPermisos.isPending || setUserRole.isPending
  const totalActive = Object.values(checks).filter(v => v !== null).length
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
                Asigná el nivel de acceso por módulo
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.accent + '18', color: colors.accent }}
              >
                {totalActive} / {totalMods} activos
              </span>
              {/* Leyenda */}
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Ver</span>
                <span className="flex items-center gap-1"><Pencil className="w-3 h-3 text-amber-500" /> Editar</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-red-400" /> Total</span>
              </div>
              <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </Dialog.Close>
            </div>
          </div>

          <div className="px-6 py-4 space-y-6">

            {/* Datos del agente */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Datos del agente
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Nombre completo</span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isBusy}
                    placeholder="Nombre del agente"
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">WhatsApp</span>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    disabled={isBusy}
                    placeholder="+54 9 11 12345678"
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 disabled:opacity-50"
                  />
                </div>
              </div>
              {user.email && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Email</span>
                  <span className="text-sm text-gray-400 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                    {user.email}
                  </span>
                </div>
              )}
            </div>

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
              {GRUPOS.map(grupo => (
                <div key={grupo.label} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {grupo.label}
                  </p>
                  <div className="divide-y divide-gray-50">
                    {grupo.modules.map(({ key, label }) => (
                      <ModuleRow
                        key={key}
                        label={label}
                        value={checks[key] ?? null}
                        onChange={level => handleChange(key, level)}
                        disabled={isBusy}
                      />
                    ))}
                  </div>
                </div>
              ))}
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
