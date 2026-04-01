// src/pages/VentaFormPage.tsx
import { useNavigate, useParams } from 'react-router'
import { X } from 'lucide-react'
import { useCommissionById, useCreateCommissionWithSplits, useUpdateCommission } from '@/hooks/useCommissions'
import { useAgentes } from '@/hooks/useAgentes'
import { CommissionForm, type CommissionFormValues } from '@/components/commissions/CommissionForm'
import { toast } from 'sonner'
import { FormActionBar } from '@/components/ui/FormActionBar'

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
      tipo:                values.tipo,
      co_broker:           values.co_broker,
      co_broker_nombre:    values.co_broker_nombre || null,
      propietario:         values.propietario || null,
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

      <FormActionBar
        label={isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar venta'}
        formId="venta-form"
        onCancel={handleCancel}
        disabled={isPending}
      />

    </div>
  )
}
