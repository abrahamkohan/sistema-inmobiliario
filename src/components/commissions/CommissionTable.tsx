// src/components/commissions/CommissionTable.tsx
import { useState } from 'react'
import { Eye, Pencil, Trash2, Link2 } from 'lucide-react'
import { calcTotals, fmtCurrency, getFacturacionStatus } from '@/lib/commissions'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import type { CommissionFull } from '@/lib/commissions'

interface Props {
  commissions: CommissionFull[]
  onView:    (c: CommissionFull) => void
  onEdit?:   (c: CommissionFull) => void
  onDelete?: (id: string) => void
}

function Row({ c, onView, onEdit, onDelete }: { c: CommissionFull } & Omit<Props, 'commissions'>) {
  const { totalCobrado, saldoPendiente, estado } = calcTotals(c)
  const { status } = getFacturacionStatus(c)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const dateStr = c.fecha_cierre
    ? new Date(c.fecha_cierre + 'T00:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  function handleDelete() { setDeleteOpen(true) }

  const facturacionBadge = {
    completo:     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">✓ Completo</span>,
    parcial:      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">⚠ Parcial</span>,
    sin_facturar: <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">—</span>,
  }[status]

  return (
    <>
    <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors group">
      {/* Estado */}
      <td className="px-4 py-3 text-xl text-center w-10">{estado}</td>

      {/* Proyecto */}
      <td className="px-4 py-3 max-w-[200px]">
        <button onClick={() => onView(c)} className="text-left w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900 hover:underline truncate">{c.proyecto_vendido}</span>
            {c.projects && <span title={`Vinculado: ${c.projects.name}`}><Link2 className="w-3 h-3 text-blue-400 flex-shrink-0" /></span>}
          </div>
          {c.projects?.developer_name && (
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.projects.developer_name}</p>
          )}
          {c.commission_clients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {c.commission_clients.map(cc => (
                <span key={cc.id} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  cc.tipo === 'vendedor' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {cc.clients.full_name}
                </span>
              ))}
            </div>
          )}
        </button>
      </td>

      {/* Fecha cierre */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{dateStr}</td>

      {/* Valor venta */}
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {c.valor_venta ? fmtCurrency(c.valor_venta) : '—'}
        {c.porcentaje_comision ? <span className="text-[11px] text-gray-400 ml-1">({c.porcentaje_comision}%)</span> : null}
      </td>

      {/* Importe comisión */}
      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
        {fmtCurrency(c.importe_comision)}
      </td>

      {/* Total cobrado */}
      <td className="px-4 py-3 text-sm font-semibold text-emerald-600 whitespace-nowrap">
        {fmtCurrency(totalCobrado)}
      </td>

      {/* Saldo */}
      <td className="px-4 py-3 text-sm font-bold whitespace-nowrap">
        <span className={saldoPendiente > 0 ? 'text-red-500' : 'text-gray-400'}>
          {fmtCurrency(saldoPendiente)}
        </span>
      </td>

      {/* Facturación */}
      <td className="px-4 py-3">{facturacionBadge}</td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onView(c)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Ver detalle">
            <Eye className="w-3.5 h-3.5" />
          </button>
          {onEdit && (
            <button onClick={() => onEdit(c)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={handleDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>

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

export function CommissionTable({ commissions, onView, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-center font-semibold text-foreground w-10"></th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Proyecto</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Cierre</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Valor venta</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Comisión</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Cobrado</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Saldo</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Facturado</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {commissions.map(c => (
            <Row key={c.id} c={c} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          ))}
          {commissions.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                Sin resultados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
