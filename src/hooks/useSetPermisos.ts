// src/hooks/useSetPermisos.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/team'

const QK = 'team'

export function useSetPermisos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, permisos }: { userId: string; permisos: Record<string, string> | null }) =>
      api.setPermisos(userId, permisos),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  })
}
