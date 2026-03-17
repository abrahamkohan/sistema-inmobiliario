// src/pages/PresupuestosPage.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, FileText, Copy, Trash2, Pencil, UploadCloud, X as XIcon, Loader2, FileDown, ChevronLeft } from 'lucide-react'
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

  const formTitle = editing ? 'Editar presupuesto' : 'Nuevo presupuesto'

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

          {/* Mobile list */}
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

      {/* ── Mobile: full-screen app layout ── */}
      {sheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: '#f1f5f9' }}
        >
          {/* App header — sticky */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-2 bg-white border-b"
            style={{ minHeight: 52 }}
          >
            <button
              onClick={() => setSheetOpen(false)}
              className="flex items-center gap-0.5 text-gray-500 px-2 py-1.5 rounded-lg active:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Volver</span>
            </button>
            <h2 className="text-[15px] font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2 pointer-events-none">
              {formTitle}
            </h2>
            <button
              onClick={() => setSheetOpen(false)}
              className="p-2 rounded-lg text-gray-400 active:bg-gray-100"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto">
            <PresupuestoForm
              key={editing?.id ?? 'new'}
              initial={editing}
              onClose={() => setSheetOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Desktop: modal ── */}
      <div className="hidden md:block">
        <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={formTitle} size="lg">
          <PresupuestoForm
            key={editing?.id ?? 'new'}
            initial={editing}
            onClose={() => setSheetOpen(false)}
            isDesktop
          />
        </Modal>
      </div>
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function PresupuestoForm({
  initial,
  onClose,
  isDesktop = false,
}: {
  initial: PRow | null
  onClose: () => void
  isDesktop?: boolean
}) {
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

  const totalUnidad    = n(precioUsd) + (cocheraOn ? n(cocheraPrecioUsd) : 0)
  const comprometido   = n(entrega) + n(cuotasCantidad) * n(cuotasValor) + (refuerzosOn ? n(refuerzosCantidad) * n(refuerzosValor) : 0) + n(saldoContraEntrega)
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

  // Desktop: flat layout inside modal (modal provides padding + scroll)
  if (isDesktop) {
    return (
      <div className="flex flex-col gap-3 pb-2">

        {/* Identificación */}
        <FSection title="Identificación">
          <FFieldText label="Cliente" value={clientName} onChange={setClientName} placeholder="Nombre del cliente" />
          <FFieldText label="Nombre de unidad" value={unidadNombre} onChange={setUnidadNombre} placeholder="Ej: Apto 3B" />
          <div className="grid grid-cols-2 gap-2">
            <FFieldNum label="Superficie" value={superficieM2} onChange={setSuperficieM2} suffix="m²" compact />
            <FFieldNum label="Precio unidad" value={precioUsd} onChange={setPrecioUsd} suffix="USD" />
          </div>
        </FSection>

        {/* Cochera */}
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={cocheraOn} onChange={(e) => setCocheraOn(e.target.checked)} className="rounded" />
            Incluir cochera
          </label>
          {cocheraOn && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <FFieldText label="Nombre cochera" value={cocheraNombre} onChange={setCocheraNombre} placeholder="Cochera 12" />
              <FFieldNum label="Precio cochera" value={cocheraPrecioUsd} onChange={setCocheraPrecioUsd} suffix="USD" />
            </div>
          )}
        </div>

        {/* Plano */}
        <FSection title="Plano de planta">
          <FloorPlanField value={floorPlanPath} onChange={setFloorPlanPath} uploading={uploading} onFile={handleFloorPlan} />
        </FSection>

        {/* Plan de pagos */}
        <FSection title="Plan de pagos">
          <FFieldNum label="Entrega / anticipo" value={entrega} onChange={setEntrega} suffix="USD" />
          <div className="grid grid-cols-2 gap-2">
            <FFieldNum label="Cuotas (cantidad)" value={cuotasCantidad} onChange={setCuotasCantidad} compact />
            <FFieldNum label="Valor por cuota" value={cuotasValor} onChange={setCuotasValor} suffix="USD" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={refuerzosOn} onChange={(e) => setRefuerzosOn(e.target.checked)} className="rounded" />
            Incluir refuerzos
          </label>
          {refuerzosOn && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <FFieldNum label="Cant. refuerzos" value={refuerzosCantidad} onChange={setRefuerzosCantidad} compact />
                <FFieldNum label="Valor por refuerzo" value={refuerzosValor} onChange={setRefuerzosValor} suffix="USD" />
              </div>
              <FFieldNum label="Periodicidad" value={refuerzosPeriodicidad} onChange={setRefuerzosPeriodicidad} suffix="meses" compact />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={saldoOn} onChange={(e) => setSaldoOn(e.target.checked)} className="rounded" />
            Saldo contra entrega
          </label>
          {saldoOn && (
            <FFieldNum label="Monto saldo contra entrega" value={saldoContraEntrega} onChange={setSaldoContraEntrega} suffix="USD" />
          )}
        </FSection>

        {/* Resumen */}
        <FinancialSummary total={totalUnidad} comprometido={comprometido} saldo={saldoPendiente} />

        {/* Notas */}
        <FSection title="Notas">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones, condiciones especiales..."
            rows={2}
            className="w-full text-sm resize-none bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
          />
        </FSection>

        {/* Sticky buttons */}
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

  // Mobile: card layout inside full-screen app container
  return (
    <div className="flex flex-col gap-3 p-4 pb-8">

      {/* Card: Identificación */}
      <AppCard title="Identificación">
        <FFieldText label="Cliente" value={clientName} onChange={setClientName} placeholder="Nombre del cliente" />
        <FFieldText label="Nombre de unidad" value={unidadNombre} onChange={setUnidadNombre} placeholder="Ej: Apto 3B" />
        <div className="grid grid-cols-2 gap-3">
          <FFieldNum label="Superficie" value={superficieM2} onChange={setSuperficieM2} suffix="m²" compact />
          <FFieldNum label="Precio" value={precioUsd} onChange={setPrecioUsd} suffix="USD" />
        </div>
      </AppCard>

      {/* Card: Cochera */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cocheraOn}
              onChange={(e) => setCocheraOn(e.target.checked)}
              className="rounded w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-700">Incluir cochera</span>
          </label>
        </div>
        {cocheraOn && (
          <div className="border-t px-4 py-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <FFieldText label="Nombre" value={cocheraNombre} onChange={setCocheraNombre} placeholder="Cochera 12" />
              <FFieldNum label="Precio" value={cocheraPrecioUsd} onChange={setCocheraPrecioUsd} suffix="USD" />
            </div>
          </div>
        )}
      </div>

      {/* Card: Plano */}
      <AppCard title="Plano de planta">
        <FloorPlanField value={floorPlanPath} onChange={setFloorPlanPath} uploading={uploading} onFile={handleFloorPlan} />
      </AppCard>

      {/* Card: Plan de pagos */}
      <AppCard title="Plan de pagos">
        {/* Entrega */}
        <FFieldNum label="Entrega / anticipo" value={entrega} onChange={setEntrega} suffix="USD" />

        {/* Cuotas */}
        <div className="grid grid-cols-2 gap-3">
          <FFieldNum label="Cuotas" value={cuotasCantidad} onChange={setCuotasCantidad} compact />
          <FFieldNum label="Valor / cuota" value={cuotasValor} onChange={setCuotasValor} suffix="USD" />
        </div>

        {/* Refuerzos toggle */}
        <div className="pt-1 border-t">
          <label className="flex items-center gap-3 py-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={refuerzosOn}
              onChange={(e) => setRefuerzosOn(e.target.checked)}
              className="rounded w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">Incluir refuerzos</span>
          </label>
        </div>
        {refuerzosOn && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <FFieldNum label="Cantidad" value={refuerzosCantidad} onChange={setRefuerzosCantidad} compact />
              <FFieldNum label="Valor / refuerzo" value={refuerzosValor} onChange={setRefuerzosValor} suffix="USD" />
            </div>
            <FFieldNum label="Periodicidad" value={refuerzosPeriodicidad} onChange={setRefuerzosPeriodicidad} suffix="meses" compact />
          </div>
        )}

        {/* Saldo toggle */}
        <div className="pt-1 border-t">
          <label className="flex items-center gap-3 py-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saldoOn}
              onChange={(e) => setSaldoOn(e.target.checked)}
              className="rounded w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">Saldo contra entrega</span>
          </label>
        </div>
        {saldoOn && (
          <FFieldNum label="Monto saldo" value={saldoContraEntrega} onChange={setSaldoContraEntrega} suffix="USD" />
        )}
      </AppCard>

      {/* Resumen financiero */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-2.5 border-b" style={{ background: '#f8fafc' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen</p>
        </div>
        <div className="divide-y">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-sm text-gray-500">Total unidad</span>
            <span className="text-sm tabular-nums font-medium text-gray-700">{fmt(totalUnidad)}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-sm text-gray-500">Comprometido</span>
            <span className="text-sm tabular-nums font-medium text-gray-700">{fmt(comprometido)}</span>
          </div>
          <div
            className="flex justify-between items-center px-4 py-3"
            style={{ background: saldoPendiente < 0 ? '#fef2f2' : saldoPendiente === 0 ? '#f0fdf4' : '#ffffff' }}
          >
            <span className="text-sm font-semibold text-gray-800">Saldo pendiente</span>
            <span
              className="tabular-nums font-bold"
              style={{
                fontSize: 20,
                color: saldoPendiente < 0 ? '#dc2626' : saldoPendiente === 0 ? '#16a34a' : '#111827',
              }}
            >
              {fmt(saldoPendiente)}
            </span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <AppCard title="Notas">
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones, condiciones especiales..."
          rows={3}
          className="w-full text-sm resize-none bg-transparent outline-none text-gray-700 placeholder:text-gray-400 leading-relaxed"
        />
      </AppCard>

      {/* Botones sticky */}
      <div
        className="flex gap-2"
        style={{ position: 'sticky', bottom: 0, background: '#f1f5f9', paddingTop: 8, paddingBottom: 8, marginTop: 4 }}
      >
        <Button variant="outline" onClick={onClose} className="flex-1 h-11 text-sm font-medium">Cancelar</Button>
        <Button className="flex-1 h-11 text-sm font-medium" disabled={isPending} onClick={handleSave}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Card section for mobile app layout */
function AppCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-2.5 border-b" style={{ background: '#f8fafc' }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        {children}
      </div>
    </div>
  )
}

/** Section title for desktop modal layout */
function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-t pt-3 first:border-0 first:pt-0">
        {title}
      </p>
      {children}
    </div>
  )
}

function FinancialSummary({ total, comprometido, saldo }: { total: number; comprometido: number; saldo: number }) {
  return (
    <div className="rounded-xl border overflow-hidden text-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
        <span className="text-gray-500">Total unidad</span>
        <span className="tabular-nums text-gray-700">{fmt(total)}</span>
      </div>
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t">
        <span className="text-gray-500">Comprometido</span>
        <span className="tabular-nums text-gray-700">{fmt(comprometido)}</span>
      </div>
      <div className={`flex justify-between items-center px-4 py-3 border-t ${saldo < 0 ? 'bg-red-50' : 'bg-white'}`}>
        <span className="font-semibold text-gray-800" style={{ fontSize: 14 }}>Saldo pendiente</span>
        <span
          className="tabular-nums font-bold"
          style={{ fontSize: 18, color: saldo < 0 ? '#dc2626' : saldo === 0 ? '#16a34a' : '#111827' }}
        >
          {fmt(saldo)}
        </span>
      </div>
    </div>
  )
}

function FFieldText({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-gray-500">{label}</Label>
      <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm h-9" />
    </div>
  )
}

function FFieldNum({ label, value, onChange, suffix, compact }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; compact?: boolean
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [display, setDisplay] = useState(() => fmtInput(value))

  useEffect(() => {
    if (!isFocused) setDisplay(fmtInput(value))
  }, [value, isFocused])

  function fmtInput(raw: string) {
    const n = parseFloat(raw)
    if (!raw || isNaN(n)) return raw
    return n.toLocaleString('es-PY', { maximumFractionDigits: 2 })
  }

  function handleFocus() {
    setIsFocused(true)
    setDisplay(value)
  }

  function handleBlur() {
    setIsFocused(false)
    setDisplay(fmtInput(value))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setDisplay(raw)
    const numeric = raw.replace(/\./g, '').replace(',', '.')
    onChange(numeric)
  }

  return (
    <div className="grid gap-1" style={compact ? { maxWidth: 104 } : undefined}>
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
