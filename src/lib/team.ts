// src/lib/team.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type UserRoleRow = Database['public']['Tables']['user_roles']['Row']

export type TeamMember = {
  id: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  avatar_url: string | null
  created_at: string
  role: string | null
  is_owner: boolean
  permisos: Record<string, unknown> | null
  consultant_id: string | null
  email: string | null
}

export async function getTeam(): Promise<TeamMember[]> {
  const [profilesRes, rolesRes, emailsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('user_roles').select('user_id, role, is_owner, permisos, consultant_id'),
    (supabase.rpc as any)('get_team_emails'),
  ])

  const roleMap = new Map<string, { role: string; is_owner: boolean; permisos: Record<string, boolean> | null; consultant_id: string | null }>()
  const rolesData = rolesRes.data as UserRoleRow[] | null
  if (rolesData) {
    rolesData.forEach(r => {
      roleMap.set(r.user_id, { role: r.role, is_owner: r.is_owner, permisos: r.permisos as Record<string, boolean> | null, consultant_id: (r as any).consultant_id ?? null })
    })
  }

  const emailMap = new Map<string, string>()
  const emailsData = emailsRes.data as { user_id: string; email: string }[] | null
  if (emailsData) {
    emailsData.forEach(e => emailMap.set(e.user_id, e.email))
  }

  const profilesData = profilesRes.data as ProfileRow[] | null
  if (!profilesData) return []

  return profilesData.map(p => {
    const roleRow = roleMap.get(p.id)
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      whatsapp: (p as any).whatsapp ?? null,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      role: roleRow?.role ?? null,
      is_owner: roleRow?.is_owner ?? false,
      permisos: roleRow?.permisos ?? null,
      consultant_id: roleRow?.consultant_id ?? null,
      email: emailMap.get(p.id) ?? null,
    }
  })
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return getTeam()
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

export async function setPermisos(userId: string, permisos: Record<string, unknown> | null): Promise<void> {
  // Usa RPC para garantizar upsert seguro:
  // - si no existe la fila → la crea con role='agente'
  // - si existe → solo actualiza permisos (no toca role ni is_owner)
  const { error } = await (supabase.rpc as any)('upsert_user_permisos', {
    p_user_id: userId,
    p_permisos: permisos ?? {},
  })
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

export async function setRole(userId: string, role: string): Promise<void> {
  return setUserRole(userId, role)
}

export async function inviteUser(email: string, name?: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email, name: name ?? null, appUrl: window.location.origin },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
}
