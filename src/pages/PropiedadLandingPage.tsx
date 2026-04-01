// src/pages/PropiedadLandingPage.tsx
// Ruta pública: /p/:id — sin auth, sin AppShell
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Bed, Bath, Maximize2, MapPin, ExternalLink, MessageCircle, Car, Phone, Mail } from 'lucide-react'
import { getPublicProperty, getPublicPropertyPhotos, getConsultoraPublic } from '@/lib/publicData'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
import { PropertyLightbox, PropertyPhotoMosaic } from '@/components/properties/PropertyGallery'
import type { Database } from '@/types/database'

type PropertyRow   = Database['public']['Tables']['properties']['Row']
type PhotoRow      = Database['public']['Tables']['property_photos']['Row']
type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']

// ── Labels ────────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
}

const CONDICION_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  usado: 'Usado',
  reventa: 'Reventa',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="max-w-[940px] mx-auto px-4 pt-5 pb-8 flex flex-col gap-4">
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

// ── Not available ─────────────────────────────────────────────────────────────

function NotAvailable({ config }: { config: ConsultoraRow | null }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 bg-white border-b border-gray-100 px-5 flex items-center">
        {config?.logo_url ? (
          <img src={config.logo_url} alt={config.nombre} className="h-7 w-auto object-contain" />
        ) : (
          <span className="text-sm font-semibold text-gray-800">{config?.nombre ?? ''}</span>
        )}
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-5xl">🏠</div>
        <h1 className="text-xl font-semibold text-gray-800">Propiedad no disponible</h1>
        <p className="text-gray-500 text-sm max-w-xs">
          Esta propiedad no está publicada o el enlace es inválido.
        </p>
        {config?.nombre && (
          <p className="text-xs text-gray-400 mt-1">{config.nombre}</p>
        )}
      </div>
    </div>
  )
}

// ── CTA helpers ───────────────────────────────────────────────────────────────

