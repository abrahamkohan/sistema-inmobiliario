// src/components/simulator/SimEditDialog.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { useUpdateSimulation } from '@/hooks/useSimulations'
import { calcAirbnb, calcAlquiler, calcPlusvalia } from '@/simulator/engine'
import type { AirbnbInputs, AlquilerInputs, PlusvaliaInputs } from '@/simulator/engine'
import { MARKET_DEFAULTS } from '@/simulator/store'
import type { Database } from '@/types/database'

type SimRow = Database['public']['Tables']['simulations']['Row']
type ScenarioData<I, R> = { inputs: I; result: R }

interface Props {
  sim: SimRow
  onClose: () => void
}

function Field({ label, value, onChange, type = 'number', suffix }: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  suffix?: string
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm h-8"
        />
        {suffix && <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  )
}

function Section({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3 border-t first:border-0 first:pt-0">
      {title}
    </p>
  )
}

export function SimEditDialog({ sim, onClose }: Props) {
  const update = useUpdateSimulation()
  const isCasual = sim.client_id == null

  const snap    = sim.snapshot_project  as Record<string, unknown>
  const snapTyp = sim.snapshot_typology as Record<string, unknown>

  // ── Identidad ──
  const [cliente,   setCliente]   = useState<string>((snap?._cliente  as string) ?? '')
  const [proyecto,  setProyecto]  = useState<string>((snap?.name      as string) ?? '')
  const [tipologia, setTipologia] = useState<string>((snapTyp?.name   as string) ?? '')

  // ── Airbnb inputs ──
  const ab = sim.scenario_airbnb as unknown as ScenarioData<AirbnbInputs, unknown> | null
  const [abPrecio,    setAbPrecio]    = useState(String(ab?.inputs.precio_compra_propiedad_usd    ?? 0))
  const [abAmob,      setAbAmob]      = useState(String(ab?.inputs.amoblamiento_preparacion_str_usd ?? 0))
  const [abNoches,    setAbNoches]    = useState(String(ab?.inputs.noches_ocupadas_mes             ?? 20))
  const [abTarifa,    setAbTarifa]    = useState(String(ab?.inputs.tarifa_diaria_promedio_usd      ?? 80))
  const [abAdmin,     setAbAdmin]     = useState(String(ab?.inputs.tarifa_administracion_percent   ?? 20))
  const [abExpensas,  setAbExpensas]  = useState(String(ab?.inputs.expensas_usd_mes                ?? 100))
  const [abElec,      setAbElec]      = useState(String(ab?.inputs.electricidad_usd_mes            ?? 50))
  const [abInternet,  setAbInternet]  = useState(String(ab?.inputs.internet_usd_mes               ?? 30))
  const [abCable,     setAbCable]     = useState(String(ab?.inputs.cable_tv_usd_mes               ?? 20))

  // ── Alquiler inputs ──
  const al = sim.scenario_alquiler as unknown as ScenarioData<AlquilerInputs, unknown> | null
  const [alPrecio,        setAlPrecio]        = useState(String(al?.inputs.precio_compra_propiedad_usd      ?? 0))
  const [alAmob,          setAlAmob]          = useState(String(al?.inputs.amoblamiento_preparacion_str_usd ?? 0))
  const [alIncluirAmob,   setAlIncluirAmob]   = useState(al?.inputs.incluir_amoblamiento ?? false)
  const [alMensual,       setAlMensual]       = useState(String(al?.inputs.alquiler_mensual_usd             ?? 600))
  const [alAdmin,         setAlAdmin]         = useState(String(al?.inputs.tarifa_administracion_percent    ?? 8))
  const [alExpensas,      setAlExpensas]      = useState(String(al?.inputs.expensas_usd_mes                 ?? 100))
  const [alOtros,         setAlOtros]         = useState(String(al?.inputs.otros_usd_mes                    ?? 0))

  // ── Plusvalía inputs ──
  const pv = sim.scenario_plusvalia as unknown as ScenarioData<PlusvaliaInputs, unknown> | null
  const [pvPrecio,  setPvPrecio]  = useState(String(pv?.inputs.precio_compra_propiedad_usd  ?? 0))
  const [pvVenta,   setPvVenta]   = useState(String(pv?.inputs.precio_estimado_venta_usd    ?? 0))
  const [pvAnios,   setPvAnios]   = useState(String(pv?.inputs.anios_tenencia               ?? 3))

  const n = (v: string) => parseFloat(v) || 0

  async function handleSave() {
    const newAbInputs: AirbnbInputs = {
      precio_compra_propiedad_usd:       n(abPrecio),
      amoblamiento_preparacion_str_usd:  n(abAmob),
      noches_ocupadas_mes:               Math.round(n(abNoches)),
      tarifa_diaria_promedio_usd:        n(abTarifa),
      tarifa_administracion_percent:     n(abAdmin),
      expensas_usd_mes:                  n(abExpensas),
      electricidad_usd_mes:              n(abElec),
      internet_usd_mes:                  n(abInternet),
      cable_tv_usd_mes:                  n(abCable),
    }
    const newAlInputs: AlquilerInputs = {
      precio_compra_propiedad_usd:       n(alPrecio),
      amoblamiento_preparacion_str_usd:  n(alAmob),
      incluir_amoblamiento:              alIncluirAmob,
      alquiler_mensual_usd:              n(alMensual),
      tarifa_administracion_percent:     n(alAdmin),
      expensas_usd_mes:                  n(alExpensas),
      otros_usd_mes:                     n(alOtros),
    }
    const newPvInputs: PlusvaliaInputs = {
      precio_compra_propiedad_usd:  n(pvPrecio),
      precio_estimado_venta_usd:    n(pvVenta),
      anios_tenencia:               n(pvAnios),
      comision_inmobiliaria_pct:    pv?.inputs.comision_inmobiliaria_pct ?? MARKET_DEFAULTS.plusvalia_comision_pct,
    }

    const newSnap    = { ...snap,    name: proyecto, ...(isCasual ? { _cliente: cliente } : {}) }
    const newSnapTyp = { ...snapTyp, name: tipologia }

    await update.mutateAsync({
      id: sim.id,
      input: {
        scenario_airbnb:    { inputs: newAbInputs,  result: calcAirbnb(newAbInputs)    },
        scenario_alquiler:  { inputs: newAlInputs,  result: calcAlquiler(newAlInputs)  },
        scenario_plusvalia: { inputs: newPvInputs,  result: calcPlusvalia(newPvInputs) },
        snapshot_project:   newSnap    as Record<string, unknown>,
        snapshot_typology:  newSnapTyp as Record<string, unknown>,
      },
    })
    toast.success('Guardado')
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Editar simulación">
        <div className="flex flex-col gap-3">

          {/* Identidad */}
          <Section title="Identificación" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isCasual && <Field label="Cliente"   value={cliente}   onChange={setCliente}   type="text" />}
            <Field label="Proyecto"  value={proyecto}  onChange={setProyecto}  type="text" />
            <Field label="Tipología" value={tipologia} onChange={setTipologia} type="text" />
          </div>

          {/* Airbnb */}
          {ab && <>
            <Section title="Alquiler Temporal (Airbnb)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Precio de compra"   value={abPrecio}   onChange={setAbPrecio}   suffix="USD" />
              <Field label="Amoblamiento STR"   value={abAmob}     onChange={setAbAmob}     suffix="USD" />
              <Field label="Noches/mes"         value={abNoches}   onChange={setAbNoches}   suffix="noches" />
              <Field label="Tarifa diaria"      value={abTarifa}   onChange={setAbTarifa}   suffix="USD" />
              <Field label="Administración"     value={abAdmin}    onChange={setAbAdmin}    suffix="%" />
              <Field label="Expensas/mes"       value={abExpensas} onChange={setAbExpensas} suffix="USD" />
              <Field label="Electricidad/mes"   value={abElec}     onChange={setAbElec}     suffix="USD" />
              <Field label="Internet/mes"       value={abInternet} onChange={setAbInternet} suffix="USD" />
              <Field label="Cable/TV mes"       value={abCable}    onChange={setAbCable}    suffix="USD" />
            </div>
          </>}

          {/* Alquiler */}
          {al && <>
            <Section title="Alquiler Tradicional" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Precio de compra"   value={alPrecio}   onChange={setAlPrecio}   suffix="USD" />
              <Field label="Alquiler mensual"   value={alMensual}  onChange={setAlMensual}  suffix="USD" />
              <Field label="Administración"     value={alAdmin}    onChange={setAlAdmin}    suffix="%" />
              <Field label="Expensas/mes"       value={alExpensas} onChange={setAlExpensas} suffix="USD" />
              <Field label="Amoblamiento"       value={alAmob}     onChange={setAlAmob}     suffix="USD" />
              <Field label="Otros/mes"          value={alOtros}    onChange={setAlOtros}    suffix="USD" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={alIncluirAmob}
                onChange={(e) => setAlIncluirAmob(e.target.checked)}
                className="rounded"
              />
              Incluir amoblamiento en inversión total
            </label>
          </>}

          {/* Plusvalía */}
          {pv && <>
            <Section title="Plusvalía en Obra" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Precio de compra"       value={pvPrecio} onChange={setPvPrecio} suffix="USD" />
              <Field label="Precio estimado venta"  value={pvVenta}  onChange={setPvVenta}  suffix="USD" />
              <Field label="Años de tenencia"       value={pvAnios}  onChange={setPvAnios}  suffix="años" />
            </div>
          </>}
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" size="sm" disabled={update.isPending} onClick={handleSave}>
            {update.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        </div>
    </Modal>
  )
}
