// src/hooks/useAgentes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/agentes'
import type { Database } from '@/types/database'

type AgenteInsert = Database['public']['Tables']['agentes']['Insert']
type AgenteUpdate = Database['public']['Tables']['agentes']['Update']

const QK = 'agentes'

export function useAgentes() {
  return useQuery({ queryKey: [QK], queryFn: api.getAgentes })
}

export function useCreateAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AgenteInsert) => api.createAgente(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdateAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgenteUpdate }) => api.updateAgente(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAgente(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}
