import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { X, Camera, Link as LinkIcon, Check, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { createProject } from '@/lib/projects'
import { createTypology } from '@/lib/typologies'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'en_pozo' | 'en_construccion' | 'entregado'
type TipoProyecto = 'residencial' | 'comercial' | 'mixto'

interface TypologyDraft {
  _id: string
  name: string
  area_m2: string
  price_usd: string
  units_available: string
}

interface FormState {
  name: string
  status: Status
  developer_name: string
  tipo_proyecto: TipoProyecto | null
  maps_url: string
  lat: number | null
  lng: number | null
  zona: string
  direccion: string
  precio_desde: string
  precio_hasta: string
  moneda: 'USD' | 'PYG'
  delivery_date: string
  amenities: string[]
  typologies: TypologyDraft[]
  fotos: File[]
  description: string
}

const INITIAL: FormState = {
  name: '', status: 'en_pozo', developer_name: '', tipo_proyecto: null,
  maps_url: '', lat: null, lng: null, zona: '', direccion: '',
  precio_desde: '', precio_hasta: '', moneda: 'USD', delivery_date: '',
  amenities: [], typologies: [], fotos: [], description: '',
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Maps resolver ─────────────────────────────────────────────────────────────

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

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function PrimaryBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">Lo esencial</h2>
      {children}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
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

function Divider() {
  return <div className="border-t border-gray-100 my-5" />
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProyectoNuevoPage() {
  const navigate = useNavigate()
  const [s, setS] = useState<FormState>(INITIAL)
  const [isSaving, setIsSaving] = useState(false)
  const [isResolvingMap, setIsResolvingMap] = useState(false)
  const [resolvedEmbed, setResolvedEmbed] = useState<{ embedSrc: string; lat: number | null; lng: number | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrls = useRef<Record<string, string>>({})

  function update(patch: Partial<FormState>) { setS(prev => ({ ...prev, ...patch })) }

  // ── Maps ───────────────────────────────────────────────────────────────────
  const isShortUrl = (url: string) => url.includes('goo.gl') || url.includes('maps.app.goo.gl')
  const mapsData = resolvedEmbed ?? parseMapsUrl(s.maps_url)

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
  }, [])

  function handleMapsLink(link: string) {
    const trimmed = link.trim()
    setResolvedEmbed(null)
    if (!trimmed) { update({ maps_url: '', lat: null, lng: null }); return }
    update({ maps_url: trimmed })
    if (isShortUrl(trimmed)) { resolveShortUrl(trimmed); return }
    const parsed = parseMapsUrl(trimmed)
    update({ lat: parsed?.lat ?? null, lng: parsed?.lng ?? null })
  }

  // ── Photos ─────────────────────────────────────────────────────────────────
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

  // ── Typologies ─────────────────────────────────────────────────────────────
  function addTypology() {
    update({
      typologies: [...s.typologies, {
        _id: crypto.randomUUID(), name: '', area_m2: '', price_usd: '', units_available: '',
      }],
    })
  }
  function updateTypology(id: string, field: keyof TypologyDraft, value: string) {
    update({ typologies: s.typologies.map(t => t._id === id ? { ...t, [field]: value } : t) })
  }
  function removeTypology(id: string) {
    update({ typologies: s.typologies.filter(t => t._id !== id) })
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave(draft: boolean) {
    if (!s.name.trim()) { toast.error('El nombre del proyecto es requerido'); return }
    setIsSaving(true)
    try {
      // Build maps link for storage
      const mapsLink = s.maps_url ? { type: 'maps', name: 'Google Maps', url: s.maps_url } : null
      const links = mapsLink ? [mapsLink] : []

      const project = await createProject({
        name: s.name.trim(),
        status: s.status,
        developer_name: s.developer_name || null,
        tipo_proyecto: s.tipo_proyecto,
        location: s.zona || null,
        description: s.description || null,
        delivery_date: s.delivery_date || null,
        amenities: s.amenities,
        precio_desde: s.precio_desde ? parseFloat(s.precio_desde) : null,
        precio_hasta: s.precio_hasta ? parseFloat(s.precio_hasta) : null,
        moneda: s.moneda,
        links,
      })

      // Save typologies
      for (const t of s.typologies) {
        if (!t.name || !t.area_m2 || !t.price_usd) continue
        await createTypology({
          project_id: project.id,
          name: t.name,
          area_m2: parseFloat(t.area_m2),
          price_usd: parseFloat(t.price_usd),
          units_available: parseInt(t.units_available || '0'),
        })
      }

      // Upload photos
      for (let i = 0; i < s.fotos.length; i++) {
        const file = s.fotos[i]
        const ext = file.name.split('.').pop()
        const path = `${project.id}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('project-photos').upload(path, file)
        if (error) continue
        await supabase.from('project_photos').insert({
          project_id: project.id,
          storage_path: path,
          sort_order: i,
        })
      }

      toast.success(draft ? 'Borrador guardado' : 'Proyecto publicado')
      navigate('/proyectos')
    } catch (err) {
      toast.error('Error al guardar el proyecto')
      console.error(err)
    }
    setIsSaving(false)
  }

  // ── Header summary ─────────────────────────────────────────────────────────
  const STATUS_LABEL: Record<Status, string> = { en_pozo: 'En pozo', en_construccion: 'En obra', entregado: 'Terminado' }
  const TIPO_LABEL: Record<TipoProyecto, string> = { residencial: 'Residencial', comercial: 'Comercial', mixto: 'Mixto' }
  const hasHeaderSummary = s.name || s.tipo_proyecto
  const precioDisplay = s.precio_desde
    ? `${s.moneda === 'USD' ? '$' : '₲'} ${parseFloat(s.precio_desde).toLocaleString()}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">Nuevo proyecto</h1>
          {hasHeaderSummary ? (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {s.name && <span className="text-xs font-medium text-gray-700">{s.name}</span>}
              {s.tipo_proyecto && <span className="text-xs text-gray-400"><span className="mr-1">·</span>{TIPO_LABEL[s.tipo_proyecto]}</span>}
              {precioDisplay && <span className="text-xs font-semibold text-gray-900"><span className="text-gray-300 mr-1">·</span>desde {precioDisplay}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Completá los datos y publicá</p>
          )}
        </div>
        <button onClick={() => navigate('/proyectos')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* ══ BLOQUE 1 — LO ESENCIAL ══ */}
        <PrimaryBlock>
          {/* Nombre */}
          <div className="mb-5">
            <Label>Nombre del proyecto</Label>
            <TextInput
              value={s.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="Ej: Edificio Torres del Sol"
            />
          </div>

          {/* Estado + Desarrolladora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <Label>Estado</Label>
              <div className="flex gap-2">
                {([
                  { v: 'en_pozo' as Status, l: 'En pozo' },
                  { v: 'en_construccion' as Status, l: 'En obra' },
                  { v: 'entregado' as Status, l: 'Terminado' },
                ]).map(({ v, l }) => (
                  <button
                    key={v} type="button" onClick={() => update({ status: v })}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      s.status === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Desarrolladora</Label>
              <TextInput
                value={s.developer_name}
                onChange={e => update({ developer_name: e.target.value })}
                placeholder="Ej: Urban Domus"
              />
            </div>
          </div>

          {/* Tipo de proyecto */}
          <div>
            <Label>Tipo de proyecto</Label>
            <div className="flex gap-2">
              {([
                { v: 'residencial' as TipoProyecto, l: 'Residencial' },
                { v: 'comercial' as TipoProyecto, l: 'Comercial' },
                { v: 'mixto' as TipoProyecto, l: 'Mixto' },
              ]).map(({ v, l }) => (
                <button
                  key={v} type="button" onClick={() => update({ tipo_proyecto: v })}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    s.tipo_proyecto === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >{l}</button>
              ))}
            </div>
          </div>
        </PrimaryBlock>

        {/* ══ BLOQUE 2 — UBICACIÓN ══ */}
        <Block title="Ubicación">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Link de Google Maps</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="url"
                  value={s.maps_url}
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
              <div className="overflow-hidden rounded-xl border border-gray-200" style={{ height: 200 }}>
                <iframe src={mapsData.embedSrc} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Zona / Barrio</Label>
                <TextInput value={s.zona} onChange={e => update({ zona: e.target.value })} placeholder="Ej: Luque – Zona CIT" />
              </div>
              <div>
                <Label>Dirección</Label>
                <TextInput value={s.direccion} onChange={e => update({ direccion: e.target.value })} placeholder="Ej: Av. Mariscal López 123" />
              </div>
            </div>
          </div>
        </Block>

        {/* ══ BLOQUE 3 — INFO COMERCIAL ══ */}
        <Block title="Información comercial">
          <div className="flex flex-col gap-4">
            {/* Moneda + precios */}
            <div>
              <Label>Precio</Label>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle moneda */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
                  {(['USD', 'PYG'] as const).map(m => (
                    <button
                      key={m} type="button" onClick={() => update({ moneda: m })}
                      className={`px-3 py-2 text-sm font-semibold transition-all ${
                        s.moneda === m ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >{m}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">Desde</span>
                  <input
                    type="number"
                    value={s.precio_desde}
                    onChange={e => update({ precio_desde: e.target.value })}
                    placeholder={s.moneda === 'USD' ? '80000' : '200000000'}
                    style={{ width: 160 }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">Hasta</span>
                  <input
                    type="number"
                    value={s.precio_hasta}
                    onChange={e => update({ precio_hasta: e.target.value })}
                    placeholder="Opcional"
                    style={{ width: 160 }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Fecha de entrega */}
            <div style={{ maxWidth: 240 }}>
              <Label>Fecha estimada de entrega</Label>
              <input
                type="date"
                value={s.delivery_date}
                onChange={e => update({ delivery_date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
              />
            </div>
          </div>
        </Block>

        {/* ══ BLOQUE 4 — AMENITIES ══ */}
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
                        key={id} type="button"
                        onClick={() => update({ amenities: active ? s.amenities.filter(a => a !== id) : [...s.amenities, id] })}
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

        {/* ══ BLOQUE 5 — TIPOLOGÍAS ══ */}
        <Block title="Tipologías">
          <div className="flex flex-col gap-3">
            {s.typologies.length > 0 && (
              <>
                {/* Header de columnas */}
                <div className="grid gap-2 px-1 mb-1" style={{ gridTemplateColumns: '1fr 90px 120px 80px 32px' }}>
                  <span className="text-xs text-gray-400">Nombre</span>
                  <span className="text-xs text-gray-400 text-right">m²</span>
                  <span className="text-xs text-gray-400 text-right">Precio USD</span>
                  <span className="text-xs text-gray-400 text-right">Unidades</span>
                  <span />
                </div>
                {s.typologies.map(t => (
                  <div key={t._id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 90px 120px 80px 32px' }}>
                    <input
                      type="text"
                      value={t.name}
                      onChange={e => updateTypology(t._id, 'name', e.target.value)}
                      placeholder="Ej: 1 Dormitorio"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                    />
                    <input
                      type="number"
                      value={t.area_m2}
                      onChange={e => updateTypology(t._id, 'area_m2', e.target.value)}
                      placeholder="66"
                      className="px-2 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                    />
                    <input
                      type="number"
                      value={t.price_usd}
                      onChange={e => updateTypology(t._id, 'price_usd', e.target.value)}
                      placeholder="120000"
                      className="px-2 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                    />
                    <input
                      type="number"
                      value={t.units_available}
                      onChange={e => updateTypology(t._id, 'units_available', e.target.value)}
                      placeholder="0"
                      className="px-2 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                    />
                    <button type="button" onClick={() => removeTypology(t._id)} className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-3">
                  <button type="button" onClick={addTypology} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <Plus className="w-4 h-4" /> Agregar tipología
                  </button>
                </div>
              </>
            )}
            {s.typologies.length === 0 && (
              <button
                type="button" onClick={addTypology}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" /> Agregar primera tipología
              </button>
            )}
          </div>
        </Block>

        {/* ══ BLOQUE 6 — FOTOS ══ */}
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
              <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
            </div>
            {s.fotos.length > 0 && (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {s.fotos.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={getPreviewUrl(file)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Portada</span>}
                      <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* ══ BLOQUE 7 — DESCRIPCIÓN ══ */}
        <Block title="Descripción">
          <textarea
            value={s.description}
            onChange={e => update({ description: e.target.value })}
            rows={5}
            placeholder="Describí el proyecto: características, ventajas, ubicación estratégica..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 resize-none"
          />
        </Block>

      </div>

      {/* Panel flotante */}
      <div className="fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-2">
        <button
          type="button" onClick={() => handleSave(false)} disabled={isSaving}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Publicar proyecto'}
        </button>
        <button
          type="button" onClick={() => handleSave(true)} disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors disabled:opacity-50"
        >
          Guardar borrador
        </button>
      </div>

    </div>
  )
}
