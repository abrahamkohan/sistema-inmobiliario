// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, getClient, createClient, updateClient, deleteClient } from '@/lib/clients'
import { createTask } from '@/lib/tasks'
import { useAuth } from '@/context/AuthContext'
import type { Database } from '@/types/database'

type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClient(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: (input: ClientInsert) =>
      createClient({ ...input, assigned_to: session?.user?.id ?? null }),
    onSuccess: (newClient) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      if ((newClient.tipo ?? 'lead') === 'lead' && session?.user?.id) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(12, 0, 0, 0)
        createTask({
          title:       'Seguimiento inicial',
          due_date:    tomorrow.toISOString(),
          type:        'whatsapp',
          context:     'lead',
          priority:    'medium',
          status:      'pending',
          lead_id:     newClient.id,
          assigned_to: session.user.id,
          created_by:  session.user.id,
        }).then(() => qc.invalidateQueries({ queryKey: ['tasks'] }))
      }
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClientUpdate }) =>
      updateClient(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useConvertToCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      updateClient(id, {
        tipo: 'cliente',
        estado: 'convertido',
        converted_at: new Date().toISOString(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useChangeEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      updateClient(id, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useReassignClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, agentId }: { clientId: string; agentId: string }) =>
      updateClient(clientId, { assigned_to: agentId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
