// src/hooks/useTeam.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import * as api from '@/lib/team'
import type { TeamMember } from '@/lib/team'

const QK = 'team'

export function useTeam() {
  return useQuery({ queryKey: [QK], queryFn: api.getTeam, staleTime: 0 })
}

/** Devuelve el TeamMember del usuario logueado (reutiliza cache de useTeam). */
export function useCurrentMember(): TeamMember | null {
  const { session } = useAuth()
  const { data: team = [] } = useTeam()
  if (!session?.user?.id) return null
  return team.find(m => m.id === session.user.id) ?? null
}

export function useSetRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'agente' }) =>
      api.setRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useSetUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.setUserRole(userId, role),
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

/** Resuelve un user_id a nombre completo usando el cache del equipo. */
export function useAgentName(userId: string | null | undefined): string | null {
  const { data: team = [] } = useTeam()
  if (!userId) return null
  return team.find(m => m.id === userId)?.full_name ?? null
}
