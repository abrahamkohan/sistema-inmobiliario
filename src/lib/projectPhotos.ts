// src/lib/projectPhotos.ts
import { supabase } from './supabase'
import { uploadProjectPhoto, deleteStorageFile } from './storage'
import type { Database } from '@/types/database'

type PhotoRow = Database['public']['Tables']['project_photos']['Row']

export async function getProjectPhotos(projectId: string): Promise<PhotoRow[]> {
  const { data, error } = await supabase
    .from('project_photos')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data as unknown as PhotoRow[]
}

export async function addProjectPhoto(
  projectId: string,
  file: File,
  sortOrder: number
): Promise<PhotoRow> {
  const path = await uploadProjectPhoto(projectId, file)
  const { data, error } = await supabase
    .from('project_photos')
    .insert({ project_id: projectId, storage_path: path, sort_order: sortOrder })
    .select()
    .single()
  if (error) {
    // Best-effort cleanup
    await deleteStorageFile(path).catch(() => null)
    throw error
  }
  return data as unknown as PhotoRow
}

export async function deleteProjectPhoto(photo: PhotoRow): Promise<void> {
  const { error } = await supabase
    .from('project_photos')
    .delete()
    .eq('id', photo.id)
  if (error) throw error
  // External URLs are not in storage — skip deletion
  if (!photo.storage_path.startsWith('http')) {
    await deleteStorageFile(photo.storage_path).catch(() => null)
  }
}
