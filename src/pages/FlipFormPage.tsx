// src/pages/FlipFormPage.tsx — formulario nueva/editar flip
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { calcFlip } from '@/simulator/engine'
import { formatUsd } from '@/utils/money'
import { useFlipById, useCreateFlip, useUpdateFlip } from '@/hooks/useFlips'
import type { FlipRow, FlipInsert } from '@/lib/flips'
import { toast } from 'sonner'
import { FormActionBar } from '@/components/ui/FormActionBar'

const DEFAULTS = {
  label: '',
  notas: '',
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
          type="number" value={value || ''} step={step} min={min}
          onChange={(e) => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? 0 : v) }}
          className={`h-12 text-base ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && <span className="absolute right-3 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  )
}

function ResultRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

function FlipFormInner({ initial, isEdit, id }: { initial: Partial<FlipRow>; isEdit: boolean; id?: string }) {
  const navigate = useNavigate()
  const createFlip = useCreateFlip()
  const updateFlip = useUpdateFlip()
  const isPending = createFlip.isPending || updateFlip.isPending

  const [label, setLabel] = useState(initial.label ?? DEFAULTS.label)
  const [notas, setNotas] = useState(initial.notas ?? DEFAULTS.notas)
  const [fields, setFields] = useState({
    precio_lista: initial.precio_lista ?? DEFAULTS.precio_lista,
    entrega: initial.entrega ?? DEFAULTS.entrega,
    cantidad_cuotas: initial.cantidad_cuotas ?? DEFAULTS.cantidad_cuotas,
    valor_cuota: initial.valor_cuota ?? DEFAULTS.valor_cuota,
    rentabilidad_anual_percent: initial.rentabilidad_anual_percent ?? DEFAULTS.rentabilidad_anual_percent,
    comision_percent: initial.comision_percent ?? DEFAULTS.comision_percent,
  })

  function set<K extends keyof typeof fields>(key: K, value: typeof fields[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const result = calcFlip(fields)

  async function handleSave() {
    const payload: FlipInsert = { label, notas: notas || null, ...fields }
    try {
      if (isEdit && id) {
        await updateFlip.mutateAsync({ id, input: payload })
        toast.success('Flip actualizado')
      } else {
        await createFlip.mutateAsync(payload)
        toast.success('Flip guardado')
      }
      navigate('/flip')
    } catch (err: unknown) {
      toast.error('Ocurrió un error, intentá nuevamente')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate('/flip')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-0.5">
            ← Volver a Flip
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {isEdit ? 'Editar cálculo' : 'Nuevo cálculo de Flip'}
          </h1>
        </div>
        <button onClick={() => navigate('/flip')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* Descripción */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Identificación</p>
          <div className="grid gap-1.5">
            <Label className="text-xs text-gray-500">Descripción / nombre del cálculo</Label>
            <Input
              placeholder="Ej: Apto 3C Torre Norte"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="h-12 text-base"
            />
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estructura de inversión</p>
          <NumInput label="Precio de lista (USD)" value={fields.precio_lista} onChange={v => set('precio_lista', v)} prefix="$" step={1000} />
          <NumInput label="Entrega inicial (USD)" value={fields.entrega} onChange={v => set('entrega', v)} prefix="$" step={1000} />
          <NumInput label="Cantidad de cuotas" value={fields.cantidad_cuotas} onChange={v => set('cantidad_cuotas', Math.round(v))} step={1} min={1} suffix="cuotas" />
          <NumInput label="Valor de cuota (USD)" value={fields.valor_cuota} onChange={v => set('valor_cuota', v)} prefix="$" step={100} />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Proyección</p>
          <NumInput label="Rentabilidad anual esperada" value={fields.rentabilidad_anual_percent} onChange={v => set('rentabilidad_anual_percent', v)} step={0.5} suffix="%" />
          <NumInput label="Comisión de venta" value={fields.comision_percent} onChange={v => set('comision_percent', v)} step={0.5} suffix="%" />
        </div>

        {/* Resultados en vivo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Resultado proyectado</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border-l-4 bg-emerald-50 px-4 py-3" style={{ borderLeftColor: '#059669' }}>
              <p className="text-xs text-emerald-700 mb-0.5">Neto para inversor</p>
              <p className="text-xl font-bold text-emerald-800">{formatUsd(result.neto_inversor)}</p>
            </div>
            <div className="rounded-xl border-l-4 bg-emerald-50 px-4 py-3" style={{ borderLeftColor: '#059669' }}>
              <p className="text-xs text-emerald-700 mb-0.5">ROI anualizado</p>
              <p className="text-xl font-bold text-emerald-800">{result.roi_anualizado.toFixed(1)}%</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gray-50 px-4 py-3">
            <ResultRow label="Capital invertido" value={formatUsd(result.capital_invertido)} />
            <ResultRow label="Período" value={`${result.anos.toFixed(1)} años`} muted />
            <ResultRow label="Ganancia inversor" value={formatUsd(result.ganancia)} />
            <ResultRow label="Comisión vendedor" value={formatUsd(result.comision)} muted />
            <ResultRow label="Precio flip (venta)" value={formatUsd(result.precio_flip)} />
            <ResultRow label="ROI total" value={`${result.roi_total.toFixed(1)}%`} />
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Notas</p>
          <Textarea
            placeholder="Observaciones, condiciones, etc."
            value={notas ?? ''}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            className="text-base resize-none"
          />
        </div>

      </div>

      {/* Mobile bottom bar */}
      <FormActionBar
        label={isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar cálculo'}
        onSave={handleSave}
        onCancel={() => navigate('/flip')}
        disabled={isPending}
      />

    </div>
  )
}

export function FlipFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { data: existing, isLoading } = useFlipById(id ?? '')

  if (isEdit && isLoading) {
    return <div className="flex items-center justify-center py-32"><p className="text-sm text-gray-400">Cargando...</p></div>
  }
  if (isEdit && !existing) {
    return <div className="flex items-center justify-center py-32"><p className="text-sm text-gray-400">Cálculo no encontrado.</p></div>
  }

  return <FlipFormInner key={id ?? 'new'} initial={existing ?? {}} isEdit={isEdit} id={id} />
}
