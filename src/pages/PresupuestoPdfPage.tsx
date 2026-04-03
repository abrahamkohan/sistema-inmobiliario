// src/pages/PresupuestoPdfPage.tsx
// Página HTML pública — shareable por link, imprimible como PDF desde el navegador.
import { useParams } from 'react-router'
import { Loader2, Printer, Building2, MapPin, Calendar, DollarSign } from 'lucide-react'
import { usePresupuestoById } from '@/hooks/usePresupuestos'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { useBrand } from '@/context/BrandContext'
import { getPublicUrl } from '@/lib/storage'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return `USD ${n.toLocaleString('es-PY')}`
}

export function PresupuestoPdfPage() {
  const { id } = useParams<{ id: string }>()
  const { data: p,          isLoading: loadingP } = usePresupuestoById(id!)
  const { data: consultora, isLoading: loadingC } = useConsultoraConfig()

  if (loadingP || loadingC) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!p) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-400 text-sm">Presupuesto no encontrado.</p>
      </div>
    )
  }

  const floorPlanUrl = p.floor_plan_path ? getPublicUrl(p.floor_plan_path) : null
  const { engine }   = useBrand()
  const logoUrl      = engine.getLogo('crm') || null
  const date         = new Date(p.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })

  const totalUnidad = (p.precio_usd ?? 0) + (p.cochera_precio_usd ?? 0)

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-6 px-4">

        {/* Botón imprimir — se oculta al imprimir */}
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

          {/* Header consultora */}
          <div className="bg-gray-900 px-6 py-5 flex items-center justify-between gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={consultora?.nombre} className="h-10 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white/70" />
                <span className="text-white font-bold text-lg">{consultora?.nombre ?? 'Consultora'}</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-white/50 text-[11px] uppercase tracking-widest">Presupuesto</p>
              <p className="text-white/80 text-xs mt-0.5">{date}</p>
            </div>
          </div>

          {/* Cliente */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Preparado para</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{p.client_name}</p>
          </div>

          {/* Unidad */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Unidad</p>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-gray-900">{p.unidad_nombre}</p>
                {p.superficie_m2 && (
                  <p className="text-sm text-gray-500 mt-0.5">{p.superficie_m2} m²</p>
                )}
              </div>
              <p className="text-lg font-bold text-gray-900 flex-shrink-0">{fmt(p.precio_usd)}</p>
            </div>

            {p.cochera_nombre && (
              <div className="flex items-start justify-between gap-4 pt-2 border-t border-dashed border-gray-100">
                <p className="text-sm text-gray-600">{p.cochera_nombre}</p>
                <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{fmt(p.cochera_precio_usd)}</p>
              </div>
            )}

            {p.cochera_precio_usd && (
              <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-700">Total</p>
                <p className="text-base font-bold text-gray-900">{fmt(totalUnidad)}</p>
              </div>
            )}
          </div>

          {/* Plano */}
          {floorPlanUrl && (
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Plano de planta</p>
              <img src={floorPlanUrl} alt="Plano" className="w-full rounded-xl object-contain max-h-64" />
            </div>
          )}

          {/* Plan de pagos */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Plan de pagos</p>

            <div className="flex flex-col divide-y divide-gray-50">
              {p.entrega != null && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 text-gray-300" />
                    Entrega
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{fmt(p.entrega)}</span>
                </div>
              )}

              {p.cuotas_cantidad != null && p.cuotas_valor != null && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    {p.cuotas_cantidad} cuotas
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{fmt(p.cuotas_valor)} c/u</span>
                </div>
              )}

              {p.refuerzos_cantidad != null && p.refuerzos_valor != null && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    {p.refuerzos_cantidad} refuerzo{p.refuerzos_cantidad > 1 ? 's' : ''}
                    {p.refuerzos_periodicidad ? ` · ${p.refuerzos_periodicidad}` : ''}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{fmt(p.refuerzos_valor)} c/u</span>
                </div>
              )}

              {p.saldo_contra_entrega != null && (
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-300" />
                    Saldo contra entrega
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{fmt(p.saldo_contra_entrega)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {p.notas && (
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Notas</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.notas}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex flex-col gap-0.5">
            {consultora?.telefono && (
              <p className="text-xs text-gray-500">{consultora.telefono}</p>
            )}
            {consultora?.email && (
              <p className="text-xs text-gray-400">{consultora.email}</p>
            )}
            <p className="text-[10px] text-gray-300 mt-1">Los precios son en dólares americanos (USD) y están sujetos a disponibilidad.</p>
          </div>
        </div>

        <div className="no-print h-8" />
      </div>
    </>
  )
}
