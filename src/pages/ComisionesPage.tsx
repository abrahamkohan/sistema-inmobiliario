// src/pages/ComisionesPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Plus, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { CommissionTable } from '@/components/commissions/CommissionTable'
import { CommissionCard } from '@/components/commissions/CommissionCard'
import { CommissionDetailSheet } from '@/components/commissions/CommissionDetailSheet'
import {
  useCommissions,
  useDeleteCommission,
} from '@/hooks/useCommissions'
import { usePuedeEditar, usePuedeBorrar } from '@/hooks/usePermiso'
import { calcTotals } from '@/lib/commissions'
import type { CommissionFull } from '@/lib/commissions'

type Tab = 'todas' | 'sin_facturar' | 'pendientes'

export function ComisionesPage() {
  const navigate = useNavigate()
  const { data: commissions = [], isLoading } = useCommissions()
  const deleteCommission = useDeleteCommission()
  const puedeEditar = usePuedeEditar('ventas')
  const puedeBorrar = usePuedeBorrar('ventas')

  const [tab,        setTab]        = useState<Tab>('todas')
  const [detailItem, setDetailItem] = useState<CommissionFull | null>(null)

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const filtered = useMemo<CommissionFull[]>(() => {
    if (tab === 'sin_facturar') return commissions.filter(c => c.commission_splits.some(s => !s.facturada))
    if (tab === 'pendientes')   return commissions.filter(c => calcTotals(c).saldoPendiente > 0)
    return commissions
  }, [commissions, tab])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openDetail(c: CommissionFull) { setDetailItem(c) }

  function handleDelete(id: string) {
    deleteCommission.mutate(id, {
      onSuccess: () => toast.success('Venta eliminada'),
      onError:   () => toast.error('Ocurrió un error, intentá nuevamente'),
    })
  }

  const liveDetail = detailItem
    ? (commissions.find(c => c.id === detailItem.id) ?? detailItem)
    : null

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
        {puedeEditar && (
          <button
            onClick={() => navigate('/comisiones/nueva')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva
          </button>
        )}
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
        tab === 'todas'
          ? <EmptyState
              icon={TrendingUp}
              title="Sin ventas todavía"
              description="Registrá tu primera venta para empezar a hacer seguimiento de comisiones."
              action={{ label: 'Registrar venta', onClick: () => navigate('/comisiones/nueva') }}
            />
          : tab === 'sin_facturar'
            ? <EmptyState
                icon={CheckCircle2}
                title="Todo facturado"
                description="Todos los splits de comisión están marcados como facturados."
              />
            : <EmptyState
                icon={Clock}
                title="Sin saldos pendientes"
                description="No hay ventas con pagos pendientes de cobrar."
              />
      )}

      {/* Lista */}
      {filtered.length > 0 && (
        <>
          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <CommissionTable
              commissions={filtered}
              onView={openDetail}
              onEdit={puedeEditar ? c => navigate(`/comisiones/${c.id}/editar`) : undefined}
              onDelete={puedeBorrar ? handleDelete : undefined}
            />
          </div>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(c => (
              <CommissionCard
                key={c.id}
                commission={c}
                onView={openDetail}
                onEdit={puedeEditar ? c => navigate(`/comisiones/${c.id}/editar`) : undefined}
                onDelete={puedeBorrar ? handleDelete : undefined}
              />
            ))}
          </div>
        </>
      )}

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
