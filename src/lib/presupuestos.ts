// src/lib/presupuestos.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type PRow = Database['public']['Tables']['presupuestos']['Row']
type PInsert = Database['public']['Tables']['presupuestos']['Insert']
type PUpdate = Database['public']['Tables']['presupuestos']['Update']

export async function getAllPresupuestos(): Promise<PRow[]> {
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as PRow[]
}

export async function getPresupuestoById(id: string): Promise<PRow> {
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as PRow
}

export async function createPresupuesto(input: PInsert): Promise<PRow> {
  const { data, error } = await supabase
    .from('presupuestos')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PRow
}

export async function updatePresupuesto(id: string, input: PUpdate): Promise<PRow> {
  const { data, error } = await supabase
    .from('presupuestos')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PRow
}

export async function deletePresupuesto(id: string): Promise<void> {
  const { error } = await supabase
    .from('presupuestos')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function duplicatePresupuesto(id: string): Promise<PRow> {
  const { data: original, error: fetchError } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError
  const { id: _id, created_at: _ca, ...rest } = original as unknown as PRow
  const { data, error } = await supabase
    .from('presupuestos')
    .insert({ ...rest, client_id: null, client_name: null })
    .select()
    .single()
  if (error) throw error
  return data as unknown as PRow
}
