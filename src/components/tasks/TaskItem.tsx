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
  high: '●',
  medium: '●',
  low: '●',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-400',
  low: 'text-gray-300',
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

  const date = task.due_date ? new Date(task.due_date) : new Date()
  const day = date.getDate()
  const month = date
    .toLocaleDateString('es-PY', { month: 'short' })
    .toUpperCase()
    .replace('.', '')

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-white p-4 flex flex-col gap-2',
        // Sombra premium: más cerca, más definida, menos difusa
        'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        'transition-all duration-200 ease-out',
        'active:scale-[0.98]',
        // Margen inferior para que el FAB no tape el último card
        'mb-3',
        isClosed && 'opacity-60 bg-gray-50',
        swipeHint === 'complete' && 'translate-x-1',
        swipeHint === 'reschedule' && '-translate-x-1'
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* HEADER - más compacto, mejor alineado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <TypeIcon className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <span className="font-medium">{TYPE_LABEL[task.type]}</span>
        </div>

        {/* FECHA - más grande, tipografía mejorada, color marca */}
        <div className="
          w-16 h-16
          rounded-xl
          flex flex-col items-center justify-center
          bg-[#D4AF37]
          text-white
          shadow-[0_4px_12px_rgba(212,175,55,0.3)]
        ">
          <span className="text-[11px] font-semibold tracking-wider opacity-90">
            {month}
          </span>
          <span className="text-xl font-bold leading-none mt-0.5">
            {day}
          </span>
        </div>
      </div>

      {/* LEAD - más cerca del título */}
      {isLead && lead && (
        <button
          onClick={() => onOpenPeek?.(lead.id)}
          className="text-xs font-semibold text-[#D4AF37] text-left truncate -mt-1"
        >
          {lead.full_name}
        </button>
      )}

      {/* TÍTULO - más peso, mejor jerarquía */}
      <p
        className={cn(
          'text-[17px] font-semibold leading-tight tracking-tight',
          isClosed ? 'text-gray-400 line-through' : 'text-gray-900'
        )}
      >
        {task.title}
      </p>

      {/* META - más sutil, sin emojis */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className={cn("text-[10px]", PRIORITY_COLORS[task.priority])}>
          {PRIORITY_DOT[task.priority]}
        </span>
        <span className="capitalize">
          {CONTEXT_LABEL[task.context]} · {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {/* ACCIONES - botones más refinados */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {hasPhone && !isClosed && (
          <button
            onClick={handleWhatsApp}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-white
                       bg-[#25D366] shadow-sm active:scale-95 transition-transform"
          >
            WhatsApp
          </button>
        )}

        {hasPhone && !isClosed && (
          <a
            href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
            className="h-9 px-4 flex items-center justify-center rounded-lg 
                       text-xs font-semibold bg-gray-100 text-gray-700
                       active:bg-gray-200 transition-colors"
          >
            Llamar
          </a>
        )}

        {hasMeet && !isClosed && (
          <a
            href={task.meet_link!}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 flex items-center justify-center rounded-lg 
                       text-xs font-semibold bg-blue-50 text-blue-600
                       active:bg-blue-100 transition-colors"
          >
            Meet
          </a>
        )}

        <button
          onClick={() => onComplete(task)}
          disabled={isClosed}
          className={cn(
            'h-9 px-4 rounded-full text-xs font-semibold transition-colors ml-auto',
            isClosed
              ? 'bg-gray-200 text-gray-400'
              : 'bg-[#D4AF37] text-white shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
          )}
        >
          {isClosed ? 'Listo' : '✓ Hecho'}
        </button>
      </div>
    </div>
  )
}
