// src/components/auth/RequireAuth.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getProfile } from '@/lib/profile'
import { LoginPage } from '@/pages/LoginPage'
import { CompleteProfilePage } from '@/pages/CompleteProfilePage'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const [needsProfile, setNeedsProfile] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkProfile() {
      if (!session?.user?.id) {
        setChecking(false)
        return
      }

      try {
        const profile = await getProfile(session.user.id)
        console.log('[RequireAuth] profile:', profile)
        
        if (!profile?.full_name || profile.full_name.trim().length < 3) {
          console.log('[RequireAuth] needs profile, redirecting to /completar-perfil')
          setNeedsProfile(true)
        }
      } catch (e) {
        console.error('[RequireAuth] error checking profile:', e)
      } finally {
        setChecking(false)
      }
    }

    if (!loading && session) {
      checkProfile()
    } else if (!loading && !session) {
      setChecking(false)
    }
  }, [session, loading])

  if (loading || checking) return null

  if (!session) return <LoginPage />

  if (needsProfile) {
    // Only show complete profile page, no access to anything else
    return <CompleteProfilePage />
  }

  return <>{children}</>
}
