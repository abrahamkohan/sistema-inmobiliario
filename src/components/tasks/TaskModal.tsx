// src/components/tasks/TaskModal.tsx
// Fullscreen mobile form para crear o editar una tarea.
// Patrón idéntico a "Nuevo lead" (MobileFormScreen + Modal desktop).

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, Loader2, Phone, MapPin, Mail, Video } from 'lucide-react'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useCreateTask, useUpdateTask, useTask } from '@/hooks/useTasks'
import { useClient } from '@/hooks/useClients'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type TaskRow    = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskType   = TaskRow['type']
type Context    = TaskRow['context']
type Priority   = TaskRow['priority']
type Recurrence = NonNullable<TaskRow['recurrence']>

// ── Chips de tipo ─────────────────────────────────────────────────────────

const TYPE_CHIPS: { value: TaskType; icon: React.ElementType; label: string }[] = [
  { value: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { value: 'call',     icon: Phone,         label: 'Llamar'   },
  { value: 'visit',    icon: MapPin,         label: 'Visita'   },
  { value: 'email',    icon: Mail,           label: 'Email'    },
  { value: 'meeting',  icon: Video,          label: 'Reunión'  },
]

const CONTEXT_OPTIONS: { value: Context; label: string }[] = [
  { value: 'lead',      label: 'Lead'       },
  { value: 'property',  label: 'Propiedad'  },
  { value: 'admin',     label: 'Admin'      },
  { value: 'marketing', label: 'Marketing'  },
]

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low',    label: 'Baja'  },
  { value: 'medium', label: 'Media' },
  { value: 'high',   label: 'Alta'  },
]

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none',    label: 'Sin repetición' },
  { value: 'weekly',  label: 'Semanal'        },
  { value: 'monthly', label: 'Mensual'        },
  { value: 'yearly',  label: 'Anual'          },
]

// ── Helpers de fecha ──────────────────────────────────────────────────────

function toInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromInputValue(val: string): string {
  const [y, mo, d] = val.split('-').map(Number)
  return new Date(y, mo - 1, d, 12, 0, 0).toISOString()
}

// ── Estilos compartidos (mismo patrón que ClientForm) ─────────────────────

const INPUT_CLS = 'w-full h-10 px-3 border border-gray-200 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors'
const LABEL_CLS = 'text-xs font-medium text-gray-500 mb-1.5 block'

// ── Props ─────────────────────────────────────────────────────────────────

interface DefaultValues {
  context?:     Context
  lead_id?:     string
  property_id?: string
}

interface TaskModalProps {
  isOpen:         boolean
  onClose:        () => void
  taskId?:        string
  defaultValues?: DefaultValues
  agencyName?:    string
}

// ── Estado del formulario ─────────────────────────────────────────────────

interface FormState {
  title:        string
  due_date:     string
  type:         TaskType
  context:      Context
  priority:     Priority
  notes:        string
  recurrence:   Recurrence
  meet_link:    string
}

function initialForm(defaults?: DefaultValues): FormState {
  return {
    title:      '',
    due_date:   toInputValue(new Date()),
    type:       'whatsapp',
    context:    defaults?.context ?? 'lead',
    priority:   'medium',
    notes:      '',
    recurrence: 'none',
    meet_link:  '',
  }
}

// ── Componente ─────────────────────────────────────────────────────────────

