// src/components/commissions/CommissionForm.tsx
import { useState, useEffect } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useAgentes } from '@/hooks/useAgentes'
import { INPUT_CLS, LABEL_CLS } from '@/styles/design-system'
import type { Database } from '@/types/database'

type CommissionRow = Database['public']['Tables']['commissions']['Row']

export interface CommissionFormValues {
  proyecto_vendido:    string
  project_id:          string
  valor_venta:         string
  porcentaje_comision: string
  importe_comision:    string
  fecha_cierre:        string
}

interface Props {
  defaultValues?: Partial<CommissionRow>
  onSubmit:    (values: CommissionFormValues) => void
  onCancel:    () => void
  isSubmitting?: boolean
  /** id del <form> para que botones externos puedan hacer submit */
  formId?: string
  /** muestra botones inline (cuando está embebido en modal) */
  inlineButtons?: boolean
}

export function CommissionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  formId,
  inlineButtons = false,
}: Props) {
  const { data: projects = [] } = useProjects()
  const { data: agentes = [] }  = useAgentes()

  const [form, setForm] = useState<CommissionFormValues>({
    proyecto_vendido:    defaultValues?.proyecto_vendido    ?? '',
    project_id:          defaultValues?.project_id          ?? '',
    valor_venta:         defaultValues?.valor_venta?.toString()         ?? '',
    porcentaje_comision: defaultValues?.porcentaje_comision?.toString() ?? '',
    importe_comision:    defaultValues?.importe_comision?.toString()    ?? '',
    fecha_cierre:        defaultValues?.fecha_cierre ?? '',
  })

  function set<K extends keyof CommissionFormValues>(key: K, val: CommissionFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // Auto-calcular importe cuando cambian valor o porcentaje
  useEffect(() => {
    const v = parseFloat(form.valor_venta)
    const p = parseFloat(form.porcentaje_comision)
    if (!isNaN(v) && !isNaN(p) && v > 0 && p > 0) {
      set('importe_comision', ((v * p) / 100).toFixed(2))
    }
  }, [form.valor_venta, form.porcentaje_comision])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.proyecto_vendido.trim() || !form.importe_comision) return
    onSubmit(form)
  }

  const canSubmit = form.proyecto_vendido.trim().length > 0 && parseFloat(form.importe_comision) > 0

  // Preview de splits
  const importeNum     = parseFloat(form.importe_comision) || 0
  const agentesActivos = agentes.filter(a => a.activo)
  const totalPct       = agentesActivos.reduce((s, a) => s + a.porcentaje_comision, 0)

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* ── Sección: Identificación ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Proyecto CRM (opcional) */}
        <div>
          <label className={LABEL_CLS}>PROYECTO DEL CRM (OPCIONAL)</label>
          <select
            value={form.project_id}
            onChange={e => {
              const pid = e.target.value
              set('project_id', pid)
              if (pid && !form.proyecto_vendido.trim()) {
                const p = projects.find(x => x.id === pid)
                if (p) {
                  const label = p.developer_name ? `${p.developer_name} — ${p.name}` : p.name
                  set('proyecto_vendido', label)
                }
              }
            }}
            className={INPUT_CLS}
          >
            <option value="">— Sin vincular —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.developer_name ? `${p.developer_name} — ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción libre */}
        <div>
          <label className={LABEL_CLS}>PROPIEDAD / DESCRIPCIÓN *</label>
          <input
            type="text"
            placeholder="Ej: Torre Soleil — Apto 4B"
            value={form.proyecto_vendido}
            onChange={e => set('proyecto_vendido', e.target.value)}
            className={INPUT_CLS}
            autoFocus
          />
        </div>
      </div>

      {/* ── Sección: Montos ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLS}>VALOR DE VENTA (USD)</label>
          <input
            type="number"
            placeholder="100000"
            min="0"
            step="0.01"
            value={form.valor_venta}
            onChange={e => set('valor_venta', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>% COMISIÓN</label>
          <input
            type="number"
            placeholder="4"
            min="0"
            step="0.01"
            max="100"
            value={form.porcentaje_comision}
            onChange={e => set('porcentaje_comision', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>IMPORTE TOTAL (USD) *</label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={form.importe_comision}
            onChange={e => set('importe_comision', e.target.value)}
            className={INPUT_CLS}
          />
          <p className="text-[11px] text-gray-400 mt-1">Se calcula automáticamente</p>
        </div>
      </div>

      {/* ── Fecha ── */}
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
      </div>

      {/* ── Preview de splits ── */}
      {importeNum > 0 && agentesActivos.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-2">
            Reparto automático{' '}
            {Math.abs(totalPct - 100) > 0.01 && (
              <span className="text-amber-600 ml-1">(⚠ suma {totalPct}% — configurá agentes)</span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {agentesActivos.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-1.5">
                <span className="text-blue-800">
                  {a.nombre}{' '}
                  <span className="text-blue-400 text-xs">({a.porcentaje_comision}%)</span>
                </span>
                <span className="font-semibold text-blue-900">
                  {new Intl.NumberFormat('es-PY', {
                    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
                  }).format(importeNum * a.porcentaje_comision / 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Botones inline (solo modal) ── */}
      {inlineButtons && (
        <div className="flex gap-3 pt-2">
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
            {isSubmitting ? 'Guardando...' : defaultValues?.id ? 'Guardar cambios' : 'Registrar venta'}
          </button>
        </div>
      )}
    </form>
  )
}
