// src/hooks/useProjectAmenities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjectAmenities, addAmenity, updateAmenityName, deleteAmenity,
  addAmenityImage, deleteAmenityImageRecord,
  type AmenityWithImages,
} from '@/lib/projectAmenities'
import type { Database } from '@/types/database'

type AmenityImageRow = Database['public']['Tables']['project_amenity_images']['Row']

const key = (projectId: string) => ['project_amenities', projectId]

export function useProjectAmenities(projectId: string) {
  return useQuery({
    queryKey: key(projectId),
    queryFn: () => getProjectAmenities(projectId),
    enabled: !!projectId,
  })
}

export function useAddAmenity(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, sortOrder }: { name: string; sortOrder: number }) =>
      addAmenity(projectId, name, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) }),
  })
}

export function useUpdateAmenityName(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateAmenityName(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) }),
  })
}

export function useDeleteAmenity(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (amenity: AmenityWithImages) => deleteAmenity(amenity),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) }),
  })
}

export function useAddAmenityImage(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ amenityId, file, sortOrder }: { amenityId: string; file: File; sortOrder: number }) =>
      addAmenityImage(projectId, amenityId, file, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) }),
  })
}

export function useDeleteAmenityImage(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (image: AmenityImageRow) => deleteAmenityImageRecord(image),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) }),
  })
}
