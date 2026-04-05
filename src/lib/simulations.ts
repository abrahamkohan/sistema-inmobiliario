// src/lib/simulations.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type SimRow = Database['public']['Tables']['simulations']['Row']
type SimInsert = Database['public']['Tables']['simulations']['Insert']

export async function getAllSimulations(): Promise<(SimRow & { client_name: string | null })[]> {
  const { data, error } = await supabase
    .from('simulations')
    .select('*, clients(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as unknown as Array<SimRow & { clients: { full_name: string } | null }>).map((row) => ({
    ...row,
    client_name: row.clients?.full_name ?? null,
  }))
}

export async function getSimulationById(id: string): Promise<SimRow> {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('id', id as any)
    .single()
  if (error) throw error
  return data as unknown as SimRow
}

export async function getSimulationsByClient(clientId: string): Promise<SimRow[]> {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('client_id', clientId as any)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as SimRow[]
}

export async function createSimulation(input: SimInsert): Promise<SimRow> {
  const { data, error } = await supabase
    .from('simulations')
    .insert(input as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as SimRow
}

export async function deleteSimulation(id: string): Promise<void> {
  const { error } = await supabase
    .from('simulations')
    .delete()
    .eq('id', id as any)
  if (error) throw error
}

export async function updateSimulation(id: string, input: Database['public']['Tables']['simulations']['Update']): Promise<SimRow> {
  const { data, error } = await supabase
    .from('simulations')
    .update(input as any)
    .eq('id', id as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as SimRow
}

export async function updateSimulationReportPath(id: string, reportPath: string): Promise<SimRow> {
  const { data, error } = await supabase
    .from('simulations')
    .update({ report_path: reportPath } as any)
    .eq('id', id as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as SimRow
}
