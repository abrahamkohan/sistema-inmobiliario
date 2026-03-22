// src/components/tasks/TaskItem.tsx
// Card mobile-first para una tarea. Dark theme, acento gold.
// Swipe derecha = completar, swipe izquierda = reprogramar.

import { useRef, useState } from 'react'
import { MessageCircle, Phone, Check, MapPin, Mail, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { urgencyColors } from '@/utils/taskColors'
import { getUrgency } from '@/lib/tasks'
import { TaskBadge } from './TaskBadge'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

export interface TaskLead {
  id:        string
  full_name: string
  phone:     string | null
}

interface TaskItemProps {
  task:          TaskRow
  lead?:         TaskLead
  agencyName?:   string
  onComplete:    (task: TaskRow) => void
  onReschedule:  (task: TaskRow) => void
  onOpenPeek?:   (leadId: string) => void
}

// ── Labels e iconos ────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  call:     Phone,
  visit:    MapPin,
  email:    Mail,
  meeting:  Video,
}

const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call:     'Llamar',
  visit:    'Visita',
  email:    'Email',
  meeting:  'Reunión',
}

const CONTEXT_LABEL: Record<string, string> = {
  lead:      'lead',
  property:  'propiedad',
  admin:     'admin',
  marketing: 'marketing',
}

const PRIORITY_DOT: Record<string, string> = {
  high:   '🔴',
  medium: '🟡',
  low:    '⚪',
}

const PRIORITY_LABEL: Record<string, string> = {
  low:    'baja',
  medium: 'media',
  high:   'alta',
}

// ── Componente ─────────────────────────────────────────────────────────────

export function TaskItem({
  task,
  lead,
  agencyName = 'Kohan & Campos',
  onComplete,
  onReschedule,
  onOpenPeek,
}: TaskItemProps) {
  const { openWhatsApp, getTemplate } = useWhatsApp()
  const urgency   = getUrgency(task)
  const colors    = urgencyColors[urgency]
  const isClosed  = urgency === 'closed'
  const isLead    = task.context === 'lead'
  const hasPhone  = isLead && !!lead?.phone
  const hasMeet   = task.type === 'meeting' && !!task.meet_link
  const TypeIcon  = TYPE_ICON[task.type] ?? MessageCircle

  // ── Swipe ──────────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null)
  const [swipeHint, setSwipeHint] = useState<'complete' | 'reschedule' | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    if (diff > 40)       setSwipeHint('complete')
    else if (diff < -40) setSwipeHint('reschedule')
    else                 setSwipeHint(null)
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (diff > 60)       onComplete(task)
    else if (diff < -60) onReschedule(task)
    touchStartX.current = null
    setSwipeHint(null)
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────
  function handleWhatsApp() {
    if (!lead?.phone) return
    const message = getTemplate(task.title, {
      leadName:     lead.full_name,
      agencyName,
      taskPriority: task.priority,
    })
    openWhatsApp(lead.phone, message, task.id)
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-3 flex flex-col gap-1.5 select-none transition-all duration-150',
        colors.border,
        isClosed && 'opacity-50',
        swipeHint === 'complete'   && 'translate-x-1 border-green-500/60',
        swipeHint === 'reschedule' && '-translate-x-1 border-yellow-400/60',
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      {/* ── Fila 1: tipo + badge de fecha/estado ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <TypeIcon className="w-3 h-3 flex-shrink-0" />
          {TYPE_LABEL[task.type] ?? task.type}
        </div>
        <TaskBadge task={task} className="flex-shrink-0" />
      </div>

      {/* ── Lead name — abre peek ── */}
      {isLead && lead && (
        <button
          type="button"
          onClick={() => onOpenPeek?.(lead.id)}
          className="text-left text-[11px] font-semibold text-[#D4AF37] hover:underline truncate w-fit"
        >
          {lead.full_name} →
        </button>
      )}

      {/* ── Título ── */}
      <p className={cn(
        'text-sm font-medium leading-snug',
        isClosed ? 'text-muted-foreground line-through' : 'text-foreground'
      )}>
        {task.title}
      </p>

      {/* ── Prioridad + contexto ── */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] leading-none">{PRIORITY_DOT[task.priority]}</span>
        <span className="text-[10px] text-muted-foreground">
          {CONTEXT_LABEL[task.context] ?? task.context}
          {' · '}
          {PRIORITY_LABEL[task.priority] ?? task.priority}
          {task.recurrence && task.recurrence !== 'none' && (
            <span className="text-[#D4AF37]/60">
              {' · '}{task.recurrence === 'weekly' ? 'semanal' : task.recurrence === 'monthly' ? 'mensual' : 'anual'}
            </span>
          )}
        </span>
      </div>

      {/* ── Notas ── */}
      {task.notes && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">{task.notes}</p>
      )}

      {/* ── Acciones ── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/5">

        {/* WhatsApp */}
        {hasPhone && !isClosed && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="w-3 h-3 flex-shrink-0" />
            WA
          </button>
        )}

        {/* Llamar */}
        {hasPhone && !isClosed && (
          <a
            href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-white/70 text-[11px] font-semibold hover:bg-white/10"
          >
            <Phone className="w-3 h-3 flex-shrink-0" />
            Llamar
          </a>
        )}

        {/* Meet */}
        {hasMeet && !isClosed && (
          <a
            href={task.meet_link!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-[11px] font-semibold"
          >
            <Video className="w-3 h-3 flex-shrink-0" />
            Meet
          </a>
        )}

        {/* Resolver (= Completar) */}
        <button
          type="button"
          onClick={() => onComplete(task)}
          disabled={isClosed}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors',
            isClosed
              ? 'bg-zinc-800/50 text-zinc-600 cursor-default'
              : 'bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25'
          )}
        >
          <Check className="w-3 h-3 flex-shrink-0" />
          {isClosed ? 'Cerrado' : 'Resolver'}
        </button>

      </div>
    </div>
  )
}
