// src/components/auth/RequireRole.tsx
import { useEffect } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { useNoPermiso } from '@/context/NoPermisoContext'

interface Props {
  role: 'admin' | 'agente'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequireRole({ role, children, fallback = null }: Props) {
  const { data: userRole, isLoading } = useUserRole()
  const { showNoPermiso } = useNoPermiso()

  const denied = !isLoading && userRole !== role

  useEffect(() => {
    if (denied) showNoPermiso()
  }, [denied])

  if (isLoading) return null
  if (denied) return <>{fallback}</>
  return <>{children}</>
}
