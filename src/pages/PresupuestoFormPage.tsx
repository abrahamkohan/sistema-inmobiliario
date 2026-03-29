// src/pages/PresupuestoFormPage.tsx
import { useNavigate, useParams } from 'react-router'
import { X } from 'lucide-react'
import { usePresupuestoById, useCreatePresupuesto, useUpdatePresupuesto } from '@/hooks/usePresupuestos'
import { PresupuestoForm, type PresupuestoFormPayload } from '@/components/presupuestos/PresupuestoForm'
import { toast } from 'sonner'

export function PresupuestoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const { data: presupuesto, isLoading } = usePresupuestoById(id ?? '')
  const createP = useCreatePresupuesto()
  const updateP = useUpdatePresupuesto()

  const isPending = createP.isPending || updateP.isPending

  function handleCancel() {
    navigate('/presupuestos')
  }

  async function handleSubmit(payload: PresupuestoFormPayload) {
    try {
      if (isEdit && id) {
        await updateP.mutateAsync({ id, input: payload })
        toast.success('Presupuesto actualizado')
      } else {
        await createP.mutateAsync(payload)
        toast.success('Presupuesto creado')
      }
      navigate('/presupuestos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-gray-400">Cargando presupuesto...</p>
      </div>
    )
  }

  if (isEdit && !presupuesto) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-gray-400">Presupuesto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-0.5"
          >
            ← Volver a presupuestos
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h1>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* ── Form ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <PresupuestoForm
            key={id ?? 'new'}
            initial={presupuesto ?? null}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </div>
      </div>

      {/* ── Barra flotante inferior ── */}
      <div className="fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-2">
        <button
          type="submit"
          form="presupuesto-form"
          disabled={isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
      </div>

    </div>
  )
}
