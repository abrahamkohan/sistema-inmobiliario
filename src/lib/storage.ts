// src/lib/storage.ts
import { supabase } from './supabase'

const MEDIA_BUCKET = 'project-media'

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
}

export async function uploadProjectPhoto(
  projectId: string,
  file: File
): Promise<string> {
  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`
  const path = `${projectId}/photos/${filename}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function uploadProjectBrochure(
  projectId: string,
  file: File
): Promise<string> {
  const filename = sanitizeFilename(file.name)
  const path = `${projectId}/brochure/${filename}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

export async function deleteStorageFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([path])
  if (error) throw error
}

export async function uploadFloorPlan(
  projectId: string,
  file: File
): Promise<string> {
  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`
  const path = `${projectId}/typologies/${filename}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function uploadPresupuestoFloorPlan(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `presupuestos/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function uploadAmenityImage(
  projectId: string,
  amenityId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${projectId}/amenities/${amenityId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function deleteAmenityImage(path: string): Promise<void> {
  await deleteStorageFile(path).catch(() => null)
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}
