// src/components/notes/NoteEditor.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Star, Tag, Calendar, Link2, Archive, Trash2 } from 'lucide-react'
import { useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import { extractTitle } from '@/lib/notes'
import type { Database } from '@/types/database'

type NoteRow    = Database['public']['Tables']['notes']['Row']
type ClientRow  = Database['public']['Tables']['clients']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

function toInputValue(dateStr: string): string {
  const d  = new Date(dateStr)
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${dd}T${hh}:${mm}`
}

function formatReminder(iso: string): string {
  return new Date(iso).toLocaleString('es-PY', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

interface NoteEditorProps {
  note:     NoteRow
  clients:  ClientRow[]
  projects: ProjectRow[]
  onClose:  () => void
}

export function NoteEditor({ note, clients, projects, onClose }: NoteEditorProps) {
  const [content,   setContent]   = useState(note.content)
  const [tags,      setTags]      = useState<string[]>(note.tags ?? [])
  const [tagInput,  setTagInput]  = useState('')
  const [reminder,  setReminder]  = useState(note.reminder_date ?? '')
  const [clientId,  setClientId]  = useState(note.client_id ?? '')
  const [projectId, setProjectId] = useState(note.project_id ?? '')
  const [showMeta,  setShowMeta]  = useState(false)
  const [showCal,   setShowCal]   = useState(false)

  const updateNote  = useUpdateNote()
  const deleteNote  = useDeleteNote()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 50) }, [])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [content])

  const isDirty = useCallback(() =>
    content !== note.content ||
    JSON.stringify(tags) !== JSON.stringify(note.tags ?? []) ||
    reminder !== (note.reminder_date ?? '') ||
    clientId  !== (note.client_id  ?? '') ||
    projectId !== (note.project_id ?? ''),
  [content, tags, reminder, clientId, projectId, note])

  const save = useCallback(() => {
    updateNote.mutate({ id: note.id, input: { content, tags, reminder_date: reminder || null, client_id: clientId || null, project_id: projectId || null } })
  }, [content, tags, reminder, clientId, projectId, note.id, updateNote])

  function handleClose() {
    if (!content.trim()) { deleteNote.mutate(note.id, { onSuccess: onClose }); return }
    if (isDirty()) {
      updateNote.mutate({ id: note.id, input: { content, tags, reminder_date: reminder || null, client_id: clientId || null, project_id: projectId || null } }, { onSuccess: onClose })
    } else { onClose() }
  }

  function handleFlag()    { updateNote.mutate({ id: note.id, input: { is_flagged: !note.is_flagged } }) }
  function handleArchive() { save(); updateNote.mutate({ id: note.id, input: { location: note.location === 'inbox' ? 'archive' : 'inbox' } }, { onSuccess: onClose }) }
  function handleDelete()  { if (!confirm('¿Eliminar esta nota?')) return; deleteNote.mutate(note.id, { onSuccess: onClose }) }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(',', '')
      if (!tags.includes(t)) setTags([...tags, t])
      setTagInput('')
    }
  }

  const title        = extractTitle(content)
  const hasReminder  = !!reminder
  const hasLink      = !!(clientId || projectId)
  const hasTags      = tags.length > 0

  // ── Metadatos expandibles (compartido mobile/desktop) ─────────────────────
  const metaPanel = showMeta && (
    <div className="flex flex-col gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/60">

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {tag}
            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-blue-400 hover:text-blue-700 ml-0.5 leading-none">×</button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Nueva etiqueta..."
          className="text-[13px] text-gray-600 outline-none border-0 bg-transparent placeholder:text-gray-400 min-w-0 w-32"
        />
      </div>

      {/* Recordatorio */}
      {showCal && (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <input
            type="datetime-local"
            value={reminder ? toInputValue(reminder) : ''}
            onChange={e => setReminder(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="text-[13px] text-gray-600 outline-none border-0 bg-transparent cursor-pointer"
          />
          {reminder && (
            <button onClick={() => setReminder('')} className="text-[11px] text-gray-400 hover:text-red-400 font-medium">Quitar</button>
          )}
        </div>
      )}

      {/* Vínculos */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <select value={clientId} onChange={e => setClientId(e.target.value)}
          className="text-[13px] text-gray-600 outline-none border-0 bg-transparent cursor-pointer">
          <option value="">Sin cliente</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          className="text-[13px] text-gray-600 outline-none border-0 bg-transparent cursor-pointer">
          <option value="">Sin proyecto</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleClose}
    >
      {/* ══════════════════ MOBILE: sheet desde abajo ══════════════════ */}
      <div
        className="md:hidden absolute inset-0 flex items-end"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      >
        <div
          className="bg-white w-full flex flex-col"
          style={{ borderRadius: '20px 20px 0 0', maxHeight: '92vh', boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header mobile */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-[13px] text-gray-400 truncate flex-1 mr-3">{title === 'Sin título' ? '' : title}</p>
            <div className="flex gap-0.5">
              <button onClick={handleFlag} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Star className={`w-[18px] h-[18px] ${note.is_flagged ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
              </button>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Textarea mobile */}
          <div className="flex-1 overflow-y-auto px-5 pb-3">
            <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
              placeholder="Empezá a escribir..."
              className="w-full resize-none border-0 outline-none text-[15px] leading-[1.7] text-gray-900 placeholder:text-gray-300 bg-transparent"
              style={{ minHeight: 180 }} />
          </div>

          {/* Footer mobile */}
          <div className="border-t border-gray-100">
            {metaPanel}
            <div className="flex items-center gap-1 px-3 py-2">
              <button onClick={() => setShowMeta(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${hasTags || showMeta ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                <Tag className="w-3.5 h-3.5" />
                {hasTags && <span>{tags.length}</span>}
              </button>
              <button onClick={() => { setShowCal(v => !v); setShowMeta(true) }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${hasReminder ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                <Calendar className="w-3.5 h-3.5" />
                {hasReminder && <span>{formatReminder(reminder)}</span>}
              </button>
              <button onClick={() => setShowMeta(v => !v)}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${hasLink ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                <Link2 className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1" />
              <button onClick={handleArchive} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title={note.location === 'inbox' ? 'Archivar' : 'Mover a Inbox'}>
                <Archive className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════ DESKTOP: modal centrado ══════════════════ */}
      <div
        className="hidden md:flex absolute inset-0 items-center justify-center p-8"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      >
        <div
          className="bg-white w-full max-w-2xl flex flex-col"
          style={{
            borderRadius: 18,
            maxHeight: '88vh',
            boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.07)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── HEADER desktop ─────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
            style={{ background: '#f8fafc', borderRadius: '18px 18px 0 0' }}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Indicador de estado */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${note.location === 'archive' ? 'bg-gray-300' : 'bg-emerald-400'}`} />
              <p className="text-[14px] font-semibold text-gray-700 truncate">
                {title === 'Sin título' ? <span className="text-gray-400 font-normal">Nueva nota</span> : title}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-4">
              {/* Flag */}
              <button
                onClick={handleFlag}
                title={note.is_flagged ? 'Quitar destacado' : 'Destacar'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  note.is_flagged
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <Star className={`w-[15px] h-[15px] ${note.is_flagged ? 'fill-amber-400' : ''}`} />
                {note.is_flagged && <span>Destacada</span>}
              </button>
              {/* Cerrar */}
              <button
                onClick={handleClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="w-[17px] h-[17px]" />
              </button>
            </div>
          </div>

          {/* ── BODY desktop ───────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-7 py-6">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Empezá a escribir..."
              className="w-full resize-none border-0 outline-none text-[17px] leading-[1.85] text-gray-900 placeholder:text-gray-300 bg-transparent"
              style={{ minHeight: 260, fontFamily: 'inherit' }}
            />
          </div>

          {/* ── META expandible desktop ────────────────────────────────────── */}
          {metaPanel}

          {/* ── FOOTER desktop ─────────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3.5 flex items-center gap-2">

            {/* Acciones izquierda — pill buttons con icono + label */}
            <div className="flex items-center gap-1.5">

              {/* Etiquetas */}
              <button
                onClick={() => setShowMeta(v => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                  hasTags
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Tag className="w-[16px] h-[16px]" />
                <span>{hasTags ? `${tags.length} etiqueta${tags.length > 1 ? 's' : ''}` : 'Etiqueta'}</span>
              </button>

              {/* Fecha / Recordatorio */}
              <button
                onClick={() => { setShowCal(v => !v); setShowMeta(true) }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                  hasReminder
                    ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-[16px] h-[16px]" />
                <span>{hasReminder ? formatReminder(reminder) : 'Fecha'}</span>
              </button>

              {/* Vínculo */}
              <button
                onClick={() => setShowMeta(v => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                  hasLink
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Link2 className="w-[16px] h-[16px]" />
                <span>{hasLink
                  ? (clients.find(c => c.id === clientId)?.full_name ?? projects.find(p => p.id === projectId)?.name ?? 'Vinculada')
                  : 'Vínculo'
                }</span>
              </button>
            </div>

            {/* Separador */}
            <div className="flex-1" />

            {/* Acciones destructivas derecha — icono con label */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleArchive}
                title={note.location === 'inbox' ? 'Archivar' : 'Mover a Inbox'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all"
              >
                <Archive className="w-[16px] h-[16px]" />
                <span>{note.location === 'inbox' ? 'Archivar' : 'Inbox'}</span>
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-[16px] h-[16px]" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
