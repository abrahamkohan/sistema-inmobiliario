// src/components/projects/AmenitiesEditor.tsx
import { useState, useRef, useEffect } from 'react'
import { Plus, Upload, X, Loader2, Clipboard } from 'lucide-react'
import { amenityImageUrl } from '@/lib/projectAmenities'
import {
  useProjectAmenities,
  useAddAmenity,
  useUpdateAmenityName,
  useUpdateAmenityIcon,
  useDeleteAmenity,
  useAddAmenityImage,
  useDeleteAmenityImage,
} from '@/hooks/useProjectAmenities'
import type { Database } from '@/types/database'

type AmenityImageRow = Database['public']['Tables']['project_amenity_images']['Row']

// ─── Icon presets ─────────────────────────────────────────────────────────────

const ICON_PRESETS: Record<string, string> = {
  'Aire acondicionado': 'wind',
  'Calefacción': 'flame',
  'Lavandería': 'washing-machine',
  'Cocina equipada': 'utensils',
  'Placares': 'archive',
  'Balcón': 'door-open',
  'Terraza': 'sun',
  'Piscina': 'waves',
  'Gimnasio': 'dumbbell',
  'Parrilla / Quincho': 'beef',
  'Jardín': 'tree-pine',
  'Seguridad 24h': 'shield',
  'Ascensor': 'arrow-up-down',
  'Salón de usos': 'building-2',
  'Estacionamiento': 'car',
}

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
  const updateIcon    = useUpdateAmenityIcon(projectId)
  const deleteAmenity = useDeleteAmenity(projectId)
  const addImage      = useAddAmenityImage(projectId)
  const deleteImage   = useDeleteAmenityImage(projectId)

  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [pasteModal, setPasteModal] = useState<{ amenityId: string; file: File | null; previewUrl: string | null } | null>(null)
  const pasteModalRef = useRef<HTMLDivElement>(null)

  const existingNames = amenities.map(a => a.name.toLowerCase())

  // ─── Toggle chip predefinido ──────────────────────────────────────────────

  function toggleChip(name: string, categoria: string) {
    const existing = amenities.find(a => a.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      deleteAmenity.mutate(existing)
    } else {
      addAmenity.mutate({ name, sortOrder: amenities.length, categoria, icon: ICON_PRESETS[name] })
    }
  }

  // ─── Agregar custom ───────────────────────────────────────────────────────

  function doAddCustom() {
    const trimmed = customName.trim()
    if (!trimmed) return
    addAmenity.mutate({ name: trimmed, sortOrder: amenities.length, categoria: 'edificio' })
    setCustomName('')
    setShowCustom(false)
  }

  // ─── Imágenes ─────────────────────────────────────────────────────────────

  function handleFile(amenityId: string, currentCount: number, file: File) {
    addImage.mutate({ amenityId, file, sortOrder: currentCount })
  }

  function openPasteModal(amenityId: string) { setPasteModal({ amenityId, file: null, previewUrl: null }) }
  function closePasteModal() {
    if (pasteModal?.previewUrl) URL.revokeObjectURL(pasteModal.previewUrl)
    setPasteModal(null)
  }
  function handleModalPaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
    const f = item?.getAsFile()
    if (!f) return
    if (pasteModal?.previewUrl) URL.revokeObjectURL(pasteModal.previewUrl)
    setPasteModal(prev => prev ? { ...prev, file: f, previewUrl: URL.createObjectURL(f) } : null)
  }
  function confirmPaste() {
    if (!pasteModal?.file) return
    handleFile(pasteModal.amenityId, amenities.find(a => a.id === pasteModal.amenityId)?.images.length ?? 0, pasteModal.file)
    if (pasteModal.previewUrl) URL.revokeObjectURL(pasteModal.previewUrl)
    setPasteModal(null)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pasteModal) { const t = setTimeout(() => pasteModalRef.current?.focus(), 50); return () => clearTimeout(t) }
  }, [pasteModal])

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
                onClick={() => toggleChip(name, 'interior')}
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
                onClick={() => toggleChip(name, 'edificio')}
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
                  <span className="w-36 flex-shrink-0 text-xs font-medium text-gray-700 truncate">{amenity.name}</span>
                ) : (
                  <input
                    defaultValue={amenity.name}
                    onBlur={e => {
                      const v = e.target.value.trim()
                      if (v && v !== amenity.name) updateName.mutate({ id: amenity.id, name: v })
                    }}
                    className="w-36 flex-shrink-0 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                )}

                {/* Ícono */}
                <input
                  key={amenity.id + '-icon'}
                  defaultValue={amenity.icon ?? ''}
                  onBlur={e => {
                    const v = e.target.value.trim()
                    if (v !== (amenity.icon ?? '')) updateIcon.mutate({ id: amenity.id, icon: v })
                  }}
                  placeholder="ícono"
                  title="Nombre del ícono (ej: waves, dumbbell, car)"
                  className="w-24 flex-shrink-0 px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />

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
                {addImage.isPending && pasteModal?.amenityId === amenity.id && (
                  <div className="h-8 w-8 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Subir */}
                <label className="flex-shrink-0 h-7 w-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors" title="Subir imagen">
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(amenity.id, amenity.images.length, e.target.files[0])}
                  />
                </label>

                {/* Pegar */}
                <button type="button" onClick={() => openPasteModal(amenity.id)}
                  className="flex-shrink-0 h-7 w-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors" title="Pegar imagen"
                ><Clipboard className="w-3.5 h-3.5" /></button>

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

      {/* ── Modal pegar imagen ─────────────────────────────────────────────── */}
      {pasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={closePasteModal}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Pegar imagen</p>
              <button onClick={closePasteModal} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div ref={pasteModalRef} tabIndex={0} onPaste={handleModalPaste}
              className="border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-gray-900 transition-colors cursor-default" style={{ minHeight: 180 }}
            >
              {pasteModal.previewUrl ? (
                <img src={pasteModal.previewUrl} alt="preview" className="w-full rounded-xl object-contain" style={{ maxHeight: 240 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Clipboard className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Pegá con Ctrl + V</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={closePasteModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmPaste} disabled={!pasteModal.file}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40"
              >{pasteModal.file ? 'Confirmar' : 'Esperando imagen…'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
