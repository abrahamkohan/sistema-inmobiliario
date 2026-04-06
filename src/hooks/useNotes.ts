// src/hooks/useNotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getNotes, getNotesByClient, createNote, updateNote, deleteNote } from '@/lib/notes'
import type { Database } from '@/types/database'

type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

const KEY = ['notes'] as const

export function useNotes(location?: string) {
  return useQuery({
    queryKey: [...KEY, location ?? 'all'],
    queryFn: () => getNotes(location),
  })
}

export function useNotesByClient(clientId: string) {
  return useQuery({
    queryKey: [...KEY, 'client', clientId],
    queryFn: () => getNotesByClient(clientId),
    enabled: !!clientId,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NoteInsert) => createNote(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NoteUpdate }) =>
      updateNote(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