function buildContactUrl(config: ConsultoraRow | null, title: string) {
  if (config?.whatsapp) {
    const num = config.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola, me interesa la propiedad: ${title}`)
    return { url: `https://wa.me/${num}?text=${msg}`, label: 'Consultar por WhatsApp', icon: 'whatsapp' as const }
  }
  if (config?.telefono) {
    return { url: `tel:${config.telefono}`, label: 'Llamar', icon: 'phone' as const }
  }
  if (config?.email) {
    return { url: `mailto:${config.email}`, label: 'Enviar email', icon: 'mail' as const }
  }
  return null
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PropiedadLandingPage() {
  const { id } = useParams<{ id: string }>()

  const [property, setProperty]         = useState<PropertyRow | null>(null)
  const [photos, setPhotos]             = useState<PhotoRow[]>([])
  const [config, setConfig]             = useState<ConsultoraRow | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }

    Promise.all([
      getPublicProperty(id),
      getPublicPropertyPhotos(id),
      getConsultoraPublic(),
    ])
      .then(([prop, photoRows, cfg]) => {
        setConfig(cfg)
        if (!prop) { setNotFound(true); return }
        setProperty(prop)
        setPhotos(photoRows)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading)  return <LoadingSkeleton />
  if (notFound) return <NotAvailable config={config} />

  // ── Data derived ─────────────────────────────────────────────────────────────

  const p = property!

  const photoUrls = photos.map(ph => getPhotoUrl(ph.storage_path))
  const coverUrl  = p.foto_portada ? getPhotoUrl(p.foto_portada) : photoUrls[0] ?? null
  const allPhotos = coverUrl && photoUrls.length === 0 ? [coverUrl] : photoUrls

  const title   = p.titulo ?? `${TIPO_LABEL[p.tipo] ?? p.tipo} en ${p.barrio ?? p.zona ?? p.ciudad ?? ''}`
  const contact = buildContactUrl(config, title)

  const chips = [
    p.dormitorios != null && {
      icon: 'bed' as const,
      label: p.dormitorios === 0 ? 'Monoambiente' : `${p.dormitorios} dorm.`,
    },
    p.banos != null && {
      icon: 'bath' as const,
      label: `${p.banos} baño${p.banos !== 1 ? 's' : ''}`,
    },
    p.superficie_m2 != null && {
      icon: 'm2' as const,
      label: `${p.superficie_m2} m²`,
    },
    p.garajes != null && p.garajes > 0 && {
      icon: 'car' as const,
      label: `${p.garajes} garage${p.garajes !== 1 ? 's' : ''}`,
    },
  ].filter(Boolean) as { icon: 'bed' | 'bath' | 'm2' | 'car'; label: string }[]

  const detalles = [
    p.condicion && { label: 'Condición', value: CONDICION_LABEL[p.condicion] ?? p.condicion },
    p.ciudad    && { label: 'Ciudad',    value: p.ciudad },
    p.barrio    && { label: 'Barrio',    value: p.barrio },
    p.zona      && { label: 'Zona',      value: p.zona },
    p.direccion && { label: 'Dirección', value: p.direccion },
    p.piso != null && { label: 'Piso',   value: String(p.piso) },
    p.superficie_cubierta_m2 != null && { label: 'Sup. cubierta', value: `${p.superficie_cubierta_m2} m²` },
    p.terreno_m2 != null && { label: 'Terreno', value: `${p.terreno_m2} m²` },
    p.anio != null && { label: 'Año',    value: String(p.anio) },
    p.deposito != null && { label: 'Baulera', value: p.deposito ? 'Sí' : 'No' },
    p.amoblado && { label: 'Amoblado',    value: 'Sí' },
    p.financiacion && { label: 'Financiación', value: 'Consultar' },
  ].filter(Boolean) as { label: string; value: string }[]

  const ubicacion = [p.barrio, p.zona, p.ciudad].filter(Boolean).join(' · ')
  const mapsUrl   = p.latitud && p.longitud
    ? `https://www.google.com/maps?q=${p.latitud},${p.longitud}`
    : p.direccion
      ? `https://www.google.com/maps/search/${encodeURIComponent(p.direccion)}`
      : null

  const companyName = config?.nombre ?? ''
  const logoUrl     = config?.logo_url ?? null

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // ── CTA button (reutilizado en mobile sticky y desktop card) ─────────────────

  function CTAButton({ className = '' }: { className?: string }) {
    if (!contact) return null
    return (
      <a
        href={contact.url}
        target={contact.icon !== 'phone' ? '_blank' : undefined}
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 w-full h-14 rounded-2xl font-semibold text-base transition-colors ${
          contact.icon === 'whatsapp'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-900 hover:bg-gray-700 text-white'
        } ${className}`}
      >
        {contact.icon === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
        {contact.icon === 'phone'    && <Phone className="w-5 h-5" />}
        {contact.icon === 'mail'     && <Mail className="w-5 h-5" />}
        {contact.label}
      </a>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-gray-50">

        {/* ── Header ── */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20 px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-7 w-auto object-contain flex-shrink-0" />
            ) : companyName ? (
              <span className="text-sm font-semibold text-gray-800 truncate">{companyName}</span>
            ) : null}
          </div>
          {contact && (
            <a
              href={contact.url}
              target={contact.icon !== 'phone' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ml-3
                text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            >
              {contact.icon === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5" />}
              {contact.icon === 'phone'    && <Phone className="w-3.5 h-3.5" />}
              {contact.icon === 'mail'     && <Mail className="w-3.5 h-3.5" />}
              Contactar
            </a>
          )}
        </header>

        <div className="max-w-[940px] mx-auto px-4 pb-32 lg:pb-8 flex flex-col gap-4 pt-5">

          {/* ── Galería ── */}
          {allPhotos.length > 0 ? (
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100">
              <PropertyPhotoMosaic photos={allPhotos} onPhotoClick={openLightbox} />
              {allPhotos.length > 1 && (
                <button
                  onClick={() => openLightbox(0)}
                  className="w-full py-2.5 text-center text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors border-t border-gray-100"
                >
                  Ver todas las fotos ({allPhotos.length})
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-100 h-52 flex items-center justify-center text-gray-400 text-sm">
              Sin fotos disponibles
            </div>
          )}

          {/* ── Hero ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-900 text-white uppercase tracking-wide">
                {p.operacion === 'venta' ? 'En Venta' : 'En Alquiler'}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {TIPO_LABEL[p.tipo] ?? p.tipo}
              </span>
              {p.condicion && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {CONDICION_LABEL[p.condicion]}
                </span>
              )}
              {p.amoblado && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                  Amoblado
                </span>
              )}
            </div>

            <h1 className="text-xl font-semibold text-gray-900 leading-snug mb-1">{title}</h1>

            {ubicacion && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                {ubicacion}
              </p>
            )}

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {chips.map((chip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700"
                  >
                    {chip.icon === 'bed'  && <Bed  className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'bath' && <Bath className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'm2'   && <Maximize2 className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'car'  && <Car  className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Precio ── */}
          {p.precio != null && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Precio</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatPrice(p.precio, p.moneda)}
                </span>
                {p.superficie_m2 != null && p.superficie_m2 > 0 && (
                  <span className="text-sm text-gray-400">
                    {formatPrice(Math.round(p.precio / p.superficie_m2), p.moneda)}/m²
                  </span>
                )}
              </div>
              {p.financiacion && (
                <p className="text-xs text-amber-600 font-medium mt-2">Consultar financiación disponible</p>
              )}
            </div>
          )}

          {/* ── Detalles ── */}
          {detalles.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Detalles</p>
              <div className="grid grid-cols-2 gap-2">
                {detalles.map(d => (
                  <div
                    key={d.label}
                    className={`flex flex-col gap-0.5 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 ${
                      d.value.length > 25 ? 'col-span-2' : ''
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{d.label}</span>
                    <span className="text-sm font-medium text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Descripción ── */}
          {p.descripcion && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Descripción</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.descripcion}</p>
            </div>
          )}

          {/* ── Amenities ── */}
          {p.amenities && p.amenities.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comodidades</p>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Mapa ── */}
          {p.latitud && p.longitud && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ubicación{ubicacion ? ` · ${ubicacion}` : ''}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Google Maps
                  </a>
                )}
              </div>
              <div className="rounded-xl overflow-hidden" style={{ height: 220 }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${p.latitud},${p.longitud}&z=16&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de la propiedad"
                />
              </div>
            </div>
          )}

          {/* ── CTA desktop ── */}
          {contact && (
            <div className="hidden lg:block bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">¿Te interesa?</p>
              <CTAButton />
              {companyName && (
                <p className="text-center text-xs text-gray-400 mt-3">{companyName}</p>
              )}
            </div>
          )}

        </div>

        {/* ── CTA fija mobile ── */}
        {contact && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white/95 backdrop-blur border-t border-gray-100 z-20">
            <CTAButton />
          </div>
        )}

      </div>

      <PropertyLightbox
        photos={allPhotos}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
