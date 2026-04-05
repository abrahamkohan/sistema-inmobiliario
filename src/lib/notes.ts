// src/lib/notes.ts
import { supabase } from './supabase'
import type { Database } from '@/types/database'

type NoteRow    = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

// ─── Helper: primera línea como título ────────────────────────────────────────

export function extractTitle(content: string): string {
  const first = content.split('\n')[0].trim()
  return first || 'Sin título'
}

export function extractSnippet(content: string): string {
  const lines = content.split('\n').filter(l => l.trim())
  return lines[1]?.trim() ?? ''
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getNotes(location?: string): Promise<NoteRow[]> {
  let query = supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (location && location !== 'all' && location !== 'flagged') {
    query = query.eq('location', location as unknown as never)
  }
  if (location === 'flagged') {
    query = query.eq('is_flagged', true as unknown as never)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as NoteRow[]
}

export async function createNote(input: NoteInsert): Promise<NoteRow> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ content: '', location: 'inbox', ...input } as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as NoteRow
}

export async function updateNote(id: string, input: NoteUpdate): Promise<NoteRow> {
  const { data, error } = await supabase
    .from('notes')
    .update(input as unknown as never)
    .eq('id', id as unknown as never)
    .select()
    .single()
  if (error) throw error
  return data as unknown as NoteRow
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id as unknown as never)
  if (error) throw error
}

export async function getNotesByClient(clientId: string): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('client_id', clientId as unknown as never)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data as unknown as NoteRow[]
}
