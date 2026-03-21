// src/components/tasks/DayViewTeamWidget.tsx
// Widget de supervisión de equipo: atrasadas por agente.
// Solo renderiza si role = 'supervisor' | 'admin' y hay tareas atrasadas.
// Nota: los nombres de agente se resolverán cuando exista la tabla users.

import { useNavigate } from 'react-router'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { getUrgency } from '@/lib/tasks'

type Role = 'admin' | 'supervisor' | 'agent'

interface DayViewTeamWidgetProps {
  role: Role
}

export function DayViewTeamWidget({ role }: DayViewTeamWidgetProps) {
  const navigate = useNavigate()
  const { data: tasks = [], isLoading } = useTasks()

  // Solo visible para supervisor o admin
  if (role === 'agent') return null
  if (isLoading) return null

  // Agrupar tareas atrasadas por agente
  const overdueByAgent: Record<string, number> = {}
  for (const task of tasks) {
    if (getUrgency(task) === 'overdue') {
      overdueByAgent[task.assigned_to] = (overdueByAgent[task.assigned_to] ?? 0) + 1
    }
  }

  const rows = Object.entries(overdueByAgent)
    .sort((a, b) => b[1] - a[1])  // más atrasadas primero

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-white/8 bg-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Atrasadas por agente
        </p>
      </div>

      {/* Filas */}
      <div className="flex flex-col gap-1.5">
        {rows.map(([agentId, count]) => (
          <div key={agentId} className="flex items-center justify-between gap-2">
            {/* Nombre del agente — mostrará nombre real cuando exista tabla users */}
            <p className="text-sm text-foreground font-medium truncate">
              {agentId.slice(0, 8)}…
            </p>
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500/15 text-red-500 text-[11px] font-bold">
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Link */}
      <button
        type="button"
        onClick={() => navigate('/tareas')}
        className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline w-fit mt-1"
      >
        Ver tareas del equipo
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
