// src/hooks/useUserRole.ts
import { useQuery } from '@tanstack/react-query'
import { getUserRole } from '@/lib/userRoles'

export function useUserRole() {
  return useQuery({
    queryKey: ['user-role'],
    queryFn: getUserRole,
    staleTime: 5 * 60 * 1000,
  })
}

export function useIsAdmin() {
  const { data: role } = useUserRole()
  return role === 'admin'
}
