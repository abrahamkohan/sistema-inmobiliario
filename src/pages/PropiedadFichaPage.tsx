// src/pages/PropiedadFichaPage.tsx
// Ruta pública: /p/:id/ficha — ficha editorial imprimible, sin contacto comercial
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Printer, Bed, Bath, Maximize2, Car } from 'lucide-react'
import { getPublicProperty, getPublicPropertyPhotos, getConsultoraBranding } from '@/lib/publicData'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
import type { Database } from '@/types/database'

type PropertyRow = Database['public']['Tables']['properties']['Row']
type PhotoRow    = Database['public']['Tables']['property_photos']['Row']

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa:         'Casa',
  terreno:      'Terreno',
  comercial:    'Comercial',
}

const CONDICION_LABEL: Record<string, string> = {
  nuevo:   'Nuevo',
  usado:   'Usado',
  reventa: 'Reventa',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PropiedadFichaPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const conMarca = searchParams.has('marca')

  const [property, setProperty] = useState<PropertyRow | null>(null)
  const [photos, setPhotos]     = useState<PhotoRow[]>([])
  const [branding, setBranding] = useState<{ nombre: string; logo_url: string | null } | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    Promise.all([
      getPublicProperty(id),
      getPublicPropertyPhotos(id),
      getConsultoraBranding(),
    ])
      .then(([prop, photoRows, brand]) => {
        if (!prop) { setNotFound(true); return }
        setProperty(prop)
        setPhotos(photoRows)
        setBranding(brand)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-sm text-gray-400">Propiedad no encontrada.</p>
      </div>
    )
  }

  const p = property

  // Fotos
  const photoUrls = photos.map(ph => getPhotoUrl(ph.storage_path))
  const coverUrl  = p.foto_portada ? getPhotoUrl(p.foto_portada) : photoUrls[0] ?? null
  const secondary = photoUrls.filter(u => u !== coverUrl).slice(0, 3)

  const ubicacion = [p.direccion, p.barrio, p.zona, p.ciudad].filter(Boolean).join(', ')
  const title     = p.titulo ?? `${TIPO_LABEL[p.tipo] ?? p.tipo}${p.barrio ? ` en ${p.barrio}` : ''}`

  const chips = [
    p.dormitorios != null && {
      icon: 'bed',
      label: p.dormitorios === 0 ? 'Monoambiente' : `${p.dormitorios} dorm.`,
    },
    p.banos != null && {
      icon: 'bath',
      label: `${p.banos} baño${p.banos !== 1 ? 's' : ''}`,
    },
    p.superficie_m2 != null && {
      icon: 'm2',
      label: `${p.superficie_m2} m²`,
    },
    p.garajes != null && p.garajes > 0 && {
      icon: 'car',
      label: `${p.garajes} garage${p.garajes !== 1 ? 's' : ''}`,
    },
  ].filter(Boolean) as { icon: string; label: string }[]

  const detalles = [
    p.condicion             && { label: 'Condición',      value: CONDICION_LABEL[p.condicion] ?? p.condicion },
    p.piso != null          && { label: 'Piso',            value: String(p.piso) },
    p.superficie_cubierta_m2 != null && { label: 'Sup. cubierta', value: `${p.superficie_cubierta_m2} m²` },
    p.terreno_m2 != null    && { label: 'Terreno',         value: `${p.terreno_m2} m²` },
    p.anio != null          && { label: 'Año',             value: String(p.anio) },
    p.deposito              && { label: 'Baulera',         value: 'Sí' },
    p.amoblado              && { label: 'Amoblado',        value: 'Sí' },
    p.financiacion          && { label: 'Financiación',    value: 'Disponible' },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          @page { margin: 15mm; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-6 px-4">

        {/* Botón imprimir */}
        <div className="no-print flex justify-center mb-5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 h-10 px-5 rounded-full bg-gray-900 text-white text-sm font-semibold shadow-md hover:bg-gray-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </button>
        </div>

        {/* Documento */}
        <div className="page bg-white max-w-2xl mx-auto rounded-2xl shadow-lg overflow-hidden">

          {/* ── 1. Encabezado ── */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-900 text-white uppercase tracking-wide">
                  {p.operacion === 'venta' ? 'En Venta' : 'En Alquiler'}
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                  {TIPO_LABEL[p.tipo] ?? p.tipo}
                </span>
                {p.condicion && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                    {CONDICION_LABEL[p.condicion]}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-300 uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                Ficha de propiedad
              </p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{title}</h1>
            {ubicacion && (
              <p className="text-sm text-gray-400 mt-1.5">{ubicacion}</p>
            )}
          </div>

          {/* ── 2. Precio + chips ── */}
          <div className="px-8 py-5 border-b border-gray-100">
            {p.precio != null && (
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatPrice(p.precio, p.moneda)}
                </span>
                {p.superficie_m2 != null && p.superficie_m2 > 0 && (
                  <span className="text-sm text-gray-400">
                    {formatPrice(Math.round(p.precio / p.superficie_m2), p.moneda)}/m²
                  </span>
                )}
              </div>
            )}

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700"
                  >
                    {chip.icon === 'bed'  && <Bed       className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'bath' && <Bath      className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'm2'   && <Maximize2 className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'car'  && <Car       className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 3. Imagen principal ── */}
          {coverUrl && (
            <div style={{ height: 280 }}>
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* ── 4. Detalles ── */}
          {detalles.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-100 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Detalles</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                {detalles.map(d => (
                  <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{d.label}</span>
                    <span className="text-sm font-medium text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Descripción ── */}
          {p.descripcion && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Descripción</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.descripcion}</p>
            </div>
          )}

          {/* ── 6. Amenities ── */}
          {p.amenities && p.amenities.length > 0 && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Comodidades</p>
              <div className="flex flex-wrap gap-1.5">
                {p.amenities.map((a, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. Fotos secundarias ── */}
          {secondary.length > 0 && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Más fotos</p>
              <div className={`grid gap-2 ${secondary.length === 1 ? 'grid-cols-1' : secondary.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {secondary.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ height: 120 }}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-8 py-4 flex items-center justify-between">
            {conMarca
              ? <p className="text-[10px] text-gray-300">{branding?.nombre ?? ''}</p>
              : <span />
            }
            <p className="text-[10px] text-gray-300">Ficha de catálogo</p>
          </div>

        </div>

        <div className="no-print h-8" />
      </div>
    </>
  )
}
