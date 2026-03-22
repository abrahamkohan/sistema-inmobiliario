// src/components/tasks/TaskItem.tsx
// Card mobile-first para una tarea. Dark theme, acento gold.
// Swipe derecha = completar, swipe izquierda = reprogramar.

import { useRef, useState } from 'react'
import { MessageCircle, Video, Check, RotateCcw, Phone } from 'lucide-react'
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
  lead?:         TaskLead           // solo si context = 'lead'
  agencyName?:   string
  onComplete:    (task: TaskRow) => void   // abre TaskCompleteSheet
  onReschedule:  (task: TaskRow) => void   // abre date picker
  onOpenPeek?:   (leadId: string) => void  // abre panel de previsualización del lead
}

// ── Contexto / tipo → etiqueta legible ────────────────────────────────────

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
        'relative rounded-xl border bg-card p-3 flex flex-col gap-2 select-none transition-all duration-150',
        colors.border,
        isClosed && 'opacity-50',
        swipeHint === 'complete'    && 'translate-x-1 border-green-500/60',
        swipeHint === 'reschedule'  && '-translate-x-1 border-yellow-400/60',
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Fila superior: título + badge ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">

          {/* Nombre del lead — botón que abre peek */}
          {isLead && lead && (
            <button
              type="button"
              onClick={() => onOpenPeek?.(lead.id)}
              className="text-left text-[13px] font-semibold text-[#D4AF37] hover:underline truncate"
            >
              {lead.full_name} →
            </button>
          )}

          {/* Título de la tarea */}
          <p className={cn(
            'text-sm font-medium leading-snug',
            isClosed ? 'text-muted-foreground line-through' : 'text-foreground'
          )}>
            {task.title}
          </p>

          {/* Tipo · contexto · prioridad */}
          <p className="text-[10px] text-muted-foreground">
            {TYPE_LABEL[task.type] ?? task.type}
            {' · '}
            {CONTEXT_LABEL[task.context] ?? task.context}
            {' · '}
            {PRIORITY_LABEL[task.priority] ?? task.priority}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="ml-1 text-[#D4AF37]/60">
                · {task.recurrence === 'weekly' ? 'semanal' : task.recurrence === 'monthly' ? 'mensual' : 'anual'}
              </span>
            )}
          </p>
        </div>

        <TaskBadge task={task} className="flex-shrink-0 mt-0.5" />
      </div>

      {/* Notas */}
      {task.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.notes}</p>
      )}

      {/* ── Botones de acción ── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">

        {/* WhatsApp */}
        {hasPhone && !isClosed && (
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </button>
        )}

        {/* Llamar */}
        {hasPhone && !isClosed && (
          <a
            href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Llamar
          </a>
        )}

        {/* Meet */}
        {hasMeet && !isClosed && (
          <a
            href={task.meet_link!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            Meet
          </a>
        )}

        {/* ✓ Completar */}
        <button
          type="button"
          onClick={() => onComplete(task)}
          disabled={isClosed}
          className={cn(
            'flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            isClosed
              ? 'bg-zinc-800/50 text-zinc-600 cursor-default'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <Check className="w-3.5 h-3.5" />
          {isClosed ? 'Cerrado' : 'Hecho'}
        </button>

        {/* ↻ Reprogramar */}
        {!isClosed && (
          <button
            type="button"
            onClick={() => onReschedule(task)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Mover
          </button>
        )}
      </div>
    </div>
  )
}
