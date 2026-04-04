// src/components/configuracion/SeccionEquipo.tsx
import { useState } from 'react'
import { Plus, Trash2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useTeam, useSetRole, useRemoveRole, useInviteUser } from '@/hooks/useTeam'
import { useAuth } from '@/context/AuthContext'
import { useBrand } from '@/context/BrandContext'
import { useIsAdmin } from '@/hooks/useUserRole'
import { PermisosModal } from './PermisosModal'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'

// Roles disponibles - admin ve todos, otros solo admin/asesor/cm
const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'asesor', label: 'Asesor comercial' },
  { value: 'cm', label: 'Community Manager' },
  { value: 'finanzas', label: 'Finanzas', adminOnly: true },
  { value: 'viewer', label: 'Viewer', adminOnly: true },
]

// Mapeo de roles a colores del brand
const ROLE_COLORS: Record<string, 'primary' | 'secondary' | 'accent'> = {
  admin: 'primary',
  asesor: 'secondary',
  cm: 'accent',
  finanzas: 'secondary',
  viewer: 'accent',
}

function getRoleLabel(role: string | null): string {
  if (!role) return 'Sin rol'
  const found = ROLES.find(r => r.value === role)
  return found?.label ?? role
}

// Cuenta módulos con permisos custom (distintos al default del rol base)
function countCustomModules(member: TeamMember): number {
  if (!member.permisos || !member.role) return 0
  const defaults = DEFAULT_PERMISSIONS[member.role] ?? {}
  let count = 0
  for (const [mod, perm] of Object.entries(member.permisos)) {
    if (perm !== defaults[mod]) count++
  }
  return count
}

// Obtiene el color CSS del brand para un rol
function getRoleBadgeStyle(role: string | null, colors: { primary: string; secondary: string; accent: string }) {
  if (!role) return { bg: 'bg-gray-100', text: 'text-gray-600' }
  const colorKey = ROLE_COLORS[role] ?? 'secondary'
  const color = colors[colorKey]
  // Genera colores claros para el badge
  const lightColor = color + '15' // 15 = ~8% opacity en hex
  const darkColor = color + '99'   // 99 = ~60% opacity en hex
  return { 
    backgroundColor: lightColor, 
    color: darkColor,
    borderColor: color + '30',
  }
}

export function SeccionEquipo() {
  const { session } = useAuth()
  const isAdmin = useIsAdmin()
  const { engine } = useBrand()
  const { data: team = [] } = useTeam()
  const setRole = useSetRole()
  const removeRole = useRemoveRole()
  const inviteUser = useInviteUser()
  
  const colors = engine.getColors()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('asesor')

  // Estado para modal de permisos
  const [permModalUser, setPermModalUser] = useState<TeamMember | null>(null)

  // Filtrar roles según el permisos del usuario actual
  const availableRoles = ROLES.filter(r => !r.adminOnly || isAdmin)

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

  async function handleSetRole(userId: string, role: string) {
    try {
      // Mapear roles internos: admin->admin, others->agente
      const roleToSave = role === 'admin' ? 'admin' : 'agente'
      await setRole.mutateAsync({ userId, role: roleToSave as 'admin' | 'agente' })
      toast.success('Rol actualizado')
    } catch {
      toast.error('Error al actualizar rol')
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

  const canManageTeam = isAdmin

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">👥 Mi Equipo</p>
          <p className="text-xs text-gray-400 mt-1">Usuarios con acceso al sistema</p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInvite(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="w-3.5 h-3.5" />
            Invitar
          </button>
        )}
      </div>

      {/* Formulario de invitación */}
      {showInvite && canManageTeam && (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              placeholder="email@ejemplo.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="flex-1 min-w-0 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
              autoFocus
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="h-9 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
            >
              {availableRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              disabled={inviteUser.isPending || !inviteEmail.trim()}
              className="h-9 px-3 rounded-lg text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.primary }}
            >
              {inviteUser.isPending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Le llegará un magic link por email. Podés cambiar el rol después desde esta lista.
          </p>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="flex flex-col gap-2">
        {team.map(member => {
          const customMods = countCustomModules(member)
          const badgeStyle = getRoleBadgeStyle(member.role, colors)
          
          return (
            <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl gap-3">
              {/* Avatar + Name + Role */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: colors.primary + '20', color: colors.primary }}
                >
                  {(member.full_name ?? member.id)[0].toUpperCase()}
                </div>
                
                {/* Name + Badges */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                    <span className="truncate">{member.full_name ?? '—'}</span>
                    {member.is_owner && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Propietario</span>
                    )}
                    {!member.is_owner && member.id === session?.user.id && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">Vos</span>
                    )}
                  </p>
                  {/* Role badges */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span 
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md border flex-shrink-0"
                      style={badgeStyle}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                    {customMods > 0 && (
                      <span 
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ 
                          backgroundColor: colors.accent + '15', 
                          color: colors.accent + '99',
                          border: `1px solid ${colors.accent}30`
                        }}
                      >
                        Custom ({customMods} módulo{customMods !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones del usuario - solo admins ven todo */}
              {canManageTeam && !member.is_owner && member.id !== session?.user.id && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Role dropdown */}
                  <select
                    value={member.role ?? ''}
                    onChange={e => handleSetRole(member.id, e.target.value)}
                    className="h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                  >
                    <option value="">Sin rol</option>
                    {availableRoles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  
                  {/* Settings icon - solo si tiene custom permissions */}
                  {customMods > 0 && (
                    <button
                      onClick={() => setPermModalUser(member)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar permisos"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveUser(member.id, member.full_name ?? member.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Quitar acceso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Non-admin users: solo ven el botón de settings si tienen custom permissions */}
              {!canManageTeam && customMods > 0 && (
                <button
                  onClick={() => setPermModalUser(member)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver permisos"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
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
