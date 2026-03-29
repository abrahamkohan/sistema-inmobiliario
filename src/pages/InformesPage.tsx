// src/pages/InformesPage.tsx
import { useState } from 'react'
import { Globe, Loader2, Zap, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAllSimulations, useDeleteSimulation } from '@/hooks/useSimulations'
import { SimEditDialog } from '@/components/simulator/SimEditDialog'
import { useIsAdmin } from '@/hooks/useUserRole'
import { ReporteAgentes } from '@/components/reports/ReporteAgentes'
import type { Database } from '@/types/database'

type SimRow = Database['public']['Tables']['simulations']['Row']

export function InformesPage() {
  const { data: simulations = [], isLoading } = useAllSimulations()
  const isAdmin = useIsAdmin()

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const regular = simulations.filter((s) => s.client_id != null)
  const casual  = simulations.filter((s) => s.client_id == null)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Informes</h1>

      {isAdmin && <ReporteAgentes />}

      {simulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-gray-400 text-sm">No hay simulaciones guardadas todavía.</p>
          <p className="text-gray-300 text-xs">Generá una desde el Simulador.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {regular.length > 0 && <SimSection title="Simulaciones" sims={regular} />}
          {casual.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Proyectos Casuales</h2>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <SimSection sims={casual} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SimSection({ title, sims }: { title?: string; sims: SimRow[] }) {
  const [editing, setEditing] = useState<SimRow | null>(null)

  return (
    <>
      {editing && <SimEditDialog sim={editing} onClose={() => setEditing(null)} />}
      <div className="flex flex-col gap-3">
        {title && <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</h2>}

        {/* Desktop: tabla */}
        <div className="hidden md:block rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Proyecto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Tipología</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sims.map((sim) => (
                <SimRowDesktop key={sim.id} sim={sim} onEdit={() => setEditing(sim)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="flex flex-col gap-2 md:hidden">
          {sims.map((sim) => (
            <SimCardMobile key={sim.id} sim={sim} onEdit={() => setEditing(sim)} />
          ))}
        </div>
      </div>
    </>
  )
}

function getDisplayName(sim: SimRow) {
  const snap = sim.snapshot_project as Record<string, unknown>
  const isCasual = sim.client_id == null
  return isCasual
    ? ((snap?._cliente as string) ?? '—')
    : ((sim as SimRow & { client_name?: string | null }).client_name ?? (sim.client_id?.slice(0, 8) + '...'))
}

function SimRowDesktop({ sim, onEdit }: { sim: SimRow; onEdit: () => void }) {
  const deleteSimulation = useDeleteSimulation()
  const snap    = sim.snapshot_project  as Record<string, unknown>
  const snapTyp = sim.snapshot_typology as Record<string, unknown>

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-700">{getDisplayName(sim)}</td>
      <td className="px-4 py-3 text-gray-700">{(snap?.name as string) ?? '—'}</td>
      <td className="px-4 py-3 text-gray-500">{(snapTyp?.name as string) ?? '—'}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(sim.created_at).toLocaleDateString('es-PY')}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 justify-center">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/informes/${sim.id}`, '_blank')}>
            <Globe className="h-3 w-3 mr-1" />Ver
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />Editar
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={() => { if (confirm('¿Eliminar esta simulación?')) deleteSimulation.mutate(sim.id) }}
            disabled={deleteSimulation.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

function SimCardMobile({ sim, onEdit }: { sim: SimRow; onEdit: () => void }) {
  const deleteSimulation = useDeleteSimulation()
  const snap    = sim.snapshot_project  as Record<string, unknown>
  const snapTyp = sim.snapshot_typology as Record<string, unknown>
  const date    = new Date(sim.created_at).toLocaleDateString('es-PY')

  return (
    <div className="rounded-lg border bg-white p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate">{getDisplayName(sim)}</p>
          <p className="text-sm text-gray-600 truncate">{(snap?.name as string) ?? '—'}</p>
          <p className="text-xs text-gray-400">{(snapTyp?.name as string) ?? '—'} · {date}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1 border-t">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open(`/informes/${sim.id}`, '_blank')}>
          <Globe className="h-3 w-3 mr-1" />Ver informe
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="outline" size="sm"
          className="text-xs text-destructive hover:text-destructive"
          onClick={() => { if (confirm('¿Eliminar esta simulación?')) deleteSimulation.mutate(sim.id) }}
          disabled={deleteSimulation.isPending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
