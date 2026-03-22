// src/components/tasks/TaskBadge.tsx
// Refactor UX: badge tipo calendario + mejor jerarquía visual (sin tocar colores base)

import { cn } from '@/lib/utils'
import { getUrgency } from '@/lib/tasks'
import { urgencyColors } from '@/utils/taskColors'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

interface TaskBadgeProps {
  task: TaskRow
  className?: string
}

// ── Helpers ─────────────────────────────────────────────

function getDateParts(isoDate: string) {
  const date = new Date(isoDate)

  const day = new Intl.DateTimeFormat('es-PY', { day: 'numeric' }).format(date)
  const month = new Intl.DateTimeFormat('es-PY', { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase()

  return { day, month }
}

// ── Componente ─────────────────────────────────────────

export function TaskBadge({ task, className }: TaskBadgeProps) {
  const urgency = getUrgency(task)
  const colors  = urgencyColors[urgency]

  // 👉 SOLO mostramos calendario en upcoming y today
  if (urgency === 'upcoming' || urgency === 'today') {
    const { day, month } = getDateParts(task.due_date)

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border px-2 py-1 min-w-[44px]',
          colors.border,
          className
        )}
      >
        <span className="text-[9px] font-semibold text-muted-foreground leading-none">
          {month}
        </span>
        <span className="text-sm font-bold leading-none text-foreground">
          {day}
        </span>
      </div>
    )
  }

  // 👉 Estados (overdue, etc) se mantienen como badge simple
  const label = colors.badge
  if (!label) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        colors.text,
        colors.border,
        'bg-transparent',
        className
      )}
    >
      {label}
    </span>
  )
}
