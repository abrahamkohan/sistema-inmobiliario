// src/components/landing/PropertyPublicCard.tsx
import { Bed, Bath, Maximize2, MapPin } from 'lucide-react'
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
  venta:    'bg-[#1a2744] text-white',
  alquiler: 'bg-blue-600 text-white',
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
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
    >
      {/* ── Imagen ───────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-100" style={{ aspectRatio: '4 / 3' }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-2xl opacity-30">🏠</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      {/* ── Contenido ────────────────────────────────────────────────── */}
      <div className="p-2.5 flex flex-col gap-1">

        {/* Badges */}
        <div className="flex gap-1 flex-wrap">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${OPERACION_CLS[p.operacion] ?? 'bg-gray-900 text-white'}`}>
            {p.operacion === 'venta' ? 'Venta' : 'Alquiler'}
          </span>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {TIPO_LABEL[p.tipo] ?? p.tipo}
          </span>
        </div>

        {/* Título */}
        <p className="text-[11px] font-semibold text-gray-900 leading-tight line-clamp-2">
          {title}
        </p>

        {/* Ubicación */}
        {location && (
          <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Features */}
        {(p.dormitorios != null || p.banos != null || p.superficie_m2 != null) && (
          <div className="flex items-center gap-2 mt-0.5">
            {p.dormitorios != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Bed className="w-2.5 h-2.5" />
                {p.dormitorios === 0 ? 'Mono' : p.dormitorios}
              </span>
            )}
            {p.banos != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Bath className="w-2.5 h-2.5" />
                {p.banos}
              </span>
            )}
            {p.superficie_m2 != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Maximize2 className="w-2.5 h-2.5" />
                {p.superficie_m2}m²
              </span>
            )}
          </div>
        )}

        {/* Precio */}
        {p.precio != null && (
          <p className="text-[11px] font-bold text-gray-900 mt-0.5">
            {formatPrice(p.precio, p.moneda)}
          </p>
        )}

      </div>
    </a>
  )
}
