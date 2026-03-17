import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, X, Home, Key, Building2, Map, Store, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { createProperty } from '@/lib/properties'
import { LocationPicker } from '@/components/properties/LocationPicker'
import type { LocationValue } from '@/components/properties/LocationPicker'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  operacion: 'venta' | 'alquiler' | null
  tipo: 'departamento' | 'casa' | 'terreno' | 'comercial' | null
  location: LocationValue | null
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

const INITIAL_STATE: WizardState = {
  operacion: null,
  tipo: null,
  location: null,
  dormitorios: null,
  banos: null,
  superficie_m2: '',
  terreno_m2: '',
  amenities: [],
  fotos: [],
  precio: '',
  moneda: 'USD',
  titulo: '',
  descripcion: '',
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Local comercial',
}

const OP_LABEL: Record<string, string> = {
  venta: 'en Venta',
  alquiler: 'en Alquiler',
}

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

const PRESETS_USD = [30000, 50000, 80000, 100000, 150000, 200000, 300000]
const PRESETS_PYG = [50_000_000, 100_000_000, 200_000_000, 500_000_000, 1_000_000_000]

const TOTAL_STEPS = 8

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTitle(s: WizardState): string {
  const tipo = TIPO_LABEL[s.tipo!] ?? ''
  const op = OP_LABEL[s.operacion!] ?? ''
  const dormStr = s.dormitorios ? ` de ${s.dormitorios} dormitorio${s.dormitorios !== 1 ? 's' : ''}` : ''
  const zonaStr = s.location?.zona ? ` en ${s.location.zona}` : ''
  return `${tipo}${dormStr}${zonaStr} ${op}`.trim()
}

