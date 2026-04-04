// src/hooks/usePermiso.ts
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'


/**
 * Hook to check if the current user has a given permission level for a module.
 * Permissions are stored in `user_roles.permisos` JSONB column as:
 * { [module: string]: 'read' | 'write' | 'full' }
 * Levels hierarchy: '-' < 'read' < 'write' < 'full'
 */
export function usePermiso(module: string, level: string): boolean {
  const { session } = useAuth()
  const { data: team = [] } = useTeam()

  if (!session?.user?.id) return false
  const current = team.find(m => m.id === session.user.id)
  if (!current) return false

  // Owner has implicit full access
  if (current.is_owner) return true

  // Role based defaults – admins get full, agentes get read, others none
  const roleDefault = current.role === 'admin' ? 'full' : current.role === 'agente' ? 'read' : '-'

  // Override from permisos JSON
  const perms = current.permisos as Record<string, string> | undefined
  const overridden = perms?.[module] ?? roleDefault

  const hierarchy = ['-', 'read', 'write', 'full']
  const requiredIdx = hierarchy.indexOf(level)
  const actualIdx = hierarchy.indexOf(overridden)

  return actualIdx >= requiredIdx
}
