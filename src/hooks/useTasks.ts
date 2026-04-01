// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  getTasks,
  getTask,
  getTasksByLead,
  getTasksByProperty,
  createTask,
  updateTask,
  deleteTask,
  escalateTask,
  closeAndRecur,
} from '@/lib/tasks'
import type { Database } from '@/types/database'

type TaskRow    = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// ── Queries ───────────────────────────────────────────────────────────────

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn:  getTasks,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn:  () => getTask(id),
    enabled:  !!id,
  })
}

export function useTasksByLead(leadId: string) {
  return useQuery({
    queryKey: ['tasks', 'lead', leadId],
    queryFn:  () => getTasksByLead(leadId),
    enabled:  !!leadId,
  })
}

export function useTasksByProperty(propertyId: string) {
  return useQuery({
    queryKey: ['tasks', 'property', propertyId],
    queryFn:  () => getTasksByProperty(propertyId),
    enabled:  !!propertyId,
  })
}

// Tipos de tarea que se sincronizan con Google Calendar
const GCAL_ELIGIBLE_TYPES = ['call', 'meeting', 'visit']

// ── Mutations ─────────────────────────────────────────────────────────────

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInsert) => createTask(input),
    onSuccess: (newTask) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      // Invalida también la lista del lead/propiedad si aplica
      if (newTask.lead_id)     qc.invalidateQueries({ queryKey: ['tasks', 'lead',     newTask.lead_id] })
      if (newTask.property_id) qc.invalidateQueries({ queryKey: ['tasks', 'property', newTask.property_id] })
      // Google Calendar sync — fire-and-forget, nunca bloquea ni falla la creación
      if (GCAL_ELIGIBLE_TYPES.includes(newTask.type) && !!newTask.due_date) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return
          supabase.functions
            .invoke('google-calendar-sync', {
              body: { task_id: newTask.id },
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            .catch(() => { /* intencional: fallo silencioso */ })
        })
      }
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdate }) =>
      updateTask(id, input),
    // Optimistic update: refleja el cambio antes de confirmar con Supabase
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const previous = qc.getQueryData<TaskRow[]>(['tasks'])
      qc.setQueryData<TaskRow[]>(['tasks'], (old = []) =>
        old.map(t => t.id === id ? { ...t, ...input } : t)
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['tasks'], ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useEscalateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, supervisorId }: { id: string; supervisorId: string }) =>
      escalateTask(id, supervisorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

// Cierra la tarea y crea la siguiente instancia si es recurrente
export function useCloseAndRecur() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (task: TaskRow) => closeAndRecur(task),
    onSuccess: (_data, task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      if (task.lead_id)     qc.invalidateQueries({ queryKey: ['tasks', 'lead',     task.lead_id] })
      if (task.property_id) qc.invalidateQueries({ queryKey: ['tasks', 'property', task.property_id] })
    },
  })
}

// Shortcut: marcar como contacted (al tocar WhatsApp)
export function useMarkContacted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'contacted' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const previous = qc.getQueryData<TaskRow[]>(['tasks'])
      qc.setQueryData<TaskRow[]>(['tasks'], (old = []) =>
        old.map(t => t.id === id ? { ...t, status: 'contacted' } : t)
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['tasks'], ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
