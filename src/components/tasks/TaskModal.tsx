// src/components/tasks/TaskModal.tsx
// Bottom sheet para crear o editar una tarea.
// Siempre side="bottom". Nunca Dialog centrado.

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, Loader2, Phone, MapPin, Mail, Video } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

function formatDateHuman(val: string): string {
  if (!val) return ''
  const date     = new Date(val + 'T12:00:00')
  const today    = new Date(); today.setHours(12, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const dayMonth = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'long' }).format(date)
  if (date.toDateString() === today.toDateString())    return `Hoy, ${dayMonth}`
  if (date.toDateString() === tomorrow.toDateString()) return `Mañana, ${dayMonth}`
  const wd = new Intl.DateTimeFormat('es-PY', { weekday: 'long' }).format(date)
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)}, ${dayMonth}`
}

// ── Props ─────────────────────────────────────────────────────────────────

interface DefaultValues {
  context?:     Context
  lead_id?:     string
  property_id?: string
}

interface TaskModalProps {
  isOpen:         boolean
  onClose:        () => void
  taskId?:        string         // edit mode si está presente
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

  const [form,        setForm]        = useState<FormState>(() => initialForm(defaultValues))
  const [moreOpen,    setMoreOpen]    = useState(false)
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

  // ── Campos readonly para contexto fijo ──────────────────────────────────

  const lockedLeadId     = defaultValues?.lead_id     ?? (isEdit ? existingTask?.lead_id     : null)
  const lockedPropertyId = defaultValues?.property_id ?? (isEdit ? existingTask?.property_id : null)
  const hasLeadPhone     = form.context === 'lead' && !!lead?.phone
  const canSave          = form.title.trim().length > 0 && form.due_date.length > 0

  if (isEdit && loadingTask) return null

  return (
    <Sheet open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92vh] flex flex-col bg-background pb-0"
      >
        {/* Handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-white/10 mb-4 flex-shrink-0" />

        {/* Título del modal */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-1 mb-4 flex-shrink-0">
          {isEdit ? 'Editar tarea' : 'Nueva tarea'}
        </p>

        {/* Área scrollable */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-4">

          {/* ── INPUT TÍTULO — protagonista ── */}
          <input
            type="text"
            placeholder="¿Qué hay que hacer?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            autoFocus
            className="w-full bg-transparent text-lg font-medium text-foreground
                       placeholder:text-white/25 border-b border-white/10 pb-3
                       focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
          />

          {/* ── CANAL (tipo) — protagonista ── */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Canal</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_CHIPS.map(chip => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => set('type', chip.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                    form.type === chip.value
                      ? 'border-[#D4AF37] bg-[#D4AF37]/12 text-foreground'
                      : 'border-white/8 text-white/30 hover:text-white/60 hover:border-white/20'
                  )}
                >
                  <chip.icon className="w-4 h-4" />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── FECHA ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Cuándo</p>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={form.due_date}
                min={toInputValue(new Date())}
                onChange={e => set('due_date', e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm
                           text-foreground focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              />
              {form.due_date && (
                <span className="text-sm text-white/50">{formatDateHuman(form.due_date)}</span>
              )}
            </div>
          </div>

          {/* ── CONTEXTO — pills compactas ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Contexto</p>
            <div className="flex flex-wrap gap-1.5">
              {CONTEXT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('context', opt.value as Context)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                    form.context === opt.value
                      ? 'border-white/30 bg-white/10 text-foreground'
                      : 'border-white/8 text-white/25 hover:text-white/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lead readonly */}
          {lockedLeadId && lead && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
              <span className="text-xs text-white/40">Lead</span>
              <span className="text-sm text-foreground font-medium">{lead.full_name}</span>
            </div>
          )}

          {/* Propiedad readonly */}
          {lockedPropertyId && !lockedLeadId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
              <span className="text-xs text-white/40">Propiedad</span>
              <span className="text-sm text-foreground font-medium">{lockedPropertyId}</span>
            </div>
          )}

          {/* Meet link */}
          {form.type === 'meeting' && (
            <input
              type="url"
              placeholder="Link de reunión (Meet / Zoom)"
              value={form.meet_link}
              onChange={e => set('meet_link', e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5
                         text-sm text-foreground placeholder:text-white/25
                         focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
            />
          )}

          {/* ── Más opciones ── */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setMoreOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors w-fit"
            >
              {moreOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {moreOpen ? 'Menos opciones' : 'Más opciones'}
            </button>

            {moreOpen && (
              <div className="flex flex-col gap-4 pl-1 border-l border-white/8 ml-1">

                {/* Prioridad */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Prioridad
                  </p>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => set('priority', opt.value)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-xs font-medium transition-all',
                          form.priority === opt.value
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-foreground'
                            : 'border-white/8 text-white/30 hover:text-white/60'
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <textarea
                  rows={2}
                  placeholder="Notas..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5
                             text-sm text-foreground placeholder:text-white/25
                             focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 resize-none"
                />

                {/* Recurrencia */}
                <select
                  value={form.recurrence}
                  onChange={e => set('recurrence', e.target.value as Recurrence)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5
                             text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

              </div>
            )}
          </div>

        </div>{/* fin scroll */}

        {/* ── CTA STICKY ── */}
        <div className="flex-shrink-0 flex flex-col gap-2 pt-4 pb-safe border-t border-white/8 bg-background">
          {hasLeadPhone && (
            <button
              type="button"
              disabled={!canSave || isSaving}
              onClick={() => handleSave(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl
                         text-sm font-bold text-white transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: canSave && !isSaving ? '#25D366' : '#25D36640' }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Guardar + WhatsApp
            </button>
          )}
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => handleSave(false)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl
                       text-sm font-bold transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#D4AF37', color: '#000' }}
          >
            {isSaving && !hasLeadPhone && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar tarea
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cancelar
          </button>
        </div>

      </SheetContent>
    </Sheet>
  )
}
