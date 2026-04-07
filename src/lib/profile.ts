// src/lib/profile.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function getProfile(userId: string): Promise<{ id: string; full_name: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId as unknown as never)
    .single()
  if (error) {
    console.error('[getProfile] error:', error)
    return null
  }
  return data as unknown as { id: string; full_name: string | null } | null
}

export async function updateProfile(userId: string, updates: ProfileUpdate & { whatsapp?: string | null }): Promise<{ id: string; full_name: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates as unknown as never)
    .eq('id', userId as unknown as never)
  if (error) {
    console.error('[updateProfile] error:', error)
    throw error
  }
  // Devolvemos los datos que mandamos — no necesitamos SELECT permission
  return { id: userId, full_name: (updates.full_name as string | null) ?? null }
}
