import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProperties, getProperty, getPropertyPhotos,
  createProperty, updateProperty, deleteProperty,
} from '@/lib/properties'
import type { PropertyInsert, PropertyUpdate } from '@/lib/properties'

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
  return useMutation({
    mutationFn: (input: PropertyInsert) => createProperty(input),
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

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  })
}
