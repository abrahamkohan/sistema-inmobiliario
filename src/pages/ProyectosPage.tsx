// src/pages/ProyectosPage.tsx
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/ProjectList'
import { toast } from 'sonner'
import {
  useProjects,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/useProjects'

export function ProyectosPage() {
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  function handleDelete(id: string) {
    deleteProject.mutate(id, {
      onError: (err) => toast.error(`Error al eliminar: ${err instanceof Error ? err.message : String(err)}`),
    })
  }

  function handleTogglePublicado(id: string, value: boolean) {
    updateProject.mutate({ id, input: { publicado_en_web: value } }, {
      onError: (err) => toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`),
    })
  }

  function handleChangeBadge(id: string, value: 'oportunidad' | 'estable' | 'a_evaluar' | null) {
    updateProject.mutate({ id, input: { badge_analisis: value } }, {
      onError: (err) => toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`),
    })
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <Button size="sm" onClick={() => navigate('/proyectos/nueva')}>
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
          <Button variant="outline" onClick={() => navigate('/proyectos/nueva')}>Crear el primero</Button>
        </div>
      )}

      {projects.length > 0 && (
        <ProjectList
          projects={projects}
          onDelete={handleDelete}
          onTogglePublicado={handleTogglePublicado}
          onChangeBadge={handleChangeBadge}
        />
      )}
    </div>
  )
}
