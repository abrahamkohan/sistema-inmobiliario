// src/components/simulator/ScenarioAlquiler.tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calcAlquiler } from '@/simulator/engine'
import { useAlquilerInputs, useSimStore } from '@/simulator/store'
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

function GroupLabel({ children }: { children: string }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 first:mt-0">{children}</p>
}

export function ScenarioAlquiler() {
  const inputs = useAlquilerInputs()
  const setOverride = useSimStore((s) => s.setOverride)
  const result = calcAlquiler(inputs)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Inputs ── */}
      <div className="flex flex-col gap-1">
        <GroupLabel>Inversión inicial</GroupLabel>
        <div className="grid gap-1.5">
          <Label className="text-xs text-gray-500">Precio de compra</Label>
          <div className="relative flex items-center">
            <Input type="number" value={inputs.precio_compra_propiedad_usd} readOnly
              className="pr-14 text-sm bg-gray-50 cursor-not-allowed text-gray-500" />
            <span className="absolute right-3 text-xs text-gray-400 pointer-events-none">USD</span>
          </div>
          <p className="text-xs text-gray-400">Pre-cargado desde la tipología</p>
        </div>

        {/* Toggle: include amoblamiento */}
        <div className="flex items-center justify-between py-2">
          <Label className="text-xs text-gray-500">¿Incluir amoblamiento?</Label>
          <button
            type="button"
            onClick={() => setOverride('alquiler_incluir_amoblamiento', !inputs.incluir_amoblamiento)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              inputs.incluir_amoblamiento ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              inputs.incluir_amoblamiento ? 'translate-x-4' : 'translate-x-1'
            }`} />
          </button>
        </div>
        {inputs.incluir_amoblamiento && (
          <NumInput
            label="Amoblamiento"
            value={inputs.amoblamiento_preparacion_str_usd}
            onChange={(v) => setOverride('alquiler_amoblamiento', v)}
            suffix="USD"
            step={500}
          />
        )}

        <GroupLabel>Rendimiento</GroupLabel>
        <NumInput
          label="Alquiler mensual"
          value={inputs.alquiler_mensual_usd}
          onChange={(v) => setOverride('alquiler_mensual', v)}
          suffix="USD"
          step={50}
        />
        <NumInput
          label="Administración"
          value={inputs.tarifa_administracion_percent}
          onChange={(v) => setOverride('alquiler_admin_pct', v)}
          step={1}
          min={0}
          suffix="%"
        />

        <GroupLabel>Costos mensuales</GroupLabel>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Expensas" value={inputs.expensas_usd_mes} onChange={(v) => setOverride('expensas', v)} suffix="USD" />
          <NumInput label="Otros" value={inputs.otros_usd_mes} onChange={(v) => setOverride('alquiler_otros', v)} suffix="USD" />
        </div>
      </div>

      {/* ── Results ── */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <HeroCard label="Ganancia neta / mes" value={formatUsd(result.ganancia_neta_mensual)} color="#34d399" />
          <HeroCard label="Rentabilidad anual" value={`${result.rentabilidad_percent.toFixed(1)}%`} color="#34d399" />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white px-4 py-2 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ingresos</p>
          <Row label="Alquiler mensual" value={formatUsd(result.ingresos_brutos_mensuales)} />
          <Row label="Alquiler anual" value={formatUsd(result.ingresos_brutos_anuales)} />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Costos mensuales</p>
          <Row label="Total costos" value={`- ${formatUsd(result.costos_totales_mensuales)}`} muted />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">Retorno</p>
          <Row label="Ganancia neta anual" value={formatUsd(result.ganancia_neta_anual)} />
          <Row label="Inversión total" value={formatUsd(result.inversion_total)} />
          <Row
            label="Recupero de inversión"
            value={isFinite(result.anos_recuperacion) ? `${result.anos_recuperacion.toFixed(1)} años` : '—'}
          />
        </div>
      </div>
    </div>
  )
}
