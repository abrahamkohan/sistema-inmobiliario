// src/components/dashboard/AgenteDashboard.tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Users, ClipboardList, AlertCircle, Plus } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import { getUrgency } from '@/lib/tasks'
import { DayView } from '@/components/tasks/DayView'
import { Button } from '@/components/ui/button'

export function AgenteDashboard() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: clients = [] } = useClients()
  const { data: tasks = [] }   = useTasks()

  const nombre = session?.user?.email?.split('@')[0] ?? 'Agente'

  const leads    = useMemo(() => (clients ?? []).filter(c => (c.tipo ?? 'lead') === 'lead'),  [clients])
  const clientes = useMemo(() => (clients ?? []).filter(c => c.tipo === 'cliente'),           [clients])
  const overdue  = useMemo(() => (tasks ?? []).filter(t => getUrgency(t) === 'overdue'),      [tasks])
  const pending  = useMemo(() => (tasks ?? []).filter(t => t.status === 'pending'),           [tasks])

  const stats = [
    { label: 'Leads',    value: leads.length,    icon: Users,         color: '#f59e0b', onClick: () => navigate('/clientes') },
    { label: 'Clientes', value: clientes.length, icon: Users,         color: '#10b981', onClick: () => navigate('/clientes') },
    { label: 'Pendientes', value: pending.length,  icon: ClipboardList, color: '#6366f1', onClick: () => navigate('/tareas') },
    { label: 'Vencidas', value: overdue.length,  icon: AlertCircle,   color: '#ef4444', onClick: () => navigate('/tareas') },
  ]

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl mx-auto">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold">Buenos días, {nombre}</h1>
        <p className="text-sm text-muted-foreground mt-1">Esto es lo que tenés para hoy.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col gap-2 p-4 rounded-xl border bg-card text-left hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: value > 0 ? color : undefined }}>
              {value}
            </span>
          </button>
        ))}
      </div>

      {/* Acceso rápido */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate('/clientes/nuevo')}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuevo lead
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/clientes')}>
          Ver mis clientes
        </Button>
      </div>

      {/* Tareas del día */}
      <div>
        <DayView />
      </div>

    </div>
  )
}
