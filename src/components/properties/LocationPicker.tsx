import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Loader2, MapPin } from 'lucide-react'

// Fix Leaflet icons in Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    suburb?: string
    city?: string
    town?: string
    village?: string
    state?: string
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

// Flies to a coordinate when it changes
function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prev = useRef<string>('')
  useEffect(() => {
    const key = `${lat},${lng}`
    if (key !== prev.current) {
      prev.current = key
      map.flyTo([lat, lng], 15, { duration: 0.8 })
    }
  }, [lat, lng, map])
  return null
}

// Handles map click to place marker
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onClick(e.latlng.lat, e.latlng.lng) })
  return null
}

const ASUNCION: [number, number] = [-25.2867, -57.6478]

export function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return }
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
      setShowResults(data.length > 0)
    } catch { /* ignore */ }
    setIsSearching(false)
  }, [])

  function handleQueryChange(v: string) {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 500)
  }

  function selectResult(r: NominatimResult) {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const zona = r.address.suburb ?? r.address.city ?? r.address.town ?? r.address.village ?? r.address.state ?? ''
    const direccion = r.display_name.split(',').slice(0, 3).join(',').trim()
    onChange({ lat, lng, zona, direccion })
    setFlyTarget({ lat, lng })
    setQuery(direccion)
    setShowResults(false)
    setResults([])
  }

  function handleMapClick(lat: number, lng: number) {
    onChange({ lat, lng, zona: value?.zona ?? '', direccion: value?.direccion ?? '' })
  }

  function handleMarkerDrag(lat: number, lng: number) {
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
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Buscar dirección, barrio o ciudad..."
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
                <span className="text-sm text-gray-700 line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 280 }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : ASUNCION}
          zoom={value ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onClick={handleMapClick} />
          {flyTarget && <MapFlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend(e) {
                  const pos = (e.target as L.Marker).getLatLng()
                  handleMarkerDrag(pos.lat, pos.lng)
                }
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {value
          ? 'Arrastrá el pin para ajustar la ubicación exacta'
          : 'Buscá una dirección o tocá el mapa para colocar el pin'}
      </p>
    </div>
  )
}
