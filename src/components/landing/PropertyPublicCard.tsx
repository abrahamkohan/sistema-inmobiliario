// src/components/landing/PropertyPublicCard.tsx
import { Bed, Bath, Maximize2 } from 'lucide-react'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
import type { Database } from '@/types/database'

type PropertyRow = Database['public']['Tables']['properties']['Row']

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
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
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Imagen */}
      <div className="relative w-full bg-gray-100" style={{ height: 180 }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-3xl">🏠</span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${OPERACION_CLS[p.operacion] ?? 'bg-gray-900 text-white'}`}>
            {p.operacion === 'venta' ? 'Venta' : 'Alquiler'}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-700">
            {TIPO_LABEL[p.tipo] ?? p.tipo}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</p>

        {location && (
          <p className="text-xs text-gray-400">{location}</p>
        )}

        {/* Chips */}
        {(p.dormitorios != null || p.banos != null || p.superficie_m2 != null) && (
          <div className="flex items-center gap-2 mt-0.5">
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

        {/* Precio */}
        {p.precio != null && (
          <p className="text-base font-bold text-gray-900 mt-1">
            {formatPrice(p.precio, p.moneda)}
          </p>
        )}
      </div>
    </a>
  )
}
