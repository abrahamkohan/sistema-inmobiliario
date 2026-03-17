import { useState, useMemo } from 'react'
import { Search, Plus, Home } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { PropertyCard } from '@/components/properties/PropertyCard'
import type { PropertyRow } from '@/lib/properties'

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
  const { data: properties = [], isLoading } = useProperties()
  const { data: consultora } = useConsultoraConfig()
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

  function handleConsultar(property: PropertyRow) {
    if (consultora?.whatsapp) {
      const title = property.titulo || `${TIPO_LABEL[property.tipo] ?? property.tipo} en ${property.zona}`
      const msg = encodeURIComponent(`Hola, me interesa la propiedad: ${title}`)
      window.open(`https://wa.me/${consultora.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
    }
  }

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
          disabled
          title="Próximamente"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Home className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Sin propiedades</p>
          <p className="text-sm text-gray-400 mt-1">La carga de propiedades estará disponible próximamente</p>
        </div>
      )}

      {/* No results */}
      {!isLoading && properties.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">
          Sin resultados para la búsqueda actual
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <PropertyCard key={p.id} property={p} onConsultar={handleConsultar} />
          ))}
        </div>
      )}
    </div>
  )
}
