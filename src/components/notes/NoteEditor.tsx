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
  const [showMeta,    setShowMeta]    = useState(false)
  const [showCal,     setShowCal]     = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)

  const updateNote  = useUpdateNote()
  const deleteNote  = useDeleteNote()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 80) }, [])

  // Autoresize (desktop)
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
    if (isDirty()) { setConfirmExit(true); return }
    onClose()
  }

  function handleCancel() {
    if (!content.trim()) { deleteNote.mutate(note.id, { onSuccess: onClose }); return }
    onClose()
  }

  function handleSaveAndClose() {
    if (!content.trim()) { onClose(); return }
    updateNote.mutate(
      { id: note.id, input: { content, tags, reminder_date: reminder || null, client_id: clientId || null, project_id: projectId || null } },
      { onSuccess: onClose }
    )
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

  const title       = extractTitle(content)
  const hasReminder = !!reminder
  const hasLink     = !!(clientId || projectId)
  const hasTags     = tags.length > 0

  // ── Panel de metadatos (compartido mobile/desktop) ───────────────────────
  const metaPanel = showMeta && (
    <div className="flex flex-col gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/70">

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {tag}
            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-blue-400 hover:text-blue-700 leading-none ml-0.5">×</button>
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
        <Link2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
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

  // ── Dialog: cambios sin guardar ─────────────────────────────────────────────
  if (confirmExit) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
          <div>
            <p className="text-base font-bold text-gray-900">Cambios sin guardar</p>
            <p className="text-sm text-gray-500 mt-1">¿Querés guardar antes de cerrar?</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSaveAndClose}
              disabled={updateNote.isPending}
              className="h-12 rounded-xl text-sm font-semibold bg-gray-900 text-white disabled:opacity-30"
            >
              Guardar y cerrar
            </button>
            <button
              onClick={onClose}
              className="h-12 rounded-xl text-sm font-semibold bg-red-50 text-red-600"
            >
              Salir sin guardar
            </button>
            <button
              onClick={() => setConfirmExit(false)}
              className="h-10 rounded-xl text-sm text-gray-400"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE: pantalla completa — lienzo + toolbar coloreada
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="md:hidden fixed inset-0 flex flex-col bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header mobile ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-100"
          style={{ height: 54 }}
        >
          <p className="text-[13px] text-gray-400 truncate flex-1 mr-3 leading-tight">
            {title === 'Sin título' ? <span className="italic">Nueva nota</span> : title}
          </p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleFlag}
              className="p-2.5 rounded-full active:bg-gray-100 transition-colors"
            >
              <Star className={`w-5 h-5 ${note.is_flagged ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            </button>
            <button
              onClick={handleClose}
              className="p-2.5 rounded-full text-gray-400 active:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Lienzo de escritura (flex-1 → ocupa todo) ── */}
        <div className="flex-1 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Empezá a escribir..."
            className="w-full resize-none border-0 outline-none text-[17px] leading-[1.8] text-gray-900 placeholder:text-gray-300 bg-transparent"
            style={{ minHeight: '100%', padding: '20px 22px' }}
          />
        </div>

        {/* ── Meta panel (encima del toolbar) ── */}
        {metaPanel}

        {/* ── Toolbar mobile — siempre visible, también con teclado abierto ── */}
        <div
          className="flex-shrink-0 bg-white"
          style={{ borderTop: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 -2px 20px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3">

            {/* Etiquetas */}
            <button
              onClick={() => setShowMeta(v => !v)}
              title="Etiquetas"
              className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
                hasTags
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
                  : 'bg-blue-50 text-blue-500'
              }`}
            >
              <Tag className="w-[22px] h-[22px]" />
            </button>

            {/* Fecha */}
            <button
              onClick={() => { setShowCal(v => !v); setShowMeta(true) }}
              title="Recordatorio"
              className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
                hasReminder
                  ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
                  : 'bg-violet-50 text-violet-500'
              }`}
            >
              <Calendar className="w-[22px] h-[22px]" />
            </button>

            {/* Vínculo */}
            <button
              onClick={() => setShowMeta(v => !v)}
              title="Vincular"
              className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
                hasLink
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                  : 'bg-indigo-50 text-indigo-500'
              }`}
            >
              <Link2 className="w-[22px] h-[22px]" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Archivar */}
            <button
              onClick={handleArchive}
              title={note.location === 'inbox' ? 'Archivar' : 'Mover a Inbox'}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gray-100 text-gray-500 transition-all active:scale-95 active:bg-gray-200"
            >
              <Archive className="w-[22px] h-[22px]" />
            </button>

            {/* Eliminar */}
            <button
              onClick={handleDelete}
              title="Eliminar"
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-red-50 text-red-400 transition-all active:scale-95 active:bg-red-100"
            >
              <Trash2 className="w-[22px] h-[22px]" />
            </button>
          </div>

          {/* ── Footer guardar ── */}
          <div className="flex items-center gap-2 px-4 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 bg-white active:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              disabled={!content.trim() || updateNote.isPending}
              className="flex-1 h-11 rounded-xl text-sm font-semibold bg-gray-900 text-white disabled:opacity-30 transition-opacity"
            >
              Guardar nota
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP: modal centrado tipo Notion/Linear
      ══════════════════════════════════════════════════════════════════ */}
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
          {/* Header desktop */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
            style={{ background: '#f8fafc', borderRadius: '18px 18px 0 0' }}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${note.location === 'archive' ? 'bg-gray-300' : 'bg-emerald-400'}`} />
              <p className="text-[14px] font-semibold text-gray-700 truncate">
                {title === 'Sin título' ? <span className="text-gray-400 font-normal">Nueva nota</span> : title}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-4">
              <button
                onClick={handleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  note.is_flagged
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <Star className={`w-[15px] h-[15px] ${note.is_flagged ? 'fill-amber-400' : ''}`} />
                {note.is_flagged && <span>Destacada</span>}
              </button>
              <button onClick={handleClose} className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                <X className="w-[17px] h-[17px]" />
              </button>
            </div>
          </div>

          {/* Body desktop */}
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

          {/* Meta expandible desktop */}
          {metaPanel}

          {/* Footer desktop — dos filas para evitar desborde del CTA */}
          <div className="flex-shrink-0 border-t border-gray-100">

            {/* Fila 1: acciones contextuales (izq) + destructivas (der) */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <button
                  onClick={() => setShowMeta(v => !v)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                    hasTags ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Tag className="w-[16px] h-[16px] flex-shrink-0" />
                  <span>{hasTags ? `${tags.length} etiqueta${tags.length > 1 ? 's' : ''}` : 'Etiqueta'}</span>
                </button>
                <button
                  onClick={() => { setShowCal(v => !v); setShowMeta(true) }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                    hasReminder ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-[16px] h-[16px] flex-shrink-0" />
                  <span>{hasReminder ? formatReminder(reminder) : 'Fecha'}</span>
                </button>
                <button
                  onClick={() => setShowMeta(v => !v)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                    hasLink ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Link2 className="w-[16px] h-[16px] flex-shrink-0" />
                  <span>{hasLink
                    ? (clients.find(c => c.id === clientId)?.full_name ?? projects.find(p => p.id === projectId)?.name ?? 'Vinculada')
                    : 'Vínculo'
                  }</span>
                </button>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
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

            {/* Fila 2: CTA principal — siempre visible */}
            <div className="flex items-center justify-end gap-2 px-5 pb-3.5">
              <button
                onClick={handleCancel}
                className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAndClose}
                disabled={!content.trim() || updateNote.isPending}
                className="h-9 px-5 rounded-xl text-sm font-semibold bg-gray-900 text-white disabled:opacity-30 transition-opacity"
              >
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
