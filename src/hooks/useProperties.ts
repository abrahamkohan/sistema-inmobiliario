import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getProperties, getProperty, getPropertyPhotos,
  createProperty, updateProperty, deleteProperty,
  addPropertyPhoto, deletePropertyPhoto,
} from '@/lib/properties'
import type { PropertyInsert, PropertyUpdate, PropertyPhotoRow } from '@/lib/properties'
import { useAuth } from '@/context/AuthContext'
import { useTeam } from '@/hooks/useTeam'

export function useProperties() {
  return useQuery({ queryKey: ['properties'], queryFn: getProperties })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => getProperty(id),
    enabled: !!id,
  })
}

export function usePropertyPhotos(propertyId: string) {
  return useQuery({
    queryKey: ['property_photos', propertyId],
    queryFn: () => getPropertyPhotos(propertyId),
    enabled: !!propertyId,
  })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const { data: team = [] } = useTeam()
  
  // Obtener consultant_id del usuario desde user_roles
  const currentUser = team.find(m => m.id === session?.user?.id)
  const consultant_id = currentUser?.consultant_id

  return useMutation({
    mutationFn: (input: PropertyInsert) => {
      const dataWithConsultant = {
        ...input,
        assigned_to: session?.user?.id ?? null,
        assigned_agent_id: session?.user?.id ?? null,
        consultant_id: consultant_id as any
      }

      return createProperty(dataWithConsultant)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PropertyUpdate }) =>
      updateProperty(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['properties', id] })
    },
  })
}

export function useAddPropertyPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ propertyId, file, sortOrder }: { propertyId: string; file: File; sortOrder: number }) =>
      addPropertyPhoto(propertyId, file, sortOrder),
    onSuccess: (_data, { propertyId }) => qc.invalidateQueries({ queryKey: ['property_photos', propertyId] }),
  })
}

export function useDeletePropertyPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photo: PropertyPhotoRow) => deletePropertyPhoto(photo),
    onSuccess: (_data, photo) => qc.invalidateQueries({ queryKey: ['property_photos', photo.property_id] }),
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
    onError: () => toast.error('Ocurrió un error, intentá nuevamente'),
  })
}
