// src/components/whatsapp/ContactPickerSheet.tsx
// Sheet de selección de contacto + preview de mensaje + disparo de WhatsApp.
// Reutiliza useClients() y useConsultoraConfig() existentes.

import { useState, useMemo } from 'react'
import { MessageCircle, User, Search, AlertCircle } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useClients } from '@/hooks/useClients'
import { useBrand } from '@/context/BrandContext'
import { buildShareMessage, buildShareUrl } from '@/lib/whatsapp'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

type Props = {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  resourceTitle: string
  resourceUrl:   string
  resourceContext: string
}

export function ContactPickerSheet({
  open,
  onOpenChange,
  resourceTitle,
  resourceUrl,
  resourceContext,
}: Props) {
  const { data: clients = [] } = useClients()
  const { nombre }             = useBrand()

  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<ClientRow | null>(null)

  // ── Filtro por nombre ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return clients
    return clients.filter(c => c.full_name.toLowerCase().includes(q))
  }, [clients, search])

  // ── Mensaje y URL derivados del contacto seleccionado ───────────────────
  const message = selected
    ? buildShareMessage({
        type:            'propiedad',
        resourceTitle,
        resourceUrl,
        resourceContext,
        contactName:     selected.full_name,
        brandName:       nombre || null,
      })
    : null

  const url = selected?.phone && message
    ? buildShareUrl(selected.phone, message)
    : null

  const hasNoPhone     = selected !== null && !selected.phone
  const hasInvalidUrl  = selected !== null && !!selected.phone && !url
  const canConfirm     = !!url

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleConfirm() {
    if (!url) return
    window.open(url, '_blank')
    resetAndClose()
  }

  function handleOpenChange(value: boolean) {
    if (!value) resetAndClose()
    else onOpenChange(true)
  }

  function resetAndClose() {
    setSelected(null)
    setSearch('')
    onOpenChange(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl flex flex-col p-0 max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <p className="text-base font-semibold text-gray-900">Compartir por WhatsApp</p>
          <p className="text-xs text-gray-400 mt-0.5">Seleccioná un lead o cliente</p>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(client => {
                const isSelected = selected?.id === client.id
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelected(client)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <User className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {client.full_name}
                      </p>
                      <p className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                        {client.phone ?? 'Sin teléfono'}
                        {' · '}
                        {client.tipo === 'lead' ? 'Lead' : 'Cliente'}
                      </p>
                    </div>

                    {/* Warning icon si no tiene teléfono */}
                    {!client.phone && (
                      <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
                        isSelected ? 'text-white/60' : 'text-amber-400'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Preview / feedback de error */}
        {selected && (
          <div className="px-5 pt-3 pb-2 border-t border-gray-100 flex-shrink-0">
            {hasNoPhone || hasInvalidUrl ? (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  {hasNoPhone
                    ? 'Este contacto no tiene teléfono registrado.'
                    : 'El teléfono registrado no es utilizable para WhatsApp.'}
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Vista previa
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer con botón de confirmación */}
        <div className="px-5 pb-8 pt-3 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-900 text-white font-medium transition-colors hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-5 h-5" />
            Abrir WhatsApp
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
