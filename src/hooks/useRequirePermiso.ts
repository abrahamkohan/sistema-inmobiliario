// src/hooks/useRequirePermiso.ts
// Devuelve una función check(module) que abre el modal si no hay permiso.
//
// Uso:
//   const check = useRequirePermiso()
//   <button onClick={() => { if (check('crm')) handleCreate() }}>Crear</button>
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import { useNoPermiso } from '@/context/NoPermisoContext'
import type { ModuleKey } from '@/types/consultant'

export function useRequirePermiso() {
  const { session } = useAuth()
  const { data: team = [], isLoading } = useTeam()
  const { showNoPermiso } = useNoPermiso()

  return function check(module: ModuleKey): boolean {
    if (isLoading) return true
    if (!session?.user?.id) { showNoPermiso(); return false }

    const current = team.find(m => m.id === session.user.id)
    if (!current) { showNoPermiso(); return false }

    if (current.is_owner) return true

    const tiene = current.permisos?.[module] === true
    if (!tiene) showNoPermiso()
    return tiene
  }
}
