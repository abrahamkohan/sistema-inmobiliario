// src/pages/ClientDetailPage.tsx
// Ficha de cliente — timeline estilo chat, centro del CRM
import { useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, Phone, Mail, Edit2, NotebookPen, ClipboardList,
  MessageCircle, CheckCircle2, Clock, AlertCircle, BarChart2,
  FileText, Download, Loader2, Plus, Send, User,
  Star,
} from 'lucide-react'
import { useClient } from '@/hooks/useClients'
import { useNotesByClient, useDeleteNote, useCreateNote } from '@/hooks/useNotes'
import { useTasksByLead } from '@/hooks/useTasks'
import { useSimulationsByClient, useDeleteSimulation, useGenerateReport } from '@/hooks/useSimulations'
import { usePresupuestosByClient } from '@/hooks/usePresupuestos'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useProjects } from '@/hooks/useProjects'
import { TaskModal } from '@/components/tasks/TaskModal'

import { extractTitle } from '@/lib/notes'
import { getUrgency } from '@/lib/tasks'
import { getReportUrl } from '@/lib/pdfService'

import type { Database } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteRow   = Database['public']['Tables']['notes']['Row']
type TaskRow   = Database['public']['Tables']['tasks']['Row']
type SimRow    = Database['public']['Tables']['simulations']['Row']
type PRow      = Database['public']['Tables']['presupuestos']['Row']
type ClientRow = Database['public']['Tables']['clients']['Row']

type ActivityItem =
  | { type: 'note';       data: NoteRow; date: string }
  | { type: 'task';       data: TaskRow; date: string }
  | { type: 'simulation'; data: SimRow;  date: string }
  | { type: 'budget';     data: PRow;    date: string }
  | { type: 'system';     data: ClientRow; date: string }

type Tab = 'actividad' | 'notas' | 'tareas' | 'simulaciones' | 'presupuestos'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'ahora'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days  < 7)  return `${days}d`
  return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })
}

function fmtUsd(cents: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(cents / 100)
}

/** Agrupa items en "Hoy", "Ayer", fecha exacta */
function dayLabel(dateStr: string): string {
  const d     = new Date(dateStr)
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemD = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff  = (today.getTime() - itemD.getTime()) / 86400000
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return d.toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ESTADO_CLS: Record<string, string> = {
  nuevo:       'bg-blue-50 text-blue-600',
  contactado:  'bg-yellow-50 text-yellow-700',
  respondio:   'bg-green-50 text-green-700',
  no_responde: 'bg-gray-100 text-gray-500',
  descartado:  'bg-red-50 text-red-600',
  convertido:  'bg-emerald-50 text-emerald-700',
}

const TASK_TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', call: 'Llamada', meeting: 'Reunión',
  email: 'Email', visit: 'Visita',
}

// ─── Item bubble variants ──────────────────────────────────────────────────────

