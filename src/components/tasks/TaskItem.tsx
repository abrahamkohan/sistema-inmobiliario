// src/components/tasks/TaskItem.tsx

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, MessageCircle, Phone, MapPin, Mail, Video, Trash2, Pencil, MoreHorizontal, CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { getUrgency } from '@/lib/tasks'
import { buildGoogleCalendarUrl, GCAL_SUPPORTED_TYPES } from '@/lib/googleCalendar'
import { SwipeableRow } from '@/components/ui/SwipeableRow'
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
  onDelete?: (id: string) => void
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

const TYPE_COLOR: Record<string, string> = {
  whatsapp: '#397746',
  call:     '#3b82f6',
  visit:    '#f97316',
  email:    '#6366f1',
  meeting:  '#8b5cf6',
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
  onDelete,
}: TaskItemProps) {
  const { openWhatsApp, getTemplate } = useWhatsApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const urgency = getUrgency(task)
  const isClosed = urgency === 'closed'
  const isLead = task.context === 'lead'
  const hasPhone = isLead && !!lead?.phone
  const hasMeet = task.type === 'meeting' && !!task.meet_link

  const TypeIcon  = TYPE_ICON[task.type]  ?? MessageCircle
  const typeColor = TYPE_COLOR[task.type] ?? '#9ca3af'

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
  const time  = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false })


  return (
    <SwipeableRow
      className="rounded-2xl"
      leftAction={!isClosed ? {
        icon: <CheckCircle2 className="w-6 h-6" />,
        label: 'Hecho',
        color: 'bg-emerald-500',
        onTrigger: () => onComplete(task),
      } : undefined}
      rightAction={onDelete ? {
        icon: <Trash2 className="w-6 h-6" />,
        label: 'Eliminar',
        color: 'bg-red-500',
        onTrigger: () => onDelete(task.id),
      } : undefined}
    >
    <div
      className={cn(
        'group relative rounded-2xl bg-white px-3 py-2.5 flex items-center gap-3 transition-all duration-150',
        'shadow-[0_4px_14px_rgba(0,0,0,0.07)]',
        isClosed && 'opacity-50',
      )}
    >
      {/* COLUMNA IZQUIERDA: todo el contenido */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">

        {/* Tipo */}
        <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: typeColor }}>
          <TypeIcon className="w-3 h-3 flex-shrink-0" />
          <span>{TYPE_LABEL[task.type]}</span>
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
        <div className="flex items-center gap-1 text-[11px] text-gray-600 mt-2 font-medium">
          <span>{PRIORITY_DOT[task.priority]}</span>
          <span>{CONTEXT_LABEL[task.context]} · {PRIORITY_LABEL[task.priority]}</span>
        </div>

        {/* CTA principal + acción secundaria */}
        <div className="flex items-center gap-1.5 mt-1">
          {/* CTA principal: depende del tipo de tarea */}
          {task.type === 'whatsapp' && hasPhone && !isClosed && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: '#397746' }}
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
          {/* Para WhatsApp: Llamar como secundario */}
          {task.type === 'whatsapp' && hasPhone && !isClosed && (
            <a
              href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 flex-shrink-0"
            >
              <Phone className="w-3 h-3" />
              Llamar
            </a>
          )}
          {/* ✓ Hecho */}
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

          {/* ⋯ Menú contextual */}
          {!isClosed && (
            <div ref={menuRef} className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[60]">
                  <button
                    onClick={() => { setMenuOpen(false); onReschedule(task) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    Editar
                  </button>
                  {GCAL_SUPPORTED_TYPES.includes(task.type) && !!task.due_date && (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        const url = buildGoogleCalendarUrl({ task, leadName: lead?.full_name })
                        if (url) window.open(url, '_blank')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-gray-400" />
                      Al calendario
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        if (confirm('¿Eliminar esta tarea?')) onDelete(task.id)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meet link al pie — accesible para tareas tipo reunión sin meet abierta */}
        {task.meet_link && task.type !== 'meeting' && !isClosed && (
          <a
            href={task.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:underline"
          >
            <Video className="w-3 h-3 flex-shrink-0" />
            🎥 Link de reunión
          </a>
        )}
      </div>

      {/* Badge estilo calendario — cuadrado fijo 72×72 */}
      <div className="w-[72px] h-[72px] flex-shrink-0 rounded-2xl overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col">
        <div className="bg-[#D4AF37] flex items-center justify-center py-1">
          <span className="text-[11px] font-bold text-white tracking-[0.15em]">{month}</span>
        </div>
        <div className="bg-white flex-1 flex flex-col items-center justify-center leading-none">
          <span className="text-[28px] font-black text-gray-900 leading-none">{day}</span>
          <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{time}</span>
        </div>
      </div>
    </div>
    </SwipeableRow>
  )
}
