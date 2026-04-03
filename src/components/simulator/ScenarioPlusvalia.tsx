// src/components/simulator/ScenarioPlusvalia.tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calcPlusvalia } from '@/simulator/engine'
import { usePlusvaliaInputs, useSimStore } from '@/simulator/store'
import { formatUsd } from '@/utils/money'

function NumInput({
  label, value, onChange, step = 1, min = 0, prefix, suffix,
}: {
  label: string; value: number; onChange: (v: number) => void
  step?: number; min?: number; prefix?: string; suffix?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-xs text-gray-400 pointer-events-none">{prefix}</span>}
        <Input
          type="number" value={value || ""} step={step} min={min}
          onChange={(e) => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? 0 : v) }}
          className={prefix ? 'pl-9 text-sm' : suffix ? 'pr-9 text-sm' : 'text-sm'}
        />
        {suffix && <span className="absolute right-3 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  )
}

function HeroCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-gray-900 p-5 flex flex-col gap-2 shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color }}>{label}</p>
      <p className="text-[34px] font-black text-white leading-none tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

export function ScenarioPlusvalia() {
  const inputs = usePlusvaliaInputs()
  const setOverride = useSimStore((s) => s.setOverride)
  const result = calcPlusvalia(inputs)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-500">Precio de compra (USD)</Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs text-gray-400 pointer-events-none">$</span>
            <Input type="number" value={inputs.precio_compra_propiedad_usd} readOnly
              className="pl-9 text-sm bg-gray-50 cursor-not-allowed text-gray-500" />
          </div>
          <p className="text-xs text-gray-400">Pre-cargado desde la tipología</p>
        </div>

        <NumInput
          label="Precio estimado de venta (USD)"
          value={inputs.precio_estimado_venta_usd}
          onChange={(v) => setOverride('plusvalia_precio_venta', v)}
          prefix="$"
          step={1000}
        />

        <NumInput
          label="Años de tenencia"
          value={inputs.anios_tenencia}
          onChange={(v) => setOverride('plusvalia_anios', Math.max(1, Math.round(v)))}
          step={1}
          min={1}
          suffix="años"
        />

        <NumInput
          label="Comisión Inmobiliaria (%)"
          value={inputs.comision_inmobiliaria_pct}
          onChange={(v) => setOverride('plusvalia_comision_pct', v)}
          step={0.5}
          min={0}
          suffix="%"
        />

        {inputs.precio_estimado_venta_usd > inputs.precio_compra_propiedad_usd && inputs.precio_compra_propiedad_usd > 0 && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2 border">
            Apreciación implícita:{' '}
            <strong className="text-gray-700">
              {(((inputs.precio_estimado_venta_usd / inputs.precio_compra_propiedad_usd) - 1) * 100).toFixed(1)}%
            </strong>{' '}en {inputs.anios_tenencia} {inputs.anios_tenencia === 1 ? 'año' : 'años'}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <HeroCard label="Plusvalía" value={formatUsd(result.plusvalia)} color="#a78bfa" />
          <HeroCard label="ROI Anualizado" value={`${result.roi_anualizado_percent.toFixed(1)}%`} color="#a78bfa" />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white px-4 py-2 shadow-sm">
          <Row label="Precio de compra" value={formatUsd(result.inversion_total)} />
          <Row label="Precio estimado de venta" value={formatUsd(inputs.precio_estimado_venta_usd)} />
          <Row label="Plusvalía total" value={formatUsd(result.plusvalia)} />
          <Row label="ROI total" value={`${result.roi_total_percent.toFixed(1)}%`} />
          <Row label="ROI anualizado (CAGR)" value={`${result.roi_anualizado_percent.toFixed(2)}%`} />
        </div>
      </div>
    </div>
  )
}
