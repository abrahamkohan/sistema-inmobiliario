// src/components/configuracion/PermisosMatriz.tsx
// Matriz global de permisos por rol × módulo.
// Los roles son dinámicos — se leen desde consultants.role_defaults.
// Edita consultants.role_defaults (JSONB) — afecta a todos los usuarios del rol.
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBrand } from '@/context/BrandContext'
import { updateRoleDefaults } from '@/lib/consultoraConfig'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { PermLevel, ModuleKey, RoleDefaults } from '@/types/consultant'

// ── Definiciones ──────────────────────────────────────────────────────────────

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

const PERM_COLORS: Record<PermLevel, string> = {
  none:  'text-gray-400',
  read:  'text-blue-600',
  write: 'text-amber-600',
  full:  'text-emerald-600',
}

// Roles base que no se pueden eliminar
const PROTECTED_ROLES = ['admin']

// Roles de fallback cuando el tenant no tiene role_defaults
const FALLBACK_ROLES = ['admin', 'agente', 'cm', 'finanzas']

// ── Helper: construye matriz completa ─────────────────────────────────────────

function buildInitialMatrix(
  tenantDefaults: RoleDefaults | null,
  roles: string[],
): Record<string, Record<ModuleKey, PermLevel>> {
  const result: Record<string, Record<ModuleKey, PermLevel>> = {}
  for (const role of roles) {
    result[role] = {} as Record<ModuleKey, PermLevel>
    for (const { key: mod } of MODULES) {
      const tenant = tenantDefaults?.[role]?.[mod]
      const code   = DEFAULT_PERMISSIONS[role]?.[mod] as PermLevel | undefined
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

  // Roles disponibles: dinámicos desde role_defaults o fallback
  const initialRoles = consultant.role_defaults
    ? Object.keys(consultant.role_defaults)
    : FALLBACK_ROLES

  const [roles,    setRoles]    = useState<string[]>(initialRoles)
  const [matrix,   setMatrix]   = useState(() => buildInitialMatrix(consultant.role_defaults, initialRoles))
  const [isDirty,  setIsDirty]  = useState(false)

  // Crear rol
  const [showNewRole,  setShowNewRole]  = useState(false)
  const [newRoleName,  setNewRoleName]  = useState('')
  const [newRoleBase,  setNewRoleBase]  = useState('agente')

  // Eliminar rol
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  function setCell(role: string, mod: ModuleKey, value: PermLevel) {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [mod]: value },
    }))
    setIsDirty(true)
  }

  function handleSave() {
    save.mutate(matrix as RoleDefaults)
  }

  function handleCreateRole() {
    const name = newRoleName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!name) return
    if (roles.includes(name)) {
      toast.error(`El rol "${name}" ya existe`)
      return
    }
    // Copiar permisos del rol base
    const basePerms = { ...matrix[newRoleBase] } ?? {}
    const newMatrix = { ...matrix, [name]: basePerms as Record<ModuleKey, PermLevel> }
    setMatrix(newMatrix)
    setRoles(prev => [...prev, name])
    setIsDirty(true)
    setShowNewRole(false)
    setNewRoleName('')
    toast.success(`Rol "${name}" creado`)
  }

  function handleDeleteRole(role: string) {
    const newRoles  = roles.filter(r => r !== role)
    const newMatrix = { ...matrix }
    delete newMatrix[role]
    setRoles(newRoles)
    setMatrix(newMatrix)
    setIsDirty(true)
    setConfirmDelete(null)
    toast.success(`Rol "${role}" eliminado`)
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Permisos por rol</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Define qué puede hacer cada rol. Los cambios afectan a todos los usuarios del rol
            (salvo que tengan permisos personalizados).
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => { setShowNewRole(true); setNewRoleName('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear rol
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || save.isPending}
            className="px-4 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: colors.primary }}
          >
            {save.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Panel crear rol */}
      {showNewRole && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-gray-700">Nuevo rol</p>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[11px] text-gray-500 block mb-1">Nombre del rol</label>
              <input
                type="text"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                placeholder="ej: externo, junior..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Copiar permisos de</label>
              <select
                value={newRoleBase}
                onChange={e => setNewRoleBase(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-gray-400"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="">vacío (sin acceso)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateRole}
              disabled={!newRoleName.trim()}
              className="text-xs px-3 py-1.5 text-white rounded-lg disabled:opacity-40"
              style={{ backgroundColor: colors.primary }}
            >
              Crear
            </button>
            <button
              onClick={() => setShowNewRole(false)}
              className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla — scroll horizontal en mobile */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                Módulo
              </th>
              {roles.map(role => (
                <th key={role} className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 capitalize">{role}</span>
                    {!PROTECTED_ROLES.includes(role) && (
                      confirmDelete === role ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(role)}
                          className="p-0.5 text-gray-300 hover:text-red-400 transition-colors rounded"
                          title={`Eliminar rol "${role}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(({ key: mod, label, note }, i) => (
              <tr key={mod} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-800">{label}</span>
                  {note && (
                    <span className="block text-[10px] text-gray-400 mt-0.5">{note}</span>
                  )}
                </td>
                {roles.map(role => {
                  const value = matrix[role]?.[mod] ?? 'none'
                  return (
                    <td key={role} className="px-3 py-2.5 border-b border-gray-100 text-center">
                      <select
                        value={value}
                        onChange={e => setCell(role, mod, e.target.value as PermLevel)}
                        className={`text-xs font-medium border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-gray-400 transition-colors min-w-[120px] ${PERM_COLORS[value]}`}
                      >
                        {PERM_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
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
        <p className="text-xs text-amber-600">Tenés cambios sin guardar</p>
      )}
    </div>
  )
}
