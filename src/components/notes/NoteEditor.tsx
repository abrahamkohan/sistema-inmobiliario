// src/components/notes/NoteEditor.tsx
// Editor de nota — filosofía "escribir primero, pensar después"
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Star, Tag, Calendar, Link2, Archive, Trash2, Check } from 'lucide-react'
import { useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import { extractTitle } from '@/lib/notes'
import type { Database } from '@/types/database'

type NoteRow    = Database['public']['Tables']['notes']['Row']
type ClientRow  = Database['public']['Tables']['clients']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

// ─── Helper datetime ──────────────────────────────────────────────────────────

function toInputValue(dateStr: string): string {
  const d = new Date(dateStr)
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${dd}T${hh}:${mm}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NoteEditorProps {
  note: NoteRow
  clients:  ClientRow[]
  projects: ProjectRow[]
  onClose:  () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NoteEditor({ note, clients, projects, onClose }: NoteEditorProps) {
  const [content,  setContent]  = useState(note.content)
  const [tags,     setTags]     = useState<string[]>(note.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [reminder, setReminder] = useState(note.reminder_date ?? '')
  const [clientId,  setClientId]  = useState(note.client_id ?? '')
  const [projectId, setProjectId] = useState(note.project_id ?? '')
  const [saved, setSaved]         = useState(false)

  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Autofocus al abrir
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  // Autoresize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [content])

  // Guardar función
  const save = useCallback(() => {
    updateNote.mutate({
      id: note.id,
      input: {
        content,
        tags,
        reminder_date: reminder || null,
        client_id:  clientId  || null,
        project_id: projectId || null,
      },
    }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      },
    })
  }, [content, tags, reminder, clientId, projectId, note.id, updateNote])

  // Autosave al perder foco del textarea
  function handleBlur() {
    if (content !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags ?? [])
      || reminder !== (note.reminder_date ?? '')
      || clientId  !== (note.client_id ?? '')
      || projectId !== (note.project_id ?? ''))
    {
      save()
    }
  }

  function handleFlag() {
    updateNote.mutate({ id: note.id, input: { is_flagged: !note.is_flagged } })
  }

  function handleArchive() {
    updateNote.mutate(
      { id: note.id, input: { location: note.location === 'inbox' ? 'archive' : 'inbox' } },
      { onSuccess: onClose }
    )
  }

  function handleClose() {
    if (!content.trim()) {
      deleteNote.mutate(note.id, { onSuccess: onClose })
    } else {
      onClose()
    }
  }

  function handleDelete() {
    if (!confirm('¿Eliminar esta nota? No se puede deshacer.')) return
    deleteNote.mutate(note.id, { onSuccess: onClose })
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().replace(',', '')
      if (!tags.includes(newTag)) setTags([...tags, newTag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  const title = extractTitle(content)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-2xl flex flex-col"
        style={{
          borderRadius: 24,
          maxHeight: '90vh',
          boxShadow: '0 32px 72px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <p className="text-sm font-semibold text-gray-700 truncate flex-1 mr-3">{title}</p>
          <div className="flex items-center gap-1.5">
            {/* Indicador guardado */}
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Check className="w-3 h-3" /> Guardado
              </span>
            )}
            {/* Flag */}
            <button onClick={handleFlag} title="Destacar" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Star className={`w-4 h-4 ${note.is_flagged ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
            </button>
            {/* Guardar manual */}
            <button
              onClick={save}
              disabled={updateNote.isPending}
              className="px-3 py-1 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Guardar
            </button>
            {/* Cerrar */}
            <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Textarea principal ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onBlur={handleBlur}
            placeholder="Empezá a escribir..."
            className="w-full resize-none border-0 outline-none text-sm leading-relaxed text-gray-800 placeholder:text-gray-300 bg-transparent"
            style={{ minHeight: 200, fontFamily: 'inherit' }}
          />
        </div>

        {/* ── Footer: metadatos ── */}
        <div className="border-t px-5 py-3 flex flex-col gap-3">

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {tag}
                <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700">×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Agregar tag..."
              className="text-xs text-gray-500 outline-none border-0 bg-transparent placeholder:text-gray-300 w-24"
            />
          </div>

          {/* Recordatorio */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="datetime-local"
              value={reminder ? toInputValue(reminder) : ''}
              onChange={e => setReminder(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="text-xs text-gray-500 outline-none border-0 bg-transparent cursor-pointer"
            />
            {reminder && (
              <button onClick={() => setReminder('')} className="text-[10px] text-gray-400 hover:text-red-500">Quitar</button>
            )}
          </div>

          {/* Vínculos */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="text-xs text-gray-500 outline-none border-0 bg-transparent cursor-pointer"
            >
              <option value="">Sin cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="text-xs text-gray-500 outline-none border-0 bg-transparent cursor-pointer"
            >
              <option value="">Sin proyecto</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Acciones destructivas */}
          <div className="flex items-center gap-2 pt-1 border-t">
            <button
              onClick={handleArchive}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              {note.location === 'inbox' ? 'Archivar' : 'Mover a Inbox'}
            </button>
            <span className="text-gray-200">·</span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
