import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { X, Upload, Link as LinkIcon, Check, Plus, Trash2, Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { createProject } from '@/lib/projects'
import { createTypology } from '@/lib/typologies'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'en_pozo' | 'en_construccion' | 'entregado'
type TipoProyecto = 'residencial' | 'comercial' | 'mixto'
type TypologyType = 'mono' | '1dorm' | '2dorm' | '3dorm' | '4dorm' | 'cochera' | 'cochera_xl' | 'baulera'

interface TypologyVariant {
  _id: string
  area_m2: string
  plano: File | null
}

interface TypologyDraft {
  banos: number | null
  variants: TypologyVariant[]
}

interface FormState {
  name: string
  status: Status
  developer_name: string
  tipo_proyecto: TipoProyecto | null
  delivery_date: string
  maps_url: string
  lat: number | null
  lng: number | null
  zona: string
  direccion: string
  link_drive: string
  link_brochure: string
  link_vista360: string
  selected_types: TypologyType[]
  typology_data: Partial<Record<TypologyType, TypologyDraft>>
  caracteristicas: string
  fotos: File[]
  resumen: string
}

const INITIAL: FormState = {
  name: '', status: 'en_pozo', developer_name: '', tipo_proyecto: null, delivery_date: '',
  maps_url: '', lat: null, lng: null, zona: '', direccion: '',
  link_drive: '', link_brochure: '', link_vista360: '',
  selected_types: [], typology_data: {},
  caracteristicas: '',
  fotos: [],
  resumen: '',
}

// ─── Typology definitions (fixed order) ────────────────────────────────────────

const TYPOLOGY_DEFS: Array<{
  id: TypologyType
  label: string
  hasBanos: boolean
  category: 'unidad' | 'cochera' | 'baulera'
}> = [
  { id: 'mono',       label: 'Monoambiente',  hasBanos: true,  category: 'unidad'  },
  { id: '1dorm',      label: '1 Dormitorio',  hasBanos: true,  category: 'unidad'  },
  { id: '2dorm',      label: '2 Dormitorios', hasBanos: true,  category: 'unidad'  },
  { id: '3dorm',      label: '3 Dormitorios', hasBanos: true,  category: 'unidad'  },
  { id: '4dorm',      label: '4 Dormitorios', hasBanos: true,  category: 'unidad'  },
  { id: 'cochera',    label: 'Cochera',        hasBanos: false, category: 'cochera' },
  { id: 'cochera_xl', label: 'Cochera XL',     hasBanos: false, category: 'cochera' },
  { id: 'baulera',    label: 'Baulera',        hasBanos: false, category: 'baulera' },
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

// ─── PlanoInput ────────────────────────────────────────────────────────────────

function PlanoInput({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const [dragging, setDragging] = useState(false)

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile()
        if (f) onChange(f)
        break
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) onChange(f)
  }

  return (
    <div className="flex gap-2 mt-2">
      <label
        className={`flex-1 flex items-center gap-1.5 px-3 py-2 border border-dashed rounded-xl text-xs cursor-pointer transition-colors ${
          dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 text-gray-500 hover:border-gray-400'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-3 h-3 flex-shrink-0" />
        {value
          ? <span className="truncate text-emerald-600 max-w-[120px]">{value.name}</span>
          : <span>Subir archivo</span>
        }
        <input type="file" accept="image/*,.pdf" className="hidden"
          onChange={e => e.target.files?.[0] && onChange(e.target.files[0])}
        />
      </label>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 select-none"
      >
        <Clipboard className="w-3 h-3" /> Pegar
      </div>
    </div>
  )
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

  // ── Maps ─────────────────────────────────────────────────────────────────
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

  // ── Photos ───────────────────────────────────────────────────────────────
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

  // ── Typologies ──────────────────────────────────────────────────────────
  function toggleTypology(type: TypologyType) {
    if (s.selected_types.includes(type)) {
      update({ selected_types: s.selected_types.filter(t => t !== type) })
    } else {
      const newData = { ...s.typology_data }
      if (!newData[type]) newData[type] = { banos: null, variants: [{ _id: crypto.randomUUID(), area_m2: '', plano: null }] }
      update({ selected_types: [...s.selected_types, type], typology_data: newData })
    }
  }

  function updateBanos(type: TypologyType, banos: number | null) {
    update({ typology_data: { ...s.typology_data, [type]: { ...s.typology_data[type]!, banos } } })
  }

  function addVariant(type: TypologyType) {
    const draft = s.typology_data[type]!
    update({
      typology_data: {
        ...s.typology_data,
        [type]: { ...draft, variants: [...draft.variants, { _id: crypto.randomUUID(), area_m2: '', plano: null }] },
      },
    })
  }

  function removeVariant(type: TypologyType, variantId: string) {
    const draft = s.typology_data[type]!
    if (draft.variants.length <= 1) return
    update({
      typology_data: {
        ...s.typology_data,
        [type]: { ...draft, variants: draft.variants.filter(v => v._id !== variantId) },
      },
    })
  }

  function updateVariantField(type: TypologyType, variantId: string, field: 'area_m2' | 'plano', value: string | File | null) {
    const draft = s.typology_data[type]!
    update({
      typology_data: {
        ...s.typology_data,
        [type]: { ...draft, variants: draft.variants.map(v => v._id === variantId ? { ...v, [field]: value } : v) },
      },
    })
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!s.name.trim()) { toast.error('El nombre del proyecto es requerido'); return }
    setIsSaving(true)
    try {
      const links = [
        s.maps_url      && { type: 'maps',     name: 'Google Maps',  url: s.maps_url },
        s.link_drive    && { type: 'drive',    name: 'Google Drive', url: s.link_drive },
        s.link_brochure && { type: 'brochure', name: 'Brochure',     url: s.link_brochure },
        s.link_vista360 && { type: 'vista360', name: 'Vista 360',    url: s.link_vista360 },
      ].filter(Boolean) as Array<{ type: string; name: string; url: string }>

      const project = await createProject({
        name: s.name.trim(),
        status: s.status,
        developer_name: s.developer_name || null,
        tipo_proyecto: s.tipo_proyecto,
        location: s.zona || null,
        description: s.resumen || null,
        delivery_date: s.delivery_date || null,
        amenities: [],
        links,
        caracteristicas: s.caracteristicas || null,
      })

      // Tipologías — orden fijo, una fila por variante
      for (const def of TYPOLOGY_DEFS) {
        if (!s.selected_types.includes(def.id)) continue
        const typDraft = s.typology_data[def.id]!
        for (const variant of typDraft.variants) {
          let floorPlanPath: string | null = null
          if (variant.plano) {
            const ext = variant.plano.name.split('.').pop()
            const planPath = `${project.id}/plan-${def.id}-${variant._id}.${ext}`
            const { error: uploadErr } = await supabase.storage.from('project-photos').upload(planPath, variant.plano)
            if (!uploadErr) floorPlanPath = planPath
          }
          await createTypology({
            project_id: project.id,
            name: def.label,
            area_m2: parseFloat(variant.area_m2) || 0,
            price_usd: 0,
            units_available: 0,
            category: def.category,
            unit_type: def.id,
            bathrooms: typDraft.banos,
            floor_plan_path: floorPlanPath,
          })
        }
      }

      // Fotos del proyecto
      for (let i = 0; i < s.fotos.length; i++) {
        const file = s.fotos[i]
        const ext = file.name.split('.').pop()
        const path = `${project.id}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('project-photos').upload(path, file)
        if (error) continue
        await supabase.from('project_photos').insert({ project_id: project.id, storage_path: path, sort_order: i })
      }

      toast.success('Proyecto creado')
      navigate('/proyectos')
    } catch (err) {
      toast.error('Error al guardar el proyecto')
      console.error(err)
    }
    setIsSaving(false)
  }

  // ── Header summary ────────────────────────────────────────────────────────
  const TIPO_LABEL: Record<TipoProyecto, string> = { residencial: 'Residencial', comercial: 'Comercial', mixto: 'Mixto' }
  const hasHeaderSummary = !!(s.name || s.tipo_proyecto)

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">Nuevo proyecto</h1>
          {hasHeaderSummary ? (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {s.name && <span className="text-xs font-medium text-gray-700">{s.name}</span>}
              {s.tipo_proyecto && <span className="text-xs text-gray-400">· {TIPO_LABEL[s.tipo_proyecto]}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Completá los datos y publicá</p>
          )}
        </div>
        <button
          onClick={() => navigate('/proyectos')}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* ══ 1 — LO ESENCIAL ══ */}
        <PrimaryBlock>
          <div className="mb-5">
            <Label>Nombre del proyecto</Label>
            <TextInput
              value={s.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="Ej: Urban Cumbres Torre B"
            />
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
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
            <div>
              <Label>Entrega estimada</Label>
              <input
                type="date"
                value={s.delivery_date}
                onChange={e => update({ delivery_date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
              />
            </div>
          </div>
        </PrimaryBlock>

        {/* ══ 2 — UBICACIÓN ══ */}
        <Block title="Ubicación">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Google Maps</Label>
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
                  {mapsData.lat ? `${mapsData.lat.toFixed(4)}, ${mapsData.lng?.toFixed(4)}` : 'Link válido'}
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

        {/* ══ 3 — LINKS ══ */}
        <Block title="Links">
          <div className="flex flex-col gap-3">
            {([
              { label: 'Google Maps', value: s.maps_url,      onChange: (v: string) => handleMapsLink(v),             ph: 'https://maps.app.goo.gl/...' },
              { label: 'Brochure',    value: s.link_brochure, onChange: (v: string) => update({ link_brochure: v }), ph: 'https://...' },
              { label: 'Drive',       value: s.link_drive,    onChange: (v: string) => update({ link_drive: v }),    ph: 'https://drive.google.com/...' },
              { label: 'Vista 360',   value: s.link_vista360, onChange: (v: string) => update({ link_vista360: v }), ph: 'https://...' },
            ]).map(({ label, value, onChange, ph }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-24 flex-shrink-0">{label}</span>
                <input
                  type="url"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  placeholder={ph}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                />
              </div>
            ))}
          </div>
        </Block>

        {/* ══ 4 — TIPOLOGÍAS ══ */}
        <Block title="Tipologías">
          {/* Selector chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {TYPOLOGY_DEFS.map(def => {
              const active = s.selected_types.includes(def.id)
              return (
                <button
                  key={def.id} type="button"
                  onClick={() => toggleTypology(def.id)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >{def.label}</button>
              )
            })}
          </div>

          {/* Cards en orden fijo */}
          {s.selected_types.length > 0 ? (
            <div className="flex flex-col gap-4">
              {TYPOLOGY_DEFS.filter(def => s.selected_types.includes(def.id)).map(def => {
                const draft = s.typology_data[def.id]!
                return (
                  <div key={def.id} className="border border-gray-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-4">{def.label}</p>

                    {/* Baños — nivel tipología, solo residencial */}
                    {def.hasBanos && (
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs text-gray-400 w-10 flex-shrink-0">Baños</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(n => (
                            <button
                              key={n} type="button"
                              onClick={() => updateBanos(def.id, draft.banos === n ? null : n)}
                              className={`w-9 h-9 rounded-xl border-2 text-sm font-medium transition-all ${
                                draft.banos === n ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                              }`}
                            >{n === 3 ? '3+' : n}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variantes */}
                    <div className="flex flex-col gap-3">
                      {draft.variants.map((variant, idx) => (
                        <div key={variant._id}>
                          {draft.variants.length > 1 && (
                            <p className="text-xs text-gray-400 mb-1.5">Variante {idx + 1}</p>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0 pt-2">
                              <span className="text-xs text-gray-400">m²</span>
                              <input
                                type="number"
                                value={variant.area_m2}
                                onChange={e => updateVariantField(def.id, variant._id, 'area_m2', e.target.value)}
                                placeholder="50"
                                style={{ width: 80 }}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400"
                              />
                            </div>
                            <div className="flex-1">
                              <PlanoInput
                                value={variant.plano}
                                onChange={f => updateVariantField(def.id, variant._id, 'plano', f)}
                              />
                            </div>
                            {draft.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariant(def.id, variant._id)}
                                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addVariant(def.id)}
                      className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar variante
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">Seleccioná las tipologías del proyecto arriba</p>
          )}
        </Block>

        {/* ══ 5 — CARACTERÍSTICAS DEL EDIFICIO ══ */}
        <Block title="Características del edificio">
          <textarea
            value={s.caracteristicas}
            onChange={e => update({ caracteristicas: e.target.value })}
            rows={5}
            placeholder={"4 Torres · 6 pisos · 14 dptos por piso\n2 Piscinas · Solarium\n1 Gimnasio por torre\nSeguridad 24h · Ascensor panorámico"}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 resize-none"
          />
        </Block>

        {/* ══ 6 — FOTOS ══ */}
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
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
              <p className="text-sm text-gray-500">Tocá para agregar fotos</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · máx. 20</p>
              <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => e.target.files && addFiles(e.target.files)}
              />
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

        {/* ══ 7 — RESUMEN ══ */}
        <Block title="Resumen">
          <textarea
            value={s.resumen}
            onChange={e => update({ resumen: e.target.value })}
            rows={6}
            placeholder={"URBAN CUMBRES TORRE B\nEntrega: Marzo 2027\n\nUbicación estratégica en el corazón de Luque. Proyecto residencial con amenities premium..."}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 resize-none"
          />
        </Block>

      </div>

      {/* Panel flotante */}
      <div className="fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-2">
        <button
          type="button" onClick={handleSave} disabled={isSaving}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Publicar proyecto'}
        </button>
        <button
          type="button" onClick={() => navigate('/proyectos')} disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
      </div>

    </div>
  )
}
