// src/components/configuracion/PermisosMatriz.tsx
// Matriz global de permisos por rol × módulo.
// Edita consultants.role_defaults (JSONB) — afecta a todos los usuarios del rol.
import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBrand } from '@/context/BrandContext'
import { updateRoleDefaults } from '@/lib/consultoraConfig'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { PermLevel, RoleKey, ModuleKey, RoleDefaults } from '@/types/consultant'

// ── Definiciones ──────────────────────────────────────────────────────────────

const MODULES: { key: ModuleKey; label: string; note?: string }[] = [
  { key: 'crm',          label: 'Clientes'      },
  { key: 'tareas',       label: 'Tareas'        },
  { key: 'notas',        label: 'Notas'         },
  { key: 'propiedades',  label: 'Propiedades'   },
  { key: 'proyectos',    label: 'Proyectos'     },
  { key: 'finanzas',     label: 'Finanzas',     note: 'Ventas · Simulador · Flip · Presupuestos' },
  { key: 'reportes',     label: 'Informes'      },
  { key: 'marketing',    label: 'Marketing'     },
  { key: 'configuracion',label: 'Configuración', note: 'Recursos · Configuración' },
]

const ROLES: { key: RoleKey; label: string }[] = [
  { key: 'admin',    label: 'Administrador' },
  { key: 'agente',   label: 'Agente'        },
  { key: 'cm',       label: 'Marketing'     },
  { key: 'finanzas', label: 'Finanzas'      },
]

const PERM_OPTIONS: { value: PermLevel; label: string }[] = [
  { value: 'none',  label: 'Sin acceso'    },
  { value: 'read',  label: 'Lectura'       },
  { value: 'write', label: 'Editar'        },
  { value: 'full',  label: 'Control total' },
]

const PERM_COLORS: Record<PermLevel, string> = {
  none:  'text-gray-400',
  read:  'text-blue-600',
  write: 'text-amber-600',
  full:  'text-emerald-600',
}

// ── Helper: construye defaults completos fusionando tenant + código ───────────

function buildInitialMatrix(tenantDefaults: RoleDefaults | null): Record<RoleKey, Record<ModuleKey, PermLevel>> {
  const result = {} as Record<RoleKey, Record<ModuleKey, PermLevel>>
  for (const { key: role } of ROLES) {
    result[role] = {} as Record<ModuleKey, PermLevel>
    for (const { key: mod } of MODULES) {
      const tenant  = (tenantDefaults as Record<string, Record<string, PermLevel>> | null)?.[role]?.[mod]
      const code    = DEFAULT_PERMISSIONS[role]?.[mod] as PermLevel | undefined
      result[role][mod] = tenant ?? code ?? 'none'
    }
  }
  return result
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PermisosMatriz() {
  const { consultant, engine } = useBrand()
  const colors = engine.getColors()
  const qc = useQueryClient()

  const [matrix, setMatrix] = useState(() =>
    buildInitialMatrix(consultant.role_defaults)
  )
  const [isDirty, setIsDirty] = useState(false)

  const save = useMutation({
    mutationFn: (roleDefaults: RoleDefaults) => updateRoleDefaults(roleDefaults),
    onSuccess: () => {
      toast.success('Permisos de roles guardados')
      setIsDirty(false)
      qc.invalidateQueries({ queryKey: ['brand'] })
      qc.invalidateQueries({ queryKey: ['consultora'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error al guardar'),
  })

  function setCell(role: RoleKey, mod: ModuleKey, value: PermLevel) {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [mod]: value },
    }))
    setIsDirty(true)
  }

  function handleSave() {
    save.mutate(matrix as RoleDefaults)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Permisos por rol</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Define qué puede hacer cada rol. Los cambios afectan a todos los usuarios del rol
            (salvo que tengan permisos personalizados).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || save.isPending}
          className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
          style={{ backgroundColor: colors.primary }}
        >
          {save.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Tabla — scroll horizontal en mobile */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                Módulo
              </th>
              {ROLES.map(r => (
                <th
                  key={r.key}
                  className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center"
                >
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(({ key: mod, label, note }, i) => (
              <tr
                key={mod}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="px-4 py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-800">{label}</span>
                  {note && (
                    <span className="block text-[10px] text-gray-400 mt-0.5">{note}</span>
                  )}
                </td>
                {ROLES.map(({ key: role }) => {
                  const value = matrix[role][mod]
                  return (
                    <td key={role} className="px-3 py-2.5 border-b border-gray-100 text-center">
                      <select
                        value={value}
                        onChange={e => setCell(role, mod, e.target.value as PermLevel)}
                        className={`text-xs font-medium border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-gray-400 transition-colors min-w-[120px] ${PERM_COLORS[value]}`}
                      >
                        {PERM_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDirty && (
        <p className="text-xs text-amber-600">
          Tenés cambios sin guardar
        </p>
      )}
    </div>
  )
}
