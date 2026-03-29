// src/components/presupuestos/PresupuestoForm.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { X as XIcon, UploadCloud, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadPresupuestoFloorPlan, getPublicUrl } from '@/lib/storage'
import { useClients } from '@/hooks/useClients'
import { useProperties } from '@/hooks/useProperties'
import type { Database } from '@/types/database'

type PRow = Database['public']['Tables']['presupuestos']['Row']
type PInsert = Database['public']['Tables']['presupuestos']['Insert']

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresupuestoFormPayload extends PInsert {
  client_id?: string | null
}

export interface PresupuestoFormProps {
  initial: PRow | null
  onSubmit: (payload: PresupuestoFormPayload) => Promise<void>
  isPending: boolean
}

// ─── AutocompleteField ────────────────────────────────────────────────────────

function AutocompleteField({
  label,
  value,
  onChange,
  onSelectId,
  suggestions,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelectId?: (id: string | null) => void
  suggestions: Array<{ id: string; label: string; sublabel?: string }>
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 6)
    const q = value.toLowerCase()
    return suggestions
      .filter(s => s.label.toLowerCase().includes(q) || s.sublabel?.toLowerCase().includes(q))
      .slice(0, 6)
  }, [value, suggestions])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleSelect(s: { id: string; label: string }) {
    onChange(s.label)
    onSelectId?.(s.id)
    setOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    onSelectId?.(null)
    if (!open) setOpen(true)
  }

  return (
    <div ref={containerRef} className="grid gap-1 relative">
      <Label className="text-xs text-gray-500">{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="text-sm h-9"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {filtered.map(s => (
            <button
              key={s.id}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">{s.label}</span>
              {s.sublabel && (
                <span className="block text-xs text-gray-400">{s.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-t pt-4 first:border-0 first:pt-0">
        {title}
      </p>
      {children}
    </div>
  )
}

function InlineCheck({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap text-sm text-gray-600 flex-shrink-0 self-end h-9">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  )
}

function FFieldNum({ label, value, onChange, suffix, compact }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; compact?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [display, setDisplay] = useState(() => fmtNum(value))

  useEffect(() => {
    if (!focused) setDisplay(fmtNum(value))
  }, [value, focused])

  function fmtNum(raw: string) {
    const n = parseFloat(raw)
    if (!raw || isNaN(n)) return raw
    return n.toLocaleString('es-PY', { maximumFractionDigits: 2 })
  }

  return (
    <div className="grid gap-1" style={compact ? { maxWidth: 104 } : undefined}>
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={display}
          onChange={e => { setDisplay(e.target.value); onChange(e.target.value.replace(/\./g, '').replace(',', '.')) }}
          onFocus={() => { setFocused(true); setDisplay(value) }}
          onBlur={() => { setFocused(false); setDisplay(fmtNum(value)) }}
          className={`text-sm h-9 text-right${suffix ? ' pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function FloorPlanField({ value, onChange, uploading, onFile }: {
  value: string | null; onChange: (path: string | null) => void; uploading: boolean; onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = value ? getPublicUrl(value) : null

  return (
    <div>
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Plano" className="w-full rounded-lg border max-h-52 object-contain bg-gray-50" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-0.5 hover:bg-white border shadow-sm">
            <XIcon className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          className="border border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2.5 px-4 py-3"
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? <Loader2 className="h-4 w-4 text-gray-300 flex-shrink-0 animate-spin" />
            : <UploadCloud className="h-4 w-4 text-gray-300 flex-shrink-0" />}
          <p className="text-xs text-gray-400">{uploading ? 'Subiendo...' : 'Subir plano · clic o Ctrl+V'}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PresupuestoForm({ initial, onSubmit }: PresupuestoFormProps) {
  // ── Suggestions data ────────────────────────────────────────────────────────
  const { data: clients = [] } = useClients()
  const { data: properties = [] } = useProperties()

  const clientSuggestions = useMemo(() =>
    clients.map(c => ({
      id: c.id,
      label: c.full_name,
      sublabel: c.apodo ?? undefined,
    })),
    [clients]
  )

  const unidadSuggestions = useMemo(() =>
    properties
      .filter(p => p.titulo)
      .map(p => ({
        id: p.id,
        label: p.titulo!,
        sublabel: [p.tipo, p.barrio, p.ciudad].filter(Boolean).join(' · ') || undefined,
      })),
    [properties]
  )

  // ── Form state ──────────────────────────────────────────────────────────────
  const [clientId,              setClientId]              = useState<string | null>(initial?.client_id ?? null)
  const [clientName,            setClientName]            = useState(initial?.client_name ?? '')
  const [unidadNombre,          setUnidadNombre]          = useState(initial?.unidad_nombre ?? '')
  const [superficieM2,          setSuperficieM2]          = useState(String(initial?.superficie_m2 ?? ''))
  const [precioUsd,             setPrecioUsd]             = useState(String(initial?.precio_usd ?? ''))
  const [cocheraOn,             setCocheraOn]             = useState(!!(initial?.cochera_nombre || (initial?.cochera_precio_usd ?? 0) > 0))
  const [cocheraNombre,         setCocheraNombre]         = useState(initial?.cochera_nombre ?? '')
  const [cocheraPrecioUsd,      setCocheraPrecioUsd]      = useState(String(initial?.cochera_precio_usd ?? ''))
  const [floorPlanPath,         setFloorPlanPath]         = useState<string | null>(initial?.floor_plan_path ?? null)
  const [uploading,             setUploading]             = useState(false)
  const [entrega,               setEntrega]               = useState(String(initial?.entrega ?? ''))
  const [cuotasCantidad,        setCuotasCantidad]        = useState(String(initial?.cuotas_cantidad ?? ''))
  const [cuotasValor,           setCuotasValor]           = useState(String(initial?.cuotas_valor ?? ''))
  const [refuerzosOn,           setRefuerzosOn]           = useState((initial?.refuerzos_cantidad ?? 0) > 0)
  const [refuerzosCantidad,     setRefuerzosCantidad]     = useState(String(initial?.refuerzos_cantidad ?? ''))
  const [refuerzosValor,        setRefuerzosValor]        = useState(String(initial?.refuerzos_valor ?? ''))
  const [refuerzosPeriodicidad, setRefuerzosPeriodicidad] = useState(String(initial?.refuerzos_periodicidad ?? 6))
  const [saldoContraEntrega,    setSaldoContraEntrega]    = useState(String(initial?.saldo_contra_entrega ?? ''))
  const [saldoOn,               setSaldoOn]               = useState((initial?.saldo_contra_entrega ?? 0) > 0)
  const [notas,                 setNotas]                 = useState(initial?.notas ?? '')

  const n = (v: string) => parseFloat(v) || 0

  const totalUnidad    = n(precioUsd) + (cocheraOn ? n(cocheraPrecioUsd) : 0)
  const comprometido   = n(entrega) + n(cuotasCantidad) * n(cuotasValor) + (refuerzosOn ? n(refuerzosCantidad) * n(refuerzosValor) : 0) + (saldoOn ? n(saldoContraEntrega) : 0)
  const saldoPendiente = totalUnidad - comprometido

  // ── Floor plan upload ───────────────────────────────────────────────────────
  const handleFloorPlan = useCallback(async (file: File) => {
    setUploading(true)
    try { const path = await uploadPresupuestoFloorPlan(file); setFloorPlanPath(path) }
    finally { setUploading(false) }
  }, [])

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) { const file = item.getAsFile(); if (file) handleFloorPlan(file); break }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFloorPlan])

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      client_id:              clientId,
      client_name:            clientName || null,
      unidad_nombre:          unidadNombre,
      superficie_m2:          superficieM2 ? n(superficieM2) : null,
      precio_usd:             n(precioUsd),
      cochera_nombre:         cocheraOn ? (cocheraNombre || null) : null,
      cochera_precio_usd:     cocheraOn ? n(cocheraPrecioUsd) : 0,
      floor_plan_path:        floorPlanPath,
      entrega:                n(entrega),
      cuotas_cantidad:        Math.round(n(cuotasCantidad)),
      cuotas_valor:           n(cuotasValor),
      refuerzos_cantidad:     refuerzosOn ? Math.round(n(refuerzosCantidad)) : 0,
      refuerzos_valor:        refuerzosOn ? n(refuerzosValor) : 0,
      refuerzos_periodicidad: refuerzosOn ? Math.round(n(refuerzosPeriodicidad)) : 6,
      saldo_contra_entrega:   saldoOn ? n(saldoContraEntrega) : 0,
      notas:                  notas || null,
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <form id="presupuesto-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Identificación ── */}
      <FSection title="Identificación">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AutocompleteField
            label="Cliente"
            value={clientName}
            onChange={setClientName}
            onSelectId={setClientId}
            suggestions={clientSuggestions}
            placeholder="Nombre del cliente"
          />
          <AutocompleteField
            label="Nombre de unidad"
            value={unidadNombre}
            onChange={setUnidadNombre}
            suggestions={unidadSuggestions}
            placeholder="Ej: Apto 3B, Torre Norte"
          />
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          <FFieldNum label="Superficie" value={superficieM2} onChange={setSuperficieM2} suffix="m²" compact />
          <div className="flex-1 min-w-[160px]">
            <FFieldNum label="Precio unidad" value={precioUsd} onChange={setPrecioUsd} suffix="USD" />
          </div>
          <InlineCheck label="Cochera" checked={cocheraOn} onChange={setCocheraOn} />
        </div>

        {cocheraOn && (
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="grid gap-1">
                <Label className="text-xs text-gray-500">Nombre cochera</Label>
                <Input
                  type="text"
                  value={cocheraNombre}
                  onChange={e => setCocheraNombre(e.target.value)}
                  placeholder="Cochera 12"
                  className="text-sm h-9"
                />
              </div>
            </div>
            <FFieldNum label="Precio cochera" value={cocheraPrecioUsd} onChange={setCocheraPrecioUsd} suffix="USD" />
          </div>
        )}
      </FSection>

      {/* ── Plano ── */}
      <FSection title="Plano de planta">
        <FloorPlanField value={floorPlanPath} onChange={setFloorPlanPath} uploading={uploading} onFile={handleFloorPlan} />
      </FSection>

      {/* ── Plan de pagos ── */}
      <FSection title="Plan de pagos">
        <FFieldNum label="Entrega / anticipo" value={entrega} onChange={setEntrega} suffix="USD" />

        <div className="flex gap-3 items-end flex-wrap">
          <FFieldNum label="Cuotas" value={cuotasCantidad} onChange={setCuotasCantidad} compact />
          <div className="flex-1 min-w-[160px]">
            <FFieldNum label="Valor / cuota" value={cuotasValor} onChange={setCuotasValor} suffix="USD" />
          </div>
          <InlineCheck label="Refuerzos" checked={refuerzosOn} onChange={setRefuerzosOn} />
          <InlineCheck label="Saldo c/ entrega" checked={saldoOn} onChange={setSaldoOn} />
        </div>

        {refuerzosOn && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <FFieldNum label="Cantidad" value={refuerzosCantidad} onChange={setRefuerzosCantidad} compact />
              <div className="flex-1">
                <FFieldNum label="Valor refuerzo" value={refuerzosValor} onChange={setRefuerzosValor} suffix="USD" />
              </div>
            </div>
            <FFieldNum label="Periodicidad" value={refuerzosPeriodicidad} onChange={setRefuerzosPeriodicidad} suffix="meses" compact />
          </div>
        )}

        {saldoOn && (
          <FFieldNum label="Monto saldo contra entrega" value={saldoContraEntrega} onChange={setSaldoContraEntrega} suffix="USD" />
        )}
      </FSection>

      {/* ── Resumen ── */}
      <div className="rounded-xl border overflow-hidden text-sm">
        <div className="flex justify-between items-center px-4 py-2.5 bg-gray-50">
          <span className="text-gray-500">Total unidad</span>
          <span className="tabular-nums text-gray-700 font-medium">{fmt(totalUnidad)}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2.5 bg-gray-50 border-t">
          <span className="text-gray-500">Comprometido</span>
          <span className="tabular-nums text-gray-700 font-medium">{fmt(comprometido)}</span>
        </div>
        <div className={`flex justify-between items-center px-4 py-3 border-t ${saldoPendiente < 0 ? 'bg-red-50' : saldoPendiente === 0 ? 'bg-green-50' : 'bg-white'}`}>
          <span className="font-semibold text-gray-800">Saldo pendiente</span>
          <span
            className="tabular-nums font-bold text-lg"
            style={{ color: saldoPendiente < 0 ? '#dc2626' : saldoPendiente === 0 ? '#16a34a' : '#111827' }}
          >
            {fmt(saldoPendiente)}
          </span>
        </div>
      </div>

      {/* ── Notas ── */}
      <FSection title="Notas">
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Observaciones, condiciones especiales..."
          rows={3}
          className="w-full text-sm resize-none border border-gray-300 rounded-xl px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </FSection>

    </form>
  )
}
