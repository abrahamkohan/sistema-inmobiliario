// src/components/notes/NoteItem.tsx
import { Star, Pencil, Archive, Trash2, Bell, Link } from 'lucide-react'
import { useNavigate } from 'react-router'
import { extractTitle, extractSnippet } from '@/lib/notes'
import type { Database } from '@/types/database'

type NoteRow = Database['public']['Tables']['notes']['Row']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7)   return `${days}d`
  return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })
}

function getReminderUrgency(dateStr: string): 'overdue' | 'today' | 'upcoming' {
  const d    = new Date(dateStr)
  const now  = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const rem   = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (rem < today) return 'overdue'
  if (rem.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

const REMINDER_CLS: Record<string, string> = {
  overdue:  'bg-red-100 text-red-600',
  today:    'bg-yellow-100 text-yellow-700',
  upcoming: 'bg-gray-100 text-gray-500',
}

const REMINDER_LABEL: Record<string, string> = {
  overdue:  '🔴 Vencida',
  today:    '🟡 Hoy',
  upcoming: '⚪ Próxima',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NoteItemProps {
  note: NoteRow
  clientName?: string
  clientId?: string
  projectName?: string
  onOpen:    (note: NoteRow) => void
  onArchive: (id: string)   => void
  onDelete:  (id: string)   => void
  onFlag:    (id: string, flagged: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NoteItem({ note, clientName, clientId, projectName, onOpen, onArchive, onDelete, onFlag }: NoteItemProps) {
  const navigate = useNavigate()
  const title   = extractTitle(note.content)
  const snippet = extractSnippet(note.content)
  const hasReminder = !!note.reminder_date
  const urgency = hasReminder ? getReminderUrgency(note.reminder_date!) : null
  const visibleTags = note.tags.slice(0, 3)
  const hasLink = !!(note.client_id || note.project_id)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar esta nota?`)) return
    onDelete(note.id)
  }

  function handleArchive(e: React.MouseEvent) {
    e.stopPropagation()
    onArchive(note.id)
  }

  function handleFlag(e: React.MouseEvent) {
    e.stopPropagation()
    onFlag(note.id, !note.is_flagged)
  }

  return (
    <div
      onClick={() => onOpen(note)}
      className="group flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors"
    >
      {/* Flag button */}
      <button
        onClick={handleFlag}
        className="mt-0.5 flex-shrink-0 transition-colors"
        title={note.is_flagged ? 'Quitar destacado' : 'Destacar'}
      >
        <Star
          className={`w-4 h-4 ${note.is_flagged ? 'fill-amber-400 text-amber-400' : 'text-gray-200 group-hover:text-gray-300'}`}
        />
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Fila 1: título + tiempo */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{title}</p>
          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(note.updated_at)}</span>
        </div>

        {/* Fila 2: snippet */}
        {snippet && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{snippet}</p>
        )}

        {/* Fila 3: chips */}
        {(visibleTags.length > 0 || hasReminder || hasLink) && (
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            {hasReminder && urgency && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${REMINDER_CLS[urgency]}`}>
                <Bell className="w-2.5 h-2.5 inline mr-0.5" />
                {REMINDER_LABEL[urgency]}
              </span>
            )}
            {hasLink && clientId && (
              <button
                onClick={e => { e.stopPropagation(); navigate(`/clientes/${clientId}`) }}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center gap-0.5 hover:bg-indigo-100 transition-colors"
              >
                <Link className="w-2.5 h-2.5" />
                {clientName ? `→ ${clientName}` : '→ Cliente'}
              </button>
            )}
            {hasLink && !clientId && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center gap-0.5">
                <Link className="w-2.5 h-2.5" />
                {projectName ? `→ ${projectName}` : '→ Vínculo'}
              </span>
            )}
            {visibleTags.map(tag => (
              <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-gray-400">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Acciones — solo en hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(note) }}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Editar"
        >
          <Pencil className="w-3 h-3" />
        </button>
        {note.location === 'inbox' && (
          <button
            onClick={handleArchive}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Archivar"
          >
            <Archive className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
