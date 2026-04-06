// src/lib/consultants.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ConsultantInsert = Database['public']['Tables']['consultants']['Insert']
type ConsultantRow    = Database['public']['Tables']['consultants']['Row']

export async function createConsultant(input: ConsultantInsert): Promise<ConsultantRow> {
  const { data, error } = await supabase
    .from('consultants')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as ConsultantRow
}

export async function getConsultants(): Promise<ConsultantRow[]> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ConsultantRow[]
}
