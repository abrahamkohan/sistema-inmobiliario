import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bed, Bath, Maximize2, MapPin, Trash2 } from 'lucide-react'
import { useDeleteProperty } from '@/hooks/useProperties'
import { useAgentName } from '@/hooks/useTeam'
import { usePuedeBorrar } from '@/hooks/usePermiso'
import { getPhotoUrl } from '@/lib/properties'
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
  const deleteProperty = useDeleteProperty()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const agentName = useAgentName(property.assigned_to)

  // Safe access - handle null/undefined
  const safeString = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    return String(val)
  }

  const puedeBorrar = usePuedeBorrar('propiedades')
  const coverUrl = property.foto_portada ? getPhotoUrl(property.foto_portada) : null
  const ubicacion = property.barrio || property.zona || property.ciudad || 'Sin ubicación'
  const tipoLabel = safeString(property.tipo)
  const title = property.titulo || `${TIPO_LABEL[tipoLabel] ?? tipoLabel} en ${ubicacion}`

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
            {OP_LABEL[property.operacion ?? ''] ?? property.operacion ?? 'Venta'}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
            {TIPO_LABEL[property.tipo ?? ''] ?? property.tipo ?? 'Propiedad'}
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

        {/* Precio + Agente */}
        <div className="flex items-end justify-between mt-auto pt-1 gap-2">
          {property.precio != null ? (
            <p className="text-sm font-bold text-gray-900">
              {property.moneda === 'USD' ? '$' : '₲'}{property.precio.toLocaleString()}
            </p>
          ) : <span />}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {agentName && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                  {agentName[0].toUpperCase()}
                </span>
                <span className="truncate max-w-[60px]">{agentName.split(' ')[0]}</span>
              </span>
            )}
            {puedeBorrar && (
              <button
                onClick={e => { e.stopPropagation(); setShowDeleteModal(true) }}
                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    <DeleteConfirmDialog
      open={showDeleteModal}
      mode="name"
      entityName={title}
      onConfirm={() => { deleteProperty.mutate(property.id); setShowDeleteModal(false) }}
      onCancel={() => setShowDeleteModal(false)}
    />
    </>
  )
}
