// src/components/typologies/TypologiesSheet.tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TypologyForm, typologyFormToInsert, type TypologyFormValues } from './TypologyForm'
import { TypologyCard } from './TypologyCard'
import { useTypologies, useCreateTypology, useUpdateTypology, useDeleteTypology } from '@/hooks/useTypologies'
import { uploadFloorPlan, deleteStorageFile } from '@/lib/storage'
import type { Database } from '@/types/database'

type TypologyRow = Database['public']['Tables']['typologies']['Row']

interface TypologiesSheetProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TypologiesSheet({
  projectId,
  projectName,
  open,
  onOpenChange,
}: TypologiesSheetProps) {
  const { data: typologies = [], isLoading } = useTypologies(projectId)
  const createTypology = useCreateTypology(projectId)
  const updateTypology = useUpdateTypology(projectId)
  const deleteTypology = useDeleteTypology(projectId)

  const [editing, setEditing] = useState<TypologyRow | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(typology: TypologyRow) {
    setEditing(typology)
    setShowForm(true)
  }

  function handleDelete(typology: TypologyRow) {
    if (!confirm(`¿Eliminar "${typology.name}"? Esta acción no se puede deshacer.`)) return
    deleteTypology.mutate(typology.id)
    if (typology.floor_plan_path) {
      deleteStorageFile(typology.floor_plan_path).catch(() => null)
    }
  }

  async function handleSubmit(values: TypologyFormValues, floorPlanFile: File | null) {
    let floorPlanPath: string | null | undefined = undefined

    if (floorPlanFile) {
      floorPlanPath = await uploadFloorPlan(projectId, floorPlanFile)
    }

    if (editing) {
      const input = typologyFormToInsert(projectId, values, floorPlanPath, editing.floor_plan_path)
      await updateTypology.mutateAsync({ id: editing.id, input })
    } else {
      const input = typologyFormToInsert(projectId, values, floorPlanPath ?? null)
      await createTypology.mutateAsync(input)
    }

    setShowForm(false)
    setEditing(null)
  }

  const isMutating = createTypology.isPending || updateTypology.isPending

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={`Tipologías — ${projectName}`}>
        <div className="flex flex-col gap-4">
          {!showForm && (
            <Button variant="outline" size="sm" onClick={openCreate} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar tipología
            </Button>
          )}

          {showForm && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium mb-3">
                {editing ? 'Editar tipología' : 'Nueva tipología'}
              </p>
              <TypologyForm
                key={editing?.id ?? 'new'}
                defaultValues={editing ?? undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditing(null) }}
                isSubmitting={isMutating}
              />
            </div>
          )}

          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          )}

          {!isLoading && typologies.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay tipologías todavía.
            </p>
          )}

          {typologies.map((typology) => (
            <TypologyCard
              key={typology.id}
              typology={typology}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
    </Modal>
  )
}
