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
    .eq('id', id as any)
    .single()
  if (error) throw error
  return data as unknown as PropertyRow
}

export async function getPropertyPhotos(propertyId: string): Promise<PropertyPhotoRow[]> {
  const { data, error } = await supabase
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId as any)
    .order('sort_order')
  if (error) throw error
  return data as unknown as PropertyPhotoRow[]
}

export async function createProperty(input: PropertyInsert): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .insert(input as any)
    .select()
    .single()
  if (error) {
    console.error('[createProperty] Error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw error
  }
  return data as unknown as PropertyRow
}

export async function updateProperty(id: string, input: PropertyUpdate): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .update(input as any)
    .eq('id', id as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PropertyRow
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id as any)
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

export async function addPropertyPhoto(
  propertyId: string,
  file: File,
  sortOrder: number,
): Promise<PropertyPhotoRow> {
  const ext = file.name.split('.').pop()
  const path = `${propertyId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('property-photos')
    .upload(path, file, { upsert: false })
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('property_photos')
    .insert({ property_id: propertyId, storage_path: path, sort_order: sortOrder } as any)
    .select()
    .single()
  if (error) throw error
  return data as unknown as PropertyPhotoRow
}

export async function deletePropertyPhoto(photo: PropertyPhotoRow): Promise<void> {
  await supabase.storage.from('property-photos').remove([photo.storage_path])
  const { error } = await supabase.from('property_photos').delete().eq('id', photo.id as any)
  if (error) throw error
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
