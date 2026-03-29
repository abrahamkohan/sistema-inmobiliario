// src/lib/publicData.ts
// Queries públicas — accesibles sin auth (anon key)
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProjectRow      = Database['public']['Tables']['projects']['Row']
type TypologyRow     = Database['public']['Tables']['typologies']['Row']
type ConsultoraRow   = Database['public']['Tables']['consultora_config']['Row']

export async function getConsultoraPublic(): Promise<ConsultoraRow | null> {
  const { data, error } = await supabase
    .from('consultora_config')
    .select('simulador_publico, nombre, logo_url')
    .limit(1)
    .single()
  if (error) return null
  return data as unknown as ConsultoraRow
}

export async function getPublicProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('publicado_en_web', true)
    .order('name')
  if (error) throw error
  return data as unknown as ProjectRow[]
}

export async function getPublicTypologies(projectId: string): Promise<TypologyRow[]> {
  const { data, error } = await supabase
    .from('typologies')
    .select('*')
    .eq('project_id', projectId)
    .order('price_usd')
  if (error) throw error
  return data as unknown as TypologyRow[]
}
