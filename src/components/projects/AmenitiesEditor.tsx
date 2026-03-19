// src/components/projects/AmenitiesEditor.tsx
import { useState } from 'react'
import { Plus, Upload, X, Loader2 } from 'lucide-react'
import { amenityImageUrl } from '@/lib/projectAmenities'
import {
  useProjectAmenities,
  useAddAmenity,
  useUpdateAmenityName,
  useDeleteAmenity,
  useAddAmenityImage,
  useDeleteAmenityImage,
} from '@/hooks/useProjectAmenities'
import type { Database } from '@/types/database'

type AmenityImageRow = Database['public']['Tables']['project_amenity_images']['Row']

// ─── Listas predefinidas ──────────────────────────────────────────────────────

const AMENITIES_INTERIOR = [
  'Aire acondicionado', 'Calefacción', 'Lavandería', 'Cocina equipada',
  'Placares', 'Balcón', 'Terraza',
]
const AMENITIES_EDIFICIO = [
  'Piscina', 'Gimnasio', 'Parrilla / Quincho', 'Jardín',
  'Seguridad 24h', 'Ascensor', 'Salón de usos', 'Estacionamiento',
]
const ALL_PREDEFINED = [...AMENITIES_INTERIOR, ...AMENITIES_EDIFICIO]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AmenitiesEditorProps {
  projectId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AmenitiesEditor({ projectId }: AmenitiesEditorProps) {
  const { data: amenities = [], isLoading } = useProjectAmenities(projectId)
  const addAmenity    = useAddAmenity(projectId)
  const updateName    = useUpdateAmenityName(projectId)
  const deleteAmenity = useDeleteAmenity(projectId)
  const addImage      = useAddAmenityImage(projectId)
  const deleteImage   = useDeleteAmenityImage(projectId)

  const [customName, setCustomName]       = useState('')
  const [showCustom, setShowCustom]       = useState(false)
  const [activePasteId, setActivePasteId] = useState<string | null>(null)

  const existingNames = amenities.map(a => a.name.toLowerCase())

  // ─── Toggle chip predefinido ──────────────────────────────────────────────

  function toggleChip(name: string) {
    const existing = amenities.find(a => a.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      deleteAmenity.mutate(existing)
    } else {
      addAmenity.mutate({ name, sortOrder: amenities.length })
    }
  }

  // ─── Agregar custom ───────────────────────────────────────────────────────

  function doAddCustom() {
    const trimmed = customName.trim()
    if (!trimmed) return
    addAmenity.mutate({ name: trimmed, sortOrder: amenities.length })
    setCustomName('')
    setShowCustom(false)
  }

  // ─── Imágenes ─────────────────────────────────────────────────────────────

  function handleFile(amenityId: string, currentCount: number, file: File) {
    addImage.mutate({ amenityId, file, sortOrder: currentCount })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />Cargando amenities...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Interior chips ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Interior</p>
        <div className="flex flex-wrap gap-1.5">
          {AMENITIES_INTERIOR.map(name => {
            const active = existingNames.includes(name.toLowerCase())
            return (
              <button key={name} type="button"
                disabled={addAmenity.isPending}
                onClick={() => toggleChip(name)}
                className={`h-8 px-3 rounded-full border text-[12px] font-medium transition-all ${
                  active
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >{name}</button>
            )
          })}
        </div>
      </div>

      {/* ── Edificio chips ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Edificio</p>
        <div className="flex flex-wrap gap-1.5">
          {AMENITIES_EDIFICIO.map(name => {
            const active = existingNames.includes(name.toLowerCase())
            return (
              <button key={name} type="button"
                disabled={addAmenity.isPending}
                onClick={() => toggleChip(name)}
                className={`h-8 px-3 rounded-full border text-[12px] font-medium transition-all ${
                  active
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >{name}</button>
            )
          })}

          {/* + Otro */}
          {!showCustom && (
            <button type="button" onClick={() => setShowCustom(true)}
              className="h-8 px-3 rounded-full border border-dashed border-gray-300 text-[12px] text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-all"
            >+ Otro</button>
          )}
        </div>
      </div>

      {/* ── Input custom ───────────────────────────────────────────────────── */}
      {showCustom && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doAddCustom() } if (e.key === 'Escape') { setShowCustom(false); setCustomName('') } }}
            placeholder="Nombre personalizado..."
            className="flex-1 h-8 px-3 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          <button type="button" onClick={doAddCustom} disabled={!customName.trim()}
            className="flex items-center gap-1 h-8 px-3 rounded-lg border text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-40"
          ><Plus className="h-3 w-3" />Agregar</button>
          <button type="button" onClick={() => { setShowCustom(false); setCustomName('') }}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          ><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── Lista amenities agregados ───────────────────────────────────────── */}
      {amenities.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          {amenities.map(amenity => {
            const isPredefined = ALL_PREDEFINED.some(p => p.toLowerCase() === amenity.name.toLowerCase())
            return (
              <div key={amenity.id} className="flex items-center gap-2 group">

                {/* Nombre */}
                {isPredefined ? (
                  <span className="w-40 flex-shrink-0 text-xs font-medium text-gray-700 truncate">{amenity.name}</span>
                ) : (
                  <input
                    defaultValue={amenity.name}
                    onBlur={e => {
                      const v = e.target.value.trim()
                      if (v && v !== amenity.name) updateName.mutate({ id: amenity.id, name: v })
                    }}
                    className="w-40 flex-shrink-0 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                )}

                {/* Previews existentes */}
                {amenity.images.map((img: AmenityImageRow) => (
                  <div key={img.id} className="relative group/img flex-shrink-0">
                    <img src={amenityImageUrl(img.storage_path)} alt=""
                      className="h-8 w-8 rounded object-cover border border-gray-200"
                    />
                    <button type="button" onClick={() => deleteImage.mutate(img)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    ><X className="h-2.5 w-2.5" /></button>
                  </div>
                ))}

                {/* Spinner subida */}
                {addImage.isPending && activePasteId === amenity.id && (
                  <div className="h-8 w-8 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Zona pegar — visible en hover / focus */}
                <div
                  tabIndex={0}
                  onFocus={() => setActivePasteId(amenity.id)}
                  onBlur={() => setActivePasteId(prev => prev === amenity.id ? null : prev)}
                  onPaste={e => {
                    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
                    const file = item?.getAsFile()
                    if (file) handleFile(amenity.id, amenity.images.length, file)
                  }}
                  className={`flex-1 h-8 flex items-center justify-center rounded-lg border border-dashed text-[11px] cursor-pointer transition-all outline-none
                    ${activePasteId === amenity.id
                      ? 'border-gray-500 text-gray-600 bg-gray-50'
                      : 'border-transparent text-transparent group-hover:border-gray-300 group-hover:text-gray-400'
                    }`}
                >
                  Hacé clic aquí y pegá (Ctrl+V)
                </div>

                {/* Subir */}
                <label className="flex-shrink-0 h-7 w-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors" title="Subir imagen">
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(amenity.id, amenity.images.length, e.target.files[0])}
                  />
                </label>

                {/* Eliminar amenity */}
                <button type="button" onClick={() => deleteAmenity.mutate(amenity)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                  title="Eliminar amenity"
                ><X className="h-3.5 w-3.5" /></button>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
