// src/hooks/useRealtimeTasks.ts
// Suscripción Supabase Realtime a la tabla tasks.
// Invalida el cache y muestra toast cuando se insertan/actualizan tareas.
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getUrgency } from '@/lib/tasks'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

export function useRealtimeTasks() {
  const qc = useQueryClient()
  // Evitamos notificar tareas que ya conocíamos al montar el hook
  const initialIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)

  useEffect(() => {
    // Snapshot inicial de IDs conocidos
    const current = qc.getQueryData<TaskRow[]>(['tasks']) ?? []
    initialIds.current = new Set(current.map(t => t.id))
    initialized.current = true

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // Invalida el cache para que todos los componentes se actualicen
          qc.invalidateQueries({ queryKey: ['tasks'] })

          if (payload.eventType === 'INSERT') {
            const task = payload.new as TaskRow
            // Solo notificar tareas nuevas (no las que ya estaban al montar)
            if (!initialIds.current.has(task.id)) {
              if (getUrgency(task) === 'overdue') {
                toast.warning(`Tarea vencida: "${task.title}"`, { duration: 6000 })
              }
              initialIds.current.add(task.id)
            }
          }

          if (payload.eventType === 'UPDATE') {
            const task = payload.new as TaskRow
            if (getUrgency(task) === 'overdue') {
              toast.warning(`Tarea vencida: "${task.title}"`, { duration: 6000 })
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
