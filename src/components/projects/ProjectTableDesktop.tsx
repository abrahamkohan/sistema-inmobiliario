// src/components/projects/ProjectTableDesktop.tsx
// Tabla desktop-only. Solo recibe datos por props — sin fetches.
import { useNavigate } from 'react-router'
import { Trash2, Pencil, FileText } from 'lucide-react'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

interface ProjectTableDesktopProps {
  projects: ProjectRow[]
  onDelete: (id: string) => void
}

export function ProjectTableDesktop({ projects, onDelete }: ProjectTableDesktopProps) {
  const navigate = useNavigate()

  function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    onDelete(id)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-semibold text-foreground">Proyecto</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Desarrolladora</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Recursos de Venta</th>
            <th className="px-4 py-3 w-20" />
          </tr>
        </thead>
        <tbody>
          {projects.map((project, i) => (
            <tr
              key={project.id}
              onClick={() => navigate(`/proyectos/${project.id}/editar`)}
              className={`border-b border-border/40 cursor-pointer hover:bg-muted/30 transition-colors ${
                i % 2 !== 0 ? 'bg-muted/10' : ''
              }`}
            >
              {/* Proyecto: nombre + zona */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground leading-tight">{project.name}</span>
                  {project.location && (
                    <span className="text-xs text-muted-foreground">{project.location}</span>
                  )}
                </div>
              </td>

              {/* Desarrolladora */}
              <td className="px-4 py-3 text-muted-foreground">
                {project.developer_name ?? <span className="text-muted-foreground/40">—</span>}
              </td>

              {/* Recursos de Venta */}
              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                {project.brochure_url ? (
                  <a
                    href={project.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4AF37] hover:underline"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    📄 Carpeta de Venta
                    <span className="block text-xs font-normal text-muted-foreground">Brochure · Precios</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground/40 text-xs">Sin recursos</span>
                )}
              </td>

              {/* Acciones */}
              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/proyectos/${project.id}/editar`)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => handleDelete(e, project.id, project.name)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {projects.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">
                No se encontraron proyectos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
