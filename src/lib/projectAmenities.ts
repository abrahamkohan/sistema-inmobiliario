// src/lib/projectAmenities.ts
import { supabase } from './supabase'
import { uploadAmenityImage, deleteAmenityImage, getPublicUrl } from './storage'
import type { Database } from '@/types/database'

type AmenityRow      = Database['public']['Tables']['project_amenities']['Row']
type AmenityImageRow = Database['public']['Tables']['project_amenity_images']['Row']

export interface AmenityWithImages extends AmenityRow {
  images: AmenityImageRow[]
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getProjectAmenities(projectId: string): Promise<AmenityWithImages[]> {
  const { data: raw, error } = await supabase
    .from('project_amenities')
    .select('*')
    .eq('project_id', projectId as unknown as never)
    .order('sort_order', { ascending: true })
  if (error) throw error
  const amenities = (raw ?? []) as unknown as AmenityRow[]
  if (!amenities.length) return []

  const { data: rawImgs } = await supabase
    .from('project_amenity_images')
    .select('*')
    .in('amenity_id', amenities.map(a => a.id) as unknown as never)
    .order('sort_order', { ascending: true })
  const images = (rawImgs ?? []) as unknown as AmenityImageRow[]

  return amenities.map(a => ({
    ...a,
    images: images.filter(img => img.amenity_id === a.id),
  }))
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function addAmenity(
  projectId: string,
  name: string,
  sortOrder: number,
  categoria: string = 'edificio',
  icon?: string
): Promise<AmenityRow> {
  const { data, error } = await supabase
    .from('project_amenities')
    .insert({ project_id: projectId, name, sort_order: sortOrder, categoria, icon: icon ?? null } as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as AmenityRow
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateAmenityName(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('project_amenities').update({ name } as unknown as never).eq('id', id as unknown as never)
  if (error) throw error
}

export async function updateAmenityIcon(id: string, icon: string): Promise<void> {
  const { error } = await supabase.from('project_amenities').update({ icon: icon || null } as unknown as never).eq('id', id as unknown as never)
  if (error) throw error
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteAmenity(amenity: AmenityWithImages): Promise<void> {
  // Delete images from storage first
  await Promise.all(amenity.images.map(img => deleteAmenityImage(img.storage_path)))
  // DB cascade handles project_amenity_images rows
  const { error } = await supabase.from('project_amenities').delete().eq('id', amenity.id as unknown as never)
  if (error) throw error
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function addAmenityImage(
  projectId: string,
  amenityId: string,
  file: File,
  sortOrder: number
): Promise<AmenityImageRow> {
  const path = await uploadAmenityImage(projectId, amenityId, file)
  const { data, error } = await supabase
    .from('project_amenity_images')
    .insert({ amenity_id: amenityId, storage_path: path, sort_order: sortOrder } as unknown as never)
    .select()
    .single()
  if (error) { await deleteAmenityImage(path).catch(() => null); throw error }
  return data as unknown as AmenityImageRow
}

export async function deleteAmenityImageRecord(image: AmenityImageRow): Promise<void> {
  await supabase.from('project_amenity_images').delete().eq('id', image.id as unknown as never)
  await deleteAmenityImage(image.storage_path).catch(() => null)
}

export function amenityImageUrl(path: string): string {
  return getPublicUrl(path)
}
