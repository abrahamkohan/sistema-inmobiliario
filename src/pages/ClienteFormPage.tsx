// src/pages/ClienteFormPage.tsx
// Página para crear y editar clientes (sidebar visible, barra flotante inferior)
import { useNavigate, useParams } from 'react-router'
import { X } from 'lucide-react'
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/useClients'
import { ClientFormNew, type ClientFormValues } from '@/components/clients/ClientFormNew'
import { toast } from 'sonner'
import { FormActionBar } from '@/components/ui/FormActionBar'

export function ClienteFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  // Data
  const { data: client, isLoading } = useClient(id ?? '')
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  
  // Handlers
  async function handleSubmit(values: ClientFormValues) {
    try {
      const payload = {
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        nationality: values.nationality || null,
        notes: values.notes || null,
        tipo: values.tipo,
        fuente: values.fuente || null,
        dni: values.dni || null,
        fecha_nacimiento: values.fecha_nacimiento || null,
        campos_extra: Object.keys(values.campos_extra).length > 0 ? values.campos_extra : null,
        apodo: values.apodo || null,
      }
      
      if (isEdit && id) {
        await updateClient.mutateAsync({ id, input: payload })
        toast.success('Cliente actualizado')
        navigate(`/clientes/${id}`)
      } else {
        const newClient = await createClient.mutateAsync(payload)
        toast.success(values.tipo === 'lead' ? 'Lead creado' : 'Cliente creado')
        navigate(`/clientes/${newClient.id}`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }
  
  function handleCancel() {
    if (isEdit && id) {
      navigate(`/clientes/${id}`)
    } else {
      navigate('/clientes')
    }
  }
  
  // Loading state
  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando cliente...</p>
      </div>
    )
  }
  
  // Si es edición pero no hay cliente
  if (isEdit && !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Cliente no encontrado</p>
      </div>
    )
  }
  
  const isPending = createClient.isPending || updateClient.isPending
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button onClick={handleCancel} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-0.5">
            ← Volver a {isEdit ? 'cliente' : 'clientes'}
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {isEdit ? 'Editar cliente' : 'Nuevo contacto'}
          </h1>
        </div>
        <button onClick={handleCancel} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </header>
      
      {/* ── Formulario ──────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <ClientFormNew
            key={id ?? 'new'}
            defaultValues={client ?? {}}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isPending}
          />
        </div>
      </div>
      
      {/* ── Barra inferior mobile ── */}
      <FormActionBar
        label={isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear contacto'}
        onSave={() => { const form = document.querySelector('form'); if (form) form.requestSubmit() }}
        onCancel={handleCancel}
        disabled={isPending}
      />
      
    </div>
  )
}