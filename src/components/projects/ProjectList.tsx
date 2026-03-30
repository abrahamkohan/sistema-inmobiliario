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
}: ProjectListProps) {

  const locations  = [...new Set(projects.map(p => p.location).filter(Boolean))]       as string[]
  const developers = [...new Set(projects.map(p => p.developer_name).filter(Boolean))] as string[]

  // Agrupar por developer_name (proyectos sin developer van a "Sin desarrolladora")
  const grouped = projects.reduce<Record<string, ProjectRow[]>>((acc, p) => {
    const key = p.developer_name ?? 'Sin desarrolladora'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'Sin desarrolladora') return 1
    if (b === 'Sin desarrolladora') return -1
    return a.localeCompare(b)
  })

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

      {/* Mobile: cards agrupadas por desarrolladora */}
      <div className="block md:hidden">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No se encontraron proyectos.</p>
        )}
        {groupKeys.map((developer, gi) => (
          <div key={developer} className={gi > 0 ? 'mt-6' : ''}>
            {/* Encabezado de grupo */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{developer}</span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{grouped[developer].length}</span>
            </div>
            {/* Grid 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              {grouped[developer].map(project => (
                <ProjectCardMobile key={project.id} project={project} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <ProjectTableDesktop projects={projects} onDelete={onDelete} />
      </div>

    </div>
  )
}
