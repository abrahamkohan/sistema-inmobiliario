// src/components/commissions/CommissionForm.tsx
import { useState, useEffect } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useAgentes } from '@/hooks/useAgentes'
import { useCommercialAlliesActive } from '@/hooks/useCommercialAllies'
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
  tipo:                'venta' | 'alquiler'
  co_broker:           boolean
  co_broker_nombre:    string
  propietario:         string
  has_ally:            boolean
  ally_id:             string
  ally_percentage:     string
}

interface Props {
  defaultValues?: Partial<CommissionRow>
  onSubmit:    (values: CommissionFormValues) => void
  onCancel:    () => void
  isSubmitting?: boolean
  formId?: string
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
  const { data: allies = [] }    = useCommercialAlliesActive()

  const [form, setForm] = useState<CommissionFormValues>({
    proyecto_vendido:    defaultValues?.proyecto_vendido    ?? '',
    project_id:          defaultValues?.project_id          ?? '',
    valor_venta:         defaultValues?.valor_venta?.toString()         ?? '',
    porcentaje_comision: defaultValues?.porcentaje_comision?.toString() ?? '',
    importe_comision:    defaultValues?.importe_comision?.toString()    ?? '',
    fecha_cierre:        defaultValues?.fecha_cierre ?? '',
    tipo:                defaultValues?.tipo          ?? 'venta',
    co_broker:           defaultValues?.co_broker     ?? false,
    co_broker_nombre:    defaultValues?.co_broker_nombre ?? '',
    propietario:         defaultValues?.propietario   ?? '',
    has_ally:            defaultValues?.has_ally      ?? false,
    ally_id:             defaultValues?.ally_id       ?? '',
    ally_percentage:     defaultValues?.ally_percentage?.toString() ?? '',
  })

  // Sync has_ally with co_broker (mutually exclusive)
  useEffect(() => {
    if (form.has_ally && form.co_broker) {
      setForm(prev => ({ ...prev, co_broker: false }))
    }
  }, [form.has_ally])

  useEffect(() => {
    if (form.co_broker && form.has_ally) {
      setForm(prev => ({ ...prev, has_ally: false, ally_id: '', ally_percentage: '' }))
    }
  }, [form.co_broker])

  // Auto-fill percentage from ally's default
  useEffect(() => {
    if (form.has_ally && form.ally_id && allies.length > 0) {
      const ally = allies.find(a => a.id === form.ally_id)
      if (ally && !form.ally_percentage) {
        setForm(prev => ({ ...prev, ally_percentage: ally.porcentaje_default.toString() }))
      }
    }
  }, [form.has_ally, form.ally_id, allies])

