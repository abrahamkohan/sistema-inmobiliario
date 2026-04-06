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
    mutationFn: (full_name: string) => updateProfile(userId!, { full_name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', userId] })
      toast.success('Nombre actualizado')
    },
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
