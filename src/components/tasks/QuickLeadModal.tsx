// src/components/tasks/QuickLeadModal.tsx
// Modal de captura rápida de contacto desde el FAB.
// Campos mínimos: nombre, teléfono, nota interna.

import { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateClient } from '@/hooks/useClients'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const INPUT_CLS = 'w-full h-11 px-3.5 border border-gray-200 bg-white rounded-lg text-base placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors'
const LABEL_CLS = 'text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block'

export function QuickLeadModal({ isOpen, onClose }: Props) {
  const createClient = useCreateClient()
  const nameRef = useRef<HTMLInputElement>(null)

  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Reset al abrir
  useEffect(() => {
    if (!isOpen) return
    setName(''); setPhone(''); setNotes('')
    setTimeout(() => nameRef.current?.focus(), 80)
  }, [isOpen])

  // Bloquear scroll del body en mobile
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const canSave = name.trim().length > 0 && phone.trim().length > 0
  const isSaving = createClient.isPending

  async function handleSave(withWhatsApp: boolean) {
    if (!canSave) return
    try {
      await createClient.mutateAsync({
        full_name: name.trim(),
        phone:     phone.trim(),
        notes:     notes.trim() || null,
        tipo:      'lead',
      })
      toast.success('Contacto guardado')

      if (withWhatsApp) {
        const digits = phone.replace(/\D/g, '')
        const url    = `https://wa.me/${digits}`
        window.open(url, '_blank')
      }

      onClose()
    } catch {
      toast.error('Error al guardar el contacto')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Contacto rápido</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className={LABEL_CLS}>Nombre *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del contacto"
              className={INPUT_CLS}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('qlm-phone')?.focus()}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Teléfono / WhatsApp *</label>
            <input
              id="qlm-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+595 981 123456"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Nota interna <span className="normal-case font-normal text-gray-400">— opcional</span></label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contexto rápido..."
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-lg text-base placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-2 flex gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={!canSave || isSaving}
            className="flex-1 h-11 rounded-xl border-2 border-gray-900 text-sm font-semibold text-gray-900 bg-white disabled:opacity-40 transition-opacity"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={!canSave || isSaving}
            className="flex-[2] h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><MessageCircle className="w-4 h-4" /> Guardar + WhatsApp</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
