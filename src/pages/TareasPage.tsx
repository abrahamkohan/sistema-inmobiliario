// src/pages/TareasPage.tsx
// Vista completa del módulo de tareas con tabs + filtros colapsables.

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react'
import { useTasks, useUpdateTask, useCreateTask, useDeleteTask } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/context/AuthContext'
import { getUrgency } from '@/lib/tasks'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskFAB } from '@/components/tasks/TaskFAB'
import { LeadPeekSheet } from '@/components/tasks/LeadPeekSheet'
import { TaskCompleteSheet } from '@/components/tasks/TaskCompleteSheet'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { TaskLead } from '@/components/tasks/TaskItem'
import type { OutcomeVal } from '@/components/tasks/TaskCompleteSheet'

type TaskRow  = Database['public']['Tables']['tasks']['Row']
type TaskTab  = 'today' | 'overdue' | 'upcoming' | 'all'
type Context  = TaskRow['context']
type TaskType = TaskRow['type']

// ── Helpers ───────────────────────────────────────────────────────────────

function sortByDueAsc(tasks: TaskRow[]) {
  return [...tasks].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
}
function sortByPriorityDesc(tasks: TaskRow[]) {
  const O = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => (O[a.priority] ?? 1) - (O[b.priority] ?? 1))
}

// ── Filtros ───────────────────────────────────────────────────────────────

const CONTEXT_OPTIONS: { value: Context | 'all'; label: string }[] = [
  { value: 'all',      label: 'Todos'     },
  { value: 'lead',     label: 'Lead'      },
  { value: 'property', label: 'Propiedad' },
  { value: 'admin',    label: 'Admin'     },
  { value: 'marketing',label: 'Marketing' },
]

const TYPE_OPTIONS: { value: TaskType | 'all'; label: string }[] = [
  { value: 'all',      label: 'Todos'    },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call',     label: 'Llamar'   },
  { value: 'visit',    label: 'Visita'   },
  { value: 'email',    label: 'Email'    },
  { value: 'meeting',  label: 'Reunión'  },
]

// ── Componente ─────────────────────────────────────────────────────────────

export function TareasPage() {
  const { session } = useAuth()
  const role = (session?.user?.app_metadata?.role as 'admin' | 'supervisor' | 'agent') ?? 'agent'

  const { data: allTasks = [], isLoading } = useTasks()
  const { data: allClients = [] } = useClients()

  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()

  // Mapa lead_id → TaskLead
  const leads = useMemo<Record<string, TaskLead>>(() => {
    const map: Record<string, TaskLead> = {}
    for (const c of allClients) {
      map[c.id] = { id: c.id, full_name: c.full_name, phone: c.phone ?? null }
    }
    return map
  }, [allClients])

  // ── State ──────────────────────────────────────────────────────────────
  const [tab,         setTab]         = useState<TaskTab>('today')
  const [search,      setSearch]      = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [ctxFilter,   setCtxFilter]   = useState<Context | 'all'>('all')
  const [typeFilter,  setTypeFilter]  = useState<TaskType | 'all'>('all')

  const [peekLeadId,   setPeekLeadId]   = useState<string | null>(null)
  const [completeTask, setCompleteTask] = useState<TaskRow | null>(null)

  // ── Clasificación base por tab ─────────────────────────────────────────
  const byTab = useMemo<TaskRow[]>(() => {
    switch (tab) {
      case 'today':    return sortByPriorityDesc(allTasks.filter(t => getUrgency(t) === 'today'))
      case 'overdue':  return sortByDueAsc(allTasks.filter(t => getUrgency(t) === 'overdue'))
      case 'upcoming': return sortByDueAsc(allTasks.filter(t => getUrgency(t) === 'upcoming'))
      case 'all':      return sortByDueAsc(allTasks)
    }
  }, [allTasks, tab])

  // ── Aplicar filtros opcionales + búsqueda de texto ────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return byTab
      .filter(t => ctxFilter  === 'all' || t.context === ctxFilter)
      .filter(t => typeFilter === 'all' || t.type    === typeFilter)
      .filter(t => {
        if (!q) return true
        if (t.title.toLowerCase().includes(q)) return true
        const lead = t.lead_id ? leads[t.lead_id] : undefined
        if (lead?.full_name.toLowerCase().includes(q)) return true
        return false
      })
  }, [byTab, ctxFilter, typeFilter, search, leads])

  // Contadores para badges de tabs
  const overdueCount = useMemo(
    () => allTasks.filter(t => getUrgency(t) === 'overdue').length,
    [allTasks]
  )

  // ── Mutations ──────────────────────────────────────────────────────────
  function handleComplete(task: TaskRow) { setCompleteTask(task) }

  function handleReschedule(task: TaskRow) {
    // En TareasPage el reschedule abre TaskModal en modo edición
    // (implementación futura — por ahora no-op; DayView tiene inline reschedule)
    void task
  }

  function handleConfirmComplete(outcome: OutcomeVal, nextDate: Date) {
    if (!completeTask) return
    updateTask.mutate({ id: completeTask.id, input: { status: 'closed', outcome } })
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = completeTask
    createTask.mutate({
      ...rest,
      status:   'pending',
      outcome:  null,
      due_date: nextDate.toISOString(),
    })
    setCompleteTask(null)
  }

  // ── Tab button helper ──────────────────────────────────────────────────
  const TAB_CLS = (active: boolean) =>
    cn('relative px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 -mb-px',
       active ? 'border-[#D4AF37] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')

  // ── Filter chip helper ─────────────────────────────────────────────────
  const chipCls = (active: boolean) =>
    cn('px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
       active ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-foreground' : 'border-border text-muted-foreground')

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full pb-24">

      {/* Header */}
      <div className="px-4 pt-5 pb-0 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Tareas</h1>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o lead..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 overflow-x-auto">
          {(['today', 'overdue', 'upcoming', 'all'] as TaskTab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} className={TAB_CLS(tab === t)}>
              {t === 'today'    && 'Hoy'}
              {t === 'overdue'  && (
                <span className="flex items-center gap-1.5">
                  Atrasadas
                  {overdueCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {overdueCount}
                    </span>
                  )}
                </span>
              )}
              {t === 'upcoming' && 'Próximas'}
              {t === 'all'      && 'Todas'}
            </button>
          ))}
        </div>

        {/* Toggle filtros */}
        <button
          type="button"
          onClick={() => setFiltersOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Filtros
          {(ctxFilter !== 'all' || typeFilter !== 'all') && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block" />
          )}
        </button>

        {/* Filtros colapsables */}
        {filtersOpen && (
          <div className="flex flex-col gap-3 pb-2">

            {/* Contexto */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Contexto
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setCtxFilter(opt.value as Context | 'all')}
                    className={chipCls(ctxFilter === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tipo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setTypeFilter(opt.value as TaskType | 'all')}
                    className={chipCls(typeFilter === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agente — solo supervisor / admin (futuro: selector real) */}
            {role !== 'agent' && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Agente
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Disponible cuando exista la tabla de usuarios.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultado de búsqueda */}
      {search.trim() && (
        <div className="px-4 pt-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? 'Sin resultados para esta búsqueda.'
              : `${filtered.length} tarea${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TaskList
            tasks={filtered}
            leads={leads}
            tab={tab}
            onComplete={handleComplete}
            onReschedule={handleReschedule}
            onOpenPeek={setPeekLeadId}
            onDelete={id => deleteTask.mutate(id)}
          />
        )}
      </div>

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

      <TaskFAB />
    </div>
  )
}
