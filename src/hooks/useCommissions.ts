// src/hooks/useCommissions.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/commissions'
import type { Database } from '@/types/database'

type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
type CommissionUpdate = Database['public']['Tables']['commissions']['Update']
type IncomeInsert     = Database['public']['Tables']['commission_incomes']['Insert']

const QK = 'commissions'

export function useCommissions() {
  return useQuery({ queryKey: [QK], queryFn: api.getCommissions })
}

export function useCommissionById(id: string) {
  return useQuery({
    queryKey: [QK, id],
    queryFn: () => api.getCommissionById(id),
    enabled: !!id,
  })
}

export function useCreateCommissionWithSplits() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      commissionData,
      agentes,
    }: {
      commissionData: CommissionInsert
      agentes: { id: string; nombre: string; porcentaje_comision: number }[]
    }) => api.createCommissionWithSplits(commissionData, agentes),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CommissionUpdate }) =>
      api.updateCommission(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCommission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useMarkSplitAsFacturado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      splitId,
      numeroFactura,
      fechaFactura,
    }: {
      splitId: string
      numeroFactura: string
      fechaFactura: string
    }) => api.markSplitAsFacturado(splitId, numeroFactura, fechaFactura),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useAddCommissionClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      commissionId,
      clientId,
      tipo,
    }: {
      commissionId: string
      clientId: string
      tipo: 'vendedor' | 'comprador'
    }) => api.addCommissionClient(commissionId, clientId, tipo),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useRemoveCommissionClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commissionId, clientId }: { commissionId: string; clientId: string }) =>
      api.removeCommissionClient(commissionId, clientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useCreateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IncomeInsert) => api.createIncome(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useUpdateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncomeInsert> }) =>
      api.updateIncome(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteIncome(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}
