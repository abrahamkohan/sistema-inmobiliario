// src/pages/ProyectosPage.tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ProjectList } from '@/components/projects/ProjectList'
import { ProjectForm, type ProjectFormValues } from '@/components/projects/ProjectForm'
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/useProjects'
import { uploadProjectBrochure } from '@/lib/storage'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

export function ProyectosPage() {
  const { data: projects = [], isLoading } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(project: ProjectRow) {
    setEditing(project)
    setSheetOpen(true)
  }

  function handleDelete(id: string) {
    deleteProject.mutate(id)
  }

  async function handleSubmit(values: ProjectFormValues, brochureFile: File | null) {
    let brochurePath: string | null = editing?.brochure_path ?? null

    const payload = {
      name: values.name,
      description: values.description ?? null,
      location: values.location ?? null,
      status: values.status,
      delivery_date: values.delivery_date ?? null,
      developer_name: values.developer_name ?? null,
      amenities: values.amenities,
      usd_to_pyg_rate: values.usd_to_pyg_rate ?? null,
    }

    if (editing) {
      // Upload brochure if new file selected
      if (brochureFile) {
        brochurePath = await uploadProjectBrochure(editing.id, brochureFile)
      }
      await updateProject.mutateAsync({
        id: editing.id,
        input: { ...payload, brochure_path: brochurePath },
      })
    } else {
      const created = await createProject.mutateAsync(payload)
      if (brochureFile) {
        brochurePath = await uploadProjectBrochure(created.id, brochureFile)
        await updateProject.mutateAsync({
          id: created.id,
          input: { brochure_path: brochurePath },
        })
      }
    }

    setSheetOpen(false)
    setEditing(null)
  }

  const isPending = createProject.isPending || updateProject.isPending

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuevo proyecto
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando proyectos...</p>
      )}

      {!isLoading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-muted-foreground">No hay proyectos todavía.</p>
          <Button variant="outline" onClick={openCreate}>Crear el primero</Button>
        </div>
      )}

      {projects.length > 0 && (
        <ProjectList
          projects={projects}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}>
        <ProjectForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setSheetOpen(false)}
          isSubmitting={isPending}
        />
      </Modal>
    </div>
  )
}
