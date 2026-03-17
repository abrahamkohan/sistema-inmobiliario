import { supabase } from './supabase'
import type { Database } from '@/types/database'

export type PropertyRow = Database['public']['Tables']['properties']['Row']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']
export type PropertyPhotoRow = Database['public']['Tables']['property_photos']['Row']

export async function getProperties(): Promise<PropertyRow[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as PropertyRow[]
}

export async function getProperty(id: string): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as PropertyRow
}

export async function getPropertyPhotos(propertyId: string): Promise<PropertyPhotoRow[]> {
  const { data, error } = await supabase
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order')
  if (error) throw error
  return data as unknown as PropertyPhotoRow[]
}

export async function createProperty(input: PropertyInsert): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PropertyRow
}

export async function updateProperty(id: string, input: PropertyUpdate): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PropertyRow
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('property-photos').getPublicUrl(storagePath)
  return data.publicUrl
}

export function formatPrice(price: number, moneda: 'USD' | 'PYG'): string {
  if (moneda === 'PYG') {
    return '₲ ' + price.toLocaleString('es-PY')
  }
  return '$ ' + price.toLocaleString('en-US')
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  if (months === 1) return 'hace 1 mes'
  return `hace ${months} meses`
}
