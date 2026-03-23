// src/components/projects/ProjectCardMobile.tsx
// Card compacta mobile-first. Solo recibe datos por props — sin fetches.
import { useNavigate } from 'react-router'
import { MessageCircle, MapPin, Building2, FileText } from 'lucide-react'
import { cleanDigits } from '@/lib/phone'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

interface ProjectCardMobileProps {
  project:      ProjectRow
  agencyPhone?: string   // número limpio, ej: "595981123456"
}

export function ProjectCardMobile({ project, agencyPhone }: ProjectCardMobileProps) {
  const navigate = useNavigate()

  function handleWhatsApp(e: React.MouseEvent) {
    e.stopPropagation()
    if (!agencyPhone) return
    const clean = cleanDigits(agencyPhone)
    const msg   = encodeURIComponent(
      `Hola! Me interesa el proyecto *${project.name}*${project.location ? ` en ${project.location}` : ''}. ¿Podés darme más información?`
    )
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] overflow-hidden active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/proyectos/${project.id}/editar`)}
    >
      {/* Cuerpo */}
      <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1">

        {/* Nombre */}
        <p className="text-sm font-bold text-gray-900 leading-tight">{project.name}</p>

        {/* Zona */}
        {project.location && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {/* Desarrolladora */}
        {project.developer_name && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.developer_name}</span>
          </div>
        )}

        {/* Carpeta de Venta */}
        {project.drive_folder_url && (
          <a
            href={project.drive_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            📄 Carpeta de Venta
            <span className="font-normal text-gray-400">· Brochure · Precios</span>
          </a>
        )}
      </div>

      {/* CTA WhatsApp */}
      {agencyPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: '#397746' }}
        >
          <MessageCircle className="w-4 h-4" />
          Consultar por WhatsApp
        </button>
      )}
    </div>
  )
}
