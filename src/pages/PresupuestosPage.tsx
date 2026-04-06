// src/pages/PresupuestosPage.tsx
import { useNavigate } from 'react-router'
import { Plus, FileText, Copy, Trash2, Pencil, Loader2, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  usePresupuestos,
  useDeletePresupuesto,
  useDuplicatePresupuesto,
} from '@/hooks/usePresupuestos'
import { usePuedeEditar, usePuedeBorrar } from '@/hooks/usePermiso'

function fmt(n: number) {
  return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PresupuestosPage() {
  const navigate = useNavigate()
  const { data: list = [], isLoading } = usePresupuestos()
  const deleteP    = useDeletePresupuesto()
  const duplicateP = useDuplicatePresupuesto()
  const puedeEditar = usePuedeEditar('presupuestos')
  const puedeBorrar = usePuedeBorrar('presupuestos')

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este presupuesto?')) deleteP.mutate(id)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Presupuestos</h1>
        {puedeEditar && (
          <Button size="sm" onClick={() => navigate('/presupuestos/nuevo')}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Nuevo
          </Button>
        )}
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
          {puedeEditar && <Button variant="outline" onClick={() => navigate('/presupuestos/nuevo')}>Crear el primero</Button>}
        </div>
      )}

      {list.length > 0 && (
        <>
          {/* Desktop table */}
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
                {list.map(p => (
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
                        {puedeEditar && (
                          <>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/presupuestos/${p.id}/editar`)}>
                              <Pencil className="h-3 w-3 mr-1" />Editar
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => duplicateP.mutate(p.id)} disabled={duplicateP.isPending} title="Duplicar">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {puedeBorrar && (
                          <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} disabled={deleteP.isPending}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="flex flex-col gap-2 md:hidden">
            {list.map(p => (
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
                  {puedeEditar && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/presupuestos/${p.id}/editar`)}>
                        <Pencil className="h-3 w-3 mr-1" />Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => duplicateP.mutate(p.id)} disabled={duplicateP.isPending}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {puedeBorrar && (
                    <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} disabled={deleteP.isPending}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
