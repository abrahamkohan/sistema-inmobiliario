// src/pages/VentaFormPage.tsx
import { useNavigate, useParams } from 'react-router'
import { X } from 'lucide-react'
import { useCommissionById, useCreateCommissionWithSplits, useUpdateCommission } from '@/hooks/useCommissions'
import { useAgentes } from '@/hooks/useAgentes'
import { CommissionForm, type CommissionFormValues } from '@/components/commissions/CommissionForm'
import { toast } from 'sonner'

export function VentaFormPage() {
  const navigate  = useNavigate()
  const { id }    = useParams<{ id: string }>()
  const isEdit    = Boolean(id)

  const { data: commission, isLoading } = useCommissionById(id ?? '')
  const { data: agentes = [] }          = useAgentes()
  const createCommission = useCreateCommissionWithSplits()
  const updateCommission = useUpdateCommission()

  const isPending = createCommission.isPending || updateCommission.isPending

  function handleCancel() {
    navigate('/comisiones')
  }

  async function handleSubmit(values: CommissionFormValues) {
    const payload = {
      proyecto_vendido:    values.proyecto_vendido.trim(),
      project_id:          values.project_id || null,
      valor_venta:         values.valor_venta ? parseFloat(values.valor_venta) : null,
      porcentaje_comision: values.porcentaje_comision ? parseFloat(values.porcentaje_comision) : null,
      importe_comision:    parseFloat(values.importe_comision),
      fecha_cierre:        values.fecha_cierre || null,
    }
    try {
      if (isEdit && id) {
        await updateCommission.mutateAsync({ id, data: payload })
        toast.success('Venta actualizada')
      } else {
        await createCommission.mutateAsync({
          commissionData: payload,
          agentes: agentes.filter(a => a.activo),
        })
        toast.success('Venta registrada')
      }
      navigate('/comisiones')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-gray-400">Cargando venta...</p>
      </div>
    )
  }

  if (isEdit && !commission) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-gray-400">Venta no encontrada</p>
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
            ← Volver a ventas
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {isEdit ? 'Editar venta' : 'Nueva venta'}
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
          <CommissionForm
            key={id ?? 'new'}
            defaultValues={commission ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isPending}
            formId="venta-form"
          />
        </div>
      </div>

      {/* ── Barra inferior mobile ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center gap-3 px-4 py-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="venta-form"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar venta'}
        </button>
      </div>

      {/* ── Panel flotante desktop ── */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-30 w-[280px] bg-gray-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-4 flex-col gap-2">
        <button
          type="submit"
          form="venta-form"
          disabled={isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar venta'}
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
