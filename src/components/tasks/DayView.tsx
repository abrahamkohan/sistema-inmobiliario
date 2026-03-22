// src/components/tasks/DayView.tsx
// Pantalla "Mi día" — dashboard principal del módulo de tareas.
// Sin métricas ni gráficos. Una sola pregunta: ¿qué tengo que hacer hoy?

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTasks, useUpdateTask, useCreateTask } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/context/AuthContext'
import { getUrgency } from '@/lib/tasks'
import { TaskList } from './TaskList'
import { TaskFAB } from './TaskFAB'
import { DayViewTeamWidget } from './DayViewTeamWidget'
import { LeadPeekSheet } from './LeadPeekSheet'
import { TaskCompleteSheet } from './TaskCompleteSheet'
import type { Database } from '@/types/database'
import type { TaskLead } from './TaskItem'
import type { OutcomeVal } from './TaskCompleteSheet'

type TaskRow = Database['public']['Tables']['tasks']['Row']

// ── Helpers ───────────────────────────────────────────────────────────────

function sortByPriorityDesc(tasks: TaskRow[]): TaskRow[] {
  const ORDER = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => (ORDER[a.priority] ?? 1) - (ORDER[b.priority] ?? 1))
}

// ── RescheduleInline — date input que aparece debajo del item ─────────────

interface RescheduleInlineProps {
  taskId:   string
  onSave:   (taskId: string, date: Date) => void
  onCancel: () => void
}

function toInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function RescheduleInline({ taskId, onSave, onCancel }: RescheduleInlineProps) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const [val, setVal] = useState(toInputValue(tomorrow))

  function handleSave() {
    const [y, mo, d] = val.split('-').map(Number)
    onSave(taskId, new Date(y, mo - 1, d, 12, 0, 0))
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 -mt-1">
      <input
        type="date"
        value={val}
        min={toInputValue(new Date())}
        onChange={e => setVal(e.target.value)}
        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />
      <button
        type="button"
        onClick={handleSave}
        className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
        style={{ backgroundColor: '#D4AF37' }}
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )
}

// ── TaskListWithReschedule — TaskList + inline reschedule ─────────────────

interface TaskListWithRescheduleProps {
  tasks:          TaskRow[]
  leads:          Record<string, TaskLead>
  tab:            'today' | 'overdue' | 'upcoming' | 'all'
  onComplete:     (task: TaskRow) => void
  onOpenPeek:     (leadId: string) => void
  rescheduleId:   string | null
  onReschedule:   (task: TaskRow) => void
  onRescheduleSave:   (taskId: string, date: Date) => void
  onRescheduleCancel: () => void
}

