import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Camera, Home, Key, Building2, Map, Store, Link as LinkIcon, Check, MapPin, Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { LocationPicker } from './LocationPicker'
import type { LocationValue } from './LocationPicker'
import type { PropertyPhotoRow } from '@/lib/properties'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyFormState {
  operacion: 'venta' | 'alquiler' | null
  tipo: 'departamento' | 'casa' | 'terreno' | 'comercial' | null
  precio: string
  moneda: 'USD' | 'PYG'
  financiacion: boolean
  amoblado: boolean
  mapsLink: string
  lat: number | null
  lng: number | null
  ciudad: string
  barrio: string
  zona: string
  direccion: string
  dormitorios: number | null
  banos: number | null
  superficie_m2: string
  terreno_m2: string
  superficie_cubierta_m2: string
  garajes: number | null
  piso: string
  condicion: string
  amenities: string[]
  titulo: string
  descripcion: string
  estado: 'activo' | 'inactivo'
  publicado_en_web: boolean
  fotos: File[]
}

export const INITIAL_FORM_STATE: PropertyFormState = {
  operacion: null, tipo: null,
  precio: '', moneda: 'USD', financiacion: false, amoblado: false,
  mapsLink: '', lat: null, lng: null,
  ciudad: '', barrio: '', zona: '', direccion: '',
  dormitorios: null, banos: null,
  superficie_m2: '', terreno_m2: '', superficie_cubierta_m2: '',
  garajes: null, piso: '', condicion: '',
  amenities: [],
  titulo: '', descripcion: '',
  estado: 'activo', publicado_en_web: false,
  fotos: [],
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento', casa: 'Casa', terreno: 'Terreno', comercial: 'Local comercial',
}
export const OP_LABEL: Record<string, string> = { venta: 'en Venta', alquiler: 'en Alquiler' }

export const AMENITIES_GRUPOS = [
  {
    grupo: 'Interior',
    items: [
      { id: 'aire', label: 'Aire acondicionado' },
      { id: 'calefaccion', label: 'Calefacción' },
      { id: 'lavanderia', label: 'Lavandería' },
      { id: 'cocina_equipada', label: 'Cocina equipada' },
      { id: 'placares', label: 'Placares' },
      { id: 'balcon', label: 'Balcón' },
      { id: 'terraza', label: 'Terraza' },
      { id: 'amoblado', label: 'Amoblado' },
    ],
  },
  {
    grupo: 'Edificio',
    items: [
      { id: 'piscina', label: 'Piscina' },
      { id: 'gimnasio', label: 'Gimnasio' },
      { id: 'parrilla', label: 'Parrilla / Quincho' },
      { id: 'jardin', label: 'Jardín' },
      { id: 'seguridad', label: 'Seguridad 24h' },
      { id: 'ascensor', label: 'Ascensor' },
      { id: 'salon', label: 'Salón de usos' },
      { id: 'estacionamiento', label: 'Estacionamiento' },
    ],
  },
]

export const ALL_AMENITIES = AMENITIES_GRUPOS.flatMap(g => g.items)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMapsUrl(url: string): { embedSrc: string; lat: number | null; lng: number | null } | null {
  const u = url.trim()
  if (!u) return null
  const isGMaps = u.includes('google.com/maps') || u.includes('goo.gl/maps') || u.includes('maps.app.goo.gl')
  if (!isGMaps) return null
  const at = u.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (at) {
    const lat = parseFloat(at[1]), lng = parseFloat(at[2])
    return { embedSrc: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`, lat, lng }
  }
  const q = u.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (q) {
    const lat = parseFloat(q[1]), lng = parseFloat(q[2])
    return { embedSrc: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`, lat, lng }
  }
  if (!u.includes('goo.gl') && !u.includes('maps.app.goo.gl')) {
    const src = u.includes('output=embed') ? u : u + (u.includes('?') ? '&' : '?') + 'output=embed'
    return { embedSrc: src, lat: null, lng: null }
  }
  return null
}

export function generateTitle(s: Pick<PropertyFormState, 'tipo' | 'operacion' | 'dormitorios' | 'barrio' | 'zona' | 'ciudad'>): string {
  const tipo = TIPO_LABEL[s.tipo!] ?? ''
  const op = OP_LABEL[s.operacion!] ?? ''
  const dormStr = s.dormitorios ? ` de ${s.dormitorios} dormitorio${s.dormitorios !== 1 ? 's' : ''}` : ''
  const ubicStr = s.barrio || s.zona || s.ciudad ? ` en ${s.barrio || s.zona || s.ciudad}` : ''
  return `${tipo}${dormStr}${ubicStr} ${op}`.trim()
}

