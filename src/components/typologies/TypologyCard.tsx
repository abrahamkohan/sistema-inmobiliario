// src/components/typologies/TypologyCard.tsx
import { useState } from 'react'
import { Pencil, Trash2, ImageOff, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicUrl } from '@/lib/storage'
import type { Database } from '@/types/database'

type TypologyRow = Database['public']['Tables']['typologies']['Row']

interface TypologyCardProps {
  typology: TypologyRow
  onEdit: (typology: TypologyRow) => void
  onDelete: (typology: TypologyRow) => void
}

export function TypologyCard({ typology, onEdit, onDelete }: TypologyCardProps) {
  const [imgError, setImgError] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const floorPlanUrl = typology.floor_plan
    ? getPublicUrl(typology.floor_plan)
    : typology.floor_plan_path
      ? getPublicUrl(typology.floor_plan_path)
      : null
  const url = floorPlanUrl  // keep reference for lightbox below

  return (
    <>
      <div className="border rounded-lg p-3 flex flex-col gap-2">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{typology.name}</p>
            <p className="text-xs text-muted-foreground">
              {typology.area_m2} m²
              {typology.bathrooms ? ` · ${typology.bathrooms} baño${typology.bathrooms > 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(typology)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(typology)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Features */}
        {typology.features && typology.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {typology.features.map(f => (
              <span key={f} className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600 font-medium">{f}</span>
            ))}
          </div>
        )}

        {/* Gallery thumbnails */}
        {typology.images && typology.images.length > 0 && (
          <div className="grid grid-cols-4 gap-1">
            {typology.images.slice(0, 4).map((path, i) => (
              <div key={i} className="aspect-square rounded overflow-hidden border border-gray-100 bg-gray-50">
                <img src={getPublicUrl(path)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Floor plan thumbnail */}
        {url && !imgError && (
          <div
            className="relative group cursor-zoom-in rounded-md overflow-hidden bg-gray-50 border"
            style={{ height: 140 }}
            onClick={() => setLightbox(true)}
          >
            <img
              src={url}
              alt={`Plano ${typology.name}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
            </div>
          </div>
        )}
        {url && imgError && (
          <div className="flex items-center justify-center rounded-md border bg-gray-50" style={{ height: 60 }}>
            <ImageOff className="h-4 w-4 text-gray-300" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && url && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={url}
            alt={`Plano ${typology.name}`}
            className="max-w-full max-h-full rounded-lg object-contain"
            style={{ maxHeight: '90vh' }}
          />
        </div>
      )}
    </>
  )
}
