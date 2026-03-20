import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { createProperty } from '@/lib/properties'
import {
  PropertyForm,
  PropertyFormState,
  INITIAL_FORM_STATE,
  generateTitle,
  generateDescription,
} from '@/components/properties/PropertyForm'

export function PropiedadNuevaPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<PropertyFormState>(INITIAL_FORM_STATE)
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(patch: Partial<PropertyFormState>) {
    setState(prev => ({ ...prev, ...patch }))
  }

  async function handleSave(isDraft = false) {
    if (!state.operacion || !state.tipo) {
      toast.error('Completá operación y tipo de propiedad')
      return
    }
    setIsSaving(true)
    try {
      const titulo = state.titulo || generateTitle(state)
      const descripcion = state.descripcion || generateDescription(state)

      const property = await createProperty({
        operacion: state.operacion,
        tipo: state.tipo,
        titulo: titulo || null,
        descripcion: descripcion || null,
        latitud: state.lat,
        longitud: state.lng,
        ciudad: state.ciudad || null,
        barrio: state.barrio || null,
        zona: state.zona || null,
        direccion: state.direccion || null,
        dormitorios: state.dormitorios,
        banos: state.banos,
        superficie_m2: state.superficie_m2 ? parseFloat(state.superficie_m2) : null,
        terreno_m2: state.terreno_m2 ? parseFloat(state.terreno_m2) : null,
        superficie_cubierta_m2: state.superficie_cubierta_m2 ? parseFloat(state.superficie_cubierta_m2) : null,
        garajes: state.garajes,
        piso: state.piso ? parseInt(state.piso) : null,
        condicion: (state.condicion as any) || null,
        amenities: state.amenities,
        precio: state.precio ? parseFloat(state.precio) : null,
        moneda: state.moneda,
        financiacion: state.financiacion,
        amoblado: state.amoblado,
        estado: 'activo',
        publicado_en_web: !isDraft,
      })

      let portadaPath: string | null = null
      for (let i = 0; i < state.fotos.length; i++) {
        const file = state.fotos[i]
        const ext = file.name.split('.').pop()
        const path = `${property.id}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from('property-photos').upload(path, file)
        if (error) continue
        await supabase.from('property_photos').insert({
          property_id: property.id,
          storage_path: path,
          sort_order: i,
          es_portada: i === 0,
        })
        if (i === 0) portadaPath = path
      }

      if (portadaPath) {
        await supabase.from('properties').update({ foto_portada: portadaPath }).eq('id', property.id)
      }

      toast.success(isDraft ? 'Borrador guardado' : 'Propiedad publicada')
      navigate(`/propiedades/${property.id}`)
    } catch {
      toast.error('Error al guardar la propiedad')
    }
    setIsSaving(false)
  }

  return (
    <PropertyForm
      mode="create"
      state={state}
      onChange={handleChange}
      onSave={handleSave}
      onCancel={() => navigate('/propiedades')}
      isSaving={isSaving}
    />
  )
}
