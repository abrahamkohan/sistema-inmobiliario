// src/hooks/useUserRole.ts
import { useQuery } from '@tanstack/react-query'
import { getUserRole } from '@/lib/userRoles'

const EMPTY_ROLE: 'admin' | 'agente' | null = null

export function useUserRole() {
  return useQuery<'admin' | 'agente' | null>({
    queryKey: ['user-role'],
    queryFn: getUserRole,
    staleTime: 5 * 60 * 1000,
    initialData: EMPTY_ROLE,
  })
}

export function useIsAdmin() {
  const { data: role } = useUserRole()
  // role puede ser 'admin', 'agente', o null - defaults a false (agente)
  return role === 'admin'
}
