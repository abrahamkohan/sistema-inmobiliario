// src/components/configuracion/SeccionEquipo.tsx
import { useState } from 'react'
import { Plus, Trash2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useTeam, useRemoveRole, useInviteUser } from '@/hooks/useTeam'
import { useIsAdmin } from '@/hooks/useUserRole'
import { useBrand } from '@/context/BrandContext'
import { PermisosModal } from './PermisosModal'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'
import type { RoleDefaults } from '@/types/consultant'

// Módulos en orden del Sidebar
const SUMMARY_MODULES = [
  'crm',
  'tareas',
  'notas',
  'propiedades',
  'proyectos',
  'finanzas',
  'reportes',
  'marketing',
  'configuracion',
]

const MODULE_LABELS: Record<string, string> = {
  crm:           'Clientes',
  tareas:        'Tareas',
  notas:         'Notas',
  propiedades:   'Propiedades',
  proyectos:     'Proyectos',
  finanzas:      'Finanzas',
  reportes:      'Informes',
  marketing:     'Marketing',
  configuracion: 'Configuración',
}

// Obtiene permisos efectivos: override personal > tenant default > code default
function getEffectivePerm(
  member: TeamMember,
  module: string,
  tenantDefaults: RoleDefaults | null,
): string {
  const role     = member.role ?? 'agente'
  const override = (member.permisos as Record<string, string>)?.[module]
  const tenant   = (tenantDefaults as Record<string, Record<string, string>> | null)?.[role]?.[module]
  const code     = DEFAULT_PERMISSIONS[role]?.[module]
  return override ?? tenant ?? code ?? 'none'
}

// Obtiene tooltip para cada nivel
function getPermTooltip(perm: string): string {
  switch (perm) {
    case 'full': return 'Total (puede editar y eliminar)'
    case 'write': return 'Editar (puede crear y editar)'
    case 'read': return 'Lectura (solo ver)'
    default: return 'Sin acceso'
  }
}

// Renderiza el resumen de permisos
function renderPermSummary(member: TeamMember, tenantDefaults: RoleDefaults | null) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {SUMMARY_MODULES.map(mod => {
        const perm = getEffectivePerm(member, mod, tenantDefaults)

        const permStyles: Record<string, { bg: string; text: string; dot: string }> = {
          full:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: '●' },
          write: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: '●' },
          read:  { bg: 'bg-purple-100', text: 'text-purple-700', dot: '●' },
          none:  { bg: 'bg-gray-100',   text: 'text-gray-400',   dot: '○' },
        }

        const style = permStyles[perm] ?? permStyles.none

        return (
          <span
            key={mod}
            className={`text-[10px] px-1.5 py-0.5 rounded cursor-default ${style.bg} ${style.text}`}
            title={`${MODULE_LABELS[mod]}: ${getPermTooltip(perm)}`}
          >
            {style.dot}
          </span>
        )
      })}
    </div>
  )
}

export function SeccionEquipo() {
  const isAdmin = useIsAdmin()
  const { data: team = [] } = useTeam()
  const { consultant } = useBrand()
  const removeRole = useRemoveRole()
  const inviteUser = useInviteUser()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  // Estado para modal de permisos
  const [permModalUser, setPermModalUser] = useState<TeamMember | null>(null)

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    try {
      await inviteUser.mutateAsync(inviteEmail.trim())
      toast.success(`Invitación enviada a ${inviteEmail}`)
      setInviteEmail('')
      setShowInvite(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al invitar')
    }
  }

  async function handleRemoveUser(userId: string, name: string) {
    if (!confirm(`¿Quitar el acceso al sistema a "${name}"?`)) return
    try {
      await removeRole.mutateAsync(userId)
      toast.success('Acceso eliminado')
    } catch {
      toast.error('Error al eliminar acceso')
    }
  }

  // No mostrar sección si no es admin
  if (!isAdmin) {
    return (
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <p className="text-xs text-gray-400">No tienes acceso a esta sección</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">👥 Mi Equipo</p>
          <p className="text-xs text-gray-400 mt-1">Gestiona permisos por usuario</p>
        </div>
        <button
          onClick={() => setShowInvite(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Invitar
        </button>
      </div>

      {/* Formulario de invitación */}
      {showInvite && (
        <div className="p-3 bg-gray-50 rounded-lg flex gap-2">
          <input
            type="email"
            placeholder="Email del nuevo usuario"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
          <button
            onClick={handleInvite}
            disabled={inviteUser.isPending}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40"
          >
            {inviteUser.isPending ? 'Enviando...' : 'Invitar'}
          </button>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="flex flex-col gap-2">
        {team.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar simple */}
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm">
                {(member.full_name ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {member.full_name ?? 'Sin nombre'}
                  </p>
                  {member.is_owner && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      Propietario
                    </span>
                  )}
                </div>
                {/* Resumen de permisos por módulo */}
                {renderPermSummary(member, consultant.role_defaults)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !member.is_owner && setPermModalUser(member)}
                disabled={member.is_owner}
                title={member.is_owner ? 'El propietario no puede ser modificado' : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Settings className="w-4 h-4" />
                Configurar
              </button>
              {!member.is_owner && (
                <button
                  onClick={() => handleRemoveUser(member.id, member.full_name ?? member.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Quitar acceso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No hay usuarios todavía</p>
        )}
      </div>

      {/* Modal de permisos */}
      {permModalUser && (
        <PermisosModal
          user={permModalUser}
          open={!!permModalUser}
          onClose={() => setPermModalUser(null)}
        />
      )}
    </div>
  )
}
