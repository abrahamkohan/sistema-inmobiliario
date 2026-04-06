// src/pages/FlipPage.tsx — lista de cálculos de flip guardados
import { useNavigate } from 'react-router'
import { Plus, TrendingUp, Copy, Trash2, Pencil, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFlips, useDeleteFlip, useDuplicateFlip } from '@/hooks/useFlips'
import { usePuedeEditar, usePuedeBorrar } from '@/hooks/usePermiso'
import { calcFlip } from '@/simulator/engine'
import { formatUsd } from '@/utils/money'

export function FlipPage() {
  const navigate    = useNavigate()
  const { data: list = [], isLoading } = useFlips()
  const deleteFlip    = useDeleteFlip()
  const duplicateFlip = useDuplicateFlip()
  const puedeEditar = usePuedeEditar('flip')
  const puedeBorrar = usePuedeBorrar('flip')

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este flip?')) deleteFlip.mutate(id)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Flip</h1>
          <p className="text-sm text-muted-foreground">Calculadora de reventa · ROI de inversión</p>
        </div>
        {puedeEditar && (
          <Button size="sm" onClick={() => navigate('/flip/nuevo')}>
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
          <TrendingUp className="h-8 w-8 text-gray-300" />
          <p className="text-muted-foreground">No hay cálculos de flip todavía.</p>
          {puedeEditar && <Button variant="outline" onClick={() => navigate('/flip/nuevo')}>Crear el primero</Button>}
        </div>
      )}

      {list.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Precio lista</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Neto inversor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">ROI anual</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(f => {
                  const r = calcFlip(f)
                  return (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{f.label || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatUsd(f.precio_lista)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{formatUsd(r.neto_inversor)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.roi_anualizado.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(f.created_at).toLocaleDateString('es-PY')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-center">
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/flip/${f.id}/imprimir`, '_blank')}>
                            <Printer className="h-3 w-3 mr-1" />Imprimir
                          </Button>
                          {puedeEditar && (
                            <>
                              <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/flip/${f.id}/editar`)}>
                                <Pencil className="h-3 w-3 mr-1" />Editar
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs" onClick={() => duplicateFlip.mutate(f.id)} disabled={duplicateFlip.isPending} title="Duplicar">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {puedeBorrar && (
                            <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(f.id)} disabled={deleteFlip.isPending}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            {list.map(f => {
              const r = calcFlip(f)
              return (
                <div key={f.id} className="rounded-lg border bg-white p-4 flex flex-col gap-2">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{f.label || '—'}</p>
                    <p className="text-sm text-gray-600">{formatUsd(f.precio_lista)} lista · <span className="text-emerald-700 font-semibold">neto {formatUsd(r.neto_inversor)}</span></p>
                    <p className="text-xs text-gray-400">ROI anual {r.roi_anualizado.toFixed(1)}% · {new Date(f.created_at).toLocaleDateString('es-PY')}</p>
                  </div>
                  <div className="flex gap-2 pt-1 border-t">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open(`/flip/${f.id}/imprimir`, '_blank')}>
                      <Printer className="h-3 w-3 mr-1" />Imprimir
                    </Button>
                    {puedeEditar && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/flip/${f.id}/editar`)}>
                          <Pencil className="h-3 w-3 mr-1" />Editar
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => duplicateFlip.mutate(f.id)} disabled={duplicateFlip.isPending}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {puedeBorrar && (
                      <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(f.id)} disabled={deleteFlip.isPending}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