function NoteItemBubble({ item, onOpen, onDelete }: {
  item: ActivityItem & { type: 'note' }
  onOpen:   () => void
  onDelete: () => void
}) {
  const title = extractTitle(item.data.content)
  const body  = item.data.content.split('\n').slice(1).join('\n').trim()

  return (
    <div className="flex gap-2.5 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center mt-0.5">
        <NotebookPen className="w-3.5 h-3.5 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <button
          onClick={onOpen}
          className="w-full text-left bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">Nota</span>
            {item.data.is_flagged && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </div>
          <p className="text-sm font-medium text-gray-800 leading-snug">{title}</p>
          {body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{body}</p>}
          {item.data.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {item.data.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </button>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[11px] text-gray-400">{timeAgo(item.date)}</span>
          <button
            onClick={onDelete}
            className="text-[11px] text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskItemBubble({ item, onEdit }: { item: ActivityItem & { type: 'task' }; onEdit: (id: string) => void }) {
  const urgency = getUrgency(item.data)
  const isClosed = item.data.status === 'closed'
  const isOverdue = urgency === 'overdue' && !isClosed

  const statusIcon = isClosed
    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
    : isOverdue
    ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
    : urgency === 'today'
    ? <Clock className="w-3.5 h-3.5 text-amber-500" />
    : <ClipboardList className="w-3.5 h-3.5 text-blue-500" />

  return (
    <div className="flex gap-2.5">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
        isClosed ? 'bg-emerald-50' : isOverdue ? 'bg-red-50' : 'bg-blue-50'
      }`}>
        {statusIcon}
      </div>
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onEdit(item.data.id)}
          className={`w-full text-left bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all ${
            isOverdue ? 'border-red-100' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              isClosed ? 'text-emerald-500' : isOverdue ? 'text-red-400' : 'text-blue-500'
            }`}>
              {TASK_TYPE_LABEL[item.data.type] ?? 'Tarea'}
            </span>
            {isClosed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">Cerrada</span>
            )}
            {isOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Vencida</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-800 leading-snug">{item.data.title}</p>
          {item.data.notes && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.data.notes}</p>
          )}
          <p className="text-[11px] text-gray-300 mt-1.5">
            {new Date(item.data.due_date).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
          </p>
        </button>
        <p className="text-[11px] text-gray-400 mt-1 px-1">{timeAgo(item.date)}</p>
      </div>
    </div>
  )
}

function SimItemBubble({ item, clientName }: {
  item: ActivityItem & { type: 'simulation' }
  clientName: string
}) {
  const generateReport = useGenerateReport(item.data.client_id ?? '')
  const deleteSim      = useDeleteSimulation(item.data.client_id ?? '')
  const snap    = item.data.snapshot_project  as Record<string, unknown>
  const snapTyp = item.data.snapshot_typology as Record<string, unknown>
  const project  = (snap?.name    as string) ?? 'Proyecto'
  const typology = (snapTyp?.name as string) ?? 'Tipología'
  const isGenerating = generateReport.isPending

  return (
    <div className="flex gap-2.5 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mt-0.5">
        <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 block mb-0.5">
            Simulación
          </span>
          <p className="text-sm font-medium text-gray-800">{project}</p>
          <p className="text-xs text-gray-400 mt-0.5">{typology}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => generateReport.mutate({ sim: item.data, clientName })}
              disabled={isGenerating}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isGenerating
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
                : <><FileText className="w-3 h-3" /> Informe</>
              }
            </button>
            {item.data.report_path && (
              <a
                href={getReportUrl(item.data.report_path)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                <Download className="w-3 h-3" /> PDF
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[11px] text-gray-400">{timeAgo(item.date)}</span>
          <button
            onClick={() => { if (confirm('¿Eliminar simulación?')) deleteSim.mutate(item.data.id) }}
            className="text-[11px] text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function BudgetItemBubble({ item }: { item: ActivityItem & { type: 'budget' } }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5">
        <FileText className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 block mb-0.5">
            Presupuesto
          </span>
          <p className="text-sm font-medium text-gray-800">{item.data.unidad_nombre}</p>
          <p className="text-xs font-bold text-gray-600 mt-0.5">{fmtUsd(item.data.precio_usd)}</p>
          {item.data.cochera_nombre && (
            <p className="text-xs text-gray-400 mt-0.5">+ {item.data.cochera_nombre}</p>
          )}
          <a
            href={`/presupuestos/${item.data.id}/pdf`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-3 h-3" /> Ver PDF
          </a>
        </div>
        <p className="text-[11px] text-gray-400 mt-1 px-1">{timeAgo(item.date)}</p>
      </div>
    </div>
  )
}

function SystemItemBubble({ item }: { item: ActivityItem & { type: 'system' } }) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
        <User className="w-3 h-3 text-gray-400" />
        <span className="text-[11px] text-gray-500">Cliente creado · {timeAgo(item.date)}</span>
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({
  items, clientName, onOpenNote, onDeleteNote, onEditTask,
}: {
  items: ActivityItem[]
  clientName: string
  onOpenNote:   (n: NoteRow) => void
  onDeleteNote: (id: string) => void
  onEditTask:   (id: string) => void
}) {
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
        <ClipboardList className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">Sin actividad todavía</p>
    </div>
  )

  // Agrupar por día
  const groups: { label: string; items: ActivityItem[] }[] = []
  for (const item of items) {
    const label = dayLabel(item.date)
    const last  = groups[groups.length - 1]
    if (last?.label === label) {
      last.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {groups.map(group => (
        <div key={group.label} className="flex flex-col gap-3">
          {/* Day separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Items */}
          {group.items.map(item => {
            if (item.type === 'note')
              return (
                <NoteItemBubble
                  key={`n-${item.data.id}`}
                  item={item as ActivityItem & { type: 'note' }}
                  onOpen={() => onOpenNote(item.data as NoteRow)}
                  onDelete={() => { if (confirm('¿Eliminar nota?')) onDeleteNote(item.data.id) }}
                />
              )
            if (item.type === 'task')
              return <TaskItemBubble key={`t-${item.data.id}`} item={item as ActivityItem & { type: 'task' }} onEdit={onEditTask} />
            if (item.type === 'simulation')
              return (
                <SimItemBubble
                  key={`s-${item.data.id}`}
                  item={item as ActivityItem & { type: 'simulation' }}
                  clientName={clientName}
                />
              )
            if (item.type === 'budget')
              return <BudgetItemBubble key={`b-${item.data.id}`} item={item as ActivityItem & { type: 'budget' }} />
            if (item.type === 'system')
              return <SystemItemBubble key="system" item={item as ActivityItem & { type: 'system' }} />
            return null
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Chat input ───────────────────────────────────────────────────────────────

function ChatInput({
  onSendNote,
  onNewTask,
  isSending,
}: {
  onSendNote: (text: string) => void
  onNewTask:  () => void
  isSending:  boolean
}) {
  const [text,       setText]       = useState('')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const val = text.trim()
    if (!val) return
    onSendNote(val)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div
      className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Quick action menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full left-4 mb-2 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden w-52">
            <button
              onClick={() => { setMenuOpen(false); onNewTask() }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-blue-600" />
              </div>
              Nueva tarea
            </button>
            <a
              href="/presupuestos"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              Nuevo presupuesto
            </a>
            <a
              href="/simulador"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-amber-500" />
              </div>
              Nueva simulación
            </a>
          </div>
        </>
      )}

      <div className="flex items-end gap-2 relative">
        {/* + button */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            menuOpen
              ? 'bg-gray-900 text-white rotate-45'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Plus className="w-5 h-5" style={{ transform: menuOpen ? 'rotate(45deg)' : undefined, transition: 'transform 0.2s' }} />
        </button>

        {/* Textarea */}
        <div className="flex-1 flex items-end bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 focus-within:border-gray-400 focus-within:bg-white transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); autoResize() }}
            onKeyDown={handleKey}
            placeholder="Escribir nota..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-[1.5] max-h-[120px]"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function StatusBar({ activity, tasks }: { activity: ActivityItem[]; tasks: TaskRow[] }) {
  const lastActivity = activity[0]
  const nextTask = tasks
    .filter(t => t.status !== 'closed')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

  if (!lastActivity && !nextTask) return null

  return (
    <div className="flex gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
      {lastActivity && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          Última actividad {timeAgo(lastActivity.date)}
        </div>
      )}
      {nextTask && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
          Próxima: {new Date(nextTask.due_date).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate    = useNavigate()

  const [tab,      setTab]      = useState<Tab>('actividad')
  // editOpen no longer needed - using separate page for editing
  const [taskOpen,    setTaskOpen]    = useState(false)
  const [editTaskId,  setEditTaskId]  = useState<string | null>(null)
  const [editNote,    setEditNote]    = useState<NoteRow | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: client, isLoading } = useClient(id)
  const { data: notes    = []     } = useNotesByClient(id)
  const { data: tasks    = []     } = useTasksByLead(id)
  const { data: sims     = []     } = useSimulationsByClient(id)
  const { data: budgets  = []     } = usePresupuestosByClient(id)
  const { data: projects = []     } = useProjects()

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createNote  = useCreateNote()
  const deleteNote  = useDeleteNote()
  // updateClient no longer used - editing moved to separate page

  // ── All activity, sorted DESC ──────────────────────────────────────────────
  const allActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [
      ...notes.map(n   => ({ type: 'note'       as const, data: n, date: n.updated_at })),
      ...tasks.map(t   => ({ type: 'task'       as const, data: t, date: t.updated_at })),
      ...sims.map(s    => ({ type: 'simulation' as const, data: s, date: s.created_at })),
      ...budgets.map(b => ({ type: 'budget'     as const, data: b, date: b.created_at })),
    ]
    if (client) items.push({ type: 'system', data: client, date: client.created_at })
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [notes, tasks, sims, budgets, client])

  // ── Filtered by tab ────────────────────────────────────────────────────────
  const visibleItems = useMemo<ActivityItem[]>(() => {
    if (tab === 'actividad')    return allActivity
    if (tab === 'notas')        return allActivity.filter(i => i.type === 'note')
    if (tab === 'tareas')       return allActivity.filter(i => i.type === 'task')
    if (tab === 'simulaciones') return allActivity.filter(i => i.type === 'simulation')
    if (tab === 'presupuestos') return allActivity.filter(i => i.type === 'budget')
    return allActivity
  }, [allActivity, tab])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleSendNote(text: string) {
    await createNote.mutateAsync({ content: text, location: 'inbox', client_id: id })
    // Scroll to top (newest)
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100)
  }

  // handleEditClient removed - editing now handled in separate page

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !client) return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Cargando...
    </div>
  )

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials  = client.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const estadoCls = client.estado ? (ESTADO_CLS[client.estado] ?? 'bg-gray-100 text-gray-500') : ''
  const openTasks = tasks.filter(t => t.status !== 'closed').length

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'actividad',    label: 'Todo',          count: allActivity.filter(i => i.type !== 'system').length },
    { key: 'notas',        label: 'Notas',         count: notes.length },
    { key: 'tareas',       label: 'Tareas',        count: openTasks },
    { key: 'simulaciones', label: 'Simulaciones',  count: sims.length },
    { key: 'presupuestos', label: 'Presupuestos',  count: budgets.length },
  ]

  // ── Layout: fixed header + scrollable timeline + fixed chat input ──────────
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100">

        {/* Nav bar */}
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[15px]">Clientes</span>
          </button>
        </div>

        {/* Client info */}
        <div className="px-5 pb-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base"
              style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              {/* Nombre + Edit */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">
                    {client.full_name}
                  </h1>
                  {client.apodo && (
                    <p className="text-xs text-gray-400 italic">"{client.apodo}"</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/clientes/${id}/editar`)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>

              {/* Badges tipo + estado */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  client.tipo === 'cliente' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'
                }`}>
                  {client.tipo === 'cliente' ? 'Cliente' : 'Lead'}
                </span>
                {client.estado && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoCls}`}>
                    {client.estado.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info básica en grid */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {client.phone && (
              <a href={`tel:${client.phone}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{client.phone}</span>
              </a>
            )}
            {client.nationality && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{client.nationality}</span>
              </div>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`}
                className="col-span-2 flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
            )}
            {client.fuente && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Star className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="truncate text-xs">{client.fuente}</span>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {client.notes && (
            <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800 line-clamp-3">{client.notes}</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {client.phone && (
              <a
                href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${client.full_name}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: '#397746' }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                Llamar
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            )}
          </div>
        </div>

        {/* Status bar */}
        <StatusBar activity={allActivity.filter(i => i.type !== 'system')} tasks={tasks} />

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto px-4 border-t border-gray-50">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] min-w-[16px] text-center px-1 py-0.5 rounded-full font-bold ${
                  tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TIMELINE (scrollable) ────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <Timeline
          items={visibleItems}
          clientName={client.full_name}
          onOpenNote={setEditNote}
          onDeleteNote={id => deleteNote.mutate(id)}
          onEditTask={setEditTaskId}
        />
      </div>

      {/* ── CHAT INPUT (fixed bottom) ────────────────────────────────────── */}
      <ChatInput
        onSendNote={handleSendNote}
        onNewTask={() => setTaskOpen(true)}
        isSending={createNote.isPending}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <TaskModal
        isOpen={taskOpen || !!editTaskId}
        onClose={() => { setTaskOpen(false); setEditTaskId(null) }}
        taskId={editTaskId ?? undefined}
        defaultValues={editTaskId ? undefined : { context: 'lead', lead_id: id }}
      />

      {editNote && (
        <NoteEditor
          note={editNote}
          clients={[client] as ClientRow[]}
          projects={projects}
          onClose={() => setEditNote(null)}
        />
      )}

      {/* Editing now handled in separate page: /clientes/:id/editar */}
    </div>
  )
}
