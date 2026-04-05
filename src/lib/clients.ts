// src/lib/clients.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export async function getClients(): Promise<ClientRow[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })
  console.log('GET CLIENTS RAW:', data?.length, error)
  if (error) throw error
  return data as unknown as ClientRow[]
}

export async function getClient(id: string): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as ClientRow
}

export async function createClient(input: ClientInsert): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as ClientRow
}

export async function updateClient(id: string, input: ClientUpdate): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as ClientRow
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) throw error
}
