// src/components/configuracion/SeccionEquipo.tsx
import { useState } from 'react'
import { Plus, Trash2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useTeam, useRemoveRole, useInviteUser } from '@/hooks/useTeam'
import { useIsAdmin } from '@/hooks/useUserRole'
import { PermisosModal } from './PermisosModal'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'

// Módulos a mostrar en el resumen
const SUMMARY_MODULES = ['crm', 'propiedades', 'marketing_media', 'finanzas', 'configuracion']

// Obtiene permisos efectivos (override o default del rol)
function getEffectivePerm(member: TeamMember, module: string): string {
  const defaults = DEFAULT_PERMISSIONS[member.role ?? 'agente'] ?? {}
  const override = (member.permisos as Record<string, string>)?.[module]
  return override ?? defaults[module] ?? 'none'
}

// Renderiza el resumen de permisos
function renderPermSummary(member: TeamMember) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {SUMMARY_MODULES.map(mod => {
        const perm = getEffectivePerm(member, mod)
        const hasAccess = perm !== 'none'
        const isFull = perm === 'full'
        
        // Nombre corto del módulo
        const modLabel: Record<string, string> = {
          crm: 'CRM',
          propiedades: 'Prop',
          marketing_media: 'Mkt',
          finanzas: 'Fin',
          configuracion: 'Cfg',
        }
        
        return (
          <span
            key={mod}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              isFull 
                ? 'bg-green-100 text-green-700' 
                : hasAccess 
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-400'
            }`}
            title={mod}
          >
            {modLabel[mod]} {hasAccess ? '✓' : '✖'}
          </span>
        )
      })}
    </div>
  )
}

export function SeccionEquipo() {
  const isAdmin = useIsAdmin()
  const { data: team = [] } = useTeam()
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
                <p className="text-sm font-medium text-gray-900">
                  {member.full_name ?? 'Sin nombre'}
                </p>
                {/* Resumen de permisos por módulo */}
                {renderPermSummary(member)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPermModalUser(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configurar
              </button>
              <button
                onClick={() => handleRemoveUser(member.id, member.full_name ?? member.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Quitar acceso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
