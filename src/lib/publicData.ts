// src/lib/publicData.ts
// Queries públicas — accesibles sin auth (anon key)
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProjectRow      = Database['public']['Tables']['projects']['Row']
export type { ProjectRow }
type TypologyRow     = Database['public']['Tables']['typologies']['Row']
type ConsultoraRow   = Database['public']['Tables']['consultora_config']['Row']
type PropertyRow     = Database['public']['Tables']['properties']['Row']
type PropertyPhotoRow = Database['public']['Tables']['property_photos']['Row']

// Solo nombre + logos — sin contacto comercial. Para fichas de catálogo.
export async function getConsultoraBranding(): Promise<Pick<ConsultoraRow, 'nombre' | 'logo_url' | 'logo_light_url'> | null> {
  const { data, error } = await supabase
    .from('consultora_config')
    .select('nombre, logo_url, logo_light_url')
    .limit(1)
    .single()
  if (error) return null
  return data as Pick<ConsultoraRow, 'nombre' | 'logo_url' | 'logo_light_url'>
}

export async function getConsultoraPublic(): Promise<ConsultoraRow | null> {
  const { data, error } = await supabase
    .from('consultora_config')
    .select('id, nombre, logo_url, logo_light_url, whatsapp, telefono, email, instagram, sitio_web, simulador_publico, pwa_icon_url')
    .limit(1)
    .single()
  if (error) return null
  return data as unknown as ConsultoraRow
}

export async function getPublicProperty(id: string): Promise<PropertyRow | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('publicado_en_web', true)
    .single()
  if (error) return null
  return data as unknown as PropertyRow
}

export async function getPublicPropertyPhotos(propertyId: string): Promise<PropertyPhotoRow[]> {
  const { data, error } = await supabase
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order')
  if (error) return []
  return data as unknown as PropertyPhotoRow[]
}

export async function getPublicProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('publicado_en_web', true)
    .single()
  if (error) return null
  return data as unknown as ProjectRow
}

export async function getPublicProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('publicado_en_web', true)
    .order('name')
  if (error) return []
  return data as unknown as ProjectRow[]
}

export async function getPublicProperties(): Promise<PropertyRow[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, titulo, operacion, tipo, condicion, precio, moneda, dormitorios, banos, superficie_m2, barrio, zona, ciudad, foto_portada, publicado_en_web, created_at')
    .eq('publicado_en_web', true)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as unknown as PropertyRow[]
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
