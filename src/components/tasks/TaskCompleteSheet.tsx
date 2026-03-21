// src/components/tasks/TaskCompleteSheet.tsx
// Mini bottom sheet "¿Cómo resultó?" + nueva fecha sugerida.

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { suggestNextDate } from '@/lib/tasks'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { TaskLead } from './TaskItem'

type TaskRow    = Database['public']['Tables']['tasks']['Row']
type OutcomeVal = 'interested' | 'no_response' | 'not_interested'

interface TaskCompleteSheetProps {
  isOpen:     boolean
  task:       TaskRow | null
  lead?:      TaskLead
  agencyName?: string
  onClose:    () => void
  onConfirm:  (outcome: OutcomeVal, nextDate: Date) => void
}

// ── Helpers de fecha ──────────────────────────────────────────────────────

function toInputValue(date: Date): string {
  // YYYY-MM-DD en hora local
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

  const [outcome,  setOutcome]  = useState<OutcomeVal | null>(null)
  const [dateVal,  setDateVal]  = useState('')

  // Resetear estado al abrir
  useEffect(() => {
    if (isOpen) {
      setOutcome(null)
      setDateVal(toInputValue(suggestNextDate(null)))
    }
  }, [isOpen])

  // Actualizar fecha sugerida al seleccionar outcome
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

  if (!task) return null

  const canConfirm  = !!outcome && !!dateVal
  const hasPhone    = task.context === 'lead' && !!lead?.phone

  return (
    <Sheet open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-safe"
      >
        {/* Handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-5" />

        <SheetHeader className="mb-5">
          <SheetTitle>¿Cómo resultó?</SheetTitle>
        </SheetHeader>

        {/* Opciones de outcome */}
        <div className="flex flex-col gap-2 mb-5">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleOutcome(opt.value)}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all text-left',
                outcome === opt.value
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'
              )}
            >
              <span className="text-xl leading-none">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Fecha próximo seguimiento */}
        <div className="flex flex-col gap-1.5 mb-6">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Próximo seguimiento
          </label>
          <input
            type="date"
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
            min={toInputValue(new Date())}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2">
          {hasPhone && (
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => handleConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: canConfirm ? '#25D366' : undefined }}
            >
              <MessageCircle className="w-4 h-4" />
              Confirmar + WhatsApp
            </button>
          )}
          <Button
            variant="outline"
            disabled={!canConfirm}
            onClick={() => handleConfirm(false)}
            className="w-full py-3"
          >
            Confirmar sin WhatsApp
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
