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
 * - Si null (loading) → esperar, no redirigir
 * - Si false (sin permiso) → fallback
 * - Si true → renderiza children
 */
export function RequirePermiso({ modulo, nivel, children, fallback = null }: Props) {
  const tienePermiso = usePermiso(modulo, nivel)
  
  // Si está cargando (null), no redirigir todavía
  if (tienePermiso === null) {
    return null
  }
  
  // Si no tiene permiso, mostrar fallback
  if (!tienePermiso) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}
