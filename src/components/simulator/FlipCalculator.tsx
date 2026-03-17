// src/components/simulator/FlipCalculator.tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calcFlip } from '@/simulator/engine'
import type { FlipInputs } from '@/simulator/engine'
import { formatUsd } from '@/utils/money'

const DEFAULTS: FlipInputs = {
  precio_lista: 120000,
  entrega: 30000,
  cantidad_cuotas: 24,
  valor_cuota: 2000,
  rentabilidad_anual_percent: 12,
  comision_percent: 3,
}

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
    <div className="rounded-lg border-l-4 bg-gray-50 px-4 py-3" style={{ borderLeftColor: color }}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

export function FlipCalculator() {
  const [inputs, setInputs] = useState<FlipInputs>(DEFAULTS)
  const result = calcFlip(inputs)

  function set<K extends keyof FlipInputs>(key: K, value: FlipInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estructura de inversión</p>
        <NumInput label="Precio de lista (USD)" value={inputs.precio_lista} onChange={(v) => set('precio_lista', v)} prefix="$" step={1000} />
        <NumInput label="Entrega inicial (USD)" value={inputs.entrega} onChange={(v) => set('entrega', v)} prefix="$" step={1000} />
        <NumInput label="Cantidad de cuotas" value={inputs.cantidad_cuotas} onChange={(v) => set('cantidad_cuotas', Math.round(v))} step={1} min={1} suffix="cuotas" />
        <NumInput label="Valor de cuota (USD)" value={inputs.valor_cuota} onChange={(v) => set('valor_cuota', v)} prefix="$" step={100} />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Proyección</p>
        <NumInput label="Rentabilidad anual esperada" value={inputs.rentabilidad_anual_percent} onChange={(v) => set('rentabilidad_anual_percent', v)} step={0.5} suffix="%" />
        <NumInput label="Comisión de venta" value={inputs.comision_percent} onChange={(v) => set('comision_percent', v)} step={0.5} suffix="%" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <HeroCard label="Neto para inversor" value={formatUsd(result.neto_inversor)} color="#059669" />
          <HeroCard label="ROI anualizado" value={`${result.roi_anualizado.toFixed(1)}%`} color="#059669" />
        </div>
        <div className="rounded-lg border bg-gray-50 px-4 py-3">
          <Row label="Capital invertido" value={formatUsd(result.capital_invertido)} />
          <Row label="Período" value={`${result.anos.toFixed(1)} años`} muted />
          <Row label="Ganancia inversor" value={formatUsd(result.ganancia)} />
          <Row label="Comisión vendedor" value={formatUsd(result.comision)} muted />
          <Row label="Precio flip (venta)" value={formatUsd(result.precio_flip)} />
          <Row label="ROI total" value={`${result.roi_total.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  )
}
