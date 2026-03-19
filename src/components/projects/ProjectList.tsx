// src/components/projects/ProjectList.tsx
import { ProjectCard } from './ProjectCard'
import type { Database } from '@/types/database'

type ProjectRow   = Database['public']['Tables']['projects']['Row']
type BadgeAnalisis = 'oportunidad' | 'estable' | 'a_evaluar'

interface ProjectListProps {
  projects: ProjectRow[]
  onDelete: (id: string) => void
  onTogglePublicado?: (id: string, value: boolean) => void
  onChangeBadge?: (id: string, value: BadgeAnalisis | null) => void
}

export function ProjectList({ projects, onDelete, onTogglePublicado, onChangeBadge }: ProjectListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={onDelete}
          onTogglePublicado={onTogglePublicado}
          onChangeBadge={onChangeBadge}
        />
      ))}
    </div>
  )
}
