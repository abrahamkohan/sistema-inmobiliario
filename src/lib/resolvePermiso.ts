// src/lib/resolvePermiso.ts
// Función pura que resuelve el nivel efectivo de permiso para un módulo.
// Usada por usePermiso y useRequirePermiso para evitar duplicar lógica.
import { DEFAULT_PERMISSIONS } from '@/lib/roleDefaults'
import type { TeamMember } from '@/lib/team'
import type { Consultant } from '@/types/consultant'

const HIERARCHY = ['none', 'read', 'write', 'full']

/**
 * Resuelve si userId tiene permiso `level` sobre `module`.
 *
 * Chain: user_roles.permisos → role_defaults → DEFAULT_PERMISSIONS → 'none'
 *
 * @returns true | false | null (null = loading, no bloquear)
 */
export function resolvePermiso(
  team: TeamMember[],
  userId: string | undefined,
  consultant: Consultant,
  module: string,
  level: string,
): boolean | null {
  if (!userId) return false
  if (team.length === 0) return null  // loading

  const current = team.find(m => m.id === userId)
  if (!current) return false

  // El propietario siempre tiene acceso total — sus overrides no lo bloquean
  if (current.is_owner) return true

  const role = current.role ?? 'viewer'

  const perms = current.permisos as Record<string, string> | undefined
  const userOverride  = perms?.[module]
  const tenantDefault = (consultant.role_defaults as Record<string, Record<string, string>> | null)?.[role]?.[module]
  const codeDefault   = DEFAULT_PERMISSIONS[role]?.[module] ?? 'none'

  const effective = userOverride ?? tenantDefault ?? codeDefault

  const requiredIdx = HIERARCHY.indexOf(level)
  const actualIdx   = HIERARCHY.indexOf(effective)

  return actualIdx >= requiredIdx
}
