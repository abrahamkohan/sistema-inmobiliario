// src/components/projects/ProjectCard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Pencil, Trash2, Images, LayoutGrid, DollarSign, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectPhotosSheet } from './ProjectPhotosSheet'
import { FinancingPlansSheet } from './FinancingPlansSheet'
import { TypologiesSheet } from '@/components/typologies/TypologiesSheet'
import { linkIcon, linkColor } from './ProjectForm'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type BadgeAnalisis = 'oportunidad' | 'estable' | 'a_evaluar'

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

const BADGE_OPTIONS: { value: BadgeAnalisis; label: string; cls: string }[] = [
  { value: 'oportunidad', label: 'Oportunidad', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'estable',     label: 'Estable',     cls: 'bg-blue-100  text-blue-700  border-blue-200'  },
  { value: 'a_evaluar',  label: 'A evaluar',   cls: 'bg-gray-100  text-gray-600  border-gray-200'  },
]

interface ProjectCardProps {
  project: ProjectRow
  onDelete: (id: string) => void
  onTogglePublicado?: (id: string, value: boolean) => void
  onChangeBadge?: (id: string, value: BadgeAnalisis | null) => void
}

export function ProjectCard({ project, onDelete, onTogglePublicado, onChangeBadge }: ProjectCardProps) {
  const navigate = useNavigate()
  const [photosOpen,    setPhotosOpen]    = useState(false)
  const [financingOpen, setFinancingOpen] = useState(false)
  const [typologiesOpen, setTypologiesOpen] = useState(false)

  const links     = (project.links ?? []) as Array<{ type: string; name: string; url: string }>
  const publicado = project.publicado_en_web ?? false
  const badge     = project.badge_analisis as BadgeAnalisis | null
  const badgeCfg  = BADGE_OPTIONS.find(b => b.value === badge)

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

        {/* Publicación web */}
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <Globe className={`h-3.5 w-3.5 ${publicado ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium">
              {publicado ? 'Publicado en web' : 'No publicado'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onTogglePublicado?.(project.id, !publicado)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none ${
              publicado ? 'bg-emerald-500' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              publicado ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`} />
          </button>
        </div>

        {/* Badge análisis — solo si publicado */}
        {publicado && (
          <div className="flex flex-wrap gap-1.5">
            {BADGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeBadge?.(project.id, badge === opt.value ? null : opt.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  badge === opt.value ? opt.cls : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {badge && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeCfg?.cls}`}>
                ✓ {badgeCfg?.label}
              </span>
            )}
          </div>
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
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/proyectos/${project.id}/editar`)}>
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
