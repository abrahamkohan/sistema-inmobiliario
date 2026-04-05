// src/hooks/usePermiso.ts
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import { useBrand } from '@/context/BrandContext'
import { resolvePermiso } from '@/lib/resolvePermiso'

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

  return resolvePermiso(team, session?.user?.id, consultant, module, level)
}
