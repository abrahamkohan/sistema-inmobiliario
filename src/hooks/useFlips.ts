// src/hooks/useFlips.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAllFlips, getFlipById, createFlip, updateFlip, deleteFlip, duplicateFlip } from '@/lib/flips'
import type { FlipInsert, FlipUpdate } from '@/lib/flips'

const QK = 'flip_calculations'

export function useFlips() {
  return useQuery({ queryKey: [QK], queryFn: getAllFlips })
}

export function useFlipById(id: string) {
  return useQuery({ queryKey: [QK, id], queryFn: () => getFlipById(id), enabled: !!id })
}

export function useCreateFlip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: FlipInsert) => createFlip(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdateFlip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FlipUpdate }) => updateFlip(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteFlip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFlip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}

export function useDuplicateFlip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => duplicateFlip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
