import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Save, Camera, X, MapPin, Link } from 'lucide-react'
import { toast } from 'sonner'
import {
  useProperty, usePropertyPhotos, useUpdateProperty,
  useAddPropertyPhoto, useDeletePropertyPhoto,
} from '@/hooks/useProperties'
import { getPhotoUrl } from '@/lib/properties'
import { LocationPicker } from '@/components/properties/LocationPicker'
import type { LocationValue } from '@/components/properties/LocationPicker'

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITIES = [
  { id: 'aire', label: 'Aire acondicionado' },
  { id: 'calefaccion', label: 'Calefacción' },
  { id: 'placares', label: 'Placares' },
  { id: 'balcon', label: 'Balcón' },
  { id: 'terraza', label: 'Terraza' },
  { id: 'cocina_equipada', label: 'Cocina equipada' },
  { id: 'lavanderia', label: 'Lavandería' },
  { id: 'piscina', label: 'Piscina' },
  { id: 'gimnasio', label: 'Gimnasio' },
  { id: 'parrilla', label: 'Parrilla / Quincho' },
  { id: 'jardin', label: 'Jardín' },
  { id: 'seguridad', label: 'Seguridad 24h' },
  { id: 'ascensor', label: 'Ascensor' },
  { id: 'salon', label: 'Salón de usos' },
  { id: 'estacionamiento', label: 'Estacionamiento' },
  { id: 'amoblado', label: 'Amoblado' },
]

// ─── Google Maps URL parser ────────────────────────────────────────────────────

function parseGoogleMapsInput(input: string): { lat: number; lng: number } | null {
  const text = input.trim()
  const iframeMatch = text.match(/src="([^"]+)"/)
  const url = iframeMatch ? iframeMatch[1] : text
  // @lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  // q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  // embed: !3dLAT and !2dLNG
  const latMatch = url.match(/!3d(-?\d+\.\d+)/)
  const lngMatch = url.match(/!2d(-?\d+\.\d+)/)
  if (latMatch && lngMatch) return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) }
  return null
}

function extractAmenities(desc: string): { intro: string; amenityIds: string[] } {
  const lines = desc.split('\n')
  const intro: string[] = []
  const foundIds: string[] = []
  for (const line of lines) {
    const t = line.trim().replace(/^[•\-\*]\s*/, '')
    const match = AMENITIES.find(a => a.label.toLowerCase() === t.toLowerCase())
    if (match) foundIds.push(match.id)
    else if (/^[•\-\*]/.test(line.trim())) intro.push(line)
    else if (line.trim()) intro.push(line)
  }
  return { intro: intro.join('\n'), amenityIds: foundIds }
}

function buildDescription(intro: string, amenityIds: string[]): string {
  const lines: string[] = intro ? [intro] : []
  const labels = amenityIds.map(id => AMENITIES.find(a => a.id === id)?.label).filter(Boolean) as string[]
  if (labels.length > 0) {
    if (lines.length > 0) lines.push('')
    labels.forEach(l => lines.push(`• ${l}`))
  }
  return lines.join('\n').trim()
}

// ─── Reusable components ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</p>
      {children}
    </div>
  )
}

