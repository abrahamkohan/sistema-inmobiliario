// src/components/tasks/TaskList.tsx
// Recibe lista de tareas ya filtrada + mapa de leads opcionales.
// Renderiza TaskItem por cada tarea con empty state contextual.

import { ClipboardList } from 'lucide-react'
import { TaskItem, type TaskLead } from './TaskItem'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

type Tab = 'today' | 'overdue' | 'upcoming' | 'all'

interface TaskListProps {
  tasks:         TaskRow[]
  leads?:        Record<string, TaskLead>   // leadId → lead data
  tab?:          Tab
  agencyName?:   string
  onComplete:    (task: TaskRow) => void
  onReschedule:  (task: TaskRow) => void
  onOpenPeek?:   (leadId: string) => void
  onDelete?:     (id: string) => void
}

// ── Empty states por tab ──────────────────────────────────────────────────

const EMPTY: Record<Tab, { title: string; subtitle: string }> = {
  today:    { title: 'Todo al día',          subtitle: 'No tenés tareas para hoy.' },
  overdue:  { title: 'Sin tareas atrasadas', subtitle: 'Estás al día con todo.' },
  upcoming: { title: 'Sin tareas próximas',  subtitle: 'No hay tareas agendadas.' },
  all:      { title: 'Sin tareas',           subtitle: 'Creá una tarea con el botón +.' },
}

// ── Componente ─────────────────────────────────────────────────────────────

export function TaskList({
  tasks,
  leads = {},
  tab = 'all',
  agencyName,
  onComplete,
  onReschedule,
  onOpenPeek,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    const empty = EMPTY[tab]
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">{empty.title}</p>
        <p className="text-xs text-muted-foreground">{empty.subtitle}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          lead={task.lead_id ? leads[task.lead_id] : undefined}
          agencyName={agencyName}
          onComplete={onComplete}
          onReschedule={onReschedule}
          onOpenPeek={onOpenPeek}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
