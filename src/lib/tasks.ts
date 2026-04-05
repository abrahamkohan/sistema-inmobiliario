// src/lib/tasks.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type TaskRow    = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// ── Helpers de urgencia (nunca persistidos en DB) ──────────────────────────

export type TaskUrgency = 'overdue' | 'today' | 'upcoming' | 'closed'

export function getUrgency(task: TaskRow): TaskUrgency {
  if (task.status === 'closed') return 'closed'
  const due     = new Date(task.due_date)
  const today   = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (due < today)                         return 'overdue'
  if (due >= today && due < tomorrow)      return 'today'
  return 'upcoming'
}

export function suggestNextDate(outcome: TaskRow['outcome']): Date {
  const base = new Date()
  const days: Record<string, number> = {
    interested:    1,
    no_response:   5,
    not_interested: 7,
  }
  base.setDate(base.getDate() + (days[outcome ?? 'no_response'] ?? 3))
  return base
}

export function getNextRecurrenceDate(task: TaskRow): Date {
  const base = new Date(task.due_date)
  if (task.recurrence === 'weekly')  base.setDate(base.getDate() + 7)
  if (task.recurrence === 'monthly') base.setMonth(base.getMonth() + 1)
  if (task.recurrence === 'yearly')  base.setFullYear(base.getFullYear() + 1)
  return base
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
  if (error) throw error
  return data as unknown as TaskRow[]
}

export async function getTasksByLead(leadId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('lead_id', leadId as any)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data as unknown as TaskRow[]
}

export async function getTasksByProperty(propertyId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('property_id', propertyId as any)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data as unknown as TaskRow[]
}

export async function getTask(id: string): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id as any)
    .single()
  if (error) throw error
  return data as unknown as TaskRow
}

export async function createTask(input: TaskInsert): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(input as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as TaskRow
}

export async function updateTask(id: string, input: TaskUpdate): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input as any)
    .eq('id', id as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as TaskRow
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id as any)
  if (error) throw error
}

// ── Escalar tarea a supervisor ─────────────────────────────────────────────

export async function escalateTask(id: string, supervisorId: string): Promise<TaskRow> {
  return updateTask(id, { escalated_to: supervisorId })
}

// ── Cerrar y crear siguiente instancia si es recurrente ───────────────────

export async function closeAndRecur(task: TaskRow): Promise<void> {
  await updateTask(task.id, { status: 'closed' })

  if (task.recurrence && task.recurrence !== 'none') {
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = task
    await createTask({
      ...rest,
      status:   'pending',
      outcome:  null,
      due_date: getNextRecurrenceDate(task).toISOString(),
    })
  }
}
