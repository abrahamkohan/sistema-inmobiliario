// src/components/projects/ProjectCardMobile.tsx
import { useNavigate } from 'react-router'
import { MapPin, Building2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateProject } from '@/hooks/useProjects'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const STATUS_LABEL: Record<string, string> = {
  en_pozo:         'En pozo',
  en_construccion: 'En construcción',
  entregado:       'Entregado',
}

const STATUS_CLS: Record<string, string> = {
  en_pozo:         'bg-amber-100 text-amber-700',
  en_construccion: 'bg-blue-100 text-blue-700',
  entregado:       'bg-emerald-100 text-emerald-700',
}

interface ProjectCardMobileProps {
  project: ProjectRow
}

export function ProjectCardMobile({ project }: ProjectCardMobileProps) {
  const navigate = useNavigate()
  const updateProject = useUpdateProject()

  function handleTogglePublicado(e: React.MouseEvent) {
    e.stopPropagation()
    updateProject.mutate(
      { id: project.id, input: { publicado_en_web: !project.publicado_en_web } },
      { onError: () => toast.error('No se pudo actualizar la publicación') }
    )
  }

  return (
    <div
      onClick={() => navigate(`/proyectos/${project.id}`)}
      className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
    >
      {/* Imagen de portada */}
      <div className="relative w-full bg-gray-100" style={{ height: 160 }}>
        {project.hero_image_url ? (
          <img
            src={project.hero_image_url}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {/* Gradient al pie de la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Badge de estado sobre la imagen */}
        {project.status && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 pt-3 pb-3 flex flex-col gap-1">
        <p className="text-sm font-bold text-gray-900 leading-tight">{project.name}</p>

        {project.location && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-1.5">
          {project.drive_folder_url ? (
            <a
              href={project.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D4AF37]"
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              Carpeta de Venta
            </a>
          ) : (
            <span />
          )}

          {/* Toggle publicado en web */}
          <button
            type="button"
            onClick={handleTogglePublicado}
            disabled={updateProject.isPending}
            title={project.publicado_en_web ? 'Publicado en web' : 'No publicado'}
            className="flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-[10px] text-gray-400">Web</span>
            <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
              project.publicado_en_web ? 'bg-emerald-500' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                project.publicado_en_web ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
