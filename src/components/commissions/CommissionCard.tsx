// src/components/commissions/CommissionCard.tsx
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { calcTotals, fmtCurrency, getFacturacionStatus } from '@/lib/commissions'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import type { CommissionFull } from '@/lib/commissions'

interface Props {
  commission: CommissionFull
  onView:    (c: CommissionFull) => void
  onEdit?:   (c: CommissionFull) => void
  onDelete?: (id: string) => void
}

export function CommissionCard({ commission: c, onView, onEdit, onDelete }: Props) {
  const { totalCobrado, saldoPendiente, estado } = calcTotals(c)
  const { status: facStatus } = getFacturacionStatus(c)

  const dateStr = c.fecha_cierre
    ? new Date(c.fecha_cierre + 'T00:00:00').toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleteOpen(true)
  }

  return (
    <>
    <div
      onClick={() => onView(c)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex flex-col gap-2.5 cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Fila 1: estado + proyecto + acciones */}
      <div className="flex items-start gap-2">
        <span className="text-lg mt-0.5">{estado}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">{c.proyecto_vendido}</p>
          {dateStr && <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(c) }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-100 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:text-red-500 active:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fila 2: montos */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Importe</p>
          <p className="text-sm font-bold text-gray-900">{fmtCurrency(c.importe_comision)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Cobrado</p>
          <p className="text-sm font-bold text-emerald-600">{fmtCurrency(totalCobrado)}</p>
        </div>
        {saldoPendiente > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Saldo</p>
            <p className="text-sm font-bold text-red-500">{fmtCurrency(saldoPendiente)}</p>
          </div>
        )}
      </div>

      {/* Fila 3: badges */}
      <div className="flex flex-wrap gap-1.5">
        {facStatus === 'completo' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">✓ Facturado</span>
        )}
        {facStatus === 'parcial' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">⚠ Parcial</span>
        )}
        {c.commission_clients.map(cc => (
          <span key={cc.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            cc.tipo === 'vendedor' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {cc.clients.full_name}
          </span>
        ))}
      </div>
    </div>

    {onDelete && (
      <DeleteConfirmDialog
        open={deleteOpen}
        mode="keyword"
        entityName={c.proyecto_vendido}
        onConfirm={() => { onDelete(c.id); setDeleteOpen(false) }}
        onCancel={() => setDeleteOpen(false)}
      />
    )}
    </>
  )
}
