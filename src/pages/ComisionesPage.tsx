// src/pages/ComisionesPage.tsx
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { CommissionForm, type CommissionFormValues } from '@/components/commissions/CommissionForm'
import { CommissionTable } from '@/components/commissions/CommissionTable'
import { CommissionCard } from '@/components/commissions/CommissionCard'
import { CommissionDetailSheet } from '@/components/commissions/CommissionDetailSheet'
import {
  useCommissions,
  useCreateCommissionWithSplits,
  useUpdateCommission,
  useDeleteCommission,
} from '@/hooks/useCommissions'
import { useAgentes } from '@/hooks/useAgentes'
import { calcTotals } from '@/lib/commissions'
import type { CommissionFull } from '@/lib/commissions'

type Tab = 'todas' | 'sin_facturar' | 'pendientes'

export function ComisionesPage() {
  const { data: commissions = [], isLoading } = useCommissions()
  const { data: agentes = [] } = useAgentes()
  const createCommission = useCreateCommissionWithSplits()
  const updateCommission = useUpdateCommission()
  const deleteCommission = useDeleteCommission()

  const [tab,        setTab]        = useState<Tab>('todas')
  const [formOpen,   setFormOpen]   = useState(false)
  const [editing,    setEditing]    = useState<CommissionFull | null>(null)
  const [detailItem, setDetailItem] = useState<CommissionFull | null>(null)

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const filtered = useMemo<CommissionFull[]>(() => {
    if (tab === 'sin_facturar') return commissions.filter(c => c.commission_splits.some(s => !s.facturada))
    if (tab === 'pendientes')   return commissions.filter(c => calcTotals(c).saldoPendiente > 0)
    return commissions
  }, [commissions, tab])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit(c: CommissionFull) { setEditing(c); setFormOpen(true) }
  function openDetail(c: CommissionFull) { setDetailItem(c) }

  async function handleSubmit(values: CommissionFormValues) {
    const payload = {
      proyecto_vendido:    values.proyecto_vendido.trim(),
      project_id:          values.project_id || null,
      valor_venta:         values.valor_venta ? parseFloat(values.valor_venta) : null,
      porcentaje_comision: values.porcentaje_comision ? parseFloat(values.porcentaje_comision) : null,
      importe_comision:    parseFloat(values.importe_comision),
      fecha_cierre:        values.fecha_cierre || null,
    }
    try {
      if (editing) {
        await updateCommission.mutateAsync({ id: editing.id, data: payload })
        toast.success('Venta actualizada')
      } else {
        await createCommission.mutateAsync({
          commissionData: payload,
          agentes: agentes.filter(a => a.activo),
        })
        toast.success('Venta registrada')
      }
      setFormOpen(false)
      setEditing(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  function handleDelete(id: string) {
    deleteCommission.mutate(id, {
      onSuccess: () => toast.success('Venta eliminada'),
      onError:   () => toast.error('Error al eliminar'),
    })
  }

  const liveDetail = detailItem
    ? (commissions.find(c => c.id === detailItem.id) ?? detailItem)
    : null

  const isPending = createCommission.isPending || updateCommission.isPending

  // ── Tab pills ────────────────────────────────────────────────────────────────
  const TAB_CLS = (active: boolean) =>
    `flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
      active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
    }`

  const sinFacturarCount = commissions.filter(c => c.commission_splits.some(s => !s.facturada)).length
  const pendCount        = commissions.filter(c => calcTotals(c).saldoPendiente > 0).length

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button className={TAB_CLS(tab === 'todas')} onClick={() => setTab('todas')}>
          Todas
        </button>
        <button className={TAB_CLS(tab === 'sin_facturar')} onClick={() => setTab('sin_facturar')}>
          Sin facturar {sinFacturarCount > 0 && <span className="ml-1 text-xs text-amber-600 font-bold">({sinFacturarCount})</span>}
        </button>
        <button className={TAB_CLS(tab === 'pendientes')} onClick={() => setTab('pendientes')}>
          Pendientes {pendCount > 0 && <span className="ml-1 text-xs text-red-500 font-bold">({pendCount})</span>}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando...</p>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-muted-foreground">
            {tab === 'todas'         ? 'No hay ventas todavía.' :
             tab === 'sin_facturar'  ? 'Todos los splits están facturados.' :
             'No hay ventas con saldo pendiente.'}
          </p>
          {tab === 'todas' && (
            <button onClick={openCreate}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Crear la primera
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {filtered.length > 0 && (
        <>
          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <CommissionTable commissions={filtered} onView={openDetail} onEdit={openEdit} onDelete={handleDelete} />
          </div>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(c => (
              <CommissionCard key={c.id} commission={c} onView={openDetail} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

      {/* Form — Mobile fullscreen */}
      <MobileFormScreen open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? 'Editar venta' : 'Nueva venta'}>
        <CommissionForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={isPending}
          stickyButtons
        />
      </MobileFormScreen>

      {/* Form — Desktop modal */}
      <div className="hidden md:block">
        <Modal open={formOpen} onClose={() => setFormOpen(false)}
          title={editing ? 'Editar venta' : 'Nueva venta'}>
          <CommissionForm
            key={editing?.id ?? 'new'}
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            isSubmitting={isPending}
          />
        </Modal>
      </div>

      {/* Detail sheet */}
      {liveDetail && (
        <CommissionDetailSheet
          commission={liveDetail}
          open={!!liveDetail}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  )
}
