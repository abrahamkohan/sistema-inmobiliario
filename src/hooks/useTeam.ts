// src/hooks/useTeam.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/team'

const QK = 'team'

export function useTeam() {
  return useQuery({ queryKey: [QK], queryFn: api.getTeam })
}

export function useSetRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'agente' }) =>
      api.setRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useRemoveRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.removeRole(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useInviteUser() {
  return useMutation({
    mutationFn: (email: string) => api.inviteUser(email),
  })
}
