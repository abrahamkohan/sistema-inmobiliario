// src/components/clients/ClientHistorySheet.tsx
import { useState } from 'react'
import { Trash2, FileText, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSimulationsByClient, useDeleteSimulation, useGenerateReport } from '@/hooks/useSimulations'
import { useTasksByLead } from '@/hooks/useTasks'
import { getReportUrl } from '@/lib/pdfService'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']
type Tab = 'simulaciones' | 'seguimiento'

const OUTCOME_LABEL: Record<string, string> = {
  interested:     'Interesado',
  no_response:    'Sin respuesta',
  not_interested: 'No interesado',
}
const OUTCOME_CLS: Record<string, string> = {
  interested:     'bg-emerald-100 text-emerald-700',
  no_response:    'bg-gray-100 text-gray-500',
  not_interested: 'bg-red-100 text-red-600',
}

interface ClientHistorySheetProps {
  client: ClientRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientHistorySheet({ client, open, onOpenChange }: ClientHistorySheetProps) {
  const [tab, setTab] = useState<Tab>('simulaciones')
  const { data: simulations = [], isLoading } = useSimulationsByClient(client?.id ?? '')
  const deleteSim = useDeleteSimulation(client?.id ?? '')
  const generateReport = useGenerateReport(client?.id ?? '')
  const { data: allTasks = [] } = useTasksByLead(client?.id ?? '')

  const closedTasks = allTasks
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  if (!client) return null

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta simulación?')) return
    deleteSim.mutate(id)
  }

  function handleGenerate(sim: (typeof simulations)[number]) {
    generateReport.mutate({ sim, clientName: client!.full_name })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{client.full_name}</SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-muted/50 rounded-lg p-1">
          {(['simulaciones', 'seguimiento'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tab === t
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'simulaciones'
                ? 'Simulaciones'
                : `Seguimiento${closedTasks.length > 0 ? ` (${closedTasks.length})` : ''}`}
            </button>
          ))}
        </div>

        {tab === 'simulaciones' ? (
          <>
            <div className="mt-4 flex flex-col gap-1 text-sm">
              {client.email && <p className="text-muted-foreground">{client.email}</p>}
              {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
              {client.nationality && <p className="text-muted-foreground">{client.nationality}</p>}
              {client.notes && (
                <p className="text-muted-foreground border-t pt-3 mt-2">{client.notes}</p>
              )}
            </div>

            <div className="mt-6 border-t pt-6">
              <p className="text-sm font-medium mb-4">
                Simulaciones {simulations.length > 0 && `(${simulations.length})`}
              </p>

              {isLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
              )}

              {!isLoading && simulations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <p className="text-sm text-muted-foreground">No hay simulaciones todavía.</p>
                  <p className="text-xs text-muted-foreground">
                    Generá una desde el Simulador y guardala.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {simulations.map((sim) => {
                  const snap = sim.snapshot_project as Record<string, unknown>
                  const projectName = (snap?.name as string) ?? 'Proyecto'
                  const snapTyp = sim.snapshot_typology as Record<string, unknown>
                  const typName = (snapTyp?.name as string) ?? 'Tipología'
                  const date = new Date(sim.created_at).toLocaleDateString('es-PY')
                  const isGenerating = generateReport.isPending && generateReport.variables?.sim.id === sim.id

                  return (
                    <div key={sim.id} className="border rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium">{projectName} — {typName}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleDelete(sim.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          disabled={isGenerating}
                          onClick={() => handleGenerate(sim)}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          ) : (
                            <FileText className="h-3 w-3 mr-1.5" />
                          )}
                          {isGenerating ? 'Generando...' : 'Generar informe'}
                        </Button>

                        {sim.report_path && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-xs"
                            asChild
                          >
                            <a
                              href={getReportUrl(sim.report_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-3 w-3 mr-1.5" />
                              Descargar PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {closedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin seguimientos registrados aún.
              </p>
            ) : closedTasks.map(task => (
              <div key={task.id} className="border rounded-lg p-3 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.outcome && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${OUTCOME_CLS[task.outcome] ?? ''}`}>
                      {OUTCOME_LABEL[task.outcome] ?? task.outcome}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })
                    .format(new Date(task.updated_at))}
                </p>
                {task.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-1.5 mt-0.5">{task.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
