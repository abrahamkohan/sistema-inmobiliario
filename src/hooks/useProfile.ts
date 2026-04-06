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

export function useUpdateMyProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: { full_name: string; whatsapp: string }) =>
      updateProfile(userId!, { full_name: data.full_name || null, whatsapp: data.whatsapp || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', userId] })
      toast.success('Perfil actualizado')
    },
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
