// src/pages/PropiedadFichaPage.tsx
// Ruta pública: /p/:id/ficha — ficha imprimible sin contacto comercial
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Printer, Bed, Bath, Maximize2, Car, Building2 } from 'lucide-react'
import { getPublicProperty, getPublicPropertyPhotos, getConsultoraBranding } from '@/lib/publicData'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
import type { Database } from '@/types/database'

type PropertyRow   = Database['public']['Tables']['properties']['Row']
type PhotoRow      = Database['public']['Tables']['property_photos']['Row']

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PropiedadFichaPage() {
  const { id } = useParams<{ id: string }>()

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

  // Fotos — máx 4 para la ficha
  const photoUrls   = photos.map(ph => getPhotoUrl(ph.storage_path))
  const coverUrl    = p.foto_portada ? getPhotoUrl(p.foto_portada) : photoUrls[0] ?? null
  const allPhotos   = coverUrl
    ? [coverUrl, ...photoUrls.filter(u => u !== coverUrl)].slice(0, 4)
    : photoUrls.slice(0, 4)

  const ubicacion = [p.direccion, p.barrio, p.zona, p.ciudad].filter(Boolean).join(', ')
  const title     = p.titulo ?? `${TIPO_LABEL[p.tipo] ?? p.tipo}${p.barrio ? ` en ${p.barrio}` : ''}`

  const chips = [
    p.dormitorios != null && { icon: 'bed',  label: p.dormitorios === 0 ? 'Monoambiente' : `${p.dormitorios} dorm.` },
    p.banos       != null && { icon: 'bath', label: `${p.banos} baño${p.banos !== 1 ? 's' : ''}` },
    p.superficie_m2 != null && { icon: 'm2', label: `${p.superficie_m2} m²` },
    p.garajes != null && p.garajes > 0 && { icon: 'car', label: `${p.garajes} garage${p.garajes !== 1 ? 's' : ''}` },
  ].filter(Boolean) as { icon: string; label: string }[]

  const detalles = [
    p.condicion     && { label: 'Condición',      value: CONDICION_LABEL[p.condicion] ?? p.condicion },
    p.piso != null  && { label: 'Piso',            value: String(p.piso) },
    p.superficie_cubierta_m2 != null && { label: 'Sup. cubierta', value: `${p.superficie_cubierta_m2} m²` },
    p.terreno_m2 != null && { label: 'Terreno',   value: `${p.terreno_m2} m²` },
    p.anio != null  && { label: 'Año',             value: String(p.anio) },
    p.deposito      && { label: 'Baulera',         value: 'Sí' },
    p.amoblado      && { label: 'Amoblado',        value: 'Sí' },
    p.financiacion  && { label: 'Financiación',    value: 'Disponible' },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { box-shadow: none !important; border: none !important; }
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

          {/* Header */}
          <div className="bg-gray-900 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt={branding.nombre} className="h-9 object-contain" />
              ) : branding?.nombre ? (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white/60" />
                  <span className="text-white font-semibold text-base">{branding.nombre}</span>
                </div>
              ) : null}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white/50 text-[10px] uppercase tracking-widest">Ficha de propiedad</p>
            </div>
          </div>

          {/* Fotos */}
          {allPhotos.length > 0 && (
            <div className={`grid gap-0.5 ${
              allPhotos.length === 1 ? 'grid-cols-1' :
              allPhotos.length === 2 ? 'grid-cols-2' :
              allPhotos.length === 3 ? 'grid-cols-3' :
              'grid-cols-2'
            }`} style={{ height: allPhotos.length === 1 ? 260 : 220 }}>
              {allPhotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className={`w-full h-full object-cover ${
                    allPhotos.length === 4 && i === 0 ? 'col-span-2' : ''
                  }`}
                />
              ))}
            </div>
          )}

          {/* Título + badges */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-900 text-white uppercase tracking-wide">
                {p.operacion === 'venta' ? 'En Venta' : 'En Alquiler'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {TIPO_LABEL[p.tipo] ?? p.tipo}
              </span>
              {p.condicion && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {CONDICION_LABEL[p.condicion]}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{title}</h1>
            {ubicacion && (
              <p className="text-sm text-gray-500 mt-1">{ubicacion}</p>
            )}
          </div>

          {/* Precio */}
          {p.precio != null && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Precio</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(p.precio, p.moneda)}</span>
                {p.superficie_m2 != null && p.superficie_m2 > 0 && (
                  <span className="text-sm text-gray-400">
                    {formatPrice(Math.round(p.precio / p.superficie_m2), p.moneda)}/m²
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chips de superficie/ambientes */}
          {chips.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700"
                  >
                    {chip.icon === 'bed'  && <Bed       className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'bath' && <Bath      className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'm2'   && <Maximize2 className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.icon === 'car'  && <Car       className="w-3.5 h-3.5 text-gray-400" />}
                    {chip.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detalles */}
          {detalles.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Detalles</p>
              {detalles.map(d => <DetailRow key={d.label} label={d.label} value={d.value} />)}
            </div>
          )}

          {/* Descripción */}
          {p.descripcion && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Descripción</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.descripcion}</p>
            </div>
          )}

          {/* Amenities */}
          {p.amenities && p.amenities.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Comodidades</p>
              <div className="flex flex-wrap gap-1.5">
                {p.amenities.map((a, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer neutro */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">{branding?.nombre ?? ''}</p>
            <p className="text-[10px] text-gray-300">Ficha de catálogo</p>
          </div>

        </div>

        <div className="no-print h-8" />
      </div>
    </>
  )
}
