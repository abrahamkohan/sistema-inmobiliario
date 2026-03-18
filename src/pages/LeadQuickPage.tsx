import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────────

const NAT_CHIPS = ['PY', 'AR', 'BR', 'UY', 'ES', 'DE', 'EEUU']
const NAT_LABEL: Record<string, string> = {
  PY: 'Paraguayo', AR: 'Argentino', BR: 'Brasileño', UY: 'Uruguayo',
  ES: 'Español', DE: 'Alemán', EEUU: 'Estadounidense',
}
const FUENTE_CHIPS = ['Instagram', 'Facebook', 'Referido', 'WhatsApp', 'Web', 'Portales']

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  full_name: string
  phone: string
  apodo: string
  nat: string      // chip code or 'Otro'
  nat_otro: string
  fuente: string
  fuente_otro: string
  notes: string
}

const EMPTY: FormState = {
  full_name: '', phone: '', apodo: '',
  nat: '', nat_otro: '', fuente: '', fuente_otro: '', notes: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadQuickPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const ref   = params.get('ref')   ?? ''

  const [s, setS] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const nameRef  = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function update(patch: Partial<FormState>) { setS(prev => ({ ...prev, ...patch })) }

  function handleNameKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); phoneRef.current?.focus() }
  }
  function handlePhoneKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
  }

  async function save() {
    if (!s.full_name.trim()) {
      toast.error('El nombre es requerido')
      nameRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      const natValue  = s.nat === 'Otro' ? s.nat_otro : (NAT_LABEL[s.nat] ?? s.nat)
      const fuenValue = s.fuente === 'Otro' ? s.fuente_otro : s.fuente

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
      const res = await fetch(`${supabaseUrl}/functions/v1/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          lead: {
            full_name:    s.full_name.trim(),
            phone:        s.phone,
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
      setTimeout(() => {
        setSaved(false)
        setS(EMPTY)
        nameRef.current?.focus()
      }, 1400)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
    setSaving(false)
  }

  const INPUT = 'w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-900/15 focus:border-gray-400 bg-white'
  const CHIP = (active: boolean) =>
    `px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all select-none ${
      active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 bg-white active:bg-gray-50'
    }`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-sm font-bold text-gray-900">Agregar Lead</h1>
        {ref && <p className="text-xs text-gray-400 mt-0.5">ref: {ref}</p>}
      </header>

      {/* Form */}
      <div className="px-4 py-5 flex flex-col gap-5 pb-28">

        {/* Nombre */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Nombre</label>
          <input
            ref={nameRef}
            value={s.full_name}
            onChange={e => update({ full_name: e.target.value })}
            onKeyDown={handleNameKey}
            placeholder="Nombre del contacto"
            autoComplete="off"
            className={INPUT}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Teléfono</label>
          <input
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            value={s.phone}
            onChange={e => update({ phone: e.target.value })}
            onKeyDown={handlePhoneKey}
            placeholder="+595 981 123456"
            className={INPUT}
          />
        </div>

        {/* Apodo / referencia */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Apodo / referencia</label>
          <p className="text-xs text-gray-400 mb-2">Para recordarte quién es. Ej: "Señor alto Expo"</p>
          <input
            value={s.apodo}
            onChange={e => update({ apodo: e.target.value })}
            placeholder="Nota rápida de identificación"
            className={INPUT}
          />
        </div>

        {/* Nacionalidad */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Nacionalidad</label>
          <div className="flex flex-wrap gap-2">
            {NAT_CHIPS.map(c => (
              <button key={c} type="button"
                onClick={() => update({ nat: s.nat === c ? '' : c, nat_otro: '' })}
                className={CHIP(s.nat === c)}
              >{c}</button>
            ))}
            <button type="button"
              onClick={() => update({ nat: s.nat === 'Otro' ? '' : 'Otro', nat_otro: '' })}
              className={CHIP(s.nat === 'Otro')}
            >Otro</button>
          </div>
          {s.nat === 'Otro' && (
            <input
              value={s.nat_otro}
              onChange={e => update({ nat_otro: e.target.value })}
              placeholder="Escribir nacionalidad..."
              className={INPUT + ' mt-2'}
              autoFocus
            />
          )}
        </div>

        {/* Fuente */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Fuente</label>
          <div className="flex flex-wrap gap-2">
            {FUENTE_CHIPS.map(c => (
              <button key={c} type="button"
                onClick={() => update({ fuente: s.fuente === c ? '' : c, fuente_otro: '' })}
                className={CHIP(s.fuente === c)}
              >{c}</button>
            ))}
            <button type="button"
              onClick={() => update({ fuente: s.fuente === 'Otro' ? '' : 'Otro', fuente_otro: '' })}
              className={CHIP(s.fuente === 'Otro')}
            >Otro</button>
          </div>
          {s.fuente === 'Otro' && (
            <input
              value={s.fuente_otro}
              onChange={e => update({ fuente_otro: e.target.value })}
              placeholder="Escribir fuente..."
              className={INPUT + ' mt-2'}
              autoFocus
            />
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Notas</label>
          <textarea
            value={s.notes}
            onChange={e => update({ notes: e.target.value })}
            rows={2}
            placeholder="Nota rápida..."
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-gray-900/15 focus:border-gray-400 resize-none bg-white"
          />
        </div>

      </div>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white/95 backdrop-blur border-t border-gray-100">
        <button
          type="button"
          onClick={save}
          disabled={saving || saved}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-900 text-white active:scale-[0.98]'
          } disabled:opacity-70`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Lead guardado
            </span>
          ) : saving ? 'Guardando...' : 'Guardar Lead'}
        </button>
      </div>

    </div>
  )
}
