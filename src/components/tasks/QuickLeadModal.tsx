// src/components/tasks/QuickLeadModal.tsx
// Modal centrado de captura rápida de contacto desde el FAB.
// Diseño SaaS: overlay oscuro + blur, card centrada, inputs grandes.

import { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateClient } from '@/hooks/useClients'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const INPUT_CLS = [
  'w-full h-12 px-4 rounded-xl border border-gray-200 bg-white',
  'text-base text-gray-900 placeholder:text-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400',
  'transition-all duration-150',
].join(' ')

const LABEL_CLS = 'text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block'

export function QuickLeadModal({ isOpen, onClose }: Props) {
  const createClient = useCreateClient()
  const nameRef = useRef<HTMLInputElement>(null)

  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setName(''); setPhone(''); setNotes('')
    setTimeout(() => nameRef.current?.focus(), 100)
  }, [isOpen])

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
        window.open(`https://wa.me/${digits}`, '_blank')
      }
      onClose()
    } catch {
      toast.error('Error al guardar el contacto')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">Nuevo contacto</h2>
              <p className="text-xs text-gray-400 mt-0.5">Lead rápido al CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors -mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">
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
              onKeyDown={e => e.key === 'Enter' && !isSaving && canSave && handleSave(false)}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>
              Nota interna{' '}
              <span className="normal-case font-normal text-gray-300">— opcional</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contexto rápido..."
              className={cn(
                'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white',
                'text-base text-gray-900 placeholder:text-gray-400 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400',
                'transition-all duration-150'
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-1 flex gap-2.5">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={!canSave || isSaving}
            className="h-12 px-5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:border-gray-300 disabled:opacity-40 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={!canSave || isSaving}
            className="flex-1 h-12 rounded-xl bg-[#25D366] text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-[#20c05c] transition-all shadow-sm shadow-green-200"
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
