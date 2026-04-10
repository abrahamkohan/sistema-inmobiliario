// src/components/landing/ProjectPublicCard.tsx
import { Building2, MapPin, ArrowRight } from 'lucide-react'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

const STATUS_LABEL: Record<string, string> = {
  en_pozo:         'En pozo',
  en_construccion: 'En construcción',
  entregado:       'Entregado',
}

const STATUS_CLS: Record<string, string> = {
  en_pozo:         'bg-white/90 text-amber-700',
  en_construccion: 'bg-white/90 text-blue-700',
  entregado:       'bg-white/90 text-emerald-700',
}

const BADGE_ANALISIS_CLS: Record<string, string> = {
  oportunidad: 'bg-orange-500 text-white',
  estable:     'bg-emerald-500 text-white',
  a_evaluar:   'bg-gray-500 text-white',
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
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* ── Imagen ───────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-100" style={{ aspectRatio: '16 / 9' }}>
        {p.hero_image_url ? (
          <img
            src={p.hero_image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 className="w-10 h-10 text-gray-300" />
          </div>
        )}

        {/* Degradado inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {/* Badge estado — izquierda */}
        {p.status && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${STATUS_CLS[p.status] ?? 'bg-white/90 text-gray-700'}`}>
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        )}

        {/* Badge análisis — derecha */}
        {p.badge_analisis && (
          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_ANALISIS_CLS[p.badge_analisis]}`}>
            {BADGE_ANALISIS_LABEL[p.badge_analisis]}
          </span>
        )}
      </div>

      {/* ── Contenido ────────────────────────────────────────────────── */}
      <div className="px-3.5 pt-2.5 pb-3 flex flex-col gap-0.5">

        {/* Developer como eyebrow */}
        {p.developer_name && (
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 leading-none mb-0.5">
            {p.developer_name}
          </p>
        )}

        {/* Título */}
        <p className="text-[15px] font-semibold text-gray-900 leading-tight">
          {p.name}
        </p>

        {/* Ubicación */}
        {p.location && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.location}</span>
          </div>
        )}

        {/* Precio + CTA */}
        <div className="flex items-center justify-between mt-2">
          {p.precio_desde != null ? (
            <p className="text-sm font-bold text-gray-900">
              desde {fmtPrice(p.precio_desde, p.moneda)}
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
