// src/pages/FlipPrintPage.tsx — página HTML imprimible para un cálculo de flip
import { useParams } from 'react-router'
import { Loader2, Printer, Building2 } from 'lucide-react'
import { useFlipById } from '@/hooks/useFlips'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { useBrand } from '@/context/BrandContext'
import { calcFlip } from '@/simulator/engine'
import { formatUsd } from '@/utils/money'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">{label}</p>
      {children}
    </div>
  )
}

function Row({ label, value, highlight = false, muted = false }: {
  label: string; value: string; highlight?: boolean; muted?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b last:border-0 ${highlight ? 'bg-emerald-50 rounded-xl px-3 -mx-3' : ''}`}>
      <span className={`text-sm ${muted ? 'text-gray-400' : highlight ? 'font-semibold text-emerald-700' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-semibold ${muted ? 'text-gray-400' : highlight ? 'text-emerald-800 text-base' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

export function FlipPrintPage() {
  const { id } = useParams<{ id: string }>()
  const { data: flip, isLoading: loadingF } = useFlipById(id!)
  const { data: consultora, isLoading: loadingC } = useConsultoraConfig()

  if (loadingF || loadingC) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!flip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-400 text-sm">Cálculo no encontrado.</p>
      </div>
    )
  }

  const r = calcFlip(flip)
  const date = new Date(flip.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })
  const { engine } = useBrand()
  const logoUrl    = engine.getLogo('crm') || null

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { box-shadow: none !important; border: none !important; }
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
            {logoUrl ? (
              <img src={logoUrl} alt={consultora?.nombre} className="h-10 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white/70" />
                <span className="text-white font-bold text-lg">{consultora?.nombre ?? 'Consultora'}</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-white/50 text-[11px] uppercase tracking-widest">Análisis Flip</p>
              <p className="text-white/80 text-xs mt-0.5">{date}</p>
            </div>
          </div>

          {/* Título / descripción */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Descripción</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{flip.label || 'Sin nombre'}</p>
          </div>

          {/* Estructura de inversión */}
          <Section label="Estructura de inversión">
            <Row label="Precio de lista" value={formatUsd(flip.precio_lista)} />
            <Row label="Entrega inicial" value={formatUsd(flip.entrega)} />
            <Row label="Cantidad de cuotas" value={`${flip.cantidad_cuotas} cuotas`} />
            <Row label="Valor de cuota" value={`${formatUsd(flip.valor_cuota)} c/u`} />
            <Row label="Capital total invertido" value={formatUsd(r.capital_invertido)} />
            <Row label="Período de tenencia" value={`${r.anos.toFixed(1)} años`} muted />
          </Section>

          {/* Proyección */}
          <Section label="Proyección">
            <Row label="Rentabilidad anual esperada" value={`${flip.rentabilidad_anual_percent}%`} muted />
            <Row label="Comisión de venta" value={`${flip.comision_percent}%`} muted />
            <Row label="Ganancia para el inversor" value={formatUsd(r.ganancia)} />
            <Row label="Comisión del vendedor" value={formatUsd(r.comision)} muted />
            <Row label="Precio de venta (flip)" value={formatUsd(r.precio_flip)} />
          </Section>

          {/* Resultado */}
          <Section label="Resultado">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-xs text-emerald-600 mb-0.5">Neto para el inversor</p>
                <p className="text-2xl font-bold text-emerald-800">{formatUsd(r.neto_inversor)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-xs text-emerald-600 mb-0.5">ROI anualizado</p>
                <p className="text-2xl font-bold text-emerald-800">{r.roi_anualizado.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-3">
              <Row label="ROI total del período" value={`${r.roi_total.toFixed(1)}%`} />
            </div>
          </Section>

          {/* Notas */}
          {flip.notas && (
            <Section label="Notas">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{flip.notas}</p>
            </Section>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex flex-col gap-0.5">
            {consultora?.telefono && <p className="text-xs text-gray-500">{consultora.telefono}</p>}
            {consultora?.email && <p className="text-xs text-gray-400">{consultora.email}</p>}
            <p className="text-[10px] text-gray-300 mt-1">Los valores son proyecciones estimadas en dólares americanos (USD). No constituyen garantía de rentabilidad.</p>
          </div>

        </div>

        <div className="no-print h-8" />
      </div>
    </>
  )
}
