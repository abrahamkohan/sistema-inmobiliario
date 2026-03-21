// src/components/tasks/TaskFAB.tsx
// Botón flotante "+" fixed bottom-right. Abre TaskModal en modo crear.

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TaskModal } from './TaskModal'
import type { Database } from '@/types/database'

type Context = Database['public']['Tables']['tasks']['Row']['context']

interface TaskFABProps {
  defaultContext?: Context
  defaultLeadId?: string
  defaultPropertyId?: string
}

export function TaskFAB({ defaultContext, defaultLeadId, defaultPropertyId }: TaskFABProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nueva tarea"
        className="fixed bottom-6 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 hover:scale-105"
        style={{ backgroundColor: '#D4AF37' }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>

      <TaskModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultValues={{
          context:     defaultContext,
          lead_id:     defaultLeadId,
          property_id: defaultPropertyId,
        }}
      />
    </>
  )
}
