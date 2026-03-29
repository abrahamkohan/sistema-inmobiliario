// src/components/auth/RequireRole.tsx
import { useUserRole } from '@/hooks/useUserRole'

interface Props {
  role: 'admin' | 'agente'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequireRole({ role, children, fallback = null }: Props) {
  const { data: userRole, isLoading } = useUserRole()
  if (isLoading) return null
  if (userRole !== role) return <>{fallback}</>
  return <>{children}</>
}
