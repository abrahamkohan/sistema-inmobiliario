// src/pages/ProyectosPage.tsx
// Toda la lógica de datos, estado y filtros vive aquí.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/ProjectList'
import { type FilterState } from '@/components/projects/ProyectoFilters'
import { toast } from 'sonner'
import { useProjects, useDeleteProject } from '@/hooks/useProjects'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const EMPTY_FILTERS: FilterState = { status: '', location: '', developer: '' }

export function ProyectosPage() {
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()
  const deleteProject = useDeleteProject()

  const [search,  setSearch]  = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  const filteredProjects = (projects as ProjectRow[]).filter(p => {
    const q = search.toLowerCase()
    const matchSearch    = !q || p.name.toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q)
    const matchStatus    = !filters.status    || p.status         === filters.status
    const matchLocation  = !filters.location  || p.location       === filters.location
    const matchDeveloper = !filters.developer || p.developer_name === filters.developer
    return matchSearch && matchStatus && matchLocation && matchDeveloper
  })

  function handleDelete(id: string) {
    deleteProject.mutate(id, {
      onError: (err) => toast.error(`Error al eliminar: ${err instanceof Error ? err.message : String(err)}`),
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

      {!isLoading && projects.length > 0 && (
        <ProjectList
          projects={filteredProjects}
          search={search}
          filters={filters}
          onSearchChange={setSearch}
          onFilterChange={setFilters}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
