// src/pages/SimuladorPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimSelector } from '@/components/simulator/SimSelector'
import { ScenarioAirbnb } from '@/components/simulator/ScenarioAirbnb'
import { ScenarioAlquiler } from '@/components/simulator/ScenarioAlquiler'
import { ScenarioPlusvalia } from '@/components/simulator/ScenarioPlusvalia'
import { useSimStore, useAirbnbInputs, useAlquilerInputs, usePlusvaliaInputs } from '@/simulator/store'
import { calcAirbnb, calcAlquiler, calcPlusvalia } from '@/simulator/engine'
import { useSaveSimulation } from '@/hooks/useSimulations'
import { useProjects } from '@/hooks/useProjects'
import { useTypologies } from '@/hooks/useTypologies'
import { formatUsd } from '@/utils/money'

type Tab = 'airbnb' | 'alquiler' | 'plusvalia'

const TABS: {
  id: Tab
  label: string
  sublabel: string
  activeColor: string
  activeBg: string
  activeBorder: string
  dot: string
}[] = [
  {
    id: 'airbnb',
    label: 'Airbnb / STR',
    sublabel: 'Temporal',
    activeColor: '#0369a1',
    activeBg: '#e0f2fe',
    activeBorder: '#0369a1',
    dot: '#0369a1',
  },
  {
    id: 'alquiler',
    label: 'Tradicional',
    sublabel: 'Largo plazo',
    activeColor: '#475569',
    activeBg: '#f1f5f9',
    activeBorder: '#475569',
    dot: '#475569',
  },
  {
    id: 'plusvalia',
    label: 'Plusvalía',
    sublabel: 'En obra',
    activeColor: '#b45309',
    activeBg: '#fef3c7',
    activeBorder: '#d97706',
    dot: '#d97706',
  },
]

