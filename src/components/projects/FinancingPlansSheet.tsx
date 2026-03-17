// src/components/projects/FinancingPlansSheet.tsx
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { FinancingPlanForm, type PlanFormValues } from './FinancingPlanForm'
import {
  useFinancingPlans,
  useCreateFinancingPlan,
  useUpdateFinancingPlan,
  useDeleteFinancingPlan,
} from '@/hooks/useFinancingPlans'
import type { Database } from '@/types/database'

type PlanRow = Database['public']['Tables']['financing_plans']['Row']

interface FinancingPlansSheetProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinancingPlansSheet({
  projectId,
  projectName,
  open,
  onOpenChange,
}: FinancingPlansSheetProps) {
  const { data: plans = [], isLoading } = useFinancingPlans(projectId)
  const createPlan = useCreateFinancingPlan(projectId)
  const updatePlan = useUpdateFinancingPlan(projectId)
  const deletePlan = useDeleteFinancingPlan(projectId)

  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(plan: PlanRow) {
    setEditing(plan)
    setShowForm(true)
  }

  function handleDelete(plan: PlanRow) {
    if (!confirm(`¿Eliminar el plan "${plan.name}"?`)) return
    deletePlan.mutate(plan.id)
  }

  async function handleSubmit(values: PlanFormValues) {
    const payload = {
      project_id: projectId,
      name: values.name,
      anticipo_pct: values.anticipo_pct,
      cuotas: values.cuotas,
      tasa_interes_pct: values.tasa_interes_pct ?? null,
      pago_final_pct: values.pago_final_pct ?? null,
      notas: values.notas ?? null,
    }
    if (editing) {
      await updatePlan.mutateAsync({ id: editing.id, input: payload })
    } else {
      await createPlan.mutateAsync(payload)
    }
    toast.success(editing ? 'Guardado' : 'Plan creado')
    setShowForm(false)
    setEditing(null)
  }

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={`Financiación — ${projectName}`}>
        <div className="flex flex-col gap-4">
          {!showForm && (
            <Button variant="outline" size="sm" onClick={openCreate} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar plan
            </Button>
          )}

          {showForm && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium mb-3">
                {editing ? 'Editar plan' : 'Nuevo plan'}
              </p>
              <FinancingPlanForm
                key={editing?.id ?? 'new'}
                defaultValues={editing ?? undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditing(null) }}
                isSubmitting={createPlan.isPending || updatePlan.isPending}
              />
            </div>
          )}

          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          )}

          {!isLoading && plans.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay planes de financiación todavía.
            </p>
          )}

          {plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{plan.name}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(plan)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>Anticipo: <strong className="text-foreground">{plan.anticipo_pct}%</strong></span>
                <span>Cuotas: <strong className="text-foreground">{plan.cuotas}</strong></span>
                {plan.tasa_interes_pct != null && (
                  <span>Tasa: <strong className="text-foreground">{plan.tasa_interes_pct}%</strong></span>
                )}
                {plan.pago_final_pct != null && (
                  <span>Pago final: <strong className="text-foreground">{plan.pago_final_pct}%</strong></span>
                )}
              </div>
              {plan.notas && (
                <p className="text-xs text-muted-foreground">{plan.notas}</p>
              )}
            </div>
          ))}
        </div>
    </Modal>
  )
}
