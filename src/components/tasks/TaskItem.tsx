// src/components/tasks/TaskItem.tsx

import { useRef, useState } from 'react'
import { MessageCircle, Phone, MapPin, Mail, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { getUrgency } from '@/lib/tasks'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

export interface TaskLead {
  id: string
  full_name: string
  phone: string | null
}

interface TaskItemProps {
  task: TaskRow
  lead?: TaskLead
  agencyName?: string
  onComplete: (task: TaskRow) => void
  onReschedule: (task: TaskRow) => void
  onOpenPeek?: (leadId: string) => void
}

const TYPE_ICON: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  call: Phone,
  visit: MapPin,
  email: Mail,
  meeting: Video,
}

const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamar',
  visit: 'Visita',
  email: 'Email',
  meeting: 'Reunión',
}

const CONTEXT_LABEL: Record<string, string> = {
  lead: 'lead',
  property: 'propiedad',
  admin: 'admin',
  marketing: 'marketing',
}

const PRIORITY_DOT: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '⚪',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'baja',
  medium: 'media',
  high: 'alta',
}

export function TaskItem({
  task,
  lead,
  agencyName = 'Kohan & Campos',
  onComplete,
  onReschedule,
  onOpenPeek,
}: TaskItemProps) {
  const { openWhatsApp, getTemplate } = useWhatsApp()

  const urgency = getUrgency(task)
  const isClosed = urgency === 'closed'
  const isLead = task.context === 'lead'
  const hasPhone = isLead && !!lead?.phone
  const hasMeet = task.type === 'meeting' && !!task.meet_link

  const TypeIcon = TYPE_ICON[task.type] ?? MessageCircle

  const touchStartX = useRef<number | null>(null)
  const [swipeHint, setSwipeHint] = useState<'complete' | 'reschedule' | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    if (diff > 40) setSwipeHint('complete')
    else if (diff < -40) setSwipeHint('reschedule')
    else setSwipeHint(null)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (diff > 60) onComplete(task)
    else if (diff < -60) onReschedule(task)
    touchStartX.current = null
    setSwipeHint(null)
  }

  function handleWhatsApp() {
    if (!lead?.phone) return
    const message = getTemplate(task.title, {
      leadName: lead.full_name,
      agencyName,
      taskPriority: task.priority,
    })
    openWhatsApp(lead.phone, message, task.id)
  }

  const date  = task.due_date ? new Date(task.due_date) : new Date()
  const day   = date.getDate()
  const month = date.toLocaleDateString('es-PY', { month: 'short' }).toUpperCase()
  const time  = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })

  // Chip de urgencia — español paraguayo
  const URGENCY_LABEL: Record<string, string> = {
    today:    'Hoy',
    overdue:  'Atrasada',
    upcoming: 'Próxima',
    closed:   'Cerrada',
  }
  const URGENCY_CLS: Record<string, string> = {
    today:    'bg-[#D4AF37]/20 text-[#8a6d00]',
    overdue:  'bg-red-100 text-red-600',
    upcoming: 'bg-gray-100 text-gray-500',
    closed:   'bg-gray-100 text-gray-400',
  }
  const urgencyLabel = URGENCY_LABEL[urgency] ?? ''
  const urgencyChip  = URGENCY_CLS[urgency]  ?? 'bg-gray-100 text-gray-400'

  // Bloque de acciones — compartido mobile y desktop
  const actions = (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      {task.type === 'whatsapp' && hasPhone && !isClosed && (
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
      )}
      {task.type === 'call' && hasPhone && !isClosed && (
        <a
          href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
          className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-bold bg-gray-900 text-white flex-shrink-0"
        >
          <Phone className="w-3.5 h-3.5" />
          Llamar
        </a>
      )}
      {task.type === 'meeting' && hasMeet && !isClosed && (
        <a
          href={task.meet_link!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-bold bg-blue-500 text-white flex-shrink-0"
        >
          <Video className="w-3.5 h-3.5" />
          Reunión
        </a>
      )}
      {task.type === 'whatsapp' && hasPhone && !isClosed && (
        <a
          href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 flex-shrink-0"
        >
          <Phone className="w-3 h-3" />
          Llamar
        </a>
      )}
      {task.meet_link && !isClosed && (
        <a
          href={task.meet_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-500 flex-shrink-0"
        >
          <Video className="w-3 h-3 flex-shrink-0" />
          🎥 Reunión
        </a>
      )}
      <button
        onClick={() => onComplete(task)}
        disabled={isClosed}
        className={cn(
          'h-7 px-2.5 rounded-lg text-xs font-semibold transition flex-shrink-0',
          isClosed ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        {isClosed ? 'Cerrado' : '✓ Hecho'}
      </button>
    </div>
  )

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-white transition-all duration-150',
        'shadow-[0_4px_14px_rgba(0,0,0,0.07)]',
        'active:scale-[0.98]',
        isClosed && 'opacity-50',
        swipeHint === 'complete' && 'translate-x-1',
        swipeHint === 'reschedule' && '-translate-x-1'
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      {/* ── MOBILE (< md): layout vertical, badge de fecha al fondo ── */}
      <div className="flex md:hidden flex-col">

        {/* Contenido */}
        <div className="px-3 pt-3 pb-2 flex flex-col gap-0.5">

          {/* Fila 1: tipo + chip urgencia */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium min-w-0">
              <TypeIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{TYPE_LABEL[task.type]}</span>
            </div>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', urgencyChip)}>
              {urgencyLabel}
            </span>
          </div>

          {/* Lead */}
          {isLead && lead && (
            <button
              onClick={() => onOpenPeek?.(lead.id)}
              className="text-[11px] font-semibold text-[#D4AF37] text-left truncate leading-none"
            >
              {lead.full_name}
            </button>
          )}

          {/* Título */}
          <p className={cn(
            'text-sm font-bold leading-snug',
            isClosed ? 'text-gray-400 line-through' : 'text-gray-900'
          )}>
            {task.title}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
            <span>{PRIORITY_DOT[task.priority]}</span>
            <span>{CONTEXT_LABEL[task.context]} · {PRIORITY_LABEL[task.priority]}</span>
          </div>

          {/* Acciones */}
          {actions}
        </div>

        {/* Badge de fecha protagonista — al fondo de la card */}
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-[#FFB86B] to-[#FF7A7A] text-white py-3 flex flex-col items-center gap-0 shadow-[0_4px_10px_rgba(255,120,100,0.35)]">
          <span className="text-xs font-semibold tracking-[0.2em] opacity-90">{month}</span>
          <span className="text-5xl font-black leading-none">{day}</span>
          <span className="text-[11px] font-medium opacity-75 mt-1">{time}</span>
        </div>
      </div>

      {/* ── DESKTOP (≥ md): layout horizontal original ── */}
      <div className="hidden md:flex items-center gap-3 px-3 py-2.5">

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">

          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <TypeIcon className="w-3 h-3 flex-shrink-0" />
            <span>{TYPE_LABEL[task.type]}</span>
          </div>

          {isLead && lead && (
            <button
              onClick={() => onOpenPeek?.(lead.id)}
              className="text-[11px] font-semibold text-[#D4AF37] text-left truncate leading-none"
            >
              {lead.full_name}
            </button>
          )}

          <p className={cn(
            'text-sm font-bold leading-snug',
            isClosed ? 'text-gray-400 line-through' : 'text-gray-900'
          )}>
            {task.title}
          </p>

          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
            <span>{PRIORITY_DOT[task.priority]}</span>
            <span>{CONTEXT_LABEL[task.context]} · {PRIORITY_LABEL[task.priority]}</span>
          </div>

          {actions}
        </div>

        {/* Badge cuadrado protagonista — desktop */}
        <div className="w-14 h-14 flex-shrink-0 rounded-xl flex flex-col items-center justify-center leading-none bg-gradient-to-br from-[#FFB86B] to-[#FF7A7A] text-white shadow-[0_4px_10px_rgba(255,120,100,0.4)]">
          <span className="text-[10px] font-semibold opacity-90 tracking-wide">{month}</span>
          <span className="text-2xl font-bold leading-none">{day}</span>
          <span className="text-[9px] font-semibold opacity-80 mt-0.5">{time}</span>
        </div>
      </div>

    </div>
  )
}