function generateDescription(s: WizardState): string {
  const tipo = TIPO_LABEL[s.tipo!] ?? ''
  const zona = s.location?.zona ?? ''
  const op = { venta: 'venta', alquiler: 'alquiler' }[s.operacion!] ?? ''
  const lines: string[] = []
  lines.push(`${tipo}${zona ? ` en ${zona}` : ''} disponible para ${op}.`)
  if (s.dormitorios || s.banos || s.superficie_m2) lines.push('')
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

function formatPreset(value: number, moneda: 'USD' | 'PYG'): string {
  if (moneda === 'USD') {
    return value >= 1_000_000 ? `$${value / 1_000_000}M` : `$${value / 1000}k`
  }
  return value >= 1_000_000_000 ? `₲${value / 1_000_000_000}B` : `₲${value / 1_000_000}M`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type Updater = (patch: Partial<WizardState>) => void

function ChipGroup({ label, options, value, onChange }: {
  label: string
  options: { value: number; label: string }[]
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              value === opt.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 1 — Operación
function Step1({ state, update, onNext }: { state: WizardState; update: Updater; onNext: () => void }) {
  function select(op: 'venta' | 'alquiler') {
    update({ operacion: op })
    setTimeout(onNext, 180)
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">¿Qué querés hacer?</h2>
        <p className="text-sm text-gray-500 mt-1">Seleccioná el tipo de operación</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          { value: 'venta' as const, label: 'Venta', icon: Home, desc: 'Publicar para vender' },
          { value: 'alquiler' as const, label: 'Alquiler', icon: Key, desc: 'Publicar para alquilar' },
        ]).map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            onClick={() => select(value)}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              state.operacion === value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Icon className="w-8 h-8" />
            <div className="text-center">
              <p className="font-semibold">{label}</p>
              <p className={`text-xs mt-0.5 ${state.operacion === value ? 'text-gray-300' : 'text-gray-400'}`}>{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 2 — Tipo
function Step2({ state, update, onNext }: { state: WizardState; update: Updater; onNext: () => void }) {
  function select(tipo: WizardState['tipo']) {
    update({ tipo })
    setTimeout(onNext, 180)
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Tipo de propiedad</h2>
        <p className="text-sm text-gray-500 mt-1">¿Qué tipo de propiedad es?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          { value: 'departamento' as const, label: 'Departamento', icon: Building2 },
          { value: 'casa' as const, label: 'Casa', icon: Home },
          { value: 'terreno' as const, label: 'Terreno', icon: Map },
          { value: 'comercial' as const, label: 'Comercial', icon: Store },
        ]).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => select(value)}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              state.tipo === value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Icon className="w-8 h-8" />
            <p className="font-semibold">{label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 3 — Ubicación
function Step3({ state, update }: { state: WizardState; update: Updater }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Ubicación</h2>
        <p className="text-sm text-gray-500 mt-1">Buscá la dirección o tocá el mapa para colocar el pin</p>
      </div>
      <LocationPicker
        value={state.location}
        onChange={loc => update({ location: loc })}
      />
    </div>
  )
}

// Step 4 — Características
function Step4({ state, update }: { state: WizardState; update: Updater }) {
  const showDormBanos = state.tipo !== 'terreno'
  const showTerreno = state.tipo === 'casa' || state.tipo === 'terreno'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Características</h2>
        <p className="text-sm text-gray-500 mt-1">Datos principales de la propiedad</p>
      </div>
      {showDormBanos && (
        <>
          <ChipGroup
            label="Dormitorios"
            options={[
              { value: 0, label: 'Mono' },
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4+' },
            ]}
            value={state.dormitorios}
            onChange={v => update({ dormitorios: v })}
          />
          <ChipGroup
            label="Baños"
            options={[
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3+' },
            ]}
            value={state.banos}
            onChange={v => update({ banos: v })}
          />
        </>
      )}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Superficie total</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={state.superficie_m2}
            onChange={e => update({ superficie_m2: e.target.value })}
            placeholder="Ej: 66"
            className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 text-right"
          />
          <span className="text-sm text-gray-500">m²</span>
        </div>
      </div>
      {showTerreno && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Superficie de terreno</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={state.terreno_m2}
              onChange={e => update({ terreno_m2: e.target.value })}
              placeholder="Ej: 200"
              className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 text-right"
            />
            <span className="text-sm text-gray-500">m²</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Step 5 — Amenities
function Step5({ state, update }: { state: WizardState; update: Updater }) {
  function toggle(id: string) {
    const next = state.amenities.includes(id)
      ? state.amenities.filter(a => a !== id)
      : [...state.amenities, id]
    update({ amenities: next })
  }
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
        <p className="text-sm text-gray-500 mt-1">Seleccioná las comodidades disponibles</p>
      </div>
      {AMENITIES_GRUPOS.map(({ grupo, items }) => (
        <div key={grupo}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{grupo}</p>
          <div className="flex flex-wrap gap-2">
            {items.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => toggle(id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  state.amenities.includes(id)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Step 6 — Fotos
function Step6({ state, update }: { state: WizardState; update: Updater }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrls = useRef<Record<string, string>>({})

  function fileKey(file: File) { return `${file.name}-${file.size}-${file.lastModified}` }

  function getPreviewUrl(file: File): string {
    const key = fileKey(file)
    if (!previewUrls.current[key]) {
      previewUrls.current[key] = URL.createObjectURL(file)
    }
    return previewUrls.current[key]
  }

  function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    update({ fotos: [...state.fotos, ...valid].slice(0, 10) })
  }

  function removeFile(i: number) {
    const file = state.fotos[i]
    const key = fileKey(file)
    const url = previewUrls.current[key]
    if (url) URL.revokeObjectURL(url)
    delete previewUrls.current[key]
    update({ fotos: state.fotos.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Fotos</h2>
        <p className="text-sm text-gray-500 mt-1">Agregá hasta 10 fotos. La primera será la portada.</p>
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Tocá para agregar fotos</p>
        <p className="text-xs text-gray-400 mt-1">o arrastrá y soltá aquí · JPG, PNG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>
      {state.fotos.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {state.fotos.map((file, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <img
                  src={getPreviewUrl(file)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                    Portada
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removeFile(i) }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">{state.fotos.length}/10 fotos</p>
        </>
      )}
    </div>
  )
}

// Step 7 — Precio
function Step7({ state, update }: { state: WizardState; update: Updater }) {
  const presets = state.moneda === 'USD' ? PRESETS_USD : PRESETS_PYG

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Precio</h2>
        <p className="text-sm text-gray-500 mt-1">¿Cuánto vale la propiedad?</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Moneda</p>
        <div className="flex gap-2">
          {(['USD', 'PYG'] as const).map(m => (
            <button
              key={m}
              onClick={() => update({ moneda: m, precio: '' })}
              className={`px-5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                state.moneda === m
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {m === 'USD' ? '$ USD' : '₲ PYG'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Precios frecuentes</p>
        <div className="flex flex-wrap gap-2">
          {presets.map(v => (
            <button
              key={v}
              onClick={() => update({ precio: String(v) })}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                state.precio === String(v)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {formatPreset(v, state.moneda)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">O ingresá el precio exacto</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 w-5">{state.moneda === 'USD' ? '$' : '₲'}</span>
          <input
            type="number"
            value={state.precio}
            onChange={e => update({ precio: e.target.value })}
            placeholder={state.moneda === 'USD' ? '120000' : '250000000'}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 text-right"
          />
        </div>
        {state.precio && parseFloat(state.precio) > 0 && (
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            {state.moneda === 'USD' ? '$' : '₲'}{' '}
            {parseFloat(state.precio).toLocaleString(state.moneda === 'USD' ? 'en-US' : 'es-PY')}
          </p>
        )}
      </div>
    </div>
  )
}

// Step 8 — Título, descripción y publicar
function Step8({ state, update, isSaving, onPublish }: {
  state: WizardState
  update: Updater
  isSaving: boolean
  onPublish: (draft: boolean) => void
}) {
  useEffect(() => {
    if (!state.titulo) update({ titulo: generateTitle(state) })
    if (!state.descripcion) update({ descripcion: generateDescription(state) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Título y descripción</h2>
        <p className="text-sm text-gray-500 mt-1">Generamos un texto base. Podés editarlo.</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">Título</p>
        <input
          value={state.titulo}
          onChange={e => update({ titulo: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">Descripción</p>
        <textarea
          value={state.descripcion}
          onChange={e => update({ descripcion: e.target.value })}
          rows={7}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
        />
      </div>
      {/* Preview */}
      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Vista previa</p>
        <p className="font-medium text-gray-900 text-sm">{state.titulo || '—'}</p>
        <p className="text-xs text-gray-500 mt-1">
          {[
            state.tipo && TIPO_LABEL[state.tipo],
            state.operacion && OP_LABEL[state.operacion],
            state.location?.zona,
          ].filter(Boolean).join(' · ')}
        </p>
        {state.precio && (
          <p className="text-sm font-semibold text-gray-800 mt-2">
            {state.moneda === 'USD' ? '$' : '₲'}{' '}
            {parseFloat(state.precio).toLocaleString(state.moneda === 'USD' ? 'en-US' : 'es-PY')}
          </p>
        )}
      </div>
      {/* Publish buttons */}
      <div className="flex flex-col gap-2 pt-1 pb-4">
        <button
          onClick={() => onPublish(false)}
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Publicar propiedad'}
        </button>
        <button
          onClick={() => onPublish(true)}
          disabled={isSaving}
          className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Guardar como borrador
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PropiedadNuevaPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [isSaving, setIsSaving] = useState(false)

  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setStep(s => Math.max(s - 1, 1)) }
  function update(patch: Partial<WizardState>) { setState(s => ({ ...s, ...patch })) }

  async function handlePublish(draft: boolean) {
    setIsSaving(true)
    try {
      // 1. Create property record
      const property = await createProperty({
        operacion: state.operacion!,
        tipo: state.tipo!,
        titulo: state.titulo || null,
        descripcion: state.descripcion || null,
        latitud: state.location?.lat ?? null,
        longitud: state.location?.lng ?? null,
        zona: state.location?.zona || null,
        direccion: state.location?.direccion || null,
        dormitorios: state.dormitorios,
        banos: state.banos,
        superficie_m2: state.superficie_m2 ? parseFloat(state.superficie_m2) : null,
        terreno_m2: state.terreno_m2 ? parseFloat(state.terreno_m2) : null,
        amenities: state.amenities,
        precio: state.precio ? parseFloat(state.precio) : null,
        moneda: state.moneda,
        estado: 'activo',
        publicado_en_web: !draft,
      })

      // 2. Upload photos
      let portadaPath: string | null = null
      for (let i = 0; i < state.fotos.length; i++) {
        const file = state.fotos[i]
        const ext = file.name.split('.').pop()
        const path = `${property.id}/${Date.now()}-${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(path, file)
        if (uploadError) continue
        await supabase.from('property_photos').insert({
          property_id: property.id,
          storage_path: path,
          sort_order: i,
          es_portada: i === 0,
        })
        if (i === 0) portadaPath = path
      }

      // 3. Set foto_portada
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

  const showFooter = step >= 3 && step <= 7

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100 flex-shrink-0">
        <div
          className="h-full bg-gray-900 transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {step > 2 ? (
          <button
            onClick={back}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors min-w-[60px]"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        ) : (
          <div className="min-w-[60px]" />
        )}
        <span className="flex-1 text-center text-sm font-medium text-gray-600">
          Paso {step} de {TOTAL_STEPS}
        </span>
        <button
          onClick={() => navigate('/propiedades')}
          className="text-gray-400 hover:text-gray-700 transition-colors min-w-[60px] flex justify-end"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          {step === 1 && <Step1 state={state} update={update} onNext={next} />}
          {step === 2 && <Step2 state={state} update={update} onNext={next} />}
          {step === 3 && <Step3 state={state} update={update} />}
          {step === 4 && <Step4 state={state} update={update} />}
          {step === 5 && <Step5 state={state} update={update} />}
          {step === 6 && <Step6 state={state} update={update} />}
          {step === 7 && <Step7 state={state} update={update} />}
          {step === 8 && (
            <Step8
              state={state}
              update={update}
              isSaving={isSaving}
              onPublish={handlePublish}
            />
          )}
        </div>
      </main>

      {/* Footer nav (steps 3–7) */}
      {showFooter && (
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 flex gap-3 bg-white">
          <button
            onClick={back}
            className="px-5 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
