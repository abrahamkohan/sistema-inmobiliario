// src/lib/consultoraConfig.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ConsultoraRow    = Database['public']['Tables']['consultants']['Row']
type ConsultoraUpdate = Database['public']['Tables']['consultants']['Update']

const ROW_ID = 1

export async function getConsultoraConfig(): Promise<ConsultoraRow | null> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .eq('id', ROW_ID as unknown as never)
    .maybeSingle()
  if (error) throw error
  return data as ConsultoraRow | null
}

export async function upsertConsultoraConfig(
  values: ConsultoraUpdate & { nombre: string; version?: number },
): Promise<ConsultoraRow> {
  // Increment version on every save for cache busting (logos in PDFs and landing pages)
  const currentVersion = values.version ?? 1
  const nextVersion    = currentVersion + 1

  const payload = { id: ROW_ID, ...values, version: nextVersion }

  const { error } = await supabase
    .from('consultants')
    .upsert(payload as unknown as never, { onConflict: 'id' })
  if (error) throw error

  // Return optimistic row — React Query refetches real data via invalidateQueries
  return { updated_at: new Date().toISOString(), ...payload } as ConsultoraRow
}
