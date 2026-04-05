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

  if (error) throw error

  return (data ?? []) as unknown as ClientRow[]
}

export async function getClient(id: string): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id as unknown as never)
    .single()
  if (error) throw error
  return data as unknown as ClientRow
}

export async function createClient(input: ClientInsert): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .insert(input as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as ClientRow
}

export async function updateClient(id: string, input: ClientUpdate): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .update(input as unknown as never)
    .eq('id', id as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as ClientRow
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id as unknown as never)
  if (error) throw error
}
