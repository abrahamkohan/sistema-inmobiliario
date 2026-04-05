// src/hooks/usePermiso.ts
// Permiso = booleano. Sin niveles, sin resolución de cadena, sin role_defaults.
//
// Reglas:
//   is_owner → siempre true
//   permisos[module] === true → true
//   cualquier otra cosa → false
//   loading → true (no ocultar mientras carga)
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import type { ModuleKey } from '@/types/consultant'

export function usePermiso(module: ModuleKey): boolean {
  const { session } = useAuth()
  const { data: team = [], isLoading } = useTeam()

  // Mientras carga: mostrar (evita flash de sidebar vacío)
  if (isLoading) return true
  if (!session?.user?.id) return false

  const current = team.find(m => m.id === session.user.id)
  if (!current) return false

  // Propietario → acceso total siempre
  if (current.is_owner) return true

  return current.permisos?.[module] === true
}
