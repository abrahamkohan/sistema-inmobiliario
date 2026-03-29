// src/lib/team.ts
import { supabase } from './supabase'

export type TeamMember = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  role: 'admin' | 'agente' | null
}

export async function getTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_roles(role)')
    .order('created_at', { ascending: true })
  if (error) throw error

  return (data ?? []).map((p: any) => ({
    id:         p.id,
    full_name:  p.full_name,
    phone:      p.phone,
    avatar_url: p.avatar_url,
    created_at: p.created_at,
    role:       p.user_roles?.role ?? null,
  }))
}

export async function setRole(userId: string, role: 'admin' | 'agente'): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function removeRole(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}

export async function inviteUser(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw error
}
