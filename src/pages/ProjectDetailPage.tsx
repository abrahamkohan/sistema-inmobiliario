// src/pages/ProjectDetailPage.tsx
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, Pencil, MapPin, Building2, Calendar, DollarSign, FileText, Map, Video, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useProject, useUpdateProject } from '@/hooks/useProjects'
import { WhatsAppShareButton } from '@/components/whatsapp/WhatsAppShareButton'

const APP_URL = (
  import.meta.env.DEV
    ? window.location.origin
    : ((import.meta.env.VITE_APP_URL as string) || window.location.origin)
).replace(/\/$/, '')

const STATUS_LABEL: Record<string, string> = {
  en_pozo:          'En pozo',
  en_construccion:  'En construcción',
  entregado:        'Entregado',
}

const STATUS_CLS: Record<string, string> = {
  en_pozo:         'bg-amber-100 text-amber-700',
  en_construccion: 'bg-blue-100 text-blue-700',
  entregado:       'bg-emerald-100 text-emerald-700',
}

const BADGE_LABEL: Record<string, string> = {
  oportunidad: 'Oportunidad',
  estable:     'Estable',
  a_evaluar:   'A evaluar',
}

const BADGE_CLS: Record<string, string> = {
  oportunidad: 'bg-emerald-100 text-emerald-700',
  estable:     'bg-gray-100 text-gray-600',
  a_evaluar:   'bg-amber-100 text-amber-700',
}

function fmtPrice(amount: number, moneda: string) {
  return `${moneda} ${amount.toLocaleString('es-PY')}`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(id!)
  const updateProject = useUpdateProject()

  function togglePublicado() {
    if (!project) return
    updateProject.mutate({ id: project.id, input: { publicado_en_web: !project.publicado_en_web } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
      </div>
    )
  }

  const fullLocation = [project.direccion, project.barrio, project.ciudad].filter(Boolean).join(', ')

  const resourceContext = [
    STATUS_LABEL[project.status] ?? project.status,
    project.ciudad,
    project.precio_desde != null ? `desde ${fmtPrice(project.precio_desde, project.moneda)}` : null,
  ].filter(Boolean).join(' · ')

  function handleCopiarLink() {
    const url = `${APP_URL}/proyecto/${id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copiado')
    }).catch(() => {
      toast.error('No se pudo copiar el link')
    })
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">

      {/* ── Contenido ── */}
      <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 max-w-[940px] mx-auto w-full">

        {/* ── Nav bar — mismo patrón que PropiedadDetallePage ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate('/proyectos')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Proyectos
          </button>
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-3">
            {project.publicado_en_web && (
              <>
                <a
                  href={`${APP_URL}/proyecto/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver landing
                </a>
                <button
                  onClick={handleCopiarLink}
                  className="flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar link
                </button>
                <a
                  href={`${APP_URL}/proyecto/${id}/ficha`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ficha PDF
                </a>
              </>
            )}
            <WhatsAppShareButton
              resourceTitle={project.name}
              resourceUrl={`${APP_URL}/proyecto/${id}`}
              resourceContext={resourceContext}
            />
            <button
              onClick={() => navigate(`/proyectos/${project.id}/editar`)}
              className="flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button onClick={togglePublicado} className="flex items-center gap-1.5 sm:gap-2.5 group">
              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                {project.publicado_en_web ? 'Publicado' : <><span className="sm:hidden">No pub.</span><span className="hidden sm:inline">No publicado</span></>}
              </span>
              <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                project.publicado_en_web ? 'bg-emerald-500' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  project.publicado_en_web ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* ── Hero image — limpio, sin overlay ── */}
        <div className="w-full rounded-2xl overflow-hidden bg-gray-200" style={{ height: 240 }}>
          {project.hero_image_url ? (
            <img
              src={project.hero_image_url}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Building2 className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* ── Nombre + badges + desarrolladora ── */}
        <div>
          {/* Badges arriba del título */}
          {(project.status || project.badge_analisis) && (
            <div className="flex gap-1.5 mb-2">
              {project.status && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              )}
              {project.badge_analisis && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${BADGE_CLS[project.badge_analisis] ?? 'bg-gray-100 text-gray-600'}`}>
                  {BADGE_LABEL[project.badge_analisis] ?? project.badge_analisis}
                </span>
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.name}</h1>
          {project.developer_name && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">{project.developer_name}</span>
            </div>
          )}
        </div>

        {/* Ficha técnica */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">

          {/* Ubicación */}
          {(project.location || fullLocation) && (
            <div className="px-4 py-3 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Ubicación</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{project.location ?? ''}</p>
                {fullLocation && fullLocation !== project.location && (
                  <p className="text-xs text-gray-400 mt-0.5">{fullLocation}</p>
                )}
              </div>
            </div>
          )}

          {/* Entrega */}
          {project.delivery_date && (
            <div className="px-4 py-3 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Entrega</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{fmtDate(project.delivery_date)}</p>
              </div>
            </div>
          )}

          {/* Precio */}
          {project.precio_desde && (
            <div className="px-4 py-3 flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Precio desde</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {fmtPrice(project.precio_desde, project.moneda)}
                  {project.precio_hasta && (
                    <span className="font-normal text-gray-500"> · hasta {fmtPrice(project.precio_hasta, project.moneda)}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Descripción */}
        {project.description && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Descripción</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.description}</p>
          </div>
        )}

        {/* Highlights */}
        {project.highlights && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Destacados</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.highlights}</p>
          </div>
        )}

        {/* Características */}
        {project.caracteristicas && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Características</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.caracteristicas}</p>
          </div>
        )}

        {/* Links */}
        {(project.drive_folder_url || project.brochure_url || project.maps_url || project.tour_360_url) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex flex-wrap gap-2">
            {project.drive_folder_url && (
              <a href={project.drive_folder_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" />
                Carpeta de Venta
              </a>
            )}
            {project.brochure_url && (
              <a href={project.brochure_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" />
                Brochure PDF
              </a>
            )}
            {project.maps_url && (
              <a href={project.maps_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold">
                <Map className="w-3.5 h-3.5" />
                Google Maps
              </a>
            )}
            {project.tour_360_url && (
              <a href={project.tour_360_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-purple-50 text-purple-600 text-xs font-semibold">
                <Video className="w-3.5 h-3.5" />
                Tour 360°
              </a>
            )}
          </div>
        )}

        {/* Botón editar — al pie */}
        <button
          onClick={() => navigate(`/proyectos/${project.id}/editar`)}
          className="w-full h-12 rounded-2xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 mt-2"
        >
          <Pencil className="w-4 h-4" />
          Editar proyecto
        </button>
      </div>
    </div>
  )
}
