// src/hooks/useIsSaasOwner.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useIsSaasOwner(): boolean | null {
  const { session, loading } = useAuth()
  const [isSaasOwner, setIsSaasOwner] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return
    if (!session?.user?.id) { setIsSaasOwner(false); return }

    supabase
      .from('user_roles')
      .select('is_saas_owner')
      .eq('user_id', session.user.id as any)
      .maybeSingle()
      .then(({ data }) => setIsSaasOwner(data?.is_saas_owner === true))
  }, [session, loading])

  return isSaasOwner
}
