// src/components/landing/LeadForm.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LeadFormProps {
  propertyId?: string
  projectId?: string
  landingTipo: 'propiedad' | 'proyecto'
  onSuccess?: () => void
}

interface FormState {
  nombre: string
  telefono: string
  email: string
  mensaje: string
}

const EMPTY: FormState = { nombre: '', telefono: '', email: '', mensaje: '' }

export function LeadForm({ propertyId, projectId, landingTipo, onSuccess }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.telefono.trim()) return

    setStatus('loading')
    setErrorMsg('')

    const params = new URLSearchParams(window.location.search)

    const { error } = await supabase.from('clients').insert({
      full_name:    form.nombre.trim(),
      whatsapp:     form.telefono.trim(),
      phone:        form.telefono.trim(),
      email:        form.email.trim() || null,
      mensaje:      form.mensaje.trim() || null,
      tipo:         'lead',
      fuente:       landingTipo === 'propiedad' ? 'landing_propiedad' : 'landing_proyecto',
      landing_tipo: landingTipo,
      property_id:  propertyId ?? null,
      project_id:   projectId ?? null,
      utm_source:   params.get('utm_source')   ?? null,
      utm_medium:   params.get('utm_medium')   ?? null,
      utm_campaign: params.get('utm_campaign') ?? null,
    })

    if (error) {
      setStatus('error')
      setErrorMsg('No se pudo enviar tu consulta. Intentá de nuevo.')
      return
    }

    setStatus('success')
    setForm(EMPTY)
    onSuccess?.()
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-900">¡Consulta enviada!</p>
        <p className="text-sm text-gray-500">Nos ponemos en contacto a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          type="text"
          required
          value={form.nombre}
          onChange={handleChange}
          placeholder="Tu nombre"
          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Teléfono / WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          name="telefono"
          type="tel"
          required
          value={form.telefono}
          onChange={handleChange}
          placeholder="+595 XXX XXX XXX"
          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Mensaje</label>
        <textarea
          name="mensaje"
          rows={3}
          value={form.mensaje}
          onChange={handleChange}
          placeholder="¿En qué te podemos ayudar?"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
        />
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !form.nombre.trim() || !form.telefono.trim()}
        className="w-full h-12 rounded-xl bg-[#D4AF37] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {status === 'loading' ? 'Enviando...' : 'Consultar ahora'}
      </button>
    </form>
  )
}
