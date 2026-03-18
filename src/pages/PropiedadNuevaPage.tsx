import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { X, Camera, Home, Key, Building2, Map, Store, Link as LinkIcon, Check } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { createProperty } from '@/lib/properties'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  operacion: 'venta' | 'alquiler' | null
  tipo: 'departamento' | 'casa' | 'terreno' | 'comercial' | null
  mapsLink: string
  lat: number | null
  lng: number | null
  zona: string
  direccion: string
  dormitorios: number | null
  banos: number | null
  superficie_m2: string
  terreno_m2: string
  amenities: string[]
  fotos: File[]
  precio: string
  moneda: 'USD' | 'PYG'
  titulo: string
  descripcion: string
}

const INITIAL: FormState = {
  operacion: null, tipo: null,
  mapsLink: '', lat: null, lng: null, zona: '', direccion: '',
  dormitorios: null, banos: null, superficie_m2: '', terreno_m2: '',
  amenities: [], fotos: [],
  precio: '', moneda: 'USD',
  titulo: '', descripcion: '',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento', casa: 'Casa', terreno: 'Terreno', comercial: 'Local comercial',
}
const OP_LABEL: Record<string, string> = { venta: 'en Venta', alquiler: 'en Alquiler' }

const AMENITIES_GRUPOS = [
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

const ALL_AMENITIES = AMENITIES_GRUPOS.flatMap(g => g.items)

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

function generateTitle(s: FormState): string {
  const tipo = TIPO_LABEL[s.tipo!] ?? ''
  const op = OP_LABEL[s.operacion!] ?? ''
  const dormStr = s.dormitorios ? ` de ${s.dormitorios} dormitorio${s.dormitorios !== 1 ? 's' : ''}` : ''
  const zonaStr = s.zona ? ` en ${s.zona}` : ''
  return `${tipo}${dormStr}${zonaStr} ${op}`.trim()
}

function generateDescription(s: FormState): string {
  const tipo = TIPO_LABEL[s.tipo!] ?? ''
  const op = { venta: 'venta', alquiler: 'alquiler' }[s.operacion!] ?? ''
  const lines: string[] = []
  lines.push(`${tipo}${s.zona ? ` en ${s.zona}` : ''} disponible para ${op}.`)
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

function Block({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">{title}</h2>
      {children}
    </div>
  )
}

// Bloque principal — visualmente dominante
function PrimaryBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">Lo esencial</h2>
      {children}
    </div>
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

function Divider() {
  return <div className="border-t border-gray-100 my-5" />
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PropiedadNuevaPage() {
  const navigate = useNavigate()
  const [s, setS] = useState<FormState>(INITIAL)
  const [isSaving, setIsSaving] = useState(false)
  const [isResolvingMap, setIsResolvingMap] = useState(false)
  const [resolvedEmbed, setResolvedEmbed] = useState<{ embedSrc: string; lat: number | null; lng: number | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrls = useRef<Record<string, string>>({})

  function update(patch: Partial<FormState>) { setS(prev => ({ ...prev, ...patch })) }

  // Auto-fill title when key fields change
  useEffect(() => {
    if (s.operacion && s.tipo) {
      if (!s.titulo) update({ titulo: generateTitle(s) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.operacion, s.tipo, s.dormitorios, s.zona])

  // ── Google Maps parser ──────────────────────────────────────────────────────
  const isShortUrl = (url: string) =>
    url.includes('goo.gl') || url.includes('maps.app.goo.gl')

  // mapsData: usa resolvedEmbed si existe (link corto resuelto), sino parsea directo
  const mapsData = resolvedEmbed ?? parseMapsUrl(s.mapsLink)

  const resolveShortUrl = useCallback(async (link: string) => {
    setIsResolvingMap(true)
    setResolvedEmbed(null)
    try {
      const webUrl = import.meta.env.VITE_WEB_URL ?? ''
      const res = await fetch(`${webUrl}/api/resolve-maps?url=${encodeURIComponent(link)}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as { finalUrl: string; coords: { lat: number; lng: number } | null }
      const coords = data.coords
      const embedSrc = coords
        ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
        : data.finalUrl + (data.finalUrl.includes('?') ? '&' : '?') + 'output=embed'
      setResolvedEmbed({ embedSrc, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
      update({ lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    } catch {
      toast.error('No se pudo resolver el link de Maps')
    }
    setIsResolvingMap(false)
  }, [])

  function handleMapsLink(link: string) {
    const trimmed = link.trim()
    setResolvedEmbed(null)
    if (!trimmed) { update({ mapsLink: '', lat: null, lng: null }); return }
    update({ mapsLink: trimmed })
    if (isShortUrl(trimmed)) {
      resolveShortUrl(trimmed)
      return
    }
    const parsed = parseMapsUrl(trimmed)
    update({ lat: parsed?.lat ?? null, lng: parsed?.lng ?? null })
  }

  // ── Photos ──────────────────────────────────────────────────────────────────
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

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave(draft: boolean) {
    if (!s.operacion || !s.tipo) {
      toast.error('Completá operación y tipo de propiedad')
      return
    }
    setIsSaving(true)
    try {
      const titulo = s.titulo || generateTitle(s)
      const descripcion = s.descripcion || generateDescription(s)

      const property = await createProperty({
        operacion: s.operacion,
        tipo: s.tipo,
        titulo: titulo || null,
        descripcion: descripcion || null,
        latitud: s.lat,
        longitud: s.lng,
        zona: s.zona || null,
        direccion: s.direccion || null,
        dormitorios: s.dormitorios,
        banos: s.banos,
        superficie_m2: s.superficie_m2 ? parseFloat(s.superficie_m2) : null,
        terreno_m2: s.terreno_m2 ? parseFloat(s.terreno_m2) : null,
        amenities: s.amenities,
        precio: s.precio ? parseFloat(s.precio) : null,
        moneda: s.moneda,
        estado: 'activo',
        publicado_en_web: !draft,
      })

      let portadaPath: string | null = null
      for (let i = 0; i < s.fotos.length; i++) {
        const file = s.fotos[i]
        const ext = file.name.split('.').pop()
        const path = `${property.id}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('property-photos').upload(path, file)
        if (error) continue
        await supabase.from('property_photos').insert({
          property_id: property.id,
          storage_path: path,
          sort_order: i,
          es_portada: i === 0,
        })
        if (i === 0) portadaPath = path
      }

      if (portadaPath) {
        await supabase.from('properties').update({ foto_portada: portadaPath }).eq('id', property.id)
      }

      toast.success(draft ? 'Borrador guardado' : 'Propiedad publicada')
      navigate(`/propiedades/${property.id}`)
    } catch {
      toast.error('Error al guardar la propiedad')
    }
    setIsSaving(false)
  }

  const showDormBanos = s.tipo !== 'terreno'
  const showTerreno = s.tipo === 'casa' || s.tipo === 'terreno'

  // Header summary — tipo · operación · precio
  const hasHeaderSummary = s.tipo || s.operacion || (s.precio && parseFloat(s.precio) > 0)
  const headerSummaryParts: string[] = []
  if (s.tipo) headerSummaryParts.push(TIPO_LABEL[s.tipo])
  if (s.operacion) headerSummaryParts.push(OP_LABEL[s.operacion])
  const precioDisplay = s.precio && parseFloat(s.precio) > 0
    ? `${s.moneda === 'USD' ? '$' : '₲'} ${parseFloat(s.precio).toLocaleString(s.moneda === 'USD' ? 'en-US' : 'es-PY')}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">Nueva propiedad</h1>
          {/* Sticky summary — solo cuando hay datos */}
          {hasHeaderSummary && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {headerSummaryParts.map((part, i) => (
                <span key={i} className="text-xs text-gray-500">
                  {i > 0 && <span className="text-gray-300 mr-1.5">·</span>}
                  {part}
                </span>
              ))}
              {precioDisplay && (
                <span className="text-xs font-semibold text-gray-900 ml-1">
                  <span className="text-gray-300 mr-1">·</span>
                  {precioDisplay}
                </span>
              )}
            </div>
          )}
          {!hasHeaderSummary && (
            <p className="text-xs text-gray-400 mt-0.5">Completá los datos y publicá</p>
          )}
        </div>
        <button
          onClick={() => navigate('/propiedades')}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* ── Content ── */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* ══════════════════════════════════════════
            BLOQUE 1 — LO ESENCIAL (dominante)
            Operación + Tipo + Precio
        ══════════════════════════════════════════ */}
        <PrimaryBlock>

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
                    s.operacion === value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
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
                    s.tipo === value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Divider />

          {/* Precio */}
          <div>
            <Label>Precio</Label>
            <div className="flex items-center gap-3">
              {/* Toggle moneda */}
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
              {/* Input */}
              <input
                type="number"
                value={s.precio}
                onChange={e => update({ precio: e.target.value })}
                placeholder={s.moneda === 'USD' ? '120000' : '250000000'}
                maxLength={9}
                style={{ width: 200 }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-base font-medium text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
              />
            </div>
            {s.precio && parseFloat(s.precio) > 0 && (
              <p className="text-xs text-gray-400 mt-1.5" style={{ marginLeft: 94 }}>
                {s.moneda === 'USD' ? 'USD ' : '₲ '}
                {parseFloat(s.precio).toLocaleString(s.moneda === 'USD' ? 'en-US' : 'es-PY')}
              </p>
            )}
          </div>
        </PrimaryBlock>

        {/* ══════════════════════════════════════════
            BLOQUE 2 — UBICACIÓN
        ══════════════════════════════════════════ */}
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
              {isResolvingMap && (
                <p className="text-xs text-gray-400 mt-1.5">Resolviendo link…</p>
              )}
              {!isResolvingMap && mapsData && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {mapsData.lat ? `Coordenadas: ${mapsData.lat.toFixed(4)}, ${mapsData.lng?.toFixed(4)}` : 'Link válido'}
                </p>
              )}
            </div>

            {mapsData && !isResolvingMap && (
              <div className="overflow-hidden rounded-xl border border-gray-200" style={{ height: 220 }}>
                <iframe
                  src={mapsData.embedSrc}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Zona / Barrio</Label>
                <TextInput
                  value={s.zona}
                  onChange={e => update({ zona: e.target.value })}
                  placeholder="Ej: Luque – Zona CIT"
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <TextInput
                  value={s.direccion}
                  onChange={e => update({ direccion: e.target.value })}
                  placeholder="Ej: Av. Mariscal López 123"
                />
              </div>
            </div>
          </div>
        </Block>

        {/* ══════════════════════════════════════════
            BLOQUE 3 — CARACTERÍSTICAS (compacto)
        ══════════════════════════════════════════ */}
        <Block title="Características">
          <div className={`grid gap-x-6 gap-y-3 items-start ${showDormBanos ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {showDormBanos && (
              <div>
                <Label>Dormitorios</Label>
                <div className="flex gap-1.5">
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
          </div>
        </Block>

        {/* ══════════════════════════════════════════
            BLOQUE 4 — FOTOS (antes de amenities)
        ══════════════════════════════════════════ */}
        <Block title="Fotos">
          <div className="flex flex-col gap-4">
            <div
              onClick={() => inputRef.current?.click()}
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
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {s.fotos.length > 0 && (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {s.fotos.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img
                        src={getPreviewUrl(file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                          Portada
                        </span>
                      )}
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
                <p className="text-xs text-gray-400">{s.fotos.length}/20 fotos · La primera es la portada</p>
              </>
            )}
          </div>
        </Block>

        {/* ══════════════════════════════════════════
            BLOQUE 5 — AMENITIES (2 columnas)
        ══════════════════════════════════════════ */}
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
                          const next = active
                            ? s.amenities.filter(a => a !== id)
                            : [...s.amenities, id]
                          update({ amenities: next })
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all border ${
                          active
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
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

        {/* ══════════════════════════════════════════
            BLOQUE 6 — DESCRIPCIÓN
        ══════════════════════════════════════════ */}
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

      {/* ── Panel flotante (fixed right) ── */}
      <div className="fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Publicar propiedad'}
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors disabled:opacity-50"
        >
          Guardar borrador
        </button>
      </div>

    </div>
  )
}
