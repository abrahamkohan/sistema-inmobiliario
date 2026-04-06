// src/components/auth/RequirePermiso.tsx
import { useEffect } from 'react'
import { usePermiso } from '@/hooks/usePermiso'
import { useNoPermiso } from '@/context/NoPermisoContext'
import type { ModuleKey } from '@/types/consultant'

interface Props {
  modulo: ModuleKey
  children: React.ReactNode
}

/**
 * Protege contenido por permiso de módulo.
 * - loading → renderiza children (evita flash)
 * - true → renderiza children
 * - false → abre modal "Sin permisos", renderiza null (sin redirigir)
 */
export function RequirePermiso({ modulo, children }: Props) {
  const tienePermiso = usePermiso(modulo)
  const { showNoPermiso } = useNoPermiso()

  useEffect(() => {
    if (!tienePermiso) showNoPermiso()
  }, [tienePermiso])

  if (!tienePermiso) return null

  return <>{children}</>
}
