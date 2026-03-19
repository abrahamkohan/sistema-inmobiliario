import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Check, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { CountryPicker, COUNTRIES } from '@/components/ui/CountryPicker'
import type { Country } from '@/components/ui/CountryPicker'
import { cleanDigits, formatPhone, isValidPhone, getMaxDigits, buildWhatsAppUrl } from '@/lib/phone'

// ─── Constants ────────────────────────────────────────────────────────────────

const NAT_CHIPS = [
  { code: 'PY',   label: '🇵🇾 PY'   },
  { code: 'AR',   label: '🇦🇷 AR'   },
  { code: 'BR',   label: '🇧🇷 BR'   },
  { code: 'UY',   label: '🇺🇾 UY'   },
  { code: 'ES',   label: '🇪🇸 ES'   },
  { code: 'DE',   label: '🇩🇪 DE'   },
  { code: 'EEUU', label: '🇺🇸 EEUU' },
]
const NAT_LABEL: Record<string, string> = {
  PY: 'Paraguayo', AR: 'Argentino', BR: 'Brasileño', UY: 'Uruguayo',
  ES: 'Español',   DE: 'Alemán',    EEUU: 'Estadounidense',
}

const FUENTE_CHIPS = [
  { code: 'Instagram', label: '📷 Instagram' },
  { code: 'Facebook',  label: '👍 Facebook'  },
  { code: 'WhatsApp',  label: '🟢 WhatsApp'  },
  { code: 'Referido',  label: '👥 Referido'  },
  { code: 'Web',       label: '🌐 Web'       },
  { code: 'Portales',  label: '🏠 Portales'  },
]

const PY = COUNTRIES.find(c => c.code === 'PY')!

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  full_name: string
  phoneNum:  string
  apodo:     string
  nat:       string
  nat_otro:  string
  fuente:    string
  fuente_otro: string
  notes:     string
}

