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

const BADGE_ANALISIS_CLS: Record<string, string> = {
  oportunidad: 'bg-orange-500 text-white',
  estable:     'bg-emerald-500 text-white',
  a_evaluar:   'bg-gray-400 text-white',
}

const BADGE_ANALISIS_LABEL: Record<string, string> = {
  oportunidad: 'Oportunidad',
  estable:     'Estable',
  a_evaluar:   'A evaluar',
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
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
    >
      {/* ── Imagen ───────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-100" style={{ aspectRatio: '4 / 3' }}>
        {p.hero_image_url ? (
          <img
            src={p.hero_image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

        {/* Badge análisis — esquina superior derecha */}
        {p.badge_analisis && (
          <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_ANALISIS_CLS[p.badge_analisis]}`}>
            {BADGE_ANALISIS_LABEL[p.badge_analisis]}
          </span>
        )}
      </div>

      {/* ── Contenido ────────────────────────────────────────────────── */}
      <div className="p-2.5 flex flex-col gap-1">

        {/* Badges */}
        <div className="flex gap-1 flex-wrap">
          {p.status && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CLS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          )}
        </div>

        {/* Developer como eyebrow */}
        {p.developer_name && (
          <p className="text-[9px] font-semibold tracking-widest uppercase text-gray-400 leading-none">
            {p.developer_name}
          </p>
        )}

        {/* Nombre proyecto */}
        <p className="text-[11px] font-semibold text-gray-900 leading-tight line-clamp-2">
          {p.name}
        </p>

        {/* Ubicación */}
        {p.location && (
          <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{p.location}</span>
          </div>
        )}

        {/* Precio */}
        {p.precio_desde != null && (
          <p className="text-[11px] font-bold text-gray-900 mt-0.5">
            desde {fmtPrice(p.precio_desde, p.moneda)}
          </p>
        )}

      </div>
    </a>
  )
}
