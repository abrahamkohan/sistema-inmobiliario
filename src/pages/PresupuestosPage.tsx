// src/pages/PresupuestosPage.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, FileText, Copy, Trash2, Pencil, UploadCloud, X as XIcon, Loader2, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  usePresupuestos,
  useCreatePresupuesto,
  useUpdatePresupuesto,
  useDeletePresupuesto,
  useDuplicatePresupuesto,
} from '@/hooks/usePresupuestos'
import { uploadPresupuestoFloorPlan, getPublicUrl } from '@/lib/storage'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type PRow = Database['public']['Tables']['presupuestos']['Row']

function fmt(n: number) {
  return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PresupuestosPage() {
  const { data: list = [], isLoading } = usePresupuestos()
  const deleteP = useDeletePresupuesto()
  const duplicateP = useDuplicatePresupuesto()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PRow | null>(null)

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(p: PRow) {
    setEditing(p)
    setSheetOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este presupuesto?')) deleteP.mutate(id)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Presupuestos</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nuevo
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="h-8 w-8 text-gray-300" />
          <p className="text-muted-foreground">No hay presupuestos todavía.</p>
          <Button variant="outline" onClick={openCreate}>Crear el primero</Button>
        </div>
      )}

      {list.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Unidad</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Precio</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{p.client_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.unidad_nombre || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(p.precio_usd)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('es-PY')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-center">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/presupuestos/${p.id}/pdf`, '_blank')}>
                          <FileDown className="h-3 w-3 mr-1" />PDF
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => openEdit(p)}>
                          <Pencil className="h-3 w-3 mr-1" />Editar
                        </Button>
                        <Button
                          variant="outline" size="sm" className="text-xs"
                          onClick={() => duplicateP.mutate(p.id)}
                          disabled={duplicateP.isPending}
                          title="Duplicar"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleteP.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            {list.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white p-4 flex flex-col gap-2">
                <div>
                  <p className="font-medium text-sm text-gray-800">{p.client_name || '—'}</p>
                  <p className="text-sm text-gray-600">{p.unidad_nombre || '—'}</p>
                  <p className="text-xs text-gray-400">{fmt(p.precio_usd)} · {new Date(p.created_at).toLocaleDateString('es-PY')}</p>
                </div>
                <div className="flex gap-2 pt-1 border-t">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open(`/presupuestos/${p.id}/pdf`, '_blank')}>
                    <FileDown className="h-3 w-3 mr-1" />PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3 mr-1" />Editar
                  </Button>
                  <Button
                    variant="outline" size="sm" className="text-xs"
                    onClick={() => duplicateP.mutate(p.id)}
                    disabled={duplicateP.isPending}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleteP.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Editar presupuesto' : 'Nuevo presupuesto'} size="lg">
        <PresupuestoForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onClose={() => setSheetOpen(false)}
        />
      </Modal>
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function PresupuestoForm({ initial, onClose }: { initial: PRow | null; onClose: () => void }) {
  const createP = useCreatePresupuesto()
  const updateP = useUpdatePresupuesto()

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

  // Live calculations
  const totalUnidad   = n(precioUsd) + (cocheraOn ? n(cocheraPrecioUsd) : 0)
  const comprometido  = n(entrega) + n(cuotasCantidad) * n(cuotasValor) + (refuerzosOn ? n(refuerzosCantidad) * n(refuerzosValor) : 0) + n(saldoContraEntrega)
  const saldoPendiente = totalUnidad - comprometido

  const handleFloorPlan = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const path = await uploadPresupuestoFloorPlan(file)
      setFloorPlanPath(path)
    } finally {
      setUploading(false)
    }
  }, [])

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFloorPlan(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFloorPlan])

  async function handleSave() {
    const payload = {
      client_name:           clientName || null,
      unidad_nombre:         unidadNombre,
      superficie_m2:         superficieM2 ? n(superficieM2) : null,
      precio_usd:            n(precioUsd),
      cochera_nombre:        cocheraOn ? (cocheraNombre || null) : null,
      cochera_precio_usd:    cocheraOn ? n(cocheraPrecioUsd) : 0,
      floor_plan_path:       floorPlanPath,
      entrega:               n(entrega),
      cuotas_cantidad:       Math.round(n(cuotasCantidad)),
      cuotas_valor:          n(cuotasValor),
      refuerzos_cantidad:    refuerzosOn ? Math.round(n(refuerzosCantidad)) : 0,
      refuerzos_valor:       refuerzosOn ? n(refuerzosValor) : 0,
      refuerzos_periodicidad: refuerzosOn ? Math.round(n(refuerzosPeriodicidad)) : 6,
      saldo_contra_entrega:  saldoOn ? n(saldoContraEntrega) : 0,
      notas:                 notas || null,
    }
    try {
      if (initial) {
        await updateP.mutateAsync({ id: initial.id, input: payload })
        toast.success('Guardado')
      } else {
        await createP.mutateAsync(payload)
        toast.success('Creado')
      }
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const isPending = createP.isPending || updateP.isPending

  return (
    <div className="flex flex-col gap-4 pb-4">

      {/* Identificación */}
      <FSectionTitle>Identificación</FSectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FFieldText label="Cliente" value={clientName} onChange={setClientName} placeholder="Nombre del cliente" />
        </div>
        <div className="col-span-2">
          <FFieldText label="Nombre de unidad" value={unidadNombre} onChange={setUnidadNombre} placeholder="Ej: Apto 3B" />
        </div>
        <FFieldNum label="Superficie" value={superficieM2} onChange={setSuperficieM2} suffix="m²" />
        <FFieldNum label="Precio unidad" value={precioUsd} onChange={setPrecioUsd} suffix="USD" />
      </div>

      {/* Cochera */}
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={cocheraOn} onChange={(e) => setCocheraOn(e.target.checked)} className="rounded" />
          Incluir cochera
        </label>
        {cocheraOn && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FFieldText label="Nombre cochera" value={cocheraNombre} onChange={setCocheraNombre} placeholder="Ej: Cochera 12" />
            <FFieldNum label="Precio cochera" value={cocheraPrecioUsd} onChange={setCocheraPrecioUsd} suffix="USD" />
          </div>
        )}
      </div>

      {/* Plano */}
      <FSectionTitle>Plano de planta</FSectionTitle>
      <FloorPlanField value={floorPlanPath} onChange={setFloorPlanPath} uploading={uploading} onFile={handleFloorPlan} />

      {/* Plan de pagos */}
      <FSectionTitle>Plan de pagos</FSectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FFieldNum label="Entrega / anticipo" value={entrega} onChange={setEntrega} suffix="USD" />
        </div>
        <FFieldNum label="Cuotas (cantidad)" value={cuotasCantidad} onChange={setCuotasCantidad} />
        <FFieldNum label="Valor por cuota" value={cuotasValor} onChange={setCuotasValor} suffix="USD" />
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={refuerzosOn} onChange={(e) => setRefuerzosOn(e.target.checked)} className="rounded" />
            Incluir refuerzos
          </label>
        </div>
        {refuerzosOn && (
          <>
            <FFieldNum label="Cant. refuerzos" value={refuerzosCantidad} onChange={setRefuerzosCantidad} />
            <FFieldNum label="Valor por refuerzo" value={refuerzosValor} onChange={setRefuerzosValor} suffix="USD" />
            <div className="col-span-2">
              <FFieldNum label="Periodicidad" value={refuerzosPeriodicidad} onChange={setRefuerzosPeriodicidad} suffix="meses" />
            </div>
          </>
        )}
        {/* Saldo contra entrega — condicional */}
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={saldoOn} onChange={(e) => setSaldoOn(e.target.checked)} className="rounded" />
            Saldo contra entrega
          </label>
        </div>
        {saldoOn && (
          <div className="col-span-2">
            <FFieldNum label="Monto saldo contra entrega" value={saldoContraEntrega} onChange={setSaldoContraEntrega} suffix="USD" />
          </div>
        )}
      </div>

      {/* Resumen financiero */}
      <div className="rounded-xl border overflow-hidden text-sm">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
          <span className="text-gray-500">Total unidad</span>
          <span className="tabular-nums text-gray-700">{fmt(totalUnidad)}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t">
          <span className="text-gray-500">Comprometido</span>
          <span className="tabular-nums text-gray-700">{fmt(comprometido)}</span>
        </div>
        <div className={`flex justify-between items-center px-4 py-3 border-t ${saldoPendiente < 0 ? 'bg-red-50' : 'bg-white'}`}>
          <span className="font-semibold text-gray-800" style={{ fontSize: 14 }}>Saldo pendiente</span>
          <span
            className="tabular-nums font-bold"
            style={{ fontSize: 18, color: saldoPendiente < 0 ? '#dc2626' : saldoPendiente === 0 ? '#16a34a' : '#111827' }}
          >
            {fmt(saldoPendiente)}
          </span>
        </div>
      </div>

      {/* Notas */}
      <FSectionTitle>Notas</FSectionTitle>
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Observaciones, condiciones especiales..."
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Botones sticky */}
      <div
        className="flex gap-2"
        style={{ position: 'sticky', bottom: -20, background: 'white', paddingTop: 10, paddingBottom: 4, borderTop: '1px solid #e5e7eb', marginTop: 4 }}
      >
        <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button className="flex-1" size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-t pt-3 mt-1 first:border-0 first:pt-0 first:mt-0">
      {children}
    </p>
  )
}

function FFieldText({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-gray-500">{label}</Label>
      <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm h-8" />
    </div>
  )
}

function FFieldNum({ label, value, onChange, suffix }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="text-sm h-8" />
        {suffix && <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-semibold text-gray-900' : 'text-gray-700'}>{value}</span>
    </div>
  )
}

function FloorPlanField({ value, onChange, uploading, onFile }: {
  value: string | null
  onChange: (path: string | null) => void
  uploading: boolean
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = value ? getPublicUrl(value) : null

  return (
    <div>
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Plano" className="w-full rounded-lg border max-h-52 object-contain bg-gray-50" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-0.5 hover:bg-white border shadow-sm"
          >
            <XIcon className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          className="border border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? <Loader2 className="h-4 w-4 text-gray-300 flex-shrink-0 animate-spin" />
            : <UploadCloud className="h-4 w-4 text-gray-300 flex-shrink-0" />
          }
          <p className="text-xs text-gray-400">
            {uploading ? 'Subiendo...' : 'Subir plano · clic o Ctrl+V'}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
