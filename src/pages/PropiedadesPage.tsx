import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Search, Plus, Building2 } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { EmptyState } from '@/components/ui/EmptyState'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
}

const FILTROS_OP = [
  { value: '', label: 'Todos' },
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
]

const FILTROS_TIPO = [
  { value: '', label: 'Todos' },
  { value: 'departamento', label: 'Depto' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
]

export function PropiedadesPage() {
  const navigate = useNavigate()
  const { data: properties = [], isLoading } = useProperties()
  const [search, setSearch] = useState('')
  const [filterOp, setFilterOp] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  const filtered = useMemo(() => {
    return properties.filter(p => {
      if (filterOp && p.operacion !== filterOp) return false
      if (filterTipo && p.tipo !== filterTipo) return false
      if (search) {
        const q = search.toLowerCase()
        const title = (p.titulo ?? `${TIPO_LABEL[p.tipo]} en ${p.zona}`).toLowerCase()
        if (!title.includes(q) && !(p.zona ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [properties, search, filterOp, filterTipo])

  const groups = useMemo(() => {
    const venta    = filtered.filter(p => p.operacion === 'venta')
    const alquiler = filtered.filter(p => p.operacion === 'alquiler')
    return [
      { key: 'venta',    label: 'Venta',    items: venta },
      { key: 'alquiler', label: 'Alquiler', items: alquiler },
    ].filter(g => g.items.length > 0)
  }, [filtered])

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Propiedades</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {properties.length === 0 ? 'Sin propiedades' : `${properties.length} propiedad${properties.length !== 1 ? 'es' : ''}`}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/propiedades/nueva')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva propiedad</span>
        </button>
      </div>

      {/* Filters */}
      {properties.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título o zona..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterOp}
              onChange={e => setFilterOp(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
            >
              {FILTROS_OP.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
            >
              {FILTROS_TIPO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && properties.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Sin propiedades"
          description="Cargá tu primera propiedad para empezar a gestionarla."
          action={{ label: 'Nueva propiedad', onClick: () => navigate('/propiedades/nueva') }}
        />
      )}

      {/* No results */}
      {!isLoading && properties.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="No hay propiedades que coincidan con los filtros actuales."
        />
      )}

      {/* Grid agrupado por operación */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Header de grupo — solo si hay más de un grupo visible */}
              {groups.length > 1 && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{group.label}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{group.items.length}</span>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.items.map(p => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
