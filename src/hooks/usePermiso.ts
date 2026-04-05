// src/hooks/usePermiso.ts
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import { useBrand } from '@/context/BrandContext'
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'

/**
 * Hook to check if the current user has a given permission level for a module.
 * Returns null during loading to indicate "don't know yet" - components should wait.
 *
 * Resolution chain (first defined wins):
 *   1. user_roles.permisos[module]            — personal override
 *   2. consultants.role_defaults[role][module] — tenant-level role default
 *   3. DEFAULT_PERMISSIONS[role][module]       — code-level fallback
 *   4. 'none'
 */
export function usePermiso(module: string, level: string): boolean | null {
  const { session } = useAuth()
  const { data: team = [], isLoading } = useTeam()
  const { consultant } = useBrand()

  if (isLoading) return null
  if (!session?.user?.id) return false
  if (!team || team.length === 0) return false

  const current = team.find(m => m.id === session.user.id)
  if (!current) return false

  const role = current.role ?? 'viewer'

  // 1. Personal override
  const perms = current.permisos as Record<string, string> | undefined
  const userOverride = perms?.[module]

  // 2. Tenant-level role default
  const tenantDefault = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[role]?.[module]

  // 3. Code-level fallback
  const codeDefault = DEFAULT_PERMISSIONS[role]?.[module] ?? 'none'

  const effective = userOverride ?? tenantDefault ?? codeDefault

  const hierarchy = ['none', 'read', 'write', 'full']
  const requiredIdx = hierarchy.indexOf(level)
  const actualIdx   = hierarchy.indexOf(effective)

  return actualIdx >= requiredIdx
}
