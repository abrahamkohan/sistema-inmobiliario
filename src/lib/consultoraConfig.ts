// src/lib/consultoraConfig.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ConsultoraRow    = Database['public']['Tables']['consultora_config']['Row']
type ConsultoraUpdate = Database['public']['Tables']['consultora_config']['Update']

const ROW_ID = 1

export async function getConsultoraConfig(): Promise<ConsultoraRow | null> {
  const { data, error } = await supabase
    .from('consultora_config')
    .select('*')
    .eq('id', ROW_ID)
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
    .from('consultora_config')
    .upsert(payload, { onConflict: 'id' })
  if (error) throw error

  // Return optimistic row — React Query refetches real data via invalidateQueries
  return { updated_at: new Date().toISOString(), ...payload } as ConsultoraRow
}
