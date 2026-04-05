// src/hooks/useCommercialAllies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type CommercialAlly = {
  id: string
  nombre: string
  porcentaje_default: number
  telefono: string | null
  email: string | null
  activo: boolean
}

export function useCommercialAllies() {
  return useQuery({
    queryKey: ['commercial_allies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commercial_allies')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data as unknown as CommercialAlly[]
    },
  })
}

export function useCommercialAlliesActive() {
  const { data, ...rest } = useCommercialAllies()
  return {
    ...rest,
    data: data?.filter(a => a.activo) ?? [],
  }
}

export function useCreateAlly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ally: Omit<CommercialAlly, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('commercial_allies')
        .insert(ally as unknown as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commercial_allies'] }),
  })
}

export function useUpdateAlly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommercialAlly> & { id: string }) => {
      const { data, error } = await supabase
        .from('commercial_allies')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as never)
        .eq('id', id as any)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commercial_allies'] }),
  })
}

export function useDeleteAlly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commercial_allies')
        .delete()
        .eq('id', id as any)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commercial_allies'] }),
  })
}
