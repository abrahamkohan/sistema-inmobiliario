// src/lib/flips.ts
import { supabase } from './supabase'

export interface FlipRow {
  id: string
  label: string
  precio_lista: number
  entrega: number
  cantidad_cuotas: number
  valor_cuota: number
  rentabilidad_anual_percent: number
  comision_percent: number
  notas: string | null
  created_at: string
}

export type FlipInsert = Omit<FlipRow, 'id' | 'created_at'>
export type FlipUpdate = Partial<FlipInsert>

export async function getAllFlips(): Promise<FlipRow[]> {
  const { data, error } = await supabase
    .from('flip_calculations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as FlipRow[]
}

export async function getFlipById(id: string): Promise<FlipRow> {
  const { data, error } = await supabase
    .from('flip_calculations')
    .select('*')
    .eq('id', id as unknown as never)
    .single()
  if (error) throw error
  return data as unknown as FlipRow
}

export async function createFlip(input: FlipInsert): Promise<FlipRow> {
  const { data, error } = await supabase
    .from('flip_calculations')
    .insert(input as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as FlipRow
}

export async function updateFlip(id: string, input: FlipUpdate): Promise<FlipRow> {
  const { data, error } = await supabase
    .from('flip_calculations')
    .update(input as unknown as never)
    .eq('id', id as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as FlipRow
}

export async function deleteFlip(id: string): Promise<void> {
  const { error } = await supabase.from('flip_calculations').delete().eq('id', id as unknown as never)
  if (error) throw error
}

export async function duplicateFlip(id: string): Promise<FlipRow> {
  const { data: orig, error: fetchErr } = await supabase
    .from('flip_calculations')
    .select('*')
    .eq('id', id as unknown as never)
    .single()
  if (fetchErr) throw fetchErr
  const { id: _id, created_at: _ca, ...rest } = orig as unknown as FlipRow
  const { data, error } = await supabase
    .from('flip_calculations')
    .insert({ ...rest, label: `${rest.label} (copia)` } as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as FlipRow
}