function ButtonGroup<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            value === o.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NumberSelector({ label, value, options, onChange }: {
  label: string
  value: number | null
  options: { value: number; label: string }[]
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(value === o.value ? null : o.value)}
            className={`w-10 h-10 rounded-xl text-sm font-medium border transition-colors ${
              value === o.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between w-full group">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

interface Draft {
  titulo: string
  tipo: string
  operacion: string
  estado: string
  dormitorios: number | null
  banos: number | null
  superficie_m2: string
  terreno_m2: string
  superficie_cubierta_m2: string
  garajes: number | null
  piso: string
  condicion: string
  descIntro: string
  amenityIds: string[]
  precio: string
  moneda: 'USD' | 'PYG'
  publicado_en_web: boolean
  zona: string
  direccion: string
  latitud: number | null
  longitud: number | null
}

export function PropiedadEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(id!)
  const { data: photos = [] } = usePropertyPhotos(id!)
  const updateProperty = useUpdateProperty()
  const addPhoto = useAddPropertyPhoto()
  const deletePhoto = useDeletePropertyPhoto()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mapsInput, setMapsInput] = useState('')
  const [mapsError, setMapsError] = useState('')
  const [showMapsPaste, setShowMapsPaste] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize draft from property
  useEffect(() => {
    if (!property || draft) return
    const { intro, amenityIds } = property.descripcion
      ? extractAmenities(property.descripcion)
      : { intro: '', amenityIds: [] }
    setDraft({
      titulo: property.titulo ?? '',
      tipo: property.tipo ?? 'departamento',
      operacion: property.operacion ?? 'venta',
      estado: (property as any).estado ?? 'activo',
      dormitorios: property.dormitorios ?? null,
      banos: property.banos ?? null,
      superficie_m2: property.superficie_m2 != null ? String(property.superficie_m2) : '',
      terreno_m2: property.terreno_m2 != null ? String(property.terreno_m2) : '',
      superficie_cubierta_m2: property.superficie_cubierta_m2 != null ? String(property.superficie_cubierta_m2) : '',
      garajes: property.garajes ?? null,
      piso: property.piso != null ? String(property.piso) : '',
      condicion: property.condicion ?? '',
      descIntro: intro,
      amenityIds,
      precio: property.precio != null ? String(property.precio) : '',
      moneda: (property.moneda as 'USD' | 'PYG') ?? 'USD',
      publicado_en_web: property.publicado_en_web ?? false,
      zona: property.zona ?? '',
      direccion: property.direccion ?? '',
      latitud: property.latitud ?? null,
      longitud: property.longitud ?? null,
    })
  }, [property, draft])

  const patch = useCallback((partial: Partial<Draft>) => {
    setDraft(prev => prev ? { ...prev, ...partial } : prev)
    setIsDirty(true)
  }, [])

  function handleLocationChange(loc: LocationValue) {
    patch({ latitud: loc.lat, longitud: loc.lng, zona: loc.zona, direccion: loc.direccion })
  }

  function handleMapsPaste() {
    const parsed = parseGoogleMapsInput(mapsInput)
    if (!parsed) {
      setMapsError('No se pudo extraer la ubicación. Usá una URL completa de Google Maps o un iframe embed.')
      return
    }
    patch({ latitud: parsed.lat, longitud: parsed.lng })
    setMapsInput('')
    setMapsError('')
    setShowMapsPaste(false)
    toast.success('Coordenadas actualizadas')
  }

  async function handleSave() {
    if (!draft || !property) return
    setSaving(true)
    try {
      const descripcion = buildDescription(draft.descIntro, draft.amenityIds)
      await updateProperty.mutateAsync({
        id: property.id,
        input: {
          titulo: draft.titulo || null,
          tipo: draft.tipo as any,
          operacion: draft.operacion as any,
          estado: draft.estado as any,
          dormitorios: draft.dormitorios,
          banos: draft.banos,
          superficie_m2: draft.superficie_m2 ? parseFloat(draft.superficie_m2) : null,
          terreno_m2: draft.terreno_m2 ? parseFloat(draft.terreno_m2) : null,
          superficie_cubierta_m2: draft.superficie_cubierta_m2 ? parseFloat(draft.superficie_cubierta_m2) : null,
          garajes: draft.garajes,
          piso: draft.piso ? parseInt(draft.piso) : null,
          condicion: draft.condicion as any || null,
          descripcion: descripcion || null,
          precio: draft.precio ? parseFloat(draft.precio) : null,
          moneda: draft.moneda,
          publicado_en_web: draft.publicado_en_web,
          zona: draft.zona || null,
          direccion: draft.direccion || null,
          latitud: draft.latitud,
          longitud: draft.longitud,
        },
      })
      setIsDirty(false)
      toast.success('Cambios guardados')
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !property) return
    const files = Array.from(e.target.files)
    const base = photos.length
    for (let i = 0; i < files.length; i++) {
      try {
        await addPhoto.mutateAsync({ propertyId: property.id, file: files[i], sortOrder: base + i })
      } catch {
        toast.error(`Error subiendo foto ${files[i].name}`)
      }
    }
    toast.success(`${files.length} foto${files.length !== 1 ? 's' : ''} agregada${files.length !== 1 ? 's' : ''}`)
    e.target.value = ''
  }

  async function handleDeletePhoto(photo: any) {
    try {
      await deletePhoto.mutateAsync(photo)
    } catch {
      toast.error('Error eliminando foto')
    }
  }

  // ── Loading ──
  if (isLoading || !draft) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  const numOpts = [0, 1, 2, 3, 4, 5].map(n => ({ value: n, label: n === 5 ? '5+' : String(n) }))
  const locationValue = draft.latitud && draft.longitud
    ? { lat: draft.latitud, lng: draft.longitud, zona: draft.zona, direccion: draft.direccion }
    : null

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-4 pb-28 flex flex-col gap-4">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/propiedades/${id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <p className="text-sm font-medium text-gray-700">Editar propiedad</p>
          <div className="w-16" />
        </div>

        {/* 1. Info general */}
        <Section title="Info general">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs text-gray-500 mb-2">Tipo</p>
              <ButtonGroup
                options={[
                  { value: 'departamento', label: 'Departamento' },
                  { value: 'casa', label: 'Casa' },
                  { value: 'terreno', label: 'Terreno' },
                  { value: 'comercial', label: 'Comercial' },
                ]}
                value={draft.tipo as any}
                onChange={v => patch({ tipo: v })}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Operación</p>
              <ButtonGroup
                options={[{ value: 'venta', label: 'Venta' }, { value: 'alquiler', label: 'Alquiler' }]}
                value={draft.operacion as any}
                onChange={v => patch({ operacion: v })}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Título</p>
              <input
                value={draft.titulo}
                onChange={e => patch({ titulo: e.target.value })}
                placeholder="Título de la propiedad"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>
        </Section>

        {/* 2. Estado y publicación */}
        <Section title="Estado y publicación">
          <div className="flex flex-col gap-4">
            <Toggle
              checked={draft.estado !== 'inactivo'}
              onChange={v => patch({ estado: v ? 'activo' : 'inactivo' })}
              label="Propiedad activa"
              sub="Las propiedades inactivas no se muestran en el sistema"
            />
            <div className="border-t border-gray-100" />
            <Toggle
              checked={draft.publicado_en_web}
              onChange={v => patch({ publicado_en_web: v })}
              label="Publicar en la web"
              sub="Visible en kohancampos.com.py"
            />
          </div>
        </Section>

        {/* 3. Precio */}
        <Section title="Precio">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(['USD', 'PYG'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => patch({ moneda: m })}
                  className={`px-5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    draft.moneda === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                {draft.moneda === 'USD' ? '$' : '₲'}
              </span>
              <input
                type="number"
                value={draft.precio}
                onChange={e => patch({ precio: e.target.value })}
                placeholder="0"
                className="w-full pl-8 pr-3 py-3 text-xl font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            {draft.precio && (
              <p className="text-sm text-gray-400">
                {draft.moneda === 'USD' ? 'USD' : 'PYG'} {parseFloat(draft.precio).toLocaleString('es-PY')}
                {draft.superficie_m2 && parseFloat(draft.superficie_m2) > 0 && (
                  <span className="ml-2">
                    · {draft.moneda === 'USD' ? '$' : '₲'} {Math.round(parseFloat(draft.precio) / parseFloat(draft.superficie_m2)).toLocaleString('es-PY')}/m²
                  </span>
                )}
              </p>
            )}
          </div>
        </Section>

        {/* 4. Detalles */}
        <Section title="Detalles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <NumberSelector label="Dormitorios" value={draft.dormitorios} options={numOpts.slice(0, 6)} onChange={v => patch({ dormitorios: v })} />
            <NumberSelector label="Baños" value={draft.banos} options={numOpts.slice(0, 6)} onChange={v => patch({ banos: v })} />
            <NumberSelector label="Garajes" value={draft.garajes} options={numOpts.slice(0, 5)} onChange={v => patch({ garajes: v })} />
            <div>
              <p className="text-xs text-gray-500 mb-2">Piso</p>
              <input
                type="number"
                value={draft.piso}
                onChange={e => patch({ piso: e.target.value })}
                placeholder="—"
                className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-center"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Superficie total (m²)</p>
              <input
                type="number"
                value={draft.superficie_m2}
                onChange={e => patch({ superficie_m2: e.target.value })}
                placeholder="—"
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-center"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Sup. cubierta (m²)</p>
              <input
                type="number"
                value={draft.superficie_cubierta_m2}
                onChange={e => patch({ superficie_cubierta_m2: e.target.value })}
                placeholder="—"
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-center"
              />
            </div>
            {(draft.tipo === 'casa' || draft.tipo === 'terreno') && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Terreno (m²)</p>
                <input
                  type="number"
                  value={draft.terreno_m2}
                  onChange={e => patch({ terreno_m2: e.target.value })}
                  placeholder="—"
                  className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-center"
                />
              </div>
            )}
          </div>
          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-2">Condición</p>
            <ButtonGroup
              options={[{ value: 'nuevo', label: 'Nuevo' }, { value: 'usado', label: 'Usado' }, { value: 'reventa', label: 'Reventa' }]}
              value={draft.condicion as any}
              onChange={v => patch({ condicion: v })}
            />
          </div>
        </Section>

        {/* 5. Descripción */}
        <Section title="Descripción">
          <textarea
            value={draft.descIntro}
            onChange={e => patch({ descIntro: e.target.value })}
            placeholder="Descripción de la propiedad..."
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none leading-relaxed"
          />
        </Section>

        {/* 6. Comodidades */}
        <Section title="Comodidades">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => {
              const active = draft.amenityIds.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? draft.amenityIds.filter(x => x !== a.id)
                      : [...draft.amenityIds, a.id]
                    patch({ amenityIds: next })
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    active ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {a.label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* 7. Ubicación */}
        <Section title="Ubicación">
          <div className="flex flex-col gap-4">
            {/* Google Maps paste */}
            <div>
              <button
                type="button"
                onClick={() => setShowMapsPaste(v => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Link className="w-3.5 h-3.5" />
                {showMapsPaste ? 'Cerrar' : 'Pegar link o iframe de Google Maps'}
              </button>
              {showMapsPaste && (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={mapsInput}
                    onChange={e => { setMapsInput(e.target.value); setMapsError('') }}
                    placeholder={'Pegá la URL de Google Maps o el código iframe embed\nEj: https://www.google.com/maps?q=-25.28,-57.64\n    <iframe src="https://www.google.com/maps/embed?pb=...">'}
                    rows={3}
                    className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none font-mono"
                  />
                  {mapsError && <p className="text-xs text-red-500">{mapsError}</p>}
                  <button
                    type="button"
                    onClick={handleMapsPaste}
                    className="self-start px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Extraer coordenadas
                  </button>
                </div>
              )}
            </div>

            {draft.latitud && draft.longitud && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                {draft.latitud.toFixed(5)}, {draft.longitud.toFixed(5)}
              </div>
            )}

            {/* Zona y dirección */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Zona</p>
                <input
                  value={draft.zona}
                  onChange={e => patch({ zona: e.target.value })}
                  placeholder="Ej: Asunción"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Dirección</p>
                <input
                  value={draft.direccion}
                  onChange={e => patch({ direccion: e.target.value })}
                  placeholder="Ej: Av. Mcal. López 123"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Mapa interactivo */}
            <div>
              <p className="text-xs text-gray-500 mb-2">O buscá en el mapa</p>
              <LocationPicker value={locationValue} onChange={handleLocationChange} />
            </div>
          </div>
        </Section>

        {/* 8. Fotos */}
        <Section title="Fotos">
          <div className="flex flex-col gap-4">
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="relative group aspect-square">
                    <img
                      src={getPhotoUrl(photo.storage_path)}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-gray-900/70 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        Portada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Agregar fotos
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
          </div>
        </Section>

      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/propiedades/${id}`)}
          className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isDirty && !saving
              ? 'bg-gray-900 text-white hover:bg-gray-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )
}
