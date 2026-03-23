// src/components/tasks/TaskCompleteSheet.tsx
// Modal centrado "¿Cómo resultó?" — reemplaza el bottom sheet.
// Backdrop oscuro con blur, escala + fade al abrir.

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { suggestNextDate } from '@/lib/tasks'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { TaskLead } from './TaskItem'

type TaskRow    = Database['public']['Tables']['tasks']['Row']
export type OutcomeVal = 'interested' | 'no_response' | 'not_interested'

interface TaskCompleteSheetProps {
  isOpen:      boolean
  task:        TaskRow | null
  lead?:       TaskLead
  agencyName?: string
  onClose:     () => void
  onConfirm:   (outcome: OutcomeVal, nextDate: Date) => void
}

// ── Helpers de fecha ──────────────────────────────────────────────────────

function toInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromInputValue(val: string): Date {
  const [y, m, d] = val.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

// ── Opciones de outcome ───────────────────────────────────────────────────

const OPTIONS: { value: OutcomeVal; emoji: string; label: string }[] = [
  { value: 'interested',     emoji: '😊', label: 'Interesado'    },
  { value: 'no_response',    emoji: '📵', label: 'No respondió'  },
  { value: 'not_interested', emoji: '👎', label: 'No interesado' },
]

// ── Componente ─────────────────────────────────────────────────────────────

export function TaskCompleteSheet({
  isOpen,
  task,
  lead,
  agencyName = 'Kohan & Campos',
  onClose,
  onConfirm,
}: TaskCompleteSheetProps) {
  const { openWhatsApp, getTemplate } = useWhatsApp()

  const [outcome, setOutcome] = useState<OutcomeVal | null>(null)
  const [dateVal, setDateVal] = useState('')
  const [visible, setVisible] = useState(false)

  // Resetear estado al abrir + animación
  useEffect(() => {
    if (isOpen) {
      setOutcome(null)
      setDateVal(toInputValue(suggestNextDate(null)))
      // pequeño delay para que la animación de entrada se vea
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [isOpen])

  // Actualizar fecha sugerida al elegir resultado
  function handleOutcome(val: OutcomeVal) {
    setOutcome(val)
    setDateVal(toInputValue(suggestNextDate(val)))
  }

  function handleConfirm(withWhatsApp: boolean) {
    if (!outcome || !task) return
    const nextDate = fromInputValue(dateVal)
    onConfirm(outcome, nextDate)
    if (withWhatsApp && lead?.phone) {
      const msg = getTemplate(task.title, {
        leadName:     lead.full_name,
        agencyName,
        taskPriority: task.priority,
      })
      openWhatsApp(lead.phone, msg)
    }
    onClose()
  }

  if (!isOpen || !task) return null

  const canConfirm = !!outcome && !!dateVal
  const hasPhone   = task.context === 'lead' && !!lead?.phone

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      {/* Panel centrado */}
      <div
        className="w-full max-w-sm flex flex-col gap-4 rounded-2xl p-5"
        style={{
          background: 'var(--card)',
          boxShadow: '0 32px 72px rgba(0,0,0,0.5)',
          transform: visible ? 'scale(1)' : 'scale(0.93)',
          opacity:   visible ? 1 : 0,
          transition: 'transform 0.18s ease-out, opacity 0.18s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">¿Cómo resultó?</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Opciones de resultado */}
        <div className="flex flex-col gap-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleOutcome(opt.value)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                outcome === opt.value
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-border/60 hover:text-foreground'
              )}
            >
              <span className="text-lg leading-none">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* 2. Fecha próximo seguimiento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Próximo seguimiento
          </label>
          <input
            type="date"
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
            min={toInputValue(new Date())}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* 3. Botones */}
        <div className="flex flex-col gap-2">
          {hasPhone && (
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => handleConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: canConfirm ? '#397746' : '#397746' }}
            >
              <MessageCircle className="w-4 h-4" />
              Confirmar + WhatsApp
            </button>
          )}
          <Button
            variant="outline"
            disabled={!canConfirm}
            onClick={() => handleConfirm(false)}
            className="w-full py-2.5"
          >
            Confirmar
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
            Cancelar
          </Button>
        </div>

      </div>
    </div>
  )
}
