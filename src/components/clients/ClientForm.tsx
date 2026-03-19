// src/components/clients/ClientForm.tsx
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

// ─── Config ──────────────────────────────────────────────────────────────────

const FUENTE_OPTIONS = ['Instagram', 'Facebook', 'Referido', 'Web', 'WhatsApp', 'Portales', 'Otro']

const EXTRA_FIELD_OPTIONS: Array<{ key: string; label: string; placeholder: string }> = [
  { key: 'direccion',   label: 'Dirección',    placeholder: 'Av. España 1234, Asunción' },
  { key: 'profesion',   label: 'Profesión',    placeholder: 'Ej: Ingeniero, Médico...' },
  { key: 'estado_civil',label: 'Estado civil', placeholder: 'Ej: Soltero, Casado...' },
  { key: 'ingresos',    label: 'Ingresos',     placeholder: 'Ej: USD 3.000/mes' },
  { key: 'empresa',     label: 'Empresa',      placeholder: 'Nombre de la empresa' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientFormValues {
  tipo: 'lead' | 'cliente'
  full_name: string
  phone: string
  nationality: string
  fuente: string
  notes: string
  email: string
  dni: string
  fecha_nacimiento: string
  campos_extra: Record<string, string>
  apodo: string
}

interface FormState {
  tipo: 'lead' | 'cliente'
  full_name: string
  phone: string
  nationality: string
  fuente: string
  fuente_otro: string
  notes: string
  email: string
  dni: string
  fecha_nacimiento: string
  active_extra: string[]
  campos_extra: Record<string, string>
  apodo: string
}

interface ClientFormProps {
  defaultValues?: Partial<ClientRow>
  onSubmit: (values: ClientFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  stickyButtons?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFuente(stored: string | null) {
  if (!stored) return { fuente: '', fuente_otro: '' }
  if (FUENTE_OPTIONS.slice(0, -1).includes(stored)) return { fuente: stored, fuente_otro: '' }
  return { fuente: 'Otro', fuente_otro: stored }
}

const INPUT_CLS = 'w-full h-12 px-3 border border-gray-200 bg-gray-50 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors'
const LABEL_CLS = 'text-xs font-medium text-gray-500 mb-1.5 block'

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientForm({ defaultValues, onSubmit, onCancel, isSubmitting, stickyButtons }: ClientFormProps) {
  const { fuente: df, fuente_otro: dfo } = parseFuente(defaultValues?.fuente ?? null)
  const defaultCamposExtra = (defaultValues?.campos_extra ?? {}) as Record<string, string>

  const [s, setS] = useState<FormState>({
    tipo:            defaultValues?.tipo ?? 'lead',
    full_name:       defaultValues?.full_name ?? '',
    phone:           defaultValues?.phone ?? '',
    nationality:     defaultValues?.nationality ?? '',
    fuente:          df,
    fuente_otro:     dfo,
    notes:           defaultValues?.notes ?? '',
    email:           defaultValues?.email ?? '',
    dni:             defaultValues?.dni ?? '',
    fecha_nacimiento: defaultValues?.fecha_nacimiento ?? '',
    active_extra:    Object.keys(defaultCamposExtra),
    campos_extra:    defaultCamposExtra,
    apodo:           defaultValues?.apodo ?? '',
  })

  const [nameError, setNameError] = useState('')
  const [showFieldPicker, setShowFieldPicker] = useState(false)

  function update(patch: Partial<FormState>) { setS(prev => ({ ...prev, ...patch })) }

  function addExtraField(key: string) {
    update({ active_extra: [...s.active_extra, key], campos_extra: { ...s.campos_extra, [key]: '' } })
    setShowFieldPicker(false)
  }

  function removeExtraField(key: string) {
    const next = { ...s.campos_extra }
    delete next[key]
    update({ active_extra: s.active_extra.filter(k => k !== key), campos_extra: next })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!s.full_name.trim()) { setNameError('El nombre es requerido'); return }
    setNameError('')
    await onSubmit({
      tipo:             s.tipo,
      full_name:        s.full_name.trim(),
      phone:            s.phone,
      nationality:      s.nationality,
      fuente:           s.fuente === 'Otro' ? s.fuente_otro : s.fuente,
      notes:            s.notes,
      email:            s.email,
      dni:              s.dni,
      fecha_nacimiento: s.fecha_nacimiento,
      campos_extra:     s.campos_extra,
      apodo:            s.apodo,
    })
  }

  const availableExtra = EXTRA_FIELD_OPTIONS.filter(o => !s.active_extra.includes(o.key))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Toggle Lead / Cliente */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        {(['lead', 'cliente'] as const).map(t => (
          <button
            key={t} type="button"
            onClick={() => update({ tipo: t })}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${
              s.tipo === t ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {t === 'lead' ? 'Lead' : 'Cliente'}
          </button>
        ))}
      </div>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLS}>Nombre *</label>
        <input
          value={s.full_name} onChange={e => { update({ full_name: e.target.value }); setNameError('') }}
          placeholder="Ej: Juan García" autoComplete="name" className={INPUT_CLS}
        />
        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
      </div>

      {/* Apodo */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLS}>Apodo / referencia</label>
        <input
          value={s.apodo} onChange={e => update({ apodo: e.target.value })}
          placeholder="Ej: Señor alto Expo" className={INPUT_CLS}
        />
      </div>

      {/* Teléfono + Nacionalidad */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLS}>Teléfono</label>
          <input
            type="tel" inputMode="numeric" autoComplete="tel"
            value={s.phone} onChange={e => update({ phone: e.target.value })}
            placeholder="+595 981 123456" className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLS}>Nacionalidad</label>
          <input value={s.nationality} onChange={e => update({ nationality: e.target.value })} placeholder="Paraguayo" className={INPUT_CLS} />
        </div>
      </div>

      {/* Cliente: Email + DNI */}
      {s.tipo === 'cliente' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Email</label>
              <input type="email" autoComplete="email" value={s.email} onChange={e => update({ email: e.target.value })} placeholder="juan@email.com" className={INPUT_CLS} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>DNI / CI / Pasaporte</label>
              <input value={s.dni} onChange={e => update({ dni: e.target.value })} placeholder="4.567.890" className={INPUT_CLS} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5" style={{ maxWidth: 200 }}>
            <label className={LABEL_CLS}>Fecha de nacimiento</label>
            <input type="date" value={s.fecha_nacimiento} onChange={e => update({ fecha_nacimiento: e.target.value })} className={INPUT_CLS} />
          </div>
        </>
      )}

      {/* Fuente de lead */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLS}>Fuente de lead</label>
        <select
          value={s.fuente}
          onChange={e => update({ fuente: e.target.value, fuente_otro: '' })}
          className={INPUT_CLS + ' bg-gray-50 focus:bg-white'}
        >
          <option value="">— Seleccionar —</option>
          {FUENTE_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {s.fuente === 'Otro' && (
          <input
            value={s.fuente_otro} onChange={e => update({ fuente_otro: e.target.value })}
            placeholder="Describí la fuente..." className={INPUT_CLS}
            autoFocus
          />
        )}
      </div>

      {/* Notas */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLS}>Notas</label>
        <textarea
          value={s.notes} onChange={e => update({ notes: e.target.value })} rows={2}
          placeholder="Observaciones..."
          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors resize-none"
        />
      </div>

      {/* Cliente: campos extra dinámicos */}
      {s.tipo === 'cliente' && (
        <div className="flex flex-col gap-3">
          {s.active_extra.map(key => {
            const def = EXTRA_FIELD_OPTIONS.find(o => o.key === key)
            if (!def) return null
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLS}>{def.label}</label>
                  <button type="button" onClick={() => removeExtraField(key)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  value={s.campos_extra[key] ?? ''}
                  onChange={e => update({ campos_extra: { ...s.campos_extra, [key]: e.target.value } })}
                  placeholder={def.placeholder} className={INPUT_CLS}
                />
              </div>
            )
          })}

          {availableExtra.length > 0 && (
            <div className="relative">
              {showFieldPicker && (
                <div className="fixed inset-0 z-40" onClick={() => setShowFieldPicker(false)} />
              )}
              <div className="relative z-50">
                <button
                  type="button" onClick={() => setShowFieldPicker(v => !v)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Agregar campo
                </button>
                {showFieldPicker && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] z-50">
                    {availableExtra.map(o => (
                      <button
                        key={o.key} type="button" onClick={() => addExtraField(o.key)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botones */}
      {stickyButtons ? (
        <div className="flex gap-2" style={{ position: 'sticky', bottom: 0, background: '#f1f5f9', paddingTop: 8, paddingBottom: 16, borderTop: '1px solid #e5e7eb', marginTop: 8 }}>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1 h-11">Cancelar</Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        </div>
      )}
    </form>
  )
}
