// src/lib/profile.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function getProfile(userId: string): Promise<{ id: string; full_name: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('[getProfile] error:', error)
    return null
  }
  return data
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<{ id: string; full_name: string | null }> {
  console.log('[updateProfile] updating:', userId, updates)
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, full_name')
    .single()
  if (error) {
    console.error('[updateProfile] error:', error)
    throw error
  }
  console.log('[updateProfile] success:', data)
  return data
}
