// src/components/tasks/TaskFAB.tsx
// Speed-dial FAB: Nueva tarea + Nueva nota

import { useState } from 'react'
import { Plus, X, ClipboardList, NotebookPen, UserPlus } from 'lucide-react'
import { TaskModal } from './TaskModal'
import { QuickLeadModal } from './QuickLeadModal'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useCreateNote } from '@/hooks/useNotes'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import { usePuedeEditar } from '@/hooks/usePermiso'
import type { Database } from '@/types/database'

type Context = Database['public']['Tables']['tasks']['Row']['context']
type NoteRow = Database['public']['Tables']['notes']['Row']

interface TaskFABProps {
  defaultContext?: Context
  defaultLeadId?: string
  defaultPropertyId?: string
}

export function TaskFAB({ defaultContext, defaultLeadId, defaultPropertyId }: TaskFABProps) {
  const [open,          setOpen]          = useState(false)
  const [quickLead,     setQuickLead]     = useState(false)
  const [expanded,      setExpanded]      = useState(false)
  const [editingNote,   setEditingNote]   = useState<NoteRow | null>(null)

  const createNote = useCreateNote()
  const { data: clients  = [] } = useClients()
  const { data: projects = [] } = useProjects()
  const puedeEditarTareas = usePuedeEditar('tareas')
  const puedeEditarNotas  = usePuedeEditar('notas')

  function handleNewLead() {
    setExpanded(false)
    setQuickLead(true)
  }

  async function handleNewNote() {
    setExpanded(false)
    const note = await createNote.mutateAsync({ content: '', location: 'inbox' })
    setEditingNote(note)
  }

  function handleNewTask() {
    setExpanded(false)
    setOpen(true)
  }

  return (
    <>
      {/* Backdrop semitransparente al expandir */}
      {expanded && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Speed-dial container */}
      <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3">

        {/* Opciones — visibles cuando expanded */}
        <div
          className="flex flex-col items-end gap-2.5 transition-all duration-200"
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'translateY(0)' : 'translateY(12px)',
            pointerEvents: expanded ? 'auto' : 'none',
          }}
        >
          {/* Contacto rápido */}
          <button
            onClick={handleNewLead}
            className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full shadow-lg text-white text-sm font-semibold transition-transform active:scale-95 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
              <UserPlus className="w-3.5 h-3.5" />
            </span>
            Contacto rápido
          </button>

          {/* Nueva tarea */}
          {puedeEditarTareas && (
            <button
              onClick={handleNewTask}
              className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full shadow-lg text-black text-sm font-semibold transition-transform active:scale-95 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c93a)' }}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/10">
                <ClipboardList className="w-3.5 h-3.5" />
              </span>
              Nueva tarea
            </button>
          )}

          {/* Nueva nota */}
          {puedeEditarNotas && (
            <button
              onClick={handleNewNote}
              disabled={createNote.isPending}
              className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full shadow-lg text-white text-sm font-semibold transition-transform active:scale-95 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                <NotebookPen className="w-3.5 h-3.5" />
              </span>
              Nueva nota
            </button>
          )}
        </div>

        {/* Botón principal */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? 'Cerrar' : 'Nueva acción'}
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all active:scale-95 hover:scale-105"
          style={{
            backgroundColor: expanded ? '#1e293b' : '#D4AF37',
            transition: 'background-color 0.2s, transform 0.15s',
          }}
        >
          {expanded
            ? <X    className="w-6 h-6 text-white" strokeWidth={2.5} />
            : <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          }
        </button>
      </div>

      {/* Modales */}
      <QuickLeadModal
        isOpen={quickLead}
        onClose={() => setQuickLead(false)}
      />

      <TaskModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultValues={{
          context:     defaultContext,
          lead_id:     defaultLeadId,
          property_id: defaultPropertyId,
        }}
      />

      {editingNote && (
        <NoteEditor
          note={editingNote}
          clients={clients}
          projects={projects}
          onClose={() => setEditingNote(null)}
        />
      )}
    </>
  )
}
