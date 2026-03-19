// src/components/projects/AmenitiesEditor.tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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

// ─── Sugerencias rápidas ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Piscina', 'Gimnasio', 'SUM', 'Seguridad 24hs', 'Ascensor',
  'Terraza', 'Parrilla / BBQ', 'Coworking', 'Área de juegos', 'Estacionamiento',
]

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

  const [customName, setCustomName] = useState('')

  // ─── Paste global (Ctrl+V) en el último amenity activo ──────────────────────

  const [activeAmenityId, setActiveAmenityId] = useState<string | null>(null)

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!activeAmenityId) return
    const items = Array.from(e.clipboardData?.items ?? [])
    const imgItem = items.find(i => i.type.startsWith('image/'))
    if (!imgItem) return
    const file = imgItem.getAsFile()
    if (!file) return
    const amenity = amenities.find(a => a.id === activeAmenityId)
    if (!amenity) return
    addImage.mutate({ amenityId: activeAmenityId, file, sortOrder: amenity.images.length })
  }, [activeAmenityId, amenities, addImage])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // ─── Add amenity ─────────────────────────────────────────────────────────────

  function doAdd(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    addAmenity.mutate({ name: trimmed, sortOrder: amenities.length })
    setCustomName('')
  }

  // ─── Upload images ──────────────────────────────────────────────────────────

  function handleFiles(amenityId: string, currentCount: number, files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file, i) => {
      addImage.mutate({ amenityId, file, sortOrder: currentCount + i })
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const existingNames = amenities.map(a => a.name.toLowerCase())

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" />Cargando amenities...</div>
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Sugerencias rápidas ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(s => {
          const added = existingNames.includes(s.toLowerCase())
          return (
            <button
              key={s}
              type="button"
              disabled={added || addAmenity.isPending}
              onClick={() => doAdd(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                added
                  ? 'bg-primary/10 border-primary/30 text-primary opacity-50 cursor-default'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              }`}
            >
              {added ? '✓ ' : '+ '}{s}
            </button>
          )
        })}
      </div>

      {/* ── Custom name input ────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <Input
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(customName) } }}
          placeholder="Nombre personalizado..."
          className="h-8 text-sm"
        />
        <button
          type="button"
          disabled={!customName.trim() || addAmenity.isPending}
          onClick={() => doAdd(customName)}
          className="flex-shrink-0 flex items-center gap-1 px-3 h-8 rounded-md border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />Agregar
        </button>
      </div>

      {/* ── Lista de amenities ──────────────────────────────────────────────── */}
      {amenities.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {amenities.map(amenity => {
            const fileInputId = `amenity-files-${amenity.id}`
            return (
              <div
                key={amenity.id}
                className="rounded-xl border bg-muted/30 p-3 flex flex-col gap-2.5"
                onFocus={() => setActiveAmenityId(amenity.id)}
                onClick={() => setActiveAmenityId(amenity.id)}
              >
                {/* Row 1: nombre + acciones */}
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue={amenity.name}
                    onBlur={e => {
                      const v = e.target.value.trim()
                      if (v && v !== amenity.name) updateName.mutate({ id: amenity.id, name: v })
                    }}
                    className="h-7 text-sm flex-1"
                  />

                  {/* Botón subir fotos */}
                  <label
                    htmlFor={fileInputId}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 h-7 rounded-md border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 cursor-pointer transition-colors"
                  >
                    <Upload className="h-3 w-3" />Subir
                  </label>
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleFiles(amenity.id, amenity.images.length, e.target.files)}
                  />

                  {/* Pegar hint */}
                  {activeAmenityId === amenity.id && (
                    <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
                      Ctrl+V para pegar
                    </span>
                  )}

                  {/* Eliminar amenity */}
                  <button
                    type="button"
                    onClick={() => deleteAmenity.mutate(amenity)}
                    className="flex-shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Row 2: previews de imágenes */}
                {amenity.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {amenity.images.map((img: AmenityImageRow) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={amenityImageUrl(img.storage_path)}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => deleteImage.mutate(img)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Spinner si se está subiendo */}
                    {addImage.isPending && (
                      <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}

                {amenity.images.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/50">Sin imágenes — subí fotos o pegá con Ctrl+V</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {amenities.length === 0 && (
        <p className="text-xs text-muted-foreground/60 py-1">
          Seleccioná una sugerencia o escribí un nombre personalizado.
        </p>
      )}
    </div>
  )
}
