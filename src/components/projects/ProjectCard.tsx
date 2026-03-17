// src/components/projects/ProjectCard.tsx
import { useState } from 'react'
import { Pencil, Trash2, Images, LayoutGrid, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectPhotosSheet } from './ProjectPhotosSheet'
import { FinancingPlansSheet } from './FinancingPlansSheet'
import { TypologiesSheet } from '@/components/typologies/TypologiesSheet'
import { linkIcon, linkColor } from './ProjectForm'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const STATUS_LABELS: Record<ProjectRow['status'], string> = {
  en_pozo: 'En pozo',
  en_construccion: 'En construcción',
  entregado: 'Entregado',
}

const STATUS_VARIANTS: Record<ProjectRow['status'], 'default' | 'secondary' | 'outline'> = {
  en_pozo: 'default',
  en_construccion: 'secondary',
  entregado: 'outline',
}

interface ProjectCardProps {
  project: ProjectRow
  onEdit: (project: ProjectRow) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [photosOpen,    setPhotosOpen]    = useState(false)
  const [financingOpen, setFinancingOpen] = useState(false)
  const [typologiesOpen, setTypologiesOpen] = useState(false)

  const links = (project.links ?? []) as Array<{ type: string; name: string; url: string }>

  function handleDelete() {
    if (!confirm(`¿Eliminar "${project.name}"? Esta acción no se puede deshacer.`)) return
    onDelete(project.id)
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold truncate">{project.name}</p>
            {project.location && (
              <p className="text-sm text-muted-foreground truncate">{project.location}</p>
            )}
          </div>
          <Badge variant={STATUS_VARIANTS[project.status]} className="flex-shrink-0 text-xs">
            {STATUS_LABELS[project.status]}
          </Badge>
        </div>

        {project.developer_name && (
          <p className="text-xs text-muted-foreground">
            Desarrolladora: <span className="text-foreground font-medium">{project.developer_name}</span>
          </p>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {links.filter((l) => l.url).map((link, i) => {
              const Icon  = linkIcon(link.type)
              const color = linkColor(link.type)
              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 hover:shadow-sm"
                  style={{
                    borderColor: color + '40',
                    backgroundColor: color + '0f',
                    color,
                  }}
                >
                  <Icon className="h-3 w-3" />
                  {link.name}
                </a>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onEdit(project)}>
            <Pencil className="h-3 w-3 mr-1" />Editar
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setTypologiesOpen(true)}>
            <LayoutGrid className="h-3 w-3 mr-1" />Tipolog.
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setPhotosOpen(true)}>
            <Images className="h-3 w-3 mr-1" />Fotos
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setFinancingOpen(true)}>
            <DollarSign className="h-3 w-3 mr-1" />Financ.
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-xs text-destructive hover:text-destructive ml-auto"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ProjectPhotosSheet projectId={project.id} projectName={project.name} open={photosOpen} onOpenChange={setPhotosOpen} />
      <FinancingPlansSheet projectId={project.id} projectName={project.name} open={financingOpen} onOpenChange={setFinancingOpen} />
      <TypologiesSheet projectId={project.id} projectName={project.name} open={typologiesOpen} onOpenChange={setTypologiesOpen} />
    </>
  )
}
