// src/components/typologies/TypologiesSheet.tsx
import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { TypologyForm, typologyFormToInsert, type TypologyFormValues } from './TypologyForm'
import { TypologyCard } from './TypologyCard'
import { useTypologies, useCreateTypology, useUpdateTypology, useDeleteTypology } from '@/hooks/useTypologies'
import { uploadFloorPlan, uploadTypologyImage, deleteStorageFile } from '@/lib/storage'
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
  const [showCreate, setShowCreate] = useState(false)
  const createFormRef = useRef<HTMLDivElement>(null)

  function openCreate() {
    setEditing(null)
    setShowCreate(true)
    setTimeout(() => createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function openEdit(typology: TypologyRow) {
    setEditing(typology)
    setShowCreate(false)
  }

  function cancelEdit() {
    setEditing(null)
    setShowCreate(false)
  }

  function handleDelete(typology: TypologyRow) {
    if (!confirm(`¿Eliminar "${typology.name}"? Esta acción no se puede deshacer.`)) return
    deleteTypology.mutate(typology.id)
    if (typology.floor_plan_path) {
      deleteStorageFile(typology.floor_plan_path).catch(() => null)
    }
  }

  async function handleSubmit(
    values: TypologyFormValues,
    floorPlanFile: File | null,
    newImageFiles: File[],
    keptImages: string[]
  ) {
    console.log('[TypologiesSheet] handleSubmit called, editing:', editing?.id, 'values:', values)
    try {
      let floorPlanPath: string | null | undefined = undefined
      if (floorPlanFile) {
        floorPlanPath = await uploadFloorPlan(projectId, floorPlanFile)
      }

      const typologyId = editing?.id ?? crypto.randomUUID()
      const uploadedImages = await Promise.all(
        newImageFiles.map(file => uploadTypologyImage(projectId, typologyId, file))
      )
      const images = [...keptImages, ...uploadedImages]

      if (editing) {
        const input = typologyFormToInsert(projectId, values, floorPlanPath, images, editing.floor_plan ?? editing.floor_plan_path)
        await updateTypology.mutateAsync({ id: editing.id, input })
      } else {
        const input = typologyFormToInsert(projectId, values, floorPlanPath ?? null, images)
        await createTypology.mutateAsync({ ...input, id: typologyId } as typeof input)
      }

      toast.success(editing ? 'Tipología actualizada' : 'Tipología creada')
      cancelEdit()
    } catch (err) {
      console.error('[TypologiesSheet] handleSubmit error:', err)
      toast.error('Error al guardar la tipología. Revisá los datos e intentá nuevamente.')
    }
  }

  const isMutating = createTypology.isPending || updateTypology.isPending

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={`Tipologías — ${projectName}`}>
      <div className="flex flex-col gap-4">

        {/* Botón agregar — siempre visible (salvo que ya esté abierto el create) */}
        {!showCreate && !editing && (
          <Button variant="outline" size="sm" onClick={openCreate} className="w-full">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Agregar tipología
          </Button>
        )}

        {/* Formulario de CREAR — aparece arriba */}
        {showCreate && (
          <div ref={createFormRef} className="border rounded-lg p-4">
            <p className="text-sm font-medium mb-3">Nueva tipología</p>
            <TypologyForm
              key="new"
              onSubmit={handleSubmit}
              onCancel={cancelEdit}
              isSubmitting={isMutating}
            />
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
        )}

        {!isLoading && typologies.length === 0 && !showCreate && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay tipologías todavía.
          </p>
        )}

        {/* Cards — la que está siendo editada se reemplaza por el form inline */}
        {typologies.map((typology) => (
          editing?.id === typology.id ? (
            <div key={typology.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
              <p className="text-sm font-medium mb-3 text-blue-700">Editando: {typology.name}</p>
              <TypologyForm
                key={typology.id}
                defaultValues={typology}
                onSubmit={handleSubmit}
                onCancel={cancelEdit}
                isSubmitting={isMutating}
              />
            </div>
          ) : (
            <TypologyCard
              key={typology.id}
              typology={typology}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )
        ))}

      </div>
    </Modal>
  )
}
