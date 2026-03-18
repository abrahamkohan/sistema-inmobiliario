import { useState, useCallback, useRef } from 'react'
import { Map, Marker } from 'react-map-gl/maplibre'
import type { MapRef, MapMouseEvent, MarkerDragEvent } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Search, Loader2, MapPin } from 'lucide-react'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

// Nominatim search biased to Paraguay — prioriza Asunción y Luque
const VIEWBOX = '-58.1,-24.8,-57.1,-25.7' // bbox cubre Gran Asunción + Luque

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

export interface LocationValue {
  lat: number
  lng: number
  zona: string
  direccion: string
}

interface Props {
  value: LocationValue | null
  onChange: (value: LocationValue) => void
}

const RESOLVE_MAPS_API = 'https://kohancampos.com.py/api/resolve-maps'

function isGoogleMapsUrl(input: string): boolean {
  return /google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(input.trim())
}

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  const latMatch = url.match(/!3d(-?\d+\.\d+)/)
  const lngMatch = url.match(/!2d(-?\d+\.\d+)/)
  if (latMatch && lngMatch) return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) }
  const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) }
  return null
}

async function resolveGoogleMapsUrl(url: string): Promise<{ lat: number; lng: number } | null> {
  // Try to extract coords directly first (works for full URLs)
  const direct = extractCoordsFromUrl(url)
  if (direct) return direct
  // For short URLs: call API route that resolves server-side
  try {
    const res = await fetch(`${RESOLVE_MAPS_API}?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.coords ?? null
  } catch {
    return null
  }
}

async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '6',
    countrycodes: 'py',
    viewbox: VIEWBOX,
    bounded: '0',           // muestra resultados fuera del bbox pero los rankea abajo
    'accept-language': 'es',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'sistema-inmobiliario/1.0' },
  })
  return res.json()
}

function extractZona(r: NominatimResult): string {
  return (
    r.address.suburb ??
    r.address.neighbourhood ??
    r.address.city ??
    r.address.town ??
    r.address.village ??
    r.address.state ??
    ''
  )
}

function extractDireccion(r: NominatimResult): string {
  // Take first 3 parts of display_name for a clean short address
  return r.display_name.split(',').slice(0, 3).join(',').trim()
}

const DEFAULT_CENTER = { longitude: -57.5759, latitude: -25.2671, zoom: 11 }
// Centrado entre Asunción (-57.6478, -25.2867) y Luque (-57.4867, -25.2671)

export function LocationPicker({ value, onChange }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return }
    setIsSearching(true)
    try {
      const data = await nominatimSearch(q)
      setResults(data)
      setShowResults(data.length > 0)
    } catch { /* ignore */ }
    setIsSearching(false)
  }, [])

  function handleQueryChange(v: string) {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (isGoogleMapsUrl(v)) {
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true)
        const coords = await resolveGoogleMapsUrl(v)
        setIsSearching(false)
        if (coords) {
          const loc: LocationValue = { lat: coords.lat, lng: coords.lng, zona: '', direccion: '' }
          onChange(loc)
          mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 16, duration: 800 })
          setQuery('')
        }
      }, 600)
    } else {
      debounceRef.current = setTimeout(() => search(v), 450)
    }
  }

  function selectResult(r: NominatimResult) {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const loc: LocationValue = {
      lat,
      lng,
      zona: extractZona(r),
      direccion: extractDireccion(r),
    }
    onChange(loc)
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 800 })
    setQuery(loc.direccion)
    setShowResults(false)
    setResults([])
  }

  function handleMapClick(e: MapMouseEvent) {
    const { lat, lng } = e.lngLat
    onChange({ lat, lng, zona: value?.zona ?? '', direccion: value?.direccion ?? '' })
  }

  function handleMarkerDrag(e: MarkerDragEvent) {
    const { lat, lng } = e.lngLat
    onChange({ lat, lng, zona: value?.zona ?? '', direccion: value?.direccion ?? '' })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-gray-300">
          {isSearching
            ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
            : <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          }
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Buscar en Asunción, Luque, San Lorenzo..."
            className="flex-1 text-sm bg-transparent focus:outline-none"
          />
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
            {results.map(r => (
              <button
                key={r.place_id}
                onMouseDown={() => selectResult(r)}
                className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 text-left border-b last:border-0"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 truncate">{r.display_name.split(',').slice(0, 3).join(',')}</p>
                  {r.address.city && (
                    <p className="text-xs text-gray-400">{r.address.city}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 300 }}>
        <Map
          ref={mapRef}
          initialViewState={
            value
              ? { longitude: value.lng, latitude: value.lat, zoom: 15 }
              : DEFAULT_CENTER
          }
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          scrollZoom={false}
          onClick={handleMapClick}
          cursor={value ? 'default' : 'crosshair'}
          attributionControl={false}
        >
          {value && (
            <Marker
              longitude={value.lng}
              latitude={value.lat}
              anchor="bottom"
              draggable
              onDragEnd={handleMarkerDrag}
            >
              <MapPin
                className="w-8 h-8 text-gray-900"
                style={{ filter: 'drop-shadow(0 2px 6px rgb(0 0 0 / 0.3))' }}
              />
            </Marker>
          )}
        </Map>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {value
          ? 'Arrastrá el pin para ajustar la posición exacta'
          : 'Buscá una dirección o tocá el mapa para colocar el pin'}
      </p>
    </div>
  )
}
