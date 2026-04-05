// src/hooks/useUserRole.ts
import { useQuery } from '@tanstack/react-query'
import { getUserRole } from '@/lib/userRoles'

export function useUserRole() {
  return useQuery<'admin' | 'agente' | null>({
    queryKey: ['user-role'],
    queryFn: getUserRole,
    staleTime: 5 * 60 * 1000,
    // Sin initialData - necesitamos esperar el valor real antes de renderizar
    // Para evitar flashes de permisos incorrectos
  })
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole()
  // isLoading es true mientras no sepamos el rol real
  // Solo es admin si el rol ya cargó Y es 'admin'
  return isLoading ? false : role === 'admin'
}
