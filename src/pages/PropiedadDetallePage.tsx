import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Bed, Bath, Maximize2, MapPin, ExternalLink, Globe, GlobeLock, MessageCircle, Edit } from 'lucide-react'
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

  // All photo URLs (cover first if not already in photos)
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

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

  const infoChips = [
    property.tipo && (TIPO_LABEL[property.tipo] ?? property.tipo),
    property.dormitorios != null && `${property.dormitorios} dorm`,
    property.banos != null && `${property.banos} baño${property.banos !== 1 ? 's' : ''}`,
    property.superficie_m2 != null && `${property.superficie_m2} m²`,
  ].filter(Boolean)

  const detalles = [
    property.garajes != null && { label: 'Garajes', value: String(property.garajes) },
    property.piso != null && { label: 'Piso', value: String(property.piso) },
    property.condicion && { label: 'Estado', value: CONDICION_LABEL[property.condicion] ?? property.condicion },
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
      <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 md:py-6 flex flex-col gap-5">

        {/* Breadcrumb / back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/propiedades')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Propiedades
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePublicado}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                property.publicado_en_web
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {property.publicado_en_web
                ? <><Globe className="w-3.5 h-3.5" /> Publicado en web</>
                : <><GlobeLock className="w-3.5 h-3.5" /> No publicado</>}
            </button>
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed"
            >
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {OP_LABEL[property.operacion] ?? property.operacion}
            </span>
            {property.estado === 'inactivo' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Inactivo</span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {property.zona && (
            <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />{property.zona}
              {property.direccion && `, ${property.direccion}`}
            </p>
          )}
        </div>

        {/* 1. GALERÍA */}
        {allPhotos.length > 0 ? (
          <PropertyPhotoMosaic photos={allPhotos} onPhotoClick={openLightbox} />
        ) : (
          <div className="h-56 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
            <span className="text-sm">Sin fotos</span>
          </div>
        )}
        {allPhotos.length > 0 && (
          <button
            onClick={() => openLightbox(0)}
            className="self-end text-sm text-gray-500 hover:text-gray-800 -mt-2 flex items-center gap-1"
          >
            Ver todas las fotos ({allPhotos.length})
          </button>
        )}

        {/* 2. INFO PRINCIPAL */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          {infoChips.map((chip, i) => (
            <span key={i} className="flex items-center gap-1">
              {i === 0 && <Bed className="w-4 h-4 opacity-0 hidden" />}
              {chip}
              {i < infoChips.length - 1 && <span className="ml-3 text-gray-300">·</span>}
            </span>
          ))}
          <span className="text-gray-400 text-xs ml-1">· publicado {timeAgo(property.created_at)}</span>
        </div>

        {/* Stats icons row */}
        <div className="flex items-center gap-4 text-sm text-gray-600 -mt-3">
          {property.dormitorios != null && (
            <span className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-gray-400" />{property.dormitorios} dorm
            </span>
          )}
          {property.banos != null && (
            <span className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-gray-400" />{property.banos} baño{property.banos !== 1 ? 's' : ''}
            </span>
          )}
          {property.superficie_m2 != null && (
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-gray-400" />{property.superficie_m2} m²
            </span>
          )}
        </div>

        {/* Precio */}
        {property.precio != null && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(property.precio, property.moneda)}
            </span>
            {property.superficie_m2 != null && property.superficie_m2 > 0 && (
              <span className="text-sm text-gray-400">
                {formatPrice(Math.round(property.precio / property.superficie_m2), property.moneda)}/m²
              </span>
            )}
          </div>
        )}

        {/* 3. DETALLES */}
        {detalles.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-gray-300 inline-block" />
              Detalles de la propiedad
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detalles.map(d => (
                <div key={d.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm">
                  <span className="text-gray-500">{d.label}</span>
                  <span className="font-medium text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. DESCRIPCIÓN */}
        {property.descripcion && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-gray-300 inline-block" />
              Descripción
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {property.descripcion}
            </div>
          </section>
        )}

        {/* 5. UBICACIÓN */}
        {(property.latitud && property.longitud) ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-gray-300 inline-block" />
                {property.zona ?? 'Ubicación'}
              </h2>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir en Maps
                </a>
              )}
            </div>
            <PropertyMap lat={property.latitud} lng={property.longitud} label={title} />
          </section>
        ) : property.zona ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-gray-300 inline-block" />
              Ubicación
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {property.zona}{property.direccion ? `, ${property.direccion}` : ''}
            </p>
          </section>
        ) : null}

        {/* 6. CONSULTAR */}
        <div className="pt-2 pb-4">
          <button
            onClick={handleConsultar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors"
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
