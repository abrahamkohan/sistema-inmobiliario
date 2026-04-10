// src/components/landing/PropertyPublicCard.tsx
import { Bed, Bath, Maximize2, MapPin, ArrowRight } from 'lucide-react'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
import type { Database } from '@/types/database'

type PropertyRow = Database['public']['Tables']['properties']['Row']

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Depto.',
  casa:         'Casa',
  terreno:      'Terreno',
  comercial:    'Comercial',
}

const OPERACION_CLS: Record<string, string> = {
  venta:    'bg-gray-900 text-white',
  alquiler: 'bg-blue-700 text-white',
}

interface PropertyPublicCardProps {
  property: PropertyRow
}

export function PropertyPublicCard({ property: p }: PropertyPublicCardProps) {
  const coverUrl = p.foto_portada ? getPhotoUrl(p.foto_portada) : null
  const title    = p.titulo ?? `${TIPO_LABEL[p.tipo] ?? p.tipo}${p.barrio ? ` en ${p.barrio}` : ''}`
  const location = [p.barrio, p.ciudad].filter(Boolean).join(' · ')

  return (
    <a
      href={`/p/${p.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* ── Imagen ───────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-100" style={{ aspectRatio: '16 / 9' }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-3xl opacity-40">🏠</span>
          </div>
        )}

        {/* Degradado inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${OPERACION_CLS[p.operacion] ?? 'bg-gray-900 text-white'}`}>
            {p.operacion === 'venta' ? 'Venta' : 'Alquiler'}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-700 backdrop-blur-sm">
            {TIPO_LABEL[p.tipo] ?? p.tipo}
          </span>
        </div>
      </div>

      {/* ── Contenido ────────────────────────────────────────────────── */}
      <div className="px-3.5 pt-2.5 pb-3 flex flex-col gap-0.5">

        {/* Título */}
        <p className="text-[15px] font-semibold text-gray-900 leading-tight line-clamp-2">
          {title}
        </p>

        {/* Ubicación */}
        {location && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Chips dormitorios / baños / m² */}
        {(p.dormitorios != null || p.banos != null || p.superficie_m2 != null) && (
          <div className="flex items-center gap-3 mt-1">
            {p.dormitorios != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Bed className="w-3 h-3" />
                {p.dormitorios === 0 ? 'Mono' : p.dormitorios}
              </span>
            )}
            {p.banos != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Bath className="w-3 h-3" />
                {p.banos}
              </span>
            )}
            {p.superficie_m2 != null && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Maximize2 className="w-3 h-3" />
                {p.superficie_m2} m²
              </span>
            )}
          </div>
        )}

        {/* Precio + CTA */}
        <div className="flex items-center justify-between mt-2">
          {p.precio != null ? (
            <p className="text-sm font-bold text-gray-900">
              {formatPrice(p.precio, p.moneda)}
            </p>
          ) : <span />}
          <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">
            Ver <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

      </div>
    </a>
  )
}
