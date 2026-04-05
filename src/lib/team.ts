// src/lib/team.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type UserRoleRow = Database['public']['Tables']['user_roles']['Row']

export type TeamMember = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  role: string | null
  is_owner: boolean
  permisos: Record<string, string> | null
  consultant_id: string | null
  email?: string
}

export async function getTeam(): Promise<TeamMember[]> {
  const profilesRes = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  const rolesRes = await supabase.from('user_roles').select('user_id, role, is_owner, permisos')

  const roleMap = new Map<string, { role: string; is_owner: boolean; permisos: Record<string, string> | null }>()
  
  const rolesData = rolesRes.data as UserRoleRow[] | null
  if (rolesData) {
    rolesData.forEach(r => {
      roleMap.set(r.user_id, { role: r.role, is_owner: r.is_owner, permisos: r.permisos })
    })
  }

  const profilesData = profilesRes.data as ProfileRow[] | null
  if (!profilesData) return []

  return profilesData.map(p => {
    const roleRow = roleMap.get(p.id)
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      role: roleRow?.role ?? null,
      is_owner: roleRow?.is_owner ?? false,
      permisos: roleRow?.permisos ?? null,
      consultant_id: null,
    }
  })
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return getTeam()
}

export async function setRole(userId: string, role: 'admin' | 'agente'): Promise<void> {
  return setUserRole(userId, role)
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  const { data: target } = await supabase
    .from('user_roles')
    .select('is_owner')
    .eq('user_id', userId as any)
    .maybeSingle() as { data: { is_owner: boolean } | null }

  if (target?.is_owner) throw new Error('No se puede modificar el propietario')

  const { error } = await supabase
    .from('user_roles')
    .update({ role } as any)
    .eq('user_id', userId as any)
  if (error) throw error
}

export async function setPermisos(userId: string, permisos: Record<string, string> | null): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .update({ permisos } as any)
    .eq('user_id', userId as any)
  if (error) throw error
}

export async function removeUser(userId: string): Promise<void> {
  const { data: target } = await supabase
    .from('user_roles')
    .select('is_owner')
    .eq('user_id', userId as any)
    .maybeSingle() as { data: { is_owner: boolean } | null }

  if (target?.is_owner) throw new Error('No se puede eliminar el propietario')

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId as any)
  if (error) throw error
}

export async function removeRole(userId: string): Promise<void> {
  return removeUser(userId)
}

// Stub for inviteUser - no-op since Supabase client doesn't have this method
export async function inviteUser(_email: string): Promise<void> {
  console.warn('inviteUser not implemented - use Supabase Dashboard for invitations')
}
