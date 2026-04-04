// src/lib/agentes.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type AgenteRow    = Database['public']['Tables']['agentes']['Row']
type AgenteInsert = Database['public']['Tables']['agentes']['Insert']
type AgenteUpdate = Database['public']['Tables']['agentes']['Update']

export async function getAgentes(): Promise<AgenteRow[]> {
  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data as unknown as AgenteRow[]
}

export async function getAgentesActivos(): Promise<AgenteRow[]> {
  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })
  if (error) throw error
  return data as unknown as AgenteRow[]
}

export async function createAgente(input: AgenteInsert): Promise<AgenteRow> {
  const { data, error } = await supabase
    .from('agentes')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as AgenteRow
}

export async function updateAgente(id: string, input: AgenteUpdate): Promise<AgenteRow> {
  const { data, error } = await supabase
    .from('agentes')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as AgenteRow
}

export async function deleteAgente(id: string): Promise<void> {
  const { error } = await supabase.from('agentes').delete().eq('id', id)
  if (error) throw error
}
