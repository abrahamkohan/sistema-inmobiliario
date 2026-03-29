// src/lib/userRoles.ts
import { supabase } from './supabase'

export async function getUserRole(): Promise<'admin' | 'agente' | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  return (data?.role as 'admin' | 'agente') ?? null
}
