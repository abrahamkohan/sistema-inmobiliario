// src/hooks/useUserRole.ts
import { useQuery } from '@tanstack/react-query'
import { getUserRole } from '@/lib/userRoles'

export function useUserRole() {
  return useQuery<'admin' | 'agente' | null>({
    queryKey: ['user-role'],
    queryFn: getUserRole,
    staleTime: 5 * 60 * 1000,
  })
}

export function useIsAdmin(): boolean | null {
  // Retorna null mientras carga para evitar render incorrecto
  const { data: role, isLoading } = useUserRole()
  if (isLoading) return null
  return role === 'admin'
}
