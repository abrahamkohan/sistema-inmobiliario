import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Bed, Bath, Maximize2, MapPin, ExternalLink, MessageCircle, Edit, Calendar } from 'lucide-react'
import { useProperty, usePropertyPhotos, useUpdateProperty } from '@/hooks/useProperties'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { getPhotoUrl, formatPrice, timeAgo } from '@/lib/properties'
import { PropertyLightbox, PropertyPhotoMosaic } from '@/components/properties/PropertyGallery'
import { PropertyMap } from '@/components/properties/PropertyMap'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
}

const OP_LABEL: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
}

const CONDICION_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  usado: 'Usado',
  reventa: 'Reventa',
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{children}</p>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function PropiedadDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(id!)
  const { data: photos = [] } = usePropertyPhotos(id!)
  const { data: consultora } = useConsultoraConfig()
  const updateProperty = useUpdateProperty()

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const photoUrls = photos.map(p => getPhotoUrl(p.storage_path))
  const coverUrl = property?.foto_portada
    ? getPhotoUrl(property.foto_portada)
    : photoUrls[0] ?? null
  const allPhotos = coverUrl && photoUrls.length === 0 ? [coverUrl] : photoUrls

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  function handleConsultar() {
    if (!property) return
    if (consultora?.whatsapp) {
      const title = property.titulo || `${TIPO_LABEL[property.tipo]} en ${property.zona}`
      const msg = encodeURIComponent(`Hola, me interesa la propiedad: ${title}`)
      window.open(`https://wa.me/${consultora.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
    }
  }

  function togglePublicado() {
    if (!property) return
    updateProperty.mutate({ id: property.id, input: { publicado_en_web: !property.publicado_en_web } })
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  // ── Not found ──
  if (!property) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Propiedad no encontrada</p>
        <button onClick={() => navigate('/propiedades')} className="mt-3 text-sm text-blue-600 hover:underline">
          Volver a propiedades
        </button>
      </div>
    )
  }

  const title = property.titulo ||
    `${TIPO_LABEL[property.tipo] ?? property.tipo} en ${property.zona ?? 'Sin ubicación'}`

  const statsChips = [
    property.dormitorios != null && {
      icon: <Bed className="w-4 h-4" />,
      label: property.dormitorios === 0 ? 'Monoambiente' : `${property.dormitorios} dorm`,
    },
    property.banos != null && {
      icon: <Bath className="w-4 h-4" />,
      label: `${property.banos} baño${property.banos !== 1 ? 's' : ''}`,
    },
    property.superficie_m2 != null && {
      icon: <Maximize2 className="w-4 h-4" />,
      label: `${property.superficie_m2} m²`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[]

  const detalles = [
    property.garajes != null && { label: 'Garajes', value: String(property.garajes) },
    property.piso != null && { label: 'Piso', value: String(property.piso) },
    property.condicion && { label: 'Condición', value: CONDICION_LABEL[property.condicion] ?? property.condicion },
    property.zona && { label: 'Zona', value: property.zona },
    property.deposito != null && { label: 'Depósito', value: property.deposito ? 'Sí' : 'No' },
    property.estacionamientos != null && { label: 'Estacionamientos', value: String(property.estacionamientos) },
    property.anio != null && { label: 'Año', value: String(property.anio) },
    property.superficie_cubierta_m2 != null && { label: 'Sup. cubierta', value: `${property.superficie_cubierta_m2} m²` },
    property.terreno_m2 != null && { label: 'Terreno', value: `${property.terreno_m2} m²` },
  ].filter(Boolean) as { label: string; value: string }[]

  const mapsUrl = property.latitud && property.longitud
    ? `https://www.openstreetmap.org/?mlat=${property.latitud}&mlon=${property.longitud}&zoom=16`
    : property.direccion
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(property.direccion)}`
      : null

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-4 md:px-6 md:py-6 flex flex-col gap-4">

        {/* ── Nav bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/propiedades')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Propiedades
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/propiedades/${id}/editar`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Editar
            </button>
          <button onClick={togglePublicado} className="flex items-center gap-2.5 group">
            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
              {property.publicado_en_web ? 'Publicado' : 'No publicado'}
            </span>
            <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
              property.publicado_en_web ? 'bg-emerald-500' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                property.publicado_en_web ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
          </button>
          </div>
        </div>

        {/* ── 1. Header card ── */}
        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-900 text-white">
              {OP_LABEL[property.operacion] ?? property.operacion}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {TIPO_LABEL[property.tipo] ?? property.tipo}
            </span>
            {property.estado === 'inactivo' && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600">Inactivo</span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 leading-snug">{title}</h1>
          {(property.zona || property.direccion) && (
            <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {[property.zona, property.direccion].filter(Boolean).join(', ')}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
            <Calendar className="w-3.5 h-3.5" />
            Publicado {timeAgo(property.created_at)}
          </div>
        </Card>

        {/* ── 2. Galería ── */}
        <Card className="p-3">
          {allPhotos.length > 0 ? (
            <>
              <PropertyPhotoMosaic photos={allPhotos} onPhotoClick={openLightbox} />
              <button
                onClick={() => openLightbox(0)}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-800 transition-colors py-1"
              >
                Ver todas las fotos ({allPhotos.length})
              </button>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              Sin fotos
            </div>
          )}
        </Card>

        {/* ── 3. Stats chips ── */}
        {statsChips.length > 0 && (
          <Card>
            <CardTitle>Características</CardTitle>
            <div className="flex flex-wrap gap-3">
              {statsChips.map((chip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-700"
                >
                  <span className="text-gray-400">{chip.icon}</span>
                  {chip.label}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 4. Precio ── */}
        {property.precio != null && (
          <Card>
            <CardTitle>Precio</CardTitle>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">
                {formatPrice(property.precio, property.moneda)}
              </span>
              {property.superficie_m2 != null && property.superficie_m2 > 0 && (
                <span className="text-sm text-gray-400">
                  {formatPrice(Math.round(property.precio / property.superficie_m2), property.moneda)}/m²
                </span>
              )}
            </div>
          </Card>
        )}

        {/* ── 5. Detalles ── */}
        {detalles.length > 0 && (
          <Card>
            <CardTitle>Detalles de la propiedad</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detalles.map(d => (
                <div
                  key={d.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm"
                >
                  <span className="text-gray-500">{d.label}</span>
                  <span className="font-medium text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 6. Descripción ── */}
        {property.descripcion && (
          <Card>
            <CardTitle>Descripción</CardTitle>
            <div className="text-sm text-gray-600 leading-7 whitespace-pre-line">
              {property.descripcion}
            </div>
          </Card>
        )}

        {/* ── 7. Ubicación ── */}
        {property.latitud && property.longitud ? (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ubicación{property.zona ? ` · ${property.zona}` : ''}
              </p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir en Maps
                </a>
              )}
            </div>
            <div className="rounded-xl overflow-hidden">
              <PropertyMap lat={property.latitud} lng={property.longitud} label={title} />
            </div>
          </Card>
        ) : property.zona ? (
          <Card>
            <CardTitle>Ubicación</CardTitle>
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {[property.zona, property.direccion].filter(Boolean).join(', ')}
            </p>
          </Card>
        ) : null}

        {/* ── 8. Consultar ── */}
        <div className="pb-4">
          <button
            onClick={handleConsultar}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Consultar por esta propiedad
          </button>
        </div>

      </div>

      {/* Lightbox */}
      <PropertyLightbox
        photos={allPhotos}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