const EMPTY: FormState = {
  full_name: '', phoneNum: '', apodo: '',
  nat: '', nat_otro: '', fuente: '', fuente_otro: '', notes: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadQuickPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const ref   = params.get('ref')   ?? ''

  const [s, setS]               = useState<FormState>(EMPTY)
  const [dialCountry, setDial]  = useState<Country>(PY)
  const [detected, setDetected] = useState<Country | null>(null)
  const [phoneError, setPhoneError] = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const nameRef  = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then((d: { country_code?: string }) => {
        const found = COUNTRIES.find(c => c.code === d.country_code)
        if (!found) return
        if (found.code === 'PY') setDial(found)
        else setDetected(found)
      })
      .catch(() => {})
  }, [])

  function update(patch: Partial<FormState>) { setS(p => ({ ...p, ...patch })) }

  function handlePhoneChange(raw: string) {
    const digits    = cleanDigits(raw)
    const max       = getMaxDigits(dialCountry.code)
    const trimmed   = digits.slice(0, max)
    const formatted = formatPhone(trimmed, dialCountry.code)
    update({ phoneNum: formatted })
    if (trimmed.length >= 6) {
      setPhoneError(isValidPhone(trimmed, dialCountry.code) ? '' : 'Número inválido')
    } else {
      setPhoneError('')
    }
  }

  function handleNameKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); phoneRef.current?.focus() }
  }
  function handlePhoneKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); doSave(false) }
  }

  async function doSave(withWhatsApp: boolean) {
    if (!s.full_name.trim()) {
      toast.error('El nombre es requerido')
      nameRef.current?.focus()
      return
    }
    const digits = cleanDigits(s.phoneNum)
    if (digits && !isValidPhone(digits, dialCountry.code)) {
      setPhoneError('Número inválido'); return
    }

    // ⚡ Open WhatsApp SYNCHRONOUSLY before async (Safari popup fix)
    let waWindow: Window | null = null
    if (withWhatsApp && digits) {
      const url = buildWhatsAppUrl(dialCountry.dial, digits, s.full_name.trim())
      if (url) waWindow = window.open(url, '_blank')
    }

    setSaving(true)
    try {
      const natValue  = s.nat === 'Otro' ? s.nat_otro : (NAT_LABEL[s.nat] ?? s.nat)
      const fuenValue = s.fuente === 'Otro' ? s.fuente_otro : s.fuente
      const fullPhone = digits ? `${dialCountry.dial} ${digits}` : ''

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          lead: {
            full_name:    s.full_name.trim(),
            phone:        fullPhone,
            nationality:  natValue,
            fuente:       fuenValue,
            notes:        s.notes,
            apodo:        s.apodo,
            referido_por: ref || null,
          },
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')

      if ('vibrate' in navigator) navigator.vibrate(30)
      setSaved(true)
      setTimeout(() => { setSaved(false); setS(EMPTY); nameRef.current?.focus() }, 1400)
    } catch (err) {
      waWindow?.close()
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
    setSaving(false)
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const INPUT = 'w-full px-4 h-14 border border-gray-200 rounded-2xl text-base bg-white focus:outline-none focus:border-gray-800 focus:ring-0 transition-colors'
  const CHIP  = (active: boolean) =>
    `px-4 py-2 rounded-2xl border text-sm font-medium transition-all select-none ${
      active
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-gray-200 text-gray-700 bg-white active:bg-gray-50'
    }`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3.5 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-900">Agregar Lead</h1>
        {ref && <p className="text-xs text-gray-400 mt-0.5">ref: {ref}</p>}
      </header>

      <div className="px-4 pt-6 pb-36 flex flex-col gap-6">

        {/* Banner país detectado */}
        {detected && (
          <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <p className="text-sm text-gray-700">
              Detectamos <span className="font-semibold">{detected.flag} {detected.name}</span>
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button"
                onClick={() => { setDial(detected); setDetected(null) }}
                className="text-xs font-bold text-white bg-gray-900 px-3 py-1.5 rounded-xl"
              >Usar</button>
              <button type="button"
                onClick={() => setDetected(null)}
                className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl"
              >Ignorar</button>
            </div>
          </div>
        )}

        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</label>
          <input
            ref={nameRef}
            value={s.full_name}
            onChange={e => update({ full_name: e.target.value })}
            onKeyDown={handleNameKey}
            placeholder="Nombre del contacto"
            autoComplete="off"
            className={INPUT + ' text-lg font-medium placeholder:font-normal placeholder:text-base'}
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</label>
          <div className="flex gap-2">
            <CountryPicker
              value={dialCountry}
              onChange={c => { setDial(c); update({ phoneNum: '' }); setPhoneError('') }}
              mode="dial" className="w-[32%]"
            />
            <input
              ref={phoneRef}
              type="tel" inputMode="tel" autoComplete="tel"
              value={s.phoneNum}
              onChange={e => handlePhoneChange(e.target.value)}
              onKeyDown={handlePhoneKey}
              placeholder="981 123456"
              className={INPUT + ' flex-1' + (phoneError ? ' border-red-400 bg-red-50' : '')}
            />
          </div>
          {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
        </div>

        {/* Apodo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Apodo <span className="normal-case font-normal text-gray-400">— para recordarte quién es</span>
          </label>
          <input
            value={s.apodo}
            onChange={e => update({ apodo: e.target.value })}
            placeholder='Ej: "Señor alto Expo"'
            className={INPUT}
          />
        </div>

        {/* Nacionalidad */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nacionalidad</label>
          <div className="flex flex-wrap gap-2">
            {NAT_CHIPS.map(c => (
              <button key={c.code} type="button"
                onClick={() => update({ nat: s.nat === c.code ? '' : c.code, nat_otro: '' })}
                className={CHIP(s.nat === c.code)}
              >{c.label}</button>
            ))}
            <button type="button"
              onClick={() => update({ nat: s.nat === 'Otro' ? '' : 'Otro', nat_otro: '' })}
              className={CHIP(s.nat === 'Otro')}
            >Otro</button>
          </div>
          {s.nat === 'Otro' && (
            <input value={s.nat_otro} onChange={e => update({ nat_otro: e.target.value })}
              placeholder="Escribir nacionalidad..." className={INPUT + ' mt-1'} autoFocus />
          )}
        </div>

        {/* Fuente */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fuente</label>
          <div className="flex flex-wrap gap-2">
            {FUENTE_CHIPS.map(c => (
              <button key={c.code} type="button"
                onClick={() => update({ fuente: s.fuente === c.code ? '' : c.code, fuente_otro: '' })}
                className={CHIP(s.fuente === c.code)}
              >{c.label}</button>
            ))}
            <button type="button"
              onClick={() => update({ fuente: s.fuente === 'Otro' ? '' : 'Otro', fuente_otro: '' })}
              className={CHIP(s.fuente === 'Otro')}
            >➕ Otro</button>
          </div>
          {s.fuente === 'Otro' && (
            <input value={s.fuente_otro} onChange={e => update({ fuente_otro: e.target.value })}
              placeholder="Escribir fuente..." className={INPUT + ' mt-1'} autoFocus />
          )}
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</label>
          <textarea
            value={s.notes} onChange={e => update({ notes: e.target.value })} rows={2}
            placeholder="Nota rápida..."
            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base bg-white focus:outline-none focus:border-gray-800 resize-none"
          />
        </div>

      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-white/95 backdrop-blur border-t border-gray-100">
        {saved ? (
          <div className="w-full h-14 rounded-2xl bg-emerald-500 text-white text-base font-bold flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Lead guardado
          </div>
        ) : (
          <div className="flex gap-3">
            <button type="button" onClick={() => doSave(false)} disabled={saving || !!phoneError}
              className="flex-1 h-14 rounded-2xl text-base font-bold border-2 border-gray-900 text-gray-900 bg-white active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? '...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => doSave(true)} disabled={saving || !!phoneError}
              className="flex-[2] h-14 rounded-2xl text-base font-bold bg-emerald-600 text-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar + WhatsApp'}
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
