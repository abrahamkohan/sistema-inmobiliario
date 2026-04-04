// src/components/configuracion/SeccionEquipo.tsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTeam, useSetRole, useRemoveRole, useInviteUser } from '@/hooks/useTeam'
import { useSetPermisos } from '@/hooks/useSetPermisos'
import { useAuth } from '@/context/AuthContext'

// Roles disponibles para asignar
const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'asesor', label: 'Asesor' },
  { value: 'cm', label: 'CM' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'viewer', label: 'Viewer' },
]

// Módulos que pueden tener permisos personalizados (clave -> label)
const PERM_MODULES: Record<string, string> = {
  crm: 'CRM',
  propiedades: 'Propiedades',
  proyectos: 'Proyectos',
  media_props: 'Media (Prop/Proj)',
  marketing_media: 'Marketing',
  finanzas: 'Finanzas',
  tareas: 'Tareas',
  reportes: 'Reportes',
  configuracion: 'Configuración',
}

const PERM_OPTIONS = [
  { value: 'none', label: '—' },
  { value: 'read', label: '👁' },
  { value: 'write', label: '✏️' },
  { value: 'full', label: '🗑️' },
]

export function SeccionEquipo() {
  const { session } = useAuth()
  const { data: team = [] } = useTeam()
  const setRole = useSetRole()
  const removeRole = useRemoveRole()
  const inviteUser = useInviteUser()
  const setPermisos = useSetPermisos()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('asesor')

  // Estado para edición de permisos
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [permValues, setPermValues] = useState<Record<string, string>>({})

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
      await setRole.mutateAsync({ userId, role: role as 'admin' | 'agente' })
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

  function openPermEdit(userId: string, currentPerms: Record<string, string> | null) {
    setEditingUserId(userId)
    setPermValues(currentPerms ?? {})
  }

  function closePermEdit() {
    setEditingUserId(null)
    setPermValues({})
  }

  async function savePerms(userId: string) {
    try {
      await setPermisos.mutateAsync({ userId, permisos: permValues })
      toast.success('Permisos guardados')
      closePermEdit()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar permisos')
    }
  }

  function updatePerm(module: string, value: string) {
    setPermValues(prev => ({ ...prev, [module]: value }))
  }

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">👥 Mi Equipo</p>
          <p className="text-xs text-gray-400 mt-1">Usuarios con acceso al sistema</p>
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
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              disabled={inviteUser.isPending || !inviteEmail.trim()}
              className="h-9 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold disabled:opacity-40"
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
        {team.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(member.full_name ?? member.id)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{member.full_name ?? '—'}</span>
                  {member.is_owner && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Propietario</span>
                  )}
                  {!member.is_owner && member.id === session?.user.id && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">Vos</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{member.role ?? 'Sin rol'}</p>
              </div>
            </div>

            {/* Acciones del usuario */}
            {!member.is_owner && member.id !== session?.user.id && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <select
                    value={member.role ?? ''}
                    onChange={e => handleSetRole(member.id, e.target.value)}
                    className="h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                  >
                    <option value="">Sin rol</option>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveUser(member.id, member.full_name ?? member.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Quitar acceso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openPermEdit(member.id, member.permisos)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar permisos"
                  >
                    Permisos
                  </button>
                </div>
                {editingUserId === member.id && (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                    {Object.entries(PERM_MODULES).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2 mb-1">
                        <span className="w-32 text-sm">{label}</span>
                        <select
                          value={permValues[key] ?? 'none'}
                          onChange={e => updatePerm(key, e.target.value)}
                          className="h-8 px-2 text-xs border border-gray-200 rounded"
                        >
                          {PERM_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => savePerms(member.id)}
                        className="px-3 py-1 bg-gray-900 text-white text-xs rounded disabled:opacity-40"
                        disabled={setPermisos.isPending}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={closePermEdit}
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {team.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No hay usuarios todavía</p>
        )}
      </div>
    </div>
  )
}
