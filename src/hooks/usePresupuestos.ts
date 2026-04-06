// src/hooks/usePresupuestos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAllPresupuestos,
  getPresupuestoById,
  getPresupuestosByClient,
  createPresupuesto,
  updatePresupuesto,
  deletePresupuesto,
  duplicatePresupuesto,
} from '@/lib/presupuestos'
import type { Database } from '@/types/database'

const QK = 'presupuestos'

export function usePresupuestos() {
  return useQuery({ queryKey: [QK], queryFn: getAllPresupuestos })
}

export function usePresupuestosByClient(clientId: string) {
  return useQuery({
    queryKey: [QK, 'client', clientId],
    queryFn: () => getPresupuestosByClient(clientId),
    enabled: !!clientId,
  })
}

export function usePresupuestoById(id: string) {
  return useQuery({ queryKey: [QK, id], queryFn: () => getPresupuestoById(id), enabled: !!id })
}

export function useCreatePresupuesto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Database['public']['Tables']['presupuestos']['Insert']) =>
      createPresupuesto(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdatePresupuesto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Database['public']['Tables']['presupuestos']['Update'] }) =>
      updatePresupuesto(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeletePresupuesto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePresupuesto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}

export function useDuplicatePresupuesto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => duplicatePresupuesto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