export function SimuladorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('airbnb')
  const [modoRapido, setModoRapido] = useState(false)
  const [rapido, setRapido] = useState({ proyecto: '', tipologia: '', cliente: '', precio: '' })
  const navigate = useNavigate()
  const { projectId, typologyId, clientId, baseValues, overrides, resetOverrides, reset, setBaseValues } = useSimStore()
  const saveSimulation = useSaveSimulation()

  const { data: projects = [] } = useProjects()
  const { data: typologies = [] } = useTypologies(projectId ?? '')

  const airbnbInputs = useAirbnbInputs()
  const alquilerInputs = useAlquilerInputs()
  const plusvaliaInputs = usePlusvaliaInputs()

  const rapidoPrecio = parseFloat(rapido.precio)
  const isReadyRapido = !!(modoRapido && rapido.proyecto && rapido.tipologia && rapido.cliente && rapidoPrecio > 0)
  const isReady = modoRapido ? isReadyRapido : !!(projectId && typologyId && clientId && baseValues?.price_usd)
  function handleRapidoChange(field: keyof typeof rapido, val: string) {
    const next = { ...rapido, [field]: val }
    setRapido(next)
    if (field === 'precio') {
      const p = parseFloat(val)
      if (!isNaN(p) && p > 0) setBaseValues({ price_usd: p, cochera_price: 0, baulera_price: 0 })
    }
  }

  async function handleSave() {
    let snapshotProject: Record<string, unknown>
    let snapshotTypology: Record<string, unknown>
    let clientIdToSave: string | undefined = undefined
    let projectIdToSave: string | undefined = undefined
    let typologyIdToSave: string | undefined = undefined

    if (modoRapido) {
      snapshotProject  = { name: rapido.proyecto, location: '', developer_name: '' }
      snapshotTypology = { name: rapido.tipologia, area_m2: 0, unit_type: 'otro' }
    } else {
      if (!projectId || !typologyId || !clientId) return
      const project = projects.find((p) => p.id === projectId)
      const typology = typologies.find((t) => t.id === typologyId)
      if (!project || !typology) return
      snapshotProject  = project as unknown as Record<string, unknown>
      snapshotTypology = typology as unknown as Record<string, unknown>
      clientIdToSave   = clientId
      projectIdToSave  = projectId
      typologyIdToSave = typologyId
    }

    const saved = await saveSimulation.mutateAsync({
      client_id: clientIdToSave,
      project_id: projectIdToSave,
      typology_id: typologyIdToSave,
      scenario_airbnb:    { inputs: airbnbInputs,    result: calcAirbnb(airbnbInputs) },
      scenario_alquiler:  { inputs: alquilerInputs,  result: calcAlquiler(alquilerInputs) },
      scenario_plusvalia: { inputs: plusvaliaInputs, result: calcPlusvalia(plusvaliaInputs) },
      snapshot_project:  { ...snapshotProject,  _cliente: modoRapido ? rapido.cliente : undefined },
      snapshot_typology: snapshotTypology,
      report_path: null,
    })

    window.open(`/informes/${saved.id}`, '_blank')
    reset()
    setRapido({ proyecto: '', tipologia: '', cliente: '', precio: '' })
    navigate('/')
  }

  const activeTabDef = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Simulador</h1>
          <p className="text-sm text-muted-foreground">Calculá el retorno de tu inversión</p>
        </div>
        <div className="flex gap-2">
          {Object.keys(overrides).length > 0 && (
            <Button variant="outline" size="sm" onClick={resetOverrides}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Resetear
            </Button>
          )}
          <Button size="sm" disabled={!isReady || saveSimulation.isPending} onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saveSimulation.isPending ? 'Guardando...' : 'Guardar simulación'}
          </Button>
        </div>
      </div>

      {/* Selector */}
      {(
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Selección</p>
            <button
              onClick={() => {
                setModoRapido(!modoRapido)
                setRapido({ proyecto: '', tipologia: '', cliente: '', precio: '' })
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                modoRapido
                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <Zap className="h-3 w-3" />
              {modoRapido ? 'Modo Casual activo' : 'Modo Casual'}
            </button>
          </div>

          {modoRapido ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs text-gray-500">Proyecto</Label>
                <Input
                  placeholder="Ej: Torre Norte"
                  value={rapido.proyecto}
                  onChange={(e) => handleRapidoChange('proyecto', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-gray-500">Tipología</Label>
                <Input
                  placeholder="Ej: 2 Dormitorios"
                  value={rapido.tipologia}
                  onChange={(e) => handleRapidoChange('tipologia', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-gray-500">Cliente</Label>
                <Input
                  placeholder="Nombre del cliente"
                  value={rapido.cliente}
                  onChange={(e) => handleRapidoChange('cliente', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-gray-500">Precio USD</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ej: 85000"
                  value={rapido.precio}
                  onChange={(e) => handleRapidoChange('precio', e.target.value)}
                />
              </div>
              {isReadyRapido && rapidoPrecio > 0 && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Unidad: <strong className="text-gray-700">{formatUsd(rapidoPrecio)}</strong>
                </p>
              )}
              {!isReadyRapido && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Completá todos los campos para continuar.
                </p>
              )}
            </div>
          ) : (
            <>
              <SimSelector />
              {isReady && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Unidad: <strong className="text-gray-700">{formatUsd(baseValues?.price_usd ?? 0)}</strong></span>
                  {(baseValues?.cochera_price ?? 0) > 0 && (
                    <span>Cochera: <strong className="text-gray-700">+ {formatUsd(baseValues?.cochera_price ?? 0)}</strong></span>
                  )}
                  {(baseValues?.baulera_price ?? 0) > 0 && (
                    <span>Baulera: <strong className="text-gray-700">+ {formatUsd(baseValues?.baulera_price ?? 0)}</strong></span>
                  )}
                  {((baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0)) > 0 && (
                    <span className="font-medium text-gray-700">
                      Total: <strong>{formatUsd((baseValues?.price_usd ?? 0) + (baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0))}</strong>
                    </span>
                  )}
                </div>
              )}
              {!isReady && (
                <p className="text-xs text-muted-foreground">
                  Seleccioná proyecto, tipología y cliente para comenzar.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">

        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 min-w-[100px] flex flex-col items-center gap-0.5 px-4 py-3 text-sm transition-colors whitespace-nowrap"
                style={
                  isActive
                    ? { background: tab.activeBg, color: tab.activeColor }
                    : { color: '#9ca3af' }
                }
              >
                {/* Active indicator bar at top */}
                {isActive && (
                  <span
                    className="absolute top-0 left-0 right-0 h-0.5 rounded-b"
                    style={{ background: tab.activeBorder }}
                  />
                )}
                {/* Dot */}
                <span
                  className="h-2 w-2 rounded-full mb-0.5"
                  style={{ background: isActive ? tab.dot : '#e5e7eb' }}
                />
                <span className="font-semibold text-xs leading-tight">{tab.label}</span>
                <span className="text-[10px] leading-tight opacity-70">{tab.sublabel}</span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div
          className="p-5"
          style={{ borderTop: `3px solid ${activeTabDef.activeBorder}` }}
        >
          {!isReady ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Completá la selección arriba para ver los escenarios.
            </p>
          ) : (
            <>
              {activeTab === 'airbnb'    && <ScenarioAirbnb />}
              {activeTab === 'alquiler'  && <ScenarioAlquiler />}
              {activeTab === 'plusvalia' && <ScenarioPlusvalia />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