export function generateDescription(s: PropertyFormState): string {
  const tipo = TIPO_LABEL[s.tipo!] ?? ''
  const op = { venta: 'venta', alquiler: 'alquiler' }[s.operacion!] ?? ''
  const ubic = s.barrio || s.zona || s.ciudad
  const lines: string[] = []
  lines.push(`${tipo}${ubic ? ` en ${ubic}` : ''} disponible para ${op}.`)
  if (s.dormitorios != null) lines.push(`• ${s.dormitorios === 0 ? 'Monoambiente' : `${s.dormitorios} dormitorio${s.dormitorios !== 1 ? 's' : ''}`}`)
  if (s.banos) lines.push(`• ${s.banos} baño${s.banos !== 1 ? 's' : ''}`)
  if (s.superficie_m2) lines.push(`• ${s.superficie_m2} m² de superficie`)
  if (s.terreno_m2 && (s.tipo === 'casa' || s.tipo === 'terreno')) lines.push(`• ${s.terreno_m2} m² de terreno`)
  const top = s.amenities.slice(0, 5)
  if (top.length > 0) {
    lines.push('')
    for (const a of top) {
      const found = ALL_AMENITIES.find(x => x.id === a)
      if (found) lines.push(`• ${found.label}`)
    }
  }
  return lines.join('\n')
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function Block({ title, children, primary = false }: { title: string; children: React.ReactNode; primary?: boolean }) {
  if (primary) {
    return (
      <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">{title}</h2>
        {children}
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-gray-700 mb-2">{children}</p>
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 ${props.className ?? ''}`}
    />
  )
}

function NumChip({ n, active, onClick }: { n: number | string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-9 rounded-xl text-sm font-medium border transition-all ${
        active ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
      }`}
    >
      {n}
    </button>
  )
}

function Divider() {
  return <div className="border-t border-gray-100 my-5" />
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between w-full">
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

// ─── Props ────────────────────────────────────────────────────────────────────

export type ExistingPhoto = PropertyPhotoRow

interface PropertyFormProps {
  mode: 'create' | 'edit'
  state: PropertyFormState
  onChange: (patch: Partial<PropertyFormState>) => void
  onSave: (isDraft?: boolean) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  isDirty?: boolean
  // edit mode: existing photos from DB
  existingPhotos?: ExistingPhoto[]
  fotoPortada?: string | null
  onAddPhotos?: (files: FileList) => Promise<void>
  onDeletePhoto?: (photo: ExistingPhoto) => Promise<void>
  onSetPortada?: (path: string) => Promise<void>
  getPhotoUrl?: (path: string) => string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyForm({
  mode,
  state: s,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isDirty = true,
  existingPhotos = [],
  fotoPortada,
  onAddPhotos,
  onDeletePhoto,
  onSetPortada,
  getPhotoUrl,
}: PropertyFormProps) {
  const update = useCallback((patch: Partial<PropertyFormState>) => onChange(patch), [onChange])

  // ── Política de moneda ────────────────────────────────────────────────────
  // Venta (y null) solo admite USD. Si el estado es inválido —tanto al cargar
  // una propiedad existente como al cambiar operación en runtime— se normaliza.
  useEffect(() => {
    if (s.operacion !== 'alquiler' && s.moneda === 'PYG') {
      update({ moneda: 'USD', precio: '' })
    }
  }, [s.operacion, s.moneda]) // eslint-disable-line react-hooks/exhaustive-deps

  // Maps state
  const [isResolvingMap, setIsResolvingMap] = useState(false)
  const [resolvedEmbed, setResolvedEmbed] = useState<{ embedSrc: string; lat: number | null; lng: number | null } | null>(null)

  // Create-mode photo state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pasteZoneFocused, setPasteZoneFocused] = useState(false)
  const previewUrls = useRef<Record<string, string>>({})

  const isShortUrl = (url: string) => url.includes('goo.gl') || url.includes('maps.app.goo.gl')
  const mapsData = resolvedEmbed ?? parseMapsUrl(s.mapsLink)

  const resolveShortUrl = useCallback(async (link: string) => {
    setIsResolvingMap(true)
    setResolvedEmbed(null)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
      const res = await fetch(`${supabaseUrl}/functions/v1/resolve-maps?url=${encodeURIComponent(link)}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as { finalUrl: string; coords: { lat: number; lng: number } | null; placeName: string | null }
      const coords = data.coords
      const q = data.placeName ? encodeURIComponent(data.placeName) : coords ? `${coords.lat},${coords.lng}` : null
      const embedSrc = q
        ? `https://maps.google.com/maps?q=${q}&output=embed`
        : data.finalUrl + (data.finalUrl.includes('?') ? '&' : '?') + 'output=embed'
      setResolvedEmbed({ embedSrc, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
      update({ lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    } catch {
      toast.error('No se pudo resolver el link de Maps')
    }
    setIsResolvingMap(false)
  }, [update])

  function handleMapsLink(link: string) {
    const trimmed = link.trim()
    setResolvedEmbed(null)
    if (!trimmed) { update({ mapsLink: '', lat: null, lng: null }); return }
    update({ mapsLink: trimmed })
    if (isShortUrl(trimmed)) { resolveShortUrl(trimmed); return }
    const parsed = parseMapsUrl(trimmed)
    update({ lat: parsed?.lat ?? null, lng: parsed?.lng ?? null })
  }

  // Auto-fill title on create
  useEffect(() => {
    if (mode !== 'create') return
    if (s.operacion && s.tipo && !s.titulo) {
      update({ titulo: generateTitle(s) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.operacion, s.tipo, s.dormitorios, s.barrio, s.zona, s.ciudad])

  // Create-mode photo helpers
  function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}` }
  function getPreviewUrl(file: File): string {
    const key = fileKey(file)
    if (!previewUrls.current[key]) previewUrls.current[key] = URL.createObjectURL(file)
    return previewUrls.current[key]
  }
  function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    update({ fotos: [...s.fotos, ...valid].slice(0, 20) })
  }
  function removeFile(i: number) {
    const file = s.fotos[i]
    const key = fileKey(file)
    const url = previewUrls.current[key]
    if (url) URL.revokeObjectURL(url)
    delete previewUrls.current[key]
    update({ fotos: s.fotos.filter((_, idx) => idx !== i) })
  }
  function setFileCover(i: number) {
    if (i === 0) return
    const next = [...s.fotos]
    const [cover] = next.splice(i, 1)
    next.unshift(cover)
    update({ fotos: next })
  }
  function handlePasteZone(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return
    e.preventDefault()
    const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[]
    addFiles(files)
  }

  // LocationPicker (edit mode)
  const locationValue: LocationValue | null = s.lat && s.lng
    ? { lat: s.lat, lng: s.lng, zona: s.zona, direccion: s.direccion }
    : null

  function handleLocationChange(loc: LocationValue) {
    update({ lat: loc.lat, lng: loc.lng, zona: loc.zona, direccion: loc.direccion })
  }

  const showDormBanos = s.tipo !== 'terreno'
  const showTerreno = s.tipo === 'casa' || s.tipo === 'terreno'

  // Header summary
  const precioDisplay = s.precio && parseFloat(s.precio) > 0
    ? `${s.moneda === 'USD' ? '$' : '₲'} ${parseFloat(s.precio).toLocaleString(s.moneda === 'USD' ? 'en-US' : 'es-PY')}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">
            {mode === 'create' ? 'Nueva propiedad' : 'Editar propiedad'}
          </h1>
          {(s.tipo || s.operacion || precioDisplay) ? (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {s.tipo && <span className="text-xs text-gray-500">{TIPO_LABEL[s.tipo]}</span>}
              {s.operacion && <span className="text-xs text-gray-500"><span className="text-gray-300 mr-1">·</span>{OP_LABEL[s.operacion]}</span>}
              {precioDisplay && <span className="text-xs font-semibold text-gray-900"><span className="text-gray-300 mr-1">·</span>{precioDisplay}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Completá los datos y guardá</p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* ── BLOQUE 1: Lo esencial ── */}
        <Block title="Lo esencial" primary>

          {/* Operación */}
          <div className="mb-5">
            <Label>¿Qué tipo de operación?</Label>
            <div className="flex gap-2">
              {([
                { value: 'venta' as const, label: 'Venta', icon: Home },
                { value: 'alquiler' as const, label: 'Alquiler', icon: Key },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ operacion: value })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    s.operacion === value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div className="mb-5">
            <Label>Tipo de propiedad</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: 'departamento' as const, label: 'Departamento', icon: Building2 },
                { value: 'casa' as const, label: 'Casa', icon: Home },
                { value: 'terreno' as const, label: 'Terreno', icon: Map },
                { value: 'comercial' as const, label: 'Comercial', icon: Store },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ tipo: value })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    s.tipo === value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />{label}
                </button>
              ))}
            </div>
          </div>

          <Divider />

          {/* Precio */}
          <div>
            <Label>Precio</Label>
            <div className="flex items-center gap-3 flex-wrap">
              {s.operacion === 'alquiler' ? (
                <div className="flex rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
                  {(['USD', 'PYG'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update({ moneda: m, precio: '' })}
                      className={`px-3 py-2 text-sm font-semibold transition-all ${
                        s.moneda === m ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="px-3 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl">
                  USD
                </span>
              )}
              <input
                type="number"
                value={s.precio}
                onChange={e => update({ precio: e.target.value })}
                placeholder={s.moneda === 'USD' ? '120000' : '250000000'}
                style={{ width: 200 }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-base font-medium text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
              />
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={s.financiacion}
                  onChange={e => update({ financiacion: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">Ofrece financiación</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={s.amoblado}
                  onChange={e => update({ amoblado: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">Amoblado</span>
              </label>
            </div>
            {s.precio && parseFloat(s.precio) > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                {s.moneda === 'USD' ? 'USD ' : '₲ '}
                {parseFloat(s.precio).toLocaleString(s.moneda === 'USD' ? 'en-US' : 'es-PY')}
                {s.superficie_m2 && parseFloat(s.superficie_m2) > 0 && (
                  <span className="ml-2">
                    · {s.moneda === 'USD' ? '$' : '₲'} {Math.round(parseFloat(s.precio) / parseFloat(s.superficie_m2)).toLocaleString('es-PY')}/m²
                  </span>
                )}
              </p>
            )}
          </div>
        </Block>

        {/* ── BLOQUE 2: Estado y publicación (solo edit) ── */}
        {mode === 'edit' && (
          <Block title="Estado y publicación">
            <div className="flex flex-col gap-4">
              <Toggle
                checked={s.estado !== 'inactivo'}
                onChange={v => update({ estado: v ? 'activo' : 'inactivo' })}
                label="Propiedad activa"
                sub="Las propiedades inactivas no se muestran en el sistema"
              />
              <div className="border-t border-gray-100" />
              <Toggle
                checked={s.publicado_en_web}
                onChange={v => update({ publicado_en_web: v })}
                label="Publicar en la web"
                sub="Visible en kohancampos.com.py"
              />
            </div>
          </Block>
        )}

        {/* ── BLOQUE 3: Ubicación ── */}
        <Block title="Ubicación">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Link de Google Maps</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="url"
                  value={s.mapsLink}
                  onChange={e => handleMapsLink(e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                />
              </div>
              {isResolvingMap && <p className="text-xs text-gray-400 mt-1.5">Resolviendo link…</p>}
              {!isResolvingMap && mapsData && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {mapsData.lat ? `Coordenadas: ${mapsData.lat.toFixed(4)}, ${mapsData.lng?.toFixed(4)}` : 'Link válido'}
                </p>
              )}
            </div>

            {mapsData && !isResolvingMap && (
              <div className="overflow-hidden rounded-xl border border-gray-200" style={{ height: 220 }}>
                <iframe src={mapsData.embedSrc} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}

            {/* Coordenadas guardadas (edit, sin mapsLink) */}
            {mode === 'edit' && !s.mapsLink && s.lat && s.lng && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <MapPin className="w-3.5 h-3.5" />
                  Coordenadas guardadas: {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 180 }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${s.lat},${s.lng}&z=16&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Ciudad</Label>
                <TextInput value={s.ciudad} onChange={e => update({ ciudad: e.target.value })} placeholder="Ej: Asunción" />
              </div>
              <div>
                <Label>Barrio</Label>
                <TextInput value={s.barrio} onChange={e => update({ barrio: e.target.value })} placeholder="Ej: Recoleta" />
              </div>
              <div>
                <Label>Zona</Label>
                <TextInput value={s.zona} onChange={e => update({ zona: e.target.value })} placeholder="Ej: Zona CIT" />
              </div>
              <div>
                <Label>Dirección</Label>
                <TextInput value={s.direccion} onChange={e => update({ direccion: e.target.value })} placeholder="Ej: Av. Mariscal López 123" />
              </div>
            </div>

            {mode === 'edit' && (
              <div>
                <p className="text-xs text-gray-500 mb-2">O buscá en el mapa</p>
                <LocationPicker value={locationValue} onChange={handleLocationChange} />
              </div>
            )}
          </div>
        </Block>

        {/* ── BLOQUE 4: Características ── */}
        <Block title="Características">
          <div className={`grid gap-x-6 gap-y-4 items-start ${showDormBanos ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {showDormBanos && (
              <div>
                <Label>Dormitorios</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {[{ v: 0, l: 'Mono' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }, { v: 4, l: '4+' }].map(({ v, l }) => (
                    <NumChip key={v} n={l} active={s.dormitorios === v} onClick={() => update({ dormitorios: v })} />
                  ))}
                </div>
              </div>
            )}
            {showDormBanos && (
              <div>
                <Label>Baños</Label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(v => (
                    <NumChip key={v} n={v === 3 ? '3+' : v} active={s.banos === v} onClick={() => update({ banos: v })} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Superficie{showTerreno ? ' cubierta' : ''}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={s.superficie_m2}
                  onChange={e => update({ superficie_m2: e.target.value })}
                  placeholder="66"
                  style={{ width: 110 }}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                />
                <span className="text-sm text-gray-500">m²</span>
              </div>
            </div>
            <div>
              <Label>Sup. cubierta</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={s.superficie_cubierta_m2}
                  onChange={e => update({ superficie_cubierta_m2: e.target.value })}
                  placeholder="—"
                  style={{ width: 110 }}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                />
                <span className="text-sm text-gray-500">m²</span>
              </div>
            </div>
            {showTerreno && (
              <div>
                <Label>Terreno</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={s.terreno_m2}
                    onChange={e => update({ terreno_m2: e.target.value })}
                    placeholder="200"
                    style={{ width: 110 }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                  />
                  <span className="text-sm text-gray-500">m²</span>
                </div>
              </div>
            )}
            <div>
              <Label>Garajes</Label>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map(v => (
                  <NumChip key={v} n={v} active={s.garajes === v} onClick={() => update({ garajes: v === s.garajes ? null : v })} />
                ))}
              </div>
            </div>
            <div>
              <Label>Piso</Label>
              <input
                type="number"
                value={s.piso}
                onChange={e => update({ piso: e.target.value })}
                placeholder="—"
                style={{ width: 80 }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
              />
            </div>
          </div>

          {/* Condición */}
          <div className="mt-5">
            <Label>Condición</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'nuevo', label: 'Nuevo' },
                { value: 'usado', label: 'Usado' },
                { value: 'reventa', label: 'Reventa' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ condicion: s.condicion === value ? '' : value })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    s.condicion === value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Block>

        {/* ── BLOQUE 5: Fotos ── */}
        <Block title="Fotos">
          <div className="flex flex-col gap-4">

            {/* Edit: fotos existentes en DB */}
            {mode === 'edit' && existingPhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingPhotos.map(photo => {
                  const isPortada = photo.storage_path === fotoPortada
                  return (
                    <div key={photo.id} className="relative group aspect-square">
                      <img
                        src={getPhotoUrl?.(photo.storage_path)}
                        alt=""
                        className={`w-full h-full object-cover rounded-xl ${isPortada ? 'ring-2 ring-gray-900' : ''}`}
                      />
                      {isPortada ? (
                        <span className="absolute top-1 left-1 bg-gray-900/80 text-white text-[10px] px-1.5 py-0.5 rounded-md">Portada · Ficha PDF</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetPortada?.(photo.storage_path)}
                          className="absolute top-1 left-1 bg-white/80 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          ★ Usar como portada y ficha PDF
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeletePhoto?.(photo)}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Create: fotos nuevas (local) */}
            {mode === 'create' && s.fotos.length > 0 && (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {s.fotos.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={getPreviewUrl(file)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button
                        type="button"
                        onClick={() => setFileCover(i)}
                        title={i === 0 ? 'Portada' : 'Usar como portada'}
                        className={`absolute bottom-1 left-1 transition-all ${i === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          i === 0 ? 'bg-amber-400 text-white' : 'bg-black/60 text-white/80 hover:bg-amber-400 hover:text-white'
                        }`}>⭐ Portada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">{s.fotos.length}/20 fotos · Tocá ⭐ en una foto para hacerla portada</p>
              </>
            )}

            {/* Upload area */}
            {mode === 'create' ? (
              <>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
                className={`border-2 border-dashed rounded-2xl px-6 py-5 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <Camera className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-500">Tocá para agregar fotos</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · máx. 20</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && addFiles(e.target.files)}
                />
              </div>
              <div
                ref={pasteZoneRef}
                tabIndex={0}
                onFocus={() => setPasteZoneFocused(true)}
                onBlur={() => setPasteZoneFocused(false)}
                onPaste={handlePasteZone}
                onClick={() => pasteZoneRef.current?.focus()}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 cursor-pointer transition-all outline-none ${
                  pasteZoneFocused
                    ? 'border-gray-900 bg-gray-900/5 ring-2 ring-gray-900/10'
                    : 'border-dashed border-gray-200 hover:border-gray-400'
                }`}
              >
                <Clipboard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">
                  {pasteZoneFocused
                    ? <><span className="font-semibold text-gray-700">Listo</span> — presioná <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-mono text-xs">Ctrl+V</kbd></>
                    : <>Hacé clic acá y presioná <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-xs">Ctrl+V</kbd> para pegar imagen</>
                  }
                </span>
              </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Agregar fotos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && onAddPhotos?.(e.target.files)}
                />
              </>
            )}
          </div>
        </Block>

        {/* ── BLOQUE 6: Amenities ── */}
        <Block title="Amenities">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {AMENITIES_GRUPOS.map(({ grupo, items }) => (
              <div key={grupo}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{grupo}</p>
                <div className="flex flex-col gap-1.5">
                  {items.map(({ id, label }) => {
                    const active = s.amenities.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          const next = active ? s.amenities.filter(a => a !== id) : [...s.amenities, id]
                          update({ amenities: next })
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all border ${
                          active ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                          active ? 'bg-white/20 border-white/30' : 'border-gray-300'
                        }`}>
                          {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* ── BLOQUE 7: Título y descripción ── */}
        <Block title="Título y descripción">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Título</Label>
              <TextInput
                value={s.titulo}
                onChange={e => update({ titulo: e.target.value })}
                placeholder={s.operacion && s.tipo ? generateTitle(s) : 'Se genera automáticamente'}
              />
              {s.operacion && s.tipo && !s.titulo && (
                <button
                  type="button"
                  onClick={() => update({ titulo: generateTitle(s) })}
                  className="text-xs text-gray-400 hover:text-gray-700 mt-1 transition-colors"
                >
                  Usar sugerido: "{generateTitle(s)}"
                </button>
              )}
            </div>
            <div>
              <Label>Descripción</Label>
              <textarea
                value={s.descripcion}
                onChange={e => update({ descripcion: e.target.value })}
                rows={6}
                placeholder="Describirás la propiedad aquí..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 resize-none"
              />
              {s.operacion && s.tipo && !s.descripcion && (
                <button
                  type="button"
                  onClick={() => update({ descripcion: generateDescription(s) })}
                  className="text-xs text-gray-400 hover:text-gray-700 mt-1 transition-colors"
                >
                  Generar descripción automática
                </button>
              )}
            </div>
          </div>
        </Block>

      </div>

      {/* ── Barra inferior mobile ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center gap-3 px-4 py-2"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
        {mode === 'create' ? (
          <>
            <button type="button" onClick={() => onSave(true)} disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Borrador
            </button>
            <button type="button" onClick={() => onSave(false)} disabled={isSaving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Publicar'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button type="button" onClick={() => onSave()} disabled={!isDirty || isSaving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        )}
      </div>

      {/* ── Panel flotante desktop ── */}
      <div className="hidden md:flex fixed bottom-5 right-5 z-30 w-[220px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-3 flex-col gap-1.5">
        {mode === 'create' ? (
          <>
            <button type="button" onClick={() => onSave(false)} disabled={isSaving}
              className="w-full py-2 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Publicar propiedad'}
            </button>
            <button type="button" onClick={() => onSave(true)} disabled={isSaving}
              className="w-full py-1.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors disabled:opacity-50"
            >
              Guardar borrador
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => onSave()} disabled={!isDirty || isSaving}
              className="w-full py-2 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={onCancel}
              className="w-full py-1.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

    </div>
  )
}
