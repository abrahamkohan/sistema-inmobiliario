// src/hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { getProfile, updateProfile } from '@/lib/profile'

export function useMyProfile() {
  const { session } = useAuth()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  })
}

function normalizeWhatsapp(raw: string): string | null {
  if (!raw.trim()) return null
  // Dejar solo +, dígitos — quitar espacios, guiones, paréntesis
  return raw.replace(/[\s\-().]/g, '') || null
}

export function useUpdateMyProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: { full_name: string; whatsapp: string }) =>
      updateProfile(userId!, {
        full_name: data.full_name.trim() || null,
        whatsapp:  normalizeWhatsapp(data.whatsapp),
      }),
    onSuccess: () => {
      // Refrescar perfil propio + lista de equipo (para que el nombre se vea en toda la app)
      qc.invalidateQueries({ queryKey: ['profile', userId] })
      qc.invalidateQueries({ queryKey: ['team'] })
      toast.success('Perfil actualizado')
    },
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
