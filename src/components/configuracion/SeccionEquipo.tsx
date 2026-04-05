// src/components/configuracion/SeccionEquipo.tsx
import { useState, useEffect } from 'react'
import { Plus, Trash2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useTeam, useRemoveRole, useInviteUser } from '@/hooks/useTeam'
import { useIsAdmin } from '@/hooks/useUserRole'
import { useAuth } from '@/context/AuthContext'
import { PermisosModal } from './PermisosModal'
import type { TeamMember } from '@/lib/team'

// Módulos en orden del Sidebar
const SUMMARY_MODULES = [
  'crm', 'tareas', 'notas', 'propiedades', 'proyectos',
  'ventas', 'simulador', 'flip', 'presupuestos',
  'reportes', 'marketing', 'configuracion',
]

const MODULE_LABELS: Record<string, string> = {
  crm:           'Clientes',
  tareas:        'Tareas',
  notas:         'Notas',
  propiedades:   'Propiedades',
  proyectos:     'Proyectos',
  ventas:        'Ventas',
  simulador:     'Simulador',
  flip:          'Flip',
  presupuestos:  'Presupuestos',
  reportes:      'Informes',
  marketing:     'Marketing',
  configuracion: 'Configuración',
}

function PermSummary({ member }: { member: TeamMember }) {
  if (member.is_owner) {
    return (
      <p className="text-[10px] text-amber-600 font-medium mt-0.5">Acceso total</p>
    )
  }

  const permisos = (member.permisos as Record<string, boolean> | null) ?? {}

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {SUMMARY_MODULES.map(mod => {
        const tiene = permisos[mod] === true
        return (
          <span
            key={mod}
            title={`${MODULE_LABELS[mod]}: ${tiene ? 'Con acceso' : 'Sin acceso'}`}
            className={`text-[10px] px-1.5 py-0.5 rounded cursor-default ${
              tiene
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {MODULE_LABELS[mod]}
          </span>
        )
      })}
    </div>
  )
}

export function SeccionEquipo() {
  const isAdmin = useIsAdmin()
  const { data: team = [] } = useTeam()
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  useEffect(() => {
    const ownerCount = team.filter(m => m.is_owner).length
    if (ownerCount > 1) console.warn(`[SeccionEquipo] ${ownerCount} owners detectados — verificar datos`)
  }, [team])

  const removeRole = useRemoveRole()
  const inviteUser = useInviteUser()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
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

  if (!isAdmin) {
    return (
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <p className="text-xs text-gray-400">No tenés acceso a esta sección</p>
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

      <div className="flex flex-col gap-2">
        {team.map(member => (
          <div
            key={member.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              member.id === currentUserId
                ? 'bg-blue-50/60 border border-blue-100 hover:bg-blue-50'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm flex-shrink-0">
                {(member.full_name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {member.full_name ?? 'Sin nombre'}
                  </p>
                  {member.is_owner && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      Propietario
                    </span>
                  )}
                  {member.id === currentUserId && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Vos
                    </span>
                  )}
                  {member.role && !member.is_owner && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
                      {member.role}
                    </span>
                  )}
                </div>
                <PermSummary member={member} />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => !member.is_owner && setPermModalUser(member)}
                disabled={member.is_owner}
                title={member.is_owner ? 'El propietario no puede ser modificado' : 'Configurar permisos'}
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
