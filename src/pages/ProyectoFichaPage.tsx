// src/pages/ProyectoFichaPage.tsx
// Ruta pública: /proyecto/:id/ficha — ficha editorial imprimible, sin contacto comercial
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Printer, MapPin, Calendar, DollarSign, Building2 } from 'lucide-react'
import { getPublicProject, getConsultoraBranding } from '@/lib/publicData'
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

const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial',
  comercial:   'Comercial',
  mixto:       'Mixto',
}

function fmtPrice(amount: number, moneda: string) {
  return `${moneda} ${amount.toLocaleString('es-PY')}`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProyectoFichaPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const conMarca = searchParams.has('marca')

  const [project, setProject]   = useState<ProjectRow | null>(null)
  const [branding, setBranding] = useState<{ nombre: string; logo_url: string | null } | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    Promise.all([
      getPublicProject(id),
      getConsultoraBranding(),
    ])
      .then(([proj, brand]) => {
        if (!proj) { setNotFound(true); return }
        setProject(proj)
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

  if (notFound || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-sm text-gray-400">Proyecto no encontrado.</p>
      </div>
    )
  }

  const p = project
  const locationDisplay = p.location ?? [p.direccion, p.barrio, p.zona, p.ciudad].filter(Boolean).join(', ')

  const fichaRows = [
    locationDisplay && {
      icon:  <MapPin className="w-4 h-4" />,
      label: 'Ubicación',
      value: locationDisplay,
      sub:   null as string | null,
    },
    p.delivery_date && {
      icon:  <Calendar className="w-4 h-4" />,
      label: 'Entrega estimada',
      value: fmtDate(p.delivery_date),
      sub:   null as string | null,
    },
    p.precio_desde != null && {
      icon:  <DollarSign className="w-4 h-4" />,
      label: 'Precio desde',
      value: fmtPrice(p.precio_desde, p.moneda),
      sub:   p.precio_hasta ? `hasta ${fmtPrice(p.precio_hasta, p.moneda)}` : null,
    },
    p.developer_name && {
      icon:  <Building2 className="w-4 h-4" />,
      label: 'Desarrolladora',
      value: p.developer_name,
      sub:   null as string | null,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; sub: string | null }[]

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
                {p.status && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${STATUS_CLS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                )}
                {p.tipo_proyecto && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                    {TIPO_LABEL[p.tipo_proyecto] ?? p.tipo_proyecto}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-300 uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                Ficha de proyecto
              </p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{p.name}</h1>
            {p.developer_name && (
              <p className="text-sm text-gray-400 mt-1">{p.developer_name}</p>
            )}
            {locationDisplay && (
              <p className="text-sm text-gray-400 mt-0.5">{locationDisplay}</p>
            )}
          </div>

          {/* ── 2. Imagen hero ── */}
          {p.hero_image_url && (
            <div style={{ height: 260 }}>
              <img
                src={p.hero_image_url}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* ── 3. Ficha técnica ── */}
          {fichaRows.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-100 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Ficha técnica</p>
              {fichaRows.map((row, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="mt-0.5 flex-shrink-0 text-gray-300">{row.icon}</div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{row.label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{row.value}</p>
                    {row.sub && <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 4. Descripción ── */}
          {p.description && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Descripción</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>
          )}

          {/* ── 5. Destacados ── */}
          {p.highlights && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Destacados</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.highlights}</p>
            </div>
          )}

          {/* ── 6. Características ── */}
          {p.caracteristicas && (
            <div className="px-8 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Características</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.caracteristicas}</p>
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
