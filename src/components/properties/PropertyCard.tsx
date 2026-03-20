import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bed, Bath, Maximize2, MapPin, Globe, GlobeLock, Trash2 } from 'lucide-react'
import { useUpdateProperty, useDeleteProperty } from '@/hooks/useProperties'
import { getPhotoUrl, formatPrice } from '@/lib/properties'
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
  onConsultar?: (property: PropertyRow) => void
}

export function PropertyCard({ property, onConsultar }: Props) {
  const navigate = useNavigate()
  const updateProperty = useUpdateProperty()
  const deleteProperty = useDeleteProperty()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const coverUrl = property.foto_portada
    ? getPhotoUrl(property.foto_portada)
    : null

  function togglePublicado(e: React.MouseEvent) {
    e.stopPropagation()
    updateProperty.mutate({
      id: property.id,
      input: { publicado_en_web: !property.publicado_en_web },
    })
  }

  function handleConsultar(e: React.MouseEvent) {
    e.stopPropagation()
    onConsultar?.(property)
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmText('')
    setShowDeleteModal(true)
  }

  function handleConfirmDelete() {
    deleteProperty.mutate(property.id, {
      onSuccess: () => setShowDeleteModal(false),
    })
  }

  const title = property.titulo ||
    `${TIPO_LABEL[property.tipo] ?? property.tipo} en ${property.zona ?? 'Sin ubicación'}`

  return (
    <>
    <div
      onClick={() => navigate(`/propiedades/${property.id}`)}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100 flex-shrink-0">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Maximize2 className="w-10 h-10" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/60 text-white">
            {OP_LABEL[property.operacion] ?? property.operacion}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/60 text-white">
            {TIPO_LABEL[property.tipo] ?? property.tipo}
          </span>
        </div>
        {/* Trash button */}
        <button
          onClick={handleDeleteClick}
          title="Eliminar propiedad"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/70 hover:bg-red-600 hover:text-white transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {/* Estado inactivo */}
        {property.estado === 'inactivo' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-medium text-sm bg-black/60 px-3 py-1 rounded-full">Inactivo</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-medium text-gray-900 line-clamp-1">{title}</p>
          {property.zona && (
            <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-3 h-3" />{property.zona}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {property.dormitorios != null && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />{property.dormitorios}
            </span>
          )}
          {property.banos != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />{property.banos}
            </span>
          )}
          {property.superficie_m2 != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />{property.superficie_m2} m²
            </span>
          )}
        </div>

        {/* Price */}
        {property.precio != null && (
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-gray-800">
              {formatPrice(property.precio, property.moneda)}
            </p>
            {property.financiacion && (
              <p className="text-xs font-medium text-amber-700">Consultar financiación</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={handleConsultar}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Consultar
          </button>
          <button
            onClick={togglePublicado}
            title={property.publicado_en_web ? 'Publicado en web' : 'No publicado'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              property.publicado_en_web
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            {property.publicado_en_web
              ? <><Globe className="w-3.5 h-3.5" /> Web</>
              : <><GlobeLock className="w-3.5 h-3.5" /> Web</>}
          </button>
        </div>
      </div>
    </div>

    {/* Modal de confirmación de borrado */}
    {showDeleteModal && (
      <div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={e => { e.stopPropagation(); setShowDeleteModal(false) }}
      >
        <div
          className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Eliminar propiedad</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{title}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Esta acción es irreversible. Escribí <span className="font-mono font-semibold text-red-600">borrar</span> para confirmar.
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="borrar"
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={confirmText !== 'borrar' || deleteProperty.isPending}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleteProperty.isPending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
