// src/hooks/usePermiso.ts
// Permiso por nivel: 'read' | 'write' | 'full' | null (sin acceso)
// Retrocompatible: boolean true → 'write'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import type { ModuleKey, PermissionLevel } from '@/types/consultant'

/** Nivel real del usuario en el módulo. null = sin acceso. */
export function usePermisoLevel(module: ModuleKey): PermissionLevel | null {
  const { session } = useAuth()
  const { data: team = [], isLoading } = useTeam()

  if (isLoading) return 'full'
  if (!session?.user?.id) return null

  const OWNER_ID = '62eb703e-6cc6-46d9-a664-e64295f61d31'
  const current = team.find(m => m.id === session.user.id)

  // Fallback para el owner: si no está en el team O si está pero sin roles cargados
  if (!current || (current.id === OWNER_ID && !current.is_owner && !current.permisos)) {
    if (session.user.id === OWNER_ID) return 'full'
    return null
  }
  if (current.is_owner) return 'full'

  const val = current.permisos?.[module]
  if (val === true) return 'write'   // retrocompatibilidad con boolean
  if (val === 'read' || val === 'write' || val === 'full') return val
  return null
}

/** ¿Puede acceder al módulo? (cualquier nivel — para sidebar y RequirePermiso) */
export function usePermiso(module: ModuleKey): boolean {
  return usePermisoLevel(module) !== null
}

/** ¿Puede crear y editar? (write o full) */
export function usePuedeEditar(module: ModuleKey): boolean {
  const level = usePermisoLevel(module)
  return level === 'write' || level === 'full'
}

/** ¿Puede eliminar? (solo full) */
export function usePuedeBorrar(module: ModuleKey): boolean {
  return usePermisoLevel(module) === 'full'
}
