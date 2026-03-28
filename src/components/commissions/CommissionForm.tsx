// src/components/commissions/CommissionForm.tsx
import { useState } from 'react'
import type { Database } from '@/types/database'

type CommissionRow = Database['public']['Tables']['commissions']['Row']

const INPUT_CLS = 'w-full h-12 px-3 border border-gray-200 bg-gray-50 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors'
const LABEL_CLS = 'text-xs font-medium text-gray-500 mb-1.5 block'

export interface CommissionFormValues {
  proyecto_vendido: string
  fecha_cierre: string
  importe_comision: string
  facturada: boolean
  numero_factura: string
}

interface Props {
  defaultValues?: Partial<CommissionRow>
  onSubmit: (values: CommissionFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
  stickyButtons?: boolean
}

export function CommissionForm({ defaultValues, onSubmit, onCancel, isSubmitting, stickyButtons }: Props) {
  const [form, setForm] = useState<CommissionFormValues>({
    proyecto_vendido: defaultValues?.proyecto_vendido ?? '',
    fecha_cierre:     defaultValues?.fecha_cierre ?? '',
    importe_comision: defaultValues?.importe_comision?.toString() ?? '',
    facturada:        defaultValues?.facturada ?? false,
    numero_factura:   defaultValues?.numero_factura ?? '',
  })

  function set<K extends keyof CommissionFormValues>(key: K, value: CommissionFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.proyecto_vendido.trim() || !form.importe_comision) return
    onSubmit(form)
  }

  const canSubmit = form.proyecto_vendido.trim().length > 0 && form.importe_comision.trim().length > 0

  const buttons = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="flex-[2] h-12 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
      >
        {isSubmitting ? 'Guardando...' : defaultValues?.id ? 'Guardar cambios' : 'Crear comisión'}
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Proyecto — span completo */}
      <div>
        <label className={LABEL_CLS}>PROYECTO / PROPIEDAD VENDIDA *</label>
        <input
          type="text"
          placeholder="Ej: Torre Soleil — Unidad 4B"
          value={form.proyecto_vendido}
          onChange={e => set('proyecto_vendido', e.target.value)}
          className={INPUT_CLS}
          autoFocus
        />
      </div>

      {/* Fecha + Importe en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>FECHA DE CIERRE</label>
          <input
            type="date"
            value={form.fecha_cierre}
            onChange={e => set('fecha_cierre', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>IMPORTE COMISIÓN (USD) *</label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={form.importe_comision}
            onChange={e => set('importe_comision', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Facturada + Número en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="flex items-center justify-between px-3 py-3 bg-gray-50 rounded-xl border border-gray-200 h-12">
          <span className="text-sm font-medium text-gray-700">Facturada</span>
          <button
            type="button"
            onClick={() => set('facturada', !form.facturada)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.facturada ? 'bg-gray-900' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.facturada ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        {form.facturada && (
          <div>
            <label className={LABEL_CLS}>NÚMERO DE FACTURA</label>
            <input
              type="text"
              placeholder="Ej: 001-001-000123"
              value={form.numero_factura}
              onChange={e => set('numero_factura', e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        )}
      </div>

      {/* Botones */}
      {stickyButtons ? (
        <div
          className="sticky bottom-0 bg-white pt-3 pb-1 -mx-4 px-4 border-t border-gray-100"
          style={{ marginTop: 'auto' }}
        >
          {buttons}
        </div>
      ) : (
        <div className="pt-2">{buttons}</div>
      )}
    </form>
  )
}
