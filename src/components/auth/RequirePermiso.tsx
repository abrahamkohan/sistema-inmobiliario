// src/components/auth/RequirePermiso.tsx
import { usePermiso } from '@/hooks/usePermiso'
import type { ModuleKey } from '@/types/consultant'

interface Props {
  modulo: ModuleKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Protege contenido por permiso de módulo.
 * - true (o loading) → renderiza children
 * - false → fallback
 */
export function RequirePermiso({ modulo, children, fallback = null }: Props) {
  const tienePermiso = usePermiso(modulo)

  if (!tienePermiso) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
