// src/lib/publicData.ts
// Queries públicas — accesibles sin auth (anon key)
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProjectRow   = Database['public']['Tables']['projects']['Row']
type TypologyRow  = Database['public']['Tables']['typologies']['Row']

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
