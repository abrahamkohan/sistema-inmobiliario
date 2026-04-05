// src/hooks/useConsultora.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConsultoraConfig, upsertConsultoraConfig } from '@/lib/consultoraConfig'
import type { Database } from '@/types/database'

type ConsultoraUpdate = Database['public']['Tables']['consultants']['Update'] & { nombre: string }

export function useConsultoraConfig() {
  return useQuery({
    queryKey: ['consultora_config'],
    queryFn: getConsultoraConfig,
  })
}

export function useSaveConsultoraConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: ConsultoraUpdate) => upsertConsultoraConfig(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultora_config'] }),
  })
}