export function TaskModal({
  isOpen,
  onClose,
  taskId,
  defaultValues,
  agencyName = 'Kohan & Campos',
}: TaskModalProps) {
  const { session }    = useAuth()
  const currentUserId  = session?.user?.id ?? ''

  const isEdit = !!taskId
  const { data: existingTask, isLoading: loadingTask } = useTask(taskId ?? '')
  const { data: lead } = useClient(defaultValues?.lead_id ?? existingTask?.lead_id ?? '')

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { openWhatsApp, getTemplate } = useWhatsApp()

  const [form,     setForm]     = useState<FormState>(() => initialForm(defaultValues))
  const [moreOpen, setMoreOpen] = useState(false)
  const isSaving = createTask.isPending || updateTask.isPending

  // Poblar formulario en modo edición
  useEffect(() => {
    if (isOpen && isEdit && existingTask) {
      setForm({
        title:      existingTask.title,
        due_date:   toInputValue(new Date(existingTask.due_date)),
        type:       existingTask.type,
        context:    existingTask.context,
        priority:   existingTask.priority,
        notes:      existingTask.notes ?? '',
        recurrence: existingTask.recurrence ?? 'none',
        meet_link:  existingTask.meet_link ?? '',
      })
    } else if (isOpen && !isEdit) {
      setForm(initialForm(defaultValues))
      setMoreOpen(false)
    }
  }, [isOpen, isEdit, existingTask, defaultValues])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSave(withWhatsApp: boolean) {
    if (!form.title.trim() || !form.due_date) return

    const payload: Partial<TaskInsert> = {
      title:       form.title.trim(),
      due_date:    fromInputValue(form.due_date),
      type:        form.type,
      context:     form.context,
      priority:    form.priority,
      notes:       form.notes.trim() || null,
      recurrence:  form.recurrence,
      meet_link:   form.meet_link.trim() || null,
      lead_id:     defaultValues?.lead_id ?? existingTask?.lead_id ?? null,
      property_id: defaultValues?.property_id ?? existingTask?.property_id ?? null,
    }

    if (isEdit && taskId) {
      updateTask.mutate({ id: taskId, input: payload })
    } else {
      createTask.mutate({
        ...payload,
        assigned_to: currentUserId,
        created_by:  currentUserId,
        title:       payload.title!,
        due_date:    payload.due_date!,
      } as TaskInsert)
    }

    if (withWhatsApp && lead?.phone) {
      const msg = getTemplate(form.title, {
        leadName:     lead.full_name,
        agencyName,
        taskPriority: form.priority,
      })
      openWhatsApp(lead.phone, msg)
    }

    onClose()
  }

  // ── Derivados ────────────────────────────────────────────────────────────

  const lockedLeadId     = defaultValues?.lead_id     ?? (isEdit ? existingTask?.lead_id     : null)
  const lockedPropertyId = defaultValues?.property_id ?? (isEdit ? existingTask?.property_id : null)
  const hasLeadPhone     = form.context === 'lead' && !!lead?.phone
  const canSave          = form.title.trim().length > 0 && form.due_date.length > 0
  const title            = isEdit ? 'Editar tarea' : 'Nueva tarea'

  if (isEdit && loadingTask) return null

  // ── Contenido del formulario (compartido mobile/desktop) ─────────────────

  const formContent = (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden flex flex-col gap-4 pb-2" style={{ boxSizing: 'border-box' }}>

      {/* ── Título ── */}
      <div>
        <label className={LABEL_CLS}>TÍTULO *</label>
        <input
          type="text"
          placeholder="Ej: Seguimiento inicial"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className={INPUT_CLS}
          autoFocus
        />
      </div>

      {/* ── Fecha ── */}
      <div>
        <label className={LABEL_CLS}>FECHA *</label>
        <input
          type="date"
          value={form.due_date}
          min={toInputValue(new Date())}
          onChange={e => set('due_date', e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {/* ── Tipo (chips wrap) ── */}
      <div className="w-full min-w-0">
        <label className={LABEL_CLS}>TIPO</label>
        <div className="w-full flex flex-wrap gap-1.5">
          {TYPE_CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => set('type', chip.value)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all',
                form.type === chip.value
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              )}
            >
              <chip.icon className="w-3 h-3 flex-shrink-0" />
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead readonly (si viene fijo) */}
      {lockedLeadId && lead && (
        <div>
          <label className={LABEL_CLS}>LEAD</label>
          <div className={INPUT_CLS + ' flex items-center text-gray-500'}>
            {lead.full_name}
          </div>
        </div>
      )}

      {/* Propiedad readonly (si viene fija) */}
      {lockedPropertyId && !lockedLeadId && (
        <div>
          <label className={LABEL_CLS}>PROPIEDAD</label>
          <div className={INPUT_CLS + ' flex items-center text-gray-500'}>
            {lockedPropertyId}
          </div>
        </div>
      )}

      {/* Meet link — solo si type = meeting */}
      {form.type === 'meeting' && (
        <div>
          <label className={LABEL_CLS}>LINK REUNIÓN (Meet / Zoom)</label>
          <input
            type="url"
            placeholder="https://meet.google.com/..."
            value={form.meet_link}
            onChange={e => set('meet_link', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      )}

      {/* ── Más opciones (colapsable) ── */}
      <button
        type="button"
        onClick={() => setMoreOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors self-start"
      >
        {moreOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {moreOpen ? 'Menos opciones' : 'Más opciones'}
      </button>

      {moreOpen && (
        <div className="flex flex-col gap-4">

          {/* Contexto */}
          <div>
            <label className={LABEL_CLS}>CONTEXTO</label>
            <select
              value={form.context}
              onChange={e => set('context', e.target.value as Context)}
              className={INPUT_CLS + ' bg-gray-50'}
            >
              {CONTEXT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className={LABEL_CLS}>PRIORIDAD</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('priority', opt.value)}
                  className={cn(
                    'flex-1 h-10 rounded-xl border text-sm font-medium transition-all',
                    form.priority === opt.value
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-gray-900'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className={LABEL_CLS}>NOTAS</label>
            <textarea
              rows={2}
              placeholder="Contexto adicional..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors resize-none"
            />
          </div>

          {/* Recurrencia */}
          <div>
            <label className={LABEL_CLS}>REPETICIÓN</label>
            <select
              value={form.recurrence}
              onChange={e => set('recurrence', e.target.value as Recurrence)}
              className={INPUT_CLS + ' bg-gray-50'}
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

        </div>
      )}

      {/* ── Botones sticky al pie ── */}
      <div
        className="flex gap-2 mt-2"
        style={{
          position: 'sticky',
          bottom: 0,
          width: '100%',
          background: '#f1f5f9',
          paddingTop: 8,
          paddingBottom: 16,
          borderTop: '1px solid #e5e7eb',
          marginTop: 8,
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
          className="h-11 px-4"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => handleSave(false)}
          className="flex-1 h-11"
          style={{ backgroundColor: '#D4AF37', color: '#000', borderColor: '#D4AF37' }}
        >
          {isSaving && !hasLeadPhone ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Guardar
        </Button>
        {hasLeadPhone && (
          <Button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => handleSave(true)}
            className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            Guardar + WhatsApp
          </Button>
        )}
      </div>

    </div>
  )

  return (
    <>
      {/* Mobile: fullscreen */}
      <MobileFormScreen open={isOpen} onClose={onClose} title={title}>
        {formContent}
      </MobileFormScreen>

      {/* Desktop: modal centrado */}
      <div className="hidden md:block">
        <Modal open={isOpen} onClose={onClose} title={title}>
          {formContent}
        </Modal>
      </div>
    </>
  )
}
