// src/hooks/useRequirePermiso.ts
// Devuelve una función check(module, level) que:
//   - Si tiene permiso → devuelve true
//   - Si no tiene permiso → abre el modal y devuelve false
//   - Si está cargando (null) → devuelve true (no bloquear)
//
// Uso en botones:
//   const check = useRequirePermiso()
//   <button onClick={() => { if (check('crm', 'write')) handleCreate() }}>Crear</button>
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'
import { useBrand } from '@/context/BrandContext'
import { useNoPermiso } from '@/context/NoPermisoContext'
import { resolvePermiso } from '@/lib/resolvePermiso'

export function useRequirePermiso() {
  const { session } = useAuth()
  const { data: team = [] } = useTeam()
  const { consultant } = useBrand()
  const { showNoPermiso } = useNoPermiso()

  return function check(module: string, level: string): boolean {
    const result = resolvePermiso(team, session?.user?.id, consultant, module, level)

    // null = loading → no bloquear
    if (result === null) return true

    if (!result) {
      showNoPermiso()
      return false
    }

    return true
  }
}