function TaskListWithReschedule({
  tasks, leads, tab, onComplete, onOpenPeek,
  rescheduleId, onReschedule, onRescheduleSave, onRescheduleCancel,
}: TaskListWithRescheduleProps) {
  if (tasks.length === 0) {
    return (
      <TaskList
        tasks={[]} leads={leads} tab={tab}
        onComplete={onComplete} onReschedule={onReschedule} onOpenPeek={onOpenPeek}
      />
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {tasks.map(task => (
        <div key={task.id} className="flex flex-col gap-0">
          <TaskList
            tasks={[task]} leads={leads} tab={tab}
            onComplete={onComplete} onReschedule={onReschedule} onOpenPeek={onOpenPeek}
          />
          {rescheduleId === task.id && (
            <RescheduleInline
              taskId={task.id}
              onSave={onRescheduleSave}
              onCancel={onRescheduleCancel}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── DayView ───────────────────────────────────────────────────────────────

export function DayView() {
  const navigate   = useNavigate()
  const { session } = useAuth()

  // ── Datos ──────────────────────────────────────────────────────────────
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks()
  const { data: allClients = [] } = useClients()

  const leads = useMemo<Record<string, TaskLead>>(() => {
    const map: Record<string, TaskLead> = {}
    for (const c of allClients) {
      map[c.id] = { id: c.id, full_name: c.full_name, phone: c.phone ?? null }
    }
    return map
  }, [allClients])

  // ── Clasificación de tareas ────────────────────────────────────────────
  const overdue  = useMemo(() => allTasks.filter(t => getUrgency(t) === 'overdue')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()), [allTasks])

  const today    = useMemo(() => sortByPriorityDesc(
    allTasks.filter(t => getUrgency(t) === 'today')
  ), [allTasks])

  const upcoming = useMemo(() => allTasks
    .filter(t => getUrgency(t) === 'upcoming')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3), [allTasks])

  const isEmpty  = !loadingTasks && overdue.length === 0 && today.length === 0

  // ── Estado de sheets ───────────────────────────────────────────────────
  const [peekLeadId,    setPeekLeadId]    = useState<string | null>(null)
  const [completeTask,  setCompleteTask]  = useState<TaskRow | null>(null)
  const [rescheduleId,  setRescheduleId]  = useState<string | null>(null)

  // ── Mutations ──────────────────────────────────────────────────────────
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()

  function handleComplete(task: TaskRow) {
    setCompleteTask(task)
  }

  function handleReschedule(task: TaskRow) {
    setRescheduleId(prev => prev === task.id ? null : task.id)
  }

  function handleRescheduleSave(taskId: string, date: Date) {
    updateTask.mutate({ id: taskId, input: { due_date: date.toISOString(), status: 'rescheduled' } })
    setRescheduleId(null)
  }

  function handleConfirmComplete(outcome: OutcomeVal, nextDate: Date) {
    if (!completeTask) return
    // 1. Cerrar tarea actual
    updateTask.mutate({ id: completeTask.id, input: { status: 'closed', outcome } })
    // 2. Crear siguiente instancia con la fecha que eligió el agente
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = completeTask
    createTask.mutate({
      ...rest,
      status:   'pending',
      outcome:  null,
      due_date: nextDate.toISOString(),
    })
    setCompleteTask(null)
  }

  // ── Rol (placeholder — se leerá de tabla users cuando exista) ─────────
  const role = (session?.user?.app_metadata?.role as 'admin' | 'supervisor' | 'agent') ?? 'agent'

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-28 max-w-xl mx-auto">

      {/* Counters */}
      {!loadingTasks && (overdue.length > 0 || today.length > 0) && (
        <div className="flex gap-3">
          {overdue.length > 0 && (
            <div className="flex-1 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 flex flex-col gap-0.5">
              <span className="text-2xl font-bold text-red-500">{overdue.length}</span>
              <span className="text-xs text-muted-foreground">atrasadas</span>
            </div>
          )}
          {today.length > 0 && (
            <div className="flex-1 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/8 px-4 py-3 flex flex-col gap-0.5">
              <span className="text-2xl font-bold" style={{ color: '#D4AF37' }}>{today.length}</span>
              <span className="text-xs text-muted-foreground">para hoy</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state global */}
      {isEmpty && (
        <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">Todo al día — sin tareas pendientes.</p>
        </div>
      )}

      {/* ── ATRASADAS ── */}
      {overdue.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            — Atrasadas
          </p>
          <TaskListWithReschedule
            tasks={overdue} leads={leads} tab="overdue"
            onComplete={handleComplete} onOpenPeek={setPeekLeadId}
            rescheduleId={rescheduleId} onReschedule={handleReschedule}
            onRescheduleSave={handleRescheduleSave}
            onRescheduleCancel={() => setRescheduleId(null)}
          />
        </section>
      )}

      {/* ── HOY ── */}
      {today.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            — Hoy
          </p>
          <TaskListWithReschedule
            tasks={today} leads={leads} tab="today"
            onComplete={handleComplete} onOpenPeek={setPeekLeadId}
            rescheduleId={rescheduleId} onReschedule={handleReschedule}
            onRescheduleSave={handleRescheduleSave}
            onRescheduleCancel={() => setRescheduleId(null)}
          />
        </section>
      )}

      {/* ── PRÓXIMAS ── */}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              — Próximas
            </p>
            <button
              type="button"
              onClick={() => navigate('/tareas')}
              className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <TaskListWithReschedule
            tasks={upcoming} leads={leads} tab="upcoming"
            onComplete={handleComplete} onOpenPeek={setPeekLeadId}
            rescheduleId={rescheduleId} onReschedule={handleReschedule}
            onRescheduleSave={handleRescheduleSave}
            onRescheduleCancel={() => setRescheduleId(null)}
          />
        </section>
      )}

      {/* Widget de equipo (supervisor / admin) */}
      <DayViewTeamWidget role={role} />

      {/* Sheets */}
      <LeadPeekSheet
        isOpen={!!peekLeadId}
        leadId={peekLeadId}
        onClose={() => setPeekLeadId(null)}
      />

      <TaskCompleteSheet
        isOpen={!!completeTask}
        task={completeTask}
        lead={completeTask?.lead_id ? leads[completeTask.lead_id] : undefined}
        onClose={() => setCompleteTask(null)}
        onConfirm={handleConfirmComplete}
      />

      {/* FAB */}
      <TaskFAB />
    </div>
  )
}
