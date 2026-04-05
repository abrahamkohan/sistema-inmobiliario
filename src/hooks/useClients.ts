// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, getClient, createClient, updateClient, deleteClient } from '@/lib/clients'
import { createTask } from '@/lib/tasks'
import { useAuth } from '@/context/AuthContext'
import { useBrand } from '@/context/BrandContext'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type ClientRow    = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export function useClients() {
  const { session } = useAuth()
  console.log('[DEBUG useClients] USER ID:', session?.user?.id)
  
  return useQuery<ClientRow[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const result = await getClients()
      console.log('[DEBUG useClients] CLIENTS RESULT:', result.length, 'clients')
      return result
    },
    initialData: [],
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
  const { consultant } = useBrand()
  return useMutation({
    mutationFn: (input: ClientInsert) => {
      const dataWithConsultant = {
        ...input,
        assigned_to: session?.user?.id ?? null,
        consultant_id: consultant.uuid as any
      }
      return createClient(dataWithConsultant)
    },
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
    mutationFn: async ({ clientId, agentId }: { clientId: string; agentId: string }) => {
      console.log('[Reassign] Updating client:', clientId, 'to agent:', agentId)
      const result = await updateClient(clientId, { assigned_to: agentId })
      console.log('[Reassign] Success:', result)
      return result
    },
    onSuccess: () => {
      console.log('[Reassign] Query invalidated')
      toast.success('Cliente asignado correctamente')
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error) => {
      console.error('[Reassign] Error:', error)
      toast.error('Error al asignar cliente: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    },
  })
}
