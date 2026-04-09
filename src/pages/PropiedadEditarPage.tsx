import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  useProperty, usePropertyPhotos, useUpdateProperty,
  useAddPropertyPhoto, useDeletePropertyPhoto,
} from '@/hooks/useProperties'
import { getPhotoUrl } from '@/lib/properties'
import {
  PropertyForm,
  PropertyFormState,
  INITIAL_FORM_STATE,
  ALL_AMENITIES,
  type ExistingPhoto,
} from '@/components/properties/PropertyForm'

// Extract amenity IDs from a description string
function extractAmenityIds(desc: string): { intro: string; amenityIds: string[] } {
  const lines = desc.split('\n')
  const intro: string[] = []
  const foundIds: string[] = []
  for (const line of lines) {
    const t = line.trim().replace(/^[•\-\*]\s*/, '')
    const match = ALL_AMENITIES.find(a => a.label.toLowerCase() === t.toLowerCase())
    if (match) foundIds.push(match.id)
    else if (line.trim()) intro.push(line)
  }
  return { intro: intro.join('\n'), amenityIds: foundIds }
}

function buildDescription(intro: string, amenityIds: string[]): string {
  const lines: string[] = intro ? [intro] : []
  const labels = amenityIds.map(id => ALL_AMENITIES.find(a => a.id === id)?.label).filter(Boolean) as string[]
  if (labels.length > 0) {
    if (lines.length > 0) lines.push('')
    labels.forEach(l => lines.push(`• ${l}`))
  }
  return lines.join('\n').trim()
}

export function PropiedadEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(id!)
  const { data: photos = [] } = usePropertyPhotos(id!)
  const updateProperty = useUpdateProperty()
  const addPhoto = useAddPropertyPhoto()
  const deletePhoto = useDeletePropertyPhoto()

  const [state, setState] = useState<PropertyFormState | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize state from property
  useEffect(() => {
    if (!property || state) return
    const { intro, amenityIds } = property.descripcion
      ? extractAmenityIds(property.descripcion)
      : { intro: '', amenityIds: [] }

    setState({
      ...INITIAL_FORM_STATE,
      operacion: property.operacion ?? null,
      tipo: property.tipo ?? null,
      precio: property.precio != null ? String(property.precio) : '',
      moneda: (property.moneda as 'USD' | 'PYG') ?? 'USD',
      financiacion: property.financiacion ?? false,
      amoblado: property.amoblado ?? false,
      lat: property.latitud ?? null,
      lng: property.longitud ?? null,
      mapsLink: '',
      ciudad: property.ciudad ?? '',
      barrio: property.barrio ?? '',
      zona: property.zona ?? '',
      direccion: property.direccion ?? '',
      dormitorios: property.dormitorios ?? null,
      banos: property.banos ?? null,
      superficie_m2: property.superficie_m2 != null ? String(property.superficie_m2) : '',
      terreno_m2: property.terreno_m2 != null ? String(property.terreno_m2) : '',
      superficie_cubierta_m2: property.superficie_cubierta_m2 != null ? String(property.superficie_cubierta_m2) : '',
      garajes: property.garajes ?? null,
      piso: property.piso != null ? String(property.piso) : '',
      condicion: property.condicion ?? '',
      amenities: amenityIds,
      titulo: property.titulo ?? '',
      descripcion: intro,
      estado: (property as any).estado ?? 'activo',
      publicado_en_web: property.publicado_en_web ?? false,
      fotos: [],
    })
  }, [property, state])

  const handleChange = useCallback((patch: Partial<PropertyFormState>) => {
    setState(prev => prev ? { ...prev, ...patch } : prev)
    setIsDirty(true)
  }, [])

  async function handleSave() {
    if (!state || !property) return
    setIsSaving(true)
    try {
      const descripcion = buildDescription(state.descripcion, state.amenities)
      await updateProperty.mutateAsync({
        id: property.id,
        input: {
          titulo: state.titulo || null,
          tipo: state.tipo as any,
          operacion: state.operacion as any,
          estado: state.estado as any,
          dormitorios: state.dormitorios,
          banos: state.banos,
          superficie_m2: state.superficie_m2 ? parseFloat(state.superficie_m2) : null,
          terreno_m2: state.terreno_m2 ? parseFloat(state.terreno_m2) : null,
          superficie_cubierta_m2: state.superficie_cubierta_m2 ? parseFloat(state.superficie_cubierta_m2) : null,
          garajes: state.garajes,
          piso: state.piso ? parseInt(state.piso) : null,
          condicion: (state.condicion as any) || null,
          descripcion: descripcion || null,
          precio: state.precio ? parseFloat(state.precio) : null,
          moneda: state.moneda,
          financiacion: state.financiacion,
          amoblado: state.amoblado,
          publicado_en_web: state.publicado_en_web,
          ciudad: state.ciudad || null,
          barrio: state.barrio || null,
          zona: state.zona || null,
          direccion: state.direccion || null,
          latitud: state.lat,
          longitud: state.lng,
        },
      })
      setIsDirty(false)
      toast.success('Cambios guardados')
    } catch {
      toast.error('Error al guardar')
    }
    setIsSaving(false)
  }

  async function handleAddPhotos(files: FileList | File[]) {
    if (!property) return
    const base = photos.length
    let firstUploaded: string | null = null
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await addPhoto.mutateAsync({ propertyId: property.id, file: files[i], sortOrder: base + i })
        if (i === 0) firstUploaded = result.storage_path
      } catch {
        toast.error(`Error subiendo foto ${files[i].name}`)
      }
    }
    if (firstUploaded && (base === 0 || !property.foto_portada)) {
      await updateProperty.mutateAsync({ id: property.id, input: { foto_portada: firstUploaded } })
    }
    toast.success(`${files.length} foto${files.length !== 1 ? 's' : ''} agregada${files.length !== 1 ? 's' : ''}`)
  }

  async function handleDeletePhoto(photo: ExistingPhoto) {
    try {
      await deletePhoto.mutateAsync(photo)
      if (photo.storage_path === property?.foto_portada && property) {
        const remaining = photos.filter(p => p.id !== photo.id)
        await updateProperty.mutateAsync({
          id: property.id,
          input: { foto_portada: remaining[0]?.storage_path ?? null },
        })
      }
    } catch {
      toast.error('Error eliminando foto')
    }
  }

  async function handleSetPortada(storagePath: string) {
    if (!property) return
    try {
      await updateProperty.mutateAsync({ id: property.id, input: { foto_portada: storagePath } })
      toast.success('Foto de portada actualizada')
    } catch {
      toast.error('Error actualizando portada')
    }
  }

  if (isLoading || !state) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <PropertyForm
      mode="edit"
      state={state}
      onChange={handleChange}
      onSave={handleSave}
      onCancel={() => navigate(`/propiedades/${id}`)}
      isSaving={isSaving}
      isDirty={isDirty}
      existingPhotos={photos}
      fotoPortada={property?.foto_portada}
      onAddPhotos={handleAddPhotos}
      onDeletePhoto={handleDeletePhoto}
      onSetPortada={handleSetPortada}
      getPhotoUrl={getPhotoUrl}
    />
  )
}
