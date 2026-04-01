// src/components/tasks/TaskModal.tsx
// Fullscreen mobile form para crear o editar una tarea.
// Patrón idéntico a "Nuevo lead" (MobileFormScreen + Modal desktop).

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, Loader2, Phone, MapPin, Mail, Video, Trash2 } from 'lucide-react'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useCreateTask, useUpdateTask, useTask, useDeleteTask } from '@/hooks/useTasks'
import { useClient, useClients } from '@/hooks/useClients'
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
  const y  = date.getFullYear()
  const m  = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function fromInputValue(val: string): string {
  // val: "YYYY-MM-DDThh:mm"
  const [datePart, timePart] = val.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [hh, mm]   = (timePart ?? '00:00').split(':').map(Number)
  return new Date(y, mo - 1, d, hh, mm, 0).toISOString()
}

// ── Estilos compartidos (mismo patrón que ClientForm) ─────────────────────

const INPUT_CLS = 'w-full h-11 px-3.5 border border-gray-200 bg-white rounded-lg text-base placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors'
const LABEL_CLS = 'text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block'

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

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { openWhatsApp, getTemplate } = useWhatsApp()

  const [form,          setForm]          = useState<FormState>(() => initialForm(defaultValues))
  const [moreOpen,      setMoreOpen]      = useState(false)
  const [leadSearch,    setLeadSearch]    = useState('')
  const [selectedLead,  setSelectedLead]  = useState<string>(defaultValues?.lead_id ?? '')
  const isSaving = createTask.isPending || updateTask.isPending
  const dateInputRef = useRef<HTMLInputElement>(null)

  const { data: allClients = [] } = useClients()
  const effectiveLeadId = selectedLead || defaultValues?.lead_id || existingTask?.lead_id || ''
  const { data: lead } = useClient(effectiveLeadId)

  // Bloquear scroll del body en mobile cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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
      setSelectedLead(defaultValues?.lead_id ?? '')
      setLeadSearch('')
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
      lead_id:     selectedLead || defaultValues?.lead_id || existingTask?.lead_id || null,
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

  function handleDelete() {
    if (!taskId) return
    if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return
    deleteTask.mutate(taskId)
    onClose()
  }

  // ── Derivados ────────────────────────────────────────────────────────────

  const lockedLeadId     = defaultValues?.lead_id     ?? (isEdit ? existingTask?.lead_id     : null)
  const lockedPropertyId = defaultValues?.property_id ?? (isEdit ? existingTask?.property_id : null)
  const hasLeadPhone     = form.context === 'lead' && !!lead?.phone

  // Filtro de búsqueda para el selector de cliente
  const filteredClients = leadSearch.trim()
    ? allClients.filter(c =>
        c.full_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
        c.phone?.includes(leadSearch) ||
        c.apodo?.toLowerCase().includes(leadSearch.toLowerCase())
      ).slice(0, 6)
    : []
  const canSave          = form.title.trim().length > 0 && form.due_date.length > 0
  const title            = isEdit ? 'Editar tarea' : 'Nueva tarea'

  if (isEdit && loadingTask) return null

  // ── Contenido del formulario (compartido mobile/desktop) ─────────────────

  const formContent = (
    <div className="flex flex-col gap-4">

      {/* ── Título ── */}
      <div className="flex flex-col gap-1.5">
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

      {/* ── Fecha y hora ── */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLS}>FECHA Y HORA *</label>
        <input
          ref={dateInputRef}
          type="datetime-local"
          value={form.due_date}
          min={toInputValue(new Date())}
          onChange={e => set('due_date', e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {/* ── Tipo (chips wrap) ── */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLS}>TIPO</label>
        <div className="w-full flex flex-wrap gap-2">
          {TYPE_CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => set('type', chip.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all',
                form.type === chip.value
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <chip.icon className="w-4 h-4 flex-shrink-0" />
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead readonly (si viene fijo desde contexto externo) */}
      {lockedLeadId && lead && (
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLS}>LEAD</label>
          <div className={INPUT_CLS + ' flex items-center text-gray-500'}>
            {lead.full_name}
          </div>
        </div>
      )}

      {/* Selector de cliente/lead (cuando no viene fijo y contexto = lead) */}
      {!lockedLeadId && form.context === 'lead' && (
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLS}>CLIENTE / LEAD</label>
          {selectedLead && lead ? (
            <div className="flex items-center gap-2">
              <div className={INPUT_CLS + ' flex items-center text-gray-800 flex-1'}>
                {lead.full_name}
                {lead.phone && <span className="ml-2 text-gray-400 text-sm">{lead.phone}</span>}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedLead(''); setLeadSearch('') }}
                className="px-3 py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono..."
                value={leadSearch}
                onChange={e => setLeadSearch(e.target.value)}
                className={INPUT_CLS}
              />
              {filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedLead(c.id); setLeadSearch('') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        {c.full_name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">{c.full_name}</span>
                        {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                      </div>
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        c.tipo === 'cliente' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {c.tipo === 'cliente' ? 'Cliente' : 'Lead'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Propiedad readonly (si viene fija) */}
      {lockedPropertyId && !lockedLeadId && (
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLS}>PROPIEDAD</label>
          <div className={INPUT_CLS + ' flex items-center text-gray-500'}>
            {lockedPropertyId}
          </div>
        </div>
      )}

      {/* Meet link — solo si type = meeting */}
      {form.type === 'meeting' && (
        <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>CONTEXTO</label>
            <select
              value={form.context}
              onChange={e => set('context', e.target.value as Context)}
              className={INPUT_CLS}
            >
              {CONTEXT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>PRIORIDAD</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('priority', opt.value)}
                  className={cn(
                    'flex-1 h-10 rounded-full border text-[13px] font-medium transition-all',
                    form.priority === opt.value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>NOTAS</label>
            <textarea
              rows={2}
              placeholder="Contexto adicional..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-lg text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors resize-none"
            />
          </div>

          {/* Recurrencia */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>REPETICIÓN</label>
            <select
              value={form.recurrence}
              onChange={e => set('recurrence', e.target.value as Recurrence)}
              className={INPUT_CLS}
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

        </div>
      )}

      {/* ── Botones desktop (ocultos en mobile, tienen su footer propio) ── */}
      <div className="hidden md:flex items-center gap-2 pt-4 border-t border-gray-100 mt-2" style={{ position: 'sticky', bottom: 0, background: '#fff', paddingBottom: 4 }}>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            title="Eliminar tarea"
            aria-label="Eliminar tarea"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors mr-auto flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          Cancelar
        </button>
        <Button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => handleSave(false)}
          className="flex-1 h-10 rounded-full text-[14px] font-semibold"
          style={{ backgroundColor: '#0f172a', color: '#fff', borderColor: '#0f172a' }}
        >
          {isSaving && !hasLeadPhone ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {isEdit ? 'Guardar cambios' : 'Agregar tarea'}
        </Button>
        {hasLeadPhone && (
          <Button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => handleSave(true)}
            className="flex-[2] h-10 rounded-full text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            Guardar + WhatsApp
          </Button>
        )}
      </div>

    </div>
  )

  // ── Footer mobile — fijo fuera del scroll, siempre visible ───────────────
  const mobileFooter = (
    <div className="flex flex-col gap-1 px-4 py-3">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={isSaving}
        className="h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 bg-white active:bg-gray-50 transition-colors disabled:opacity-40"
      >
        Cancelar
      </button>

      {hasLeadPhone ? (
        <>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => handleSave(false)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold bg-gray-900 text-white disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? 'Guardar' : 'Agregar tarea'}
          </button>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => handleSave(true)}
            className="flex-1 h-11 rounded-xl text-sm font-semibold bg-emerald-600 text-white flex items-center justify-center gap-1.5 disabled:opacity-30 transition-opacity"
          >
            <MessageCircle className="w-4 h-4" />
            {isEdit ? 'Guardar + WA' : 'Agregar + WA'}
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => handleSave(false)}
          className="flex-1 h-11 rounded-xl text-sm font-semibold bg-gray-900 text-white disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isEdit ? 'Guardar cambios' : 'Agregar tarea'}
        </button>
      )}
    </div>
    {isEdit && (
      <button
        type="button"
        onClick={handleDelete}
        disabled={isSaving}
        className="flex items-center justify-center gap-1.5 w-full h-9 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Eliminar tarea
      </button>
    )}
    </div>
  )

  return (
    <>
      {/* Mobile: fullscreen con footer fijo */}
      <MobileFormScreen open={isOpen} onClose={onClose} title={title} footer={mobileFooter}>
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