  function set<K extends keyof CommissionFormValues>(key: K, val: CommissionFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // ── Cálculo bidireccional ────────────────────────────────────────────────────
  // Venta:   importe = valor × (pct / 100)   |  pct = (importe / valor) × 100
  // Alquiler: importe = valor × meses         |  meses = importe / valor
  const isAlquiler = form.tipo === 'alquiler'
  const isVenta = form.tipo === 'venta'

  function calcImporte(valor: number, pct: number): string {
    return isAlquiler ? (valor * pct).toFixed(2) : ((valor * pct) / 100).toFixed(2)
  }
  function calcPct(valor: number, importe: number): string {
    return isAlquiler ? (importe / valor).toFixed(4) : ((importe / valor) * 100).toFixed(4)
  }

  function handleValorChange(raw: string) {
    setForm(prev => {
      const v = parseFloat(raw)
      const p = parseFloat(prev.porcentaje_comision)
      const i = parseFloat(prev.importe_comision)
      const next = { ...prev, valor_venta: raw }
      if (!isNaN(v) && v > 0) {
        if (!isNaN(p) && p > 0) next.importe_comision = calcImporte(v, p)
        else if (!isNaN(i) && i > 0) next.porcentaje_comision = calcPct(v, i)
      }
      return next
    })
  }

  function handlePorcentajeChange(raw: string) {
    setForm(prev => {
      const p = parseFloat(raw)
      const v = parseFloat(prev.valor_venta)
      const next = { ...prev, porcentaje_comision: raw }
      if (!isNaN(p) && p > 0 && !isNaN(v) && v > 0) next.importe_comision = calcImporte(v, p)
      return next
    })
  }

  function handleImporteChange(raw: string) {
    setForm(prev => {
      const i = parseFloat(raw)
      const v = parseFloat(prev.valor_venta)
      const next = { ...prev, importe_comision: raw }
      if (!isNaN(i) && i > 0 && !isNaN(v) && v > 0) next.porcentaje_comision = calcPct(v, i)
      return next
    })
  }

  // Indicadores de qué campo se calcula automáticamente
  const v = parseFloat(form.valor_venta)
  const p = parseFloat(form.porcentaje_comision)
  const i = parseFloat(form.importe_comision)
  const autoImporte    = !isNaN(v) && v > 0 && !isNaN(p) && p > 0
  const autoPorcentaje = !isNaN(v) && v > 0 && !isNaN(i) && i > 0 && !autoImporte

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.proyecto_vendido.trim() || !form.importe_comision) return
    onSubmit(form)
  }

  const canSubmit = form.proyecto_vendido.trim().length > 0 && parseFloat(form.importe_comision) > 0

  // Preview splits
  const comisionTotal     = parseFloat(form.importe_comision) || 0
  const allyPct           = parseFloat(form.ally_percentage) || 0
  const selectedAlly     = allies.find(a => a.id === form.ally_id)
  
  // Cálculos según el escenario
  let miComision = comisionTotal
  let otherAmount = 0
  let otherLabel = ''

  if (form.co_broker) {
    miComision = comisionTotal * 0.5
    otherAmount = comisionTotal * 0.5
    otherLabel = form.co_broker_nombre || 'Co-broker'
  } else if (form.has_ally && allyPct > 0) {
    otherAmount = comisionTotal * (allyPct / 100)
    miComision = comisionTotal - otherAmount
    otherLabel = selectedAlly?.nombre || 'Aliado'
  }

  const agentesActivos = agentes.filter(a => a.activo)
  const totalPct       = agentesActivos.reduce((s, a) => s + a.porcentaje_comision, 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* ── Tipo de operación ── */}
      <div>
        <label className={LABEL_CLS}>TIPO DE OPERACIÓN</label>
        <div className="flex gap-2 mt-1">
          {(['venta', 'alquiler'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('tipo', t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                form.tipo === t
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t === 'venta' ? 'Venta' : 'Alquiler'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Identificación ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* ── Propietario ── */}
      <div>
        <label className={LABEL_CLS}>PROPIETARIO (QUIEN PAGA LA COMISIÓN)</label>
        <input
          type="text"
          placeholder="Nombre del propietario o empresa"
          value={form.propietario}
          onChange={e => set('propietario', e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {/* ── Montos ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLS}>
            {form.tipo === 'alquiler' ? 'ALQUILER MENSUAL (USD)' : 'VALOR DE VENTA (USD)'}
          </label>
          <input
            type="number"
            placeholder={form.tipo === 'alquiler' ? '1500' : '100000'}
            min="0"
            step="0.01"
            value={form.valor_venta}
            onChange={e => handleValorChange(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>
            {form.tipo === 'alquiler' ? 'MESES DE COMISIÓN' : '% COMISIÓN'}
          </label>
          <input
            type="number"
            placeholder={form.tipo === 'alquiler' ? '1' : '4'}
            min="0"
            step="0.01"
            max={form.tipo === 'alquiler' ? undefined : '100'}
            value={form.porcentaje_comision}
            onChange={e => handlePorcentajeChange(e.target.value)}
            className={INPUT_CLS}
          />
          {form.tipo === 'alquiler' && !autoPorcentaje && (
            <p className="text-[11px] text-gray-400 mt-1">Ej: 1 mes = 100%</p>
          )}
          {autoPorcentaje && (
            <p className="text-[11px] text-blue-400 mt-1">Se calcula automáticamente</p>
          )}
        </div>
        <div>
          <label className={LABEL_CLS}>IMPORTE TOTAL (USD) *</label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={form.importe_comision}
            onChange={e => handleImporteChange(e.target.value)}
            className={INPUT_CLS}
          />
          {autoImporte && (
            <p className="text-[11px] text-blue-400 mt-1">Se calcula automáticamente</p>
          )}
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

      {/* ── Co-broker (solo en venta) ── */}
      {isVenta && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Co-broker</p>
              <p className="text-xs text-gray-400 mt-0.5">Un colega trajo al comprador — la comisión se divide al 50%</p>
            </div>
            <button
              type="button"
              onClick={() => set('co_broker', !form.co_broker)}
              disabled={form.has_ally}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.co_broker ? 'bg-gray-900' : 'bg-gray-200'
              } ${form.has_ally ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.co_broker ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {form.co_broker && (
            <div className="mt-3">
              <label className={LABEL_CLS}>NOMBRE DEL COLEGA / INMOBILIARIA</label>
              <input
                type="text"
                placeholder="Ej: García Propiedades"
                value={form.co_broker_nombre}
                onChange={e => set('co_broker_nombre', e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Aliado comercial (solo en venta) ── */}
      {isVenta && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Aliado comercial</p>
              <p className="text-xs text-gray-400 mt-0.5">Un aliado externo que recibe porcentaje de la comisión</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (form.has_ally) {
                  set('has_ally', false)
                  set('ally_id', '')
                  set('ally_percentage', '')
                } else {
                  set('has_ally', true)
                }
              }}
              disabled={form.co_broker}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.has_ally ? 'bg-amber-500' : 'bg-gray-200'
              } ${form.co_broker ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.has_ally ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {form.has_ally && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className={LABEL_CLS}>SELECCIONAR ALIADO</label>
                <select
                  value={form.ally_id}
                  onChange={e => set('ally_id', e.target.value)}
                  className={INPUT_CLS}
                >
                  <option value="">— Elegir aliado —</option>
                  {allies.map(ally => (
                    <option key={ally.id} value={ally.id}>
                      {ally.nombre} ({ally.porcentaje_default}% por defecto)
                    </option>
                  ))}
                </select>
                {allies.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No hay aliados activos. Agregalos en Configuración.
                  </p>
                )}
              </div>
              {form.ally_id && (
                <div>
                  <label className={LABEL_CLS}>% COMISIÓN PARA EL ALIADO</label>
                  <input
                    type="number"
                    placeholder={selectedAlly?.porcentaje_default.toString() || '20'}
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.ally_percentage}
                    onChange={e => set('ally_percentage', e.target.value)}
                    className={INPUT_CLS}
                  />
                  {selectedAlly && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Por defecto: {selectedAlly.porcentaje_default}%
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Preview de splits ── */}
      {comisionTotal > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col gap-3">

          {/* Resumen comision_total / mi_comision */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/70 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Comisión total</p>
              <p className="text-base font-bold text-blue-900 mt-0.5">{fmt(comisionTotal)}</p>
            </div>
            {(form.co_broker || (form.has_ally && allyPct > 0)) && (
              <>
                {form.co_broker && <span className="text-blue-300 font-bold">÷ 2</span>}
                {form.has_ally && allyPct > 0 && <span className="text-blue-300 font-bold">- {allyPct}%</span>}
                <div className="flex-1 bg-white/70 rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Mi comisión</p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{fmt(miComision)}</p>
                </div>
                <div className="flex-1 bg-white/70 rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">{otherLabel}</p>
                  <p className="text-base font-bold text-amber-700 mt-0.5">{fmt(otherAmount)}</p>
                </div>
              </>
            )}
          </div>

          {/* Reparto interno entre agentes */}
          {agentesActivos.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                Reparto interno{' '}
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
                      {fmt(miComision * a.porcentaje_comision / 100)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

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
