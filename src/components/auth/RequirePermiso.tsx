// src/components/auth/RequirePermiso.tsx
import { usePermiso } from '@/hooks/usePermiso'

interface Props {
  modulo: string
  nivel: 'read' | 'write' | 'full'
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Protege una ruta por nivel de permiso.
 * - Si no tiene permiso → muestra fallback (o redirige)
 * - Si tiene permiso → renderiza children
 */
export function RequirePermiso({ modulo, nivel, children, fallback = null }: Props) {
  const tienePermiso = usePermiso(modulo, nivel)
  
  if (!tienePermiso) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
