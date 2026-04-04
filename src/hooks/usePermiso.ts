// src/hooks/usePermiso.ts
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'

/**
 * Hook to check if the current user has a given permission level for a module.
 * Permissions are stored in `user_roles.permisos` JSONB column as:
 * { [module: string]: 'read' | 'write' | 'full' | 'none' }
 * Levels hierarchy: 'none' < 'read' < 'write' < 'full'
 */
export function usePermiso(module: string, level: string): boolean {
  const { session } = useAuth()
  const { data: team = [] } = useTeam()

  // Si no hay sesión o el equipo no ha cargado, retornar false
  if (!session?.user?.id) return false
  if (!team || team.length === 0) return false

  const current = team.find(m => m.id === session.user.id)
  if (!current) return false

  // Owner has implicit full access
  if (current.is_owner) return true

  // Role based defaults from DEFAULT_PERMISSIONS
  const roleDefaults = DEFAULT_PERMISSIONS[current.role ?? 'viewer'] ?? {}
  const roleDefault = roleDefaults[module] ?? 'none'

  // Override from permisos JSON
  const perms = current.permisos as Record<string, string> | undefined
  const overridden = perms?.[module] ?? roleDefault

  const hierarchy = ['none', 'read', 'write', 'full']
  const requiredIdx = hierarchy.indexOf(level)
  const actualIdx = hierarchy.indexOf(overridden)

  return actualIdx >= requiredIdx
}

