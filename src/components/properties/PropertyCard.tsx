import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bed, Bath, Maximize2, MapPin, Trash2 } from 'lucide-react'
import { useUpdateProperty, useDeleteProperty } from '@/hooks/useProperties'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import type { PropertyRow } from '@/lib/properties'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Depto',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
}

const OP_LABEL: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
}

interface Props {
  property: PropertyRow
}

export function PropertyCard({ property }: Props) {
  const navigate = useNavigate()
  const updateProperty = useUpdateProperty()
  const deleteProperty = useDeleteProperty()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const coverUrl = property.foto_portada ? getPhotoUrl(property.foto_portada) : null
  const ubicacion = property.barrio ?? property.zona ?? property.ciudad ?? 'Sin ubicación'
  const title = property.titulo || `${TIPO_LABEL[property.tipo] ?? property.tipo} en ${ubicacion}`

  function togglePublicado(e: React.MouseEvent) {
    e.stopPropagation()
    updateProperty.mutate({ id: property.id, input: { publicado_en_web: !property.publicado_en_web } })
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  return (
    <>
    <div
      onClick={() => navigate(`/propiedades/${property.id}`)}
      className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.07)] overflow-hidden active:scale-[0.99] transition-transform cursor-pointer flex flex-col"
    >
      {/* Imagen */}
      <div className="relative bg-gray-100 flex-shrink-0" style={{ height: 140 }}>
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-gray-300" />
          </div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-900/70 text-white backdrop-blur-sm">
            {OP_LABEL[property.operacion] ?? property.operacion}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
            {TIPO_LABEL[property.tipo] ?? property.tipo}
          </span>
        </div>
        {/* Inactivo overlay */}
        {property.estado === 'inactivo' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full">Inactivo</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3 pt-2.5 pb-2 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight">{title}</p>

        {(property.barrio || property.zona || property.ciudad) && (
          <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{[property.barrio, property.zona, property.ciudad].filter(Boolean).join(' · ')}</span>
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2.5 text-[11px] text-gray-500">
          {property.dormitorios != null && (
            <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{property.dormitorios === 0 ? 'Mono' : property.dormitorios}</span>
          )}
          {property.banos != null && (
            <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.banos}</span>
          )}
          {property.superficie_m2 != null && (
            <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" />{property.superficie_m2} m²</span>
          )}
        </div>

        {/* Precio */}
        {property.precio != null && (
          <p className="text-sm font-bold text-gray-800">{formatPrice(property.precio, property.moneda)}</p>
        )}

        {/* Acciones CRM */}
        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-gray-50">
          <button
            onClick={togglePublicado}
            disabled={updateProperty.isPending}
            title={property.publicado_en_web ? 'Publicado en web' : 'No publicado'}
            className="flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-[10px] text-gray-400">Web</span>
            <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
              property.publicado_en_web ? 'bg-emerald-500' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                property.publicado_en_web ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </div>
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 active:bg-red-50 active:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <DeleteConfirmDialog
      open={showDeleteModal}
      mode="keyword"
      entityName={title}
      isPending={deleteProperty.isPending}
      onConfirm={() => deleteProperty.mutate(property.id, { onSuccess: () => setShowDeleteModal(false) })}
      onCancel={() => setShowDeleteModal(false)}
    />
    </>
  )
}
