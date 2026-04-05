// src/lib/userRoles.ts
import { supabase } from './supabase'

export async function getUserRole(): Promise<'admin' | 'agente' | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_roles')
    .select('role, is_owner')
    .eq('user_id', user.id as any)
    .maybeSingle()

  // El propietario tiene privilegios de admin aunque su rol sea distinto
  if ((data as any)?.is_owner) return 'admin'

  return ((data as any)?.role as 'admin' | 'agente') ?? null
}
