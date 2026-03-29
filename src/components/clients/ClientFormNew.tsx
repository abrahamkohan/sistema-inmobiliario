// src/components/clients/ClientFormNew.tsx
import { useState, useRef, useEffect } from 'react'
import { Plus, X, User, Briefcase, Mail, MapPin, Globe, FileText, Building, DollarSign, Heart, Star } from 'lucide-react'
import { CountryPicker, COUNTRIES } from '@/components/ui/CountryPicker'
import type { Country } from '@/components/ui/CountryPicker'
import { cleanDigits, formatPhone, isValidPhone, getMaxDigits, buildWhatsAppUrl } from '@/lib/phone'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

// ─── Config ───────────────────────────────────────────────────────────────────

const FUENTE_OPTIONS = ['Instagram', 'Facebook', 'Referido', 'Web', 'WhatsApp', 'Portales', 'Otro']

const EXTRA_FIELD_OPTIONS: Array<{ key: string; label: string; placeholder: string; icon: React.ReactNode }> = [
  { key: 'direccion',    label: 'Dirección',    placeholder: 'Av. España 1234, Asunción', icon: <MapPin className="w-4 h-4" /> },
  { key: 'profesion',    label: 'Profesión',    placeholder: 'Ej: Ingeniero, Médico...', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'estado_civil', label: 'Estado civil', placeholder: 'Ej: Soltero, Casado...', icon: <Heart className="w-4 h-4" /> },
  { key: 'ingresos',     label: 'Ingresos',     placeholder: 'Ej: USD 3.000/mes', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'empresa',      label: 'Empresa',      placeholder: 'Nombre de la empresa', icon: <Building className="w-4 h-4" /> },
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
  phoneNum: string
  dialCountry: Country
  natCountry: Country | null
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

interface ClientFormNewProps {
  defaultValues?: Partial<ClientRow>
  onSubmit: (values: ClientFormValues) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFuente(stored: string | null) {
  if (!stored) return { fuente: '', fuente_otro: '' }
  if (FUENTE_OPTIONS.slice(0, -1).includes(stored)) return { fuente: stored, fuente_otro: '' }
  return { fuente: 'Otro', fuente_otro: stored }
}

const PY = COUNTRIES.find(c => c.code === 'PY')!

function parsePhone(stored: string | null): { dialCountry: Country; phoneNum: string } {
  if (!stored) return { dialCountry: PY, phoneNum: '' }
  const match = COUNTRIES.find(c => stored.startsWith(c.dial))
  if (match) return { dialCountry: match, phoneNum: stored.slice(match.dial.length).trim() }
  return { dialCountry: PY, phoneNum: stored }
}

function parseNationality(stored: string | null): Country | null {
  if (!stored) return null
  return COUNTRIES.find(c => c.name.toLowerCase() === stored.toLowerCase()) ?? null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientFormNew({ defaultValues, onSubmit, onCancel: _onCancel, isSubmitting: _isSubmitting }: ClientFormNewProps) {
  const { fuente: df, fuente_otro: dfo }            = parseFuente(defaultValues?.fuente ?? null)
  const defaultCamposExtra                           = (defaultValues?.campos_extra ?? {}) as Record<string, string>
  const { dialCountry: defDial, phoneNum: defPhone } = parsePhone(defaultValues?.phone ?? null)

  const [s, setS] = useState<FormState>({
    tipo:             defaultValues?.tipo ?? 'lead',
    full_name:        defaultValues?.full_name ?? '',
    phoneNum:         defPhone,
    dialCountry:      defDial,
    natCountry:       parseNationality(defaultValues?.nationality ?? null),
    fuente:           df,
    fuente_otro:      dfo,
    notes:            defaultValues?.notes ?? '',
    email:            defaultValues?.email ?? '',
    dni:              defaultValues?.dni ?? '',
    fecha_nacimiento: defaultValues?.fecha_nacimiento ?? '',
    active_extra:     Object.keys(defaultCamposExtra),
    campos_extra:     defaultCamposExtra,
    apodo:            defaultValues?.apodo ?? '',
  })

  const [nameError,       setNameError]       = useState('')
  const [phoneError,      setPhoneError]      = useState('')
  const [showFieldPicker, setShowFieldPicker] = useState(false)

  const nameRef   = useRef<HTMLInputElement>(null)
  const phoneRef  = useRef<HTMLInputElement>(null)
  const withWARef = useRef(false)

  // Autofocus name on mount
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function update(patch: Partial<FormState>) { setS(p => ({ ...p, ...patch })) }

  function handlePhoneChange(raw: string) {
    const digits    = cleanDigits(raw)
    const max       = getMaxDigits(s.dialCountry.code)
    const trimmed   = digits.slice(0, max)
    const formatted = formatPhone(trimmed, s.dialCountry.code)
    update({ phoneNum: formatted })
    if (trimmed.length >= 6) {
      setPhoneError(isValidPhone(trimmed, s.dialCountry.code) ? '' : 'Número inválido')
    } else {
      setPhoneError('')
    }
  }

  function handleNameKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); phoneRef.current?.focus() }
  }
  function handlePhoneKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); withWARef.current = false; formRef.current?.requestSubmit() }
  }

  const formRef = useRef<HTMLFormElement>(null)

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
    if (!s.full_name.trim()) { setNameError('El nombre es requerido'); nameRef.current?.focus(); return }
    setNameError('')

    const digits   = cleanDigits(s.phoneNum)
    const phoneVal = digits ? `${s.dialCountry.dial} ${digits}` : ''

    // Validate phone if provided
    if (digits && !isValidPhone(digits, s.dialCountry.code)) {
      setPhoneError('Número inválido'); return
    }

    const wa = withWARef.current
    withWARef.current = false

    // ⚡ Open WhatsApp SYNCHRONOUSLY before async (Safari popup fix)
    let waWindow: Window | null = null
    if (wa && digits) {
      const url = buildWhatsAppUrl(s.dialCountry.dial, digits, s.full_name.trim())
      if (url) waWindow = window.open(url, '_blank')
    }

    try {
      await onSubmit({
        tipo:             s.tipo,
        full_name:        s.full_name.trim(),
        phone:            phoneVal,
        nationality:      s.natCountry ? s.natCountry.name : '',
        fuente:           s.fuente === 'Otro' ? s.fuente_otro : s.fuente,
        notes:            s.notes,
        email:            s.email,
        dni:              s.dni,
        fecha_nacimiento: s.fecha_nacimiento,
        campos_extra:     s.campos_extra,
        apodo:            s.apodo,
      })
    } catch {
      // If save failed, close the WhatsApp tab we opened
      waWindow?.close()
    }
  }

  const availableExtra = EXTRA_FIELD_OPTIONS.filter(o => !s.active_extra.includes(o.key))

  // ─── Buttons ──────────────────────────────────────────────────────────────

  // Botones removidos - usando barra flotante en página

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      {/* ── Selector Lead/Cliente (PRIMERO) ── */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Tipo de contacto</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update({ tipo: 'lead' })}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              s.tipo === 'lead' 
                ? 'border-amber-500 bg-amber-50 text-amber-800' 
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Star className={`w-6 h-6 ${s.tipo === 'lead' ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className="font-semibold">Lead</span>
            <span className="text-xs opacity-70">Potencial cliente</span>
          </button>
          
          <button
            type="button"
            onClick={() => update({ tipo: 'cliente' })}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              s.tipo === 'cliente' 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <User className={`w-6 h-6 ${s.tipo === 'cliente' ? 'text-emerald-500' : 'text-gray-400'}`} />
            <span className="font-semibold">Cliente</span>
            <span className="text-xs opacity-70">Cliente confirmado</span>
          </button>
        </div>
      </div>

      {/* ── Información básica ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4" />
          Información básica
        </h3>
        
        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
          <input
            ref={nameRef}
            value={s.full_name}
            onChange={e => { update({ full_name: e.target.value }); setNameError('') }}
            onKeyDown={handleNameKey}
            placeholder="Ej: Juan García"
            autoComplete="off"
            className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>

        {/* Apodo/Referencia */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Apodo / referencia</label>
          <input 
            value={s.apodo} 
            onChange={e => update({ apodo: e.target.value })}
            placeholder='Ej: "Señor alto Expo"' 
            className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <div className="flex gap-2">
            <CountryPicker
              value={s.dialCountry}
              onChange={c => { update({ dialCountry: c, phoneNum: '' }); setPhoneError('') }}
              mode="dial" className="w-[30%]"
            />
            <input
              ref={phoneRef}
              type="tel" inputMode="tel" autoComplete="tel"
              value={s.phoneNum}
              onChange={e => handlePhoneChange(e.target.value)}
              onKeyDown={handlePhoneKey}
              placeholder="981 123456"
              className={`flex-1 h-12 px-4 border rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
        </div>
      </div>

      {/* ── Datos del Cliente (solo si tipo es cliente) ── */}
      {s.tipo === 'cliente' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Datos del cliente
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                autoComplete="email" 
                value={s.email}
                onChange={e => update({ email: e.target.value })} 
                placeholder="juan@email.com" 
                className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">DNI / CI / Pasaporte</label>
              <input 
                value={s.dni} 
                onChange={e => update({ dni: e.target.value })}
                placeholder="4.567.890" 
                className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
              <input 
                type="date" 
                value={s.fecha_nacimiento}
                onChange={e => update({ fecha_nacimiento: e.target.value })} 
                className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nacionalidad</label>
              <CountryPicker 
                value={s.natCountry} 
                onChange={c => update({ natCountry: c })}
                mode="nationality" 
                className="w-full h-12"
              />
            </div>
          </div>
        </div>
      )}



      {/* ── Campos extra dinámicos (solo para clientes) ── */}
      {s.tipo === 'cliente' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Campos adicionales
          </h3>
          
          <div className="flex flex-col gap-3">
            {s.active_extra.map(key => {
              const def = EXTRA_FIELD_OPTIONS.find(o => o.key === key)
              if (!def) return null
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      {def.icon}
                      {def.label}
                    </label>
                    <button 
                      type="button" 
                      onClick={() => removeExtraField(key)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input 
                    value={s.campos_extra[key] ?? ''}
                    onChange={e => update({ campos_extra: { ...s.campos_extra, [key]: e.target.value } })}
                    placeholder={def.placeholder} 
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )
            })}
            
            {availableExtra.length > 0 && (
              <div className="relative">
                {showFieldPicker && <div className="fixed inset-0 z-40" onClick={() => setShowFieldPicker(false)} />}
                <div className="relative z-50">
                  <button 
                    type="button" 
                    onClick={() => setShowFieldPicker(v => !v)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                  >
                    <Plus className="w-4 h-4" /> Agregar campo
                  </button>
                  {showFieldPicker && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[200px] z-50">
                      {availableExtra.map(o => (
                        <button 
                          key={o.key} 
                          type="button" 
                          onClick={() => addExtraField(o.key)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          {o.icon}
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Información adicional (solo para leads) ── */}
      {s.tipo === 'lead' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Información adicional
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Fuente</label>
              <select 
                value={s.fuente} 
                onChange={e => update({ fuente: e.target.value, fuente_otro: '' })}
                className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">— Seleccionar —</option>
                {FUENTE_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {s.fuente === 'Otro' && (
                <input 
                  value={s.fuente_otro} 
                  onChange={e => update({ fuente_otro: e.target.value })}
                  placeholder="Describí la fuente..." 
                  className="w-full h-12 px-4 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus 
                />
              )}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nacionalidad</label>
              <CountryPicker 
                value={s.natCountry} 
                onChange={c => update({ natCountry: c })}
                mode="nationality" 
                className="w-full h-12"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Notas (último campo) ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Notas
        </h3>
        <div className="flex flex-col gap-1.5">
          <textarea
            value={s.notes}
            onChange={e => update({ notes: e.target.value })}
            rows={3}
            placeholder="Observaciones, historial, preferencias..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>

      {/* Botones removidos - usando barra flotante en página */}
    </form>
  )
}