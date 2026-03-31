// src/components/landing/ProjectPublicCard.tsx
import { Building2, MapPin } from 'lucide-react'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const STATUS_LABEL: Record<string, string> = {
  en_pozo:         'En pozo',
  en_construccion: 'En construcción',
  entregado:       'Entregado',
}

const STATUS_CLS: Record<string, string> = {
  en_pozo:         'bg-amber-100 text-amber-700',
  en_construccion: 'bg-blue-100 text-blue-700',
  entregado:       'bg-emerald-100 text-emerald-700',
}

function fmtPrice(amount: number, moneda: string) {
  return `${moneda} ${amount.toLocaleString('es-PY')}`
}

interface ProjectPublicCardProps {
  project: ProjectRow
}

export function ProjectPublicCard({ project: p }: ProjectPublicCardProps) {
  return (
    <a
      href={`/proyecto/${p.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Hero image */}
      <div className="relative w-full bg-gray-100" style={{ height: 180 }}>
        {p.hero_image_url ? (
          <img
            src={p.hero_image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

        {/* Badge estado */}
        {p.status && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{p.name}</p>

        {p.developer_name && (
          <p className="text-xs text-gray-400">{p.developer_name}</p>
        )}

        {p.location && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.location}</span>
          </div>
        )}

        {p.precio_desde != null && (
          <p className="text-sm font-bold text-gray-900 mt-1.5">
            desde {fmtPrice(p.precio_desde, p.moneda)}
          </p>
        )}
      </div>
    </a>
  )
}
