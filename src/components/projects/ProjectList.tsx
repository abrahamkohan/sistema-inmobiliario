// src/components/projects/ProjectList.tsx
import { ProjectCardMobile }   from './ProjectCardMobile'
import { ProjectTableDesktop } from './ProjectTableDesktop'
import { ProyectoFilters, type FilterState } from './ProyectoFilters'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

interface ProjectListProps {
  projects:       ProjectRow[]
  search:         string
  filters:        FilterState
  onSearchChange: (value: string) => void
  onFilterChange: (filters: FilterState) => void
  onDelete:       (id: string) => void
  agencyPhone?:   string
}

export function ProjectList({
  projects,
  search,
  filters,
  onSearchChange,
  onFilterChange,
  onDelete,
  agencyPhone,
}: ProjectListProps) {

  const locations  = [...new Set(projects.map(p => p.location).filter(Boolean))]      as string[]
  const developers = [...new Set(projects.map(p => p.developer_name).filter(Boolean))] as string[]

  return (
    <div className="flex flex-col gap-4">

      {/* Buscador + filtros */}
      <ProyectoFilters
        search={search}
        filters={filters}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        locations={locations}
        developers={developers}
      />

      {/* Mobile: cards compactas */}
      <div className="block md:hidden space-y-3">
        {projects.map(project => (
          <ProjectCardMobile
            key={project.id}
            project={project}
            agencyPhone={agencyPhone}
          />
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No se encontraron proyectos.</p>
        )}
      </div>

      {/* Desktop: solo tabla */}
      <div className="hidden md:block">
        <ProjectTableDesktop projects={projects} onDelete={onDelete} />
      </div>

    </div>
  )
}
