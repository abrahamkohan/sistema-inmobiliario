// src/components/clients/ClientCard.tsx
import { useState } from 'react'
import { Pencil, Trash2, History, Phone, MessageCircle, UserCheck, Plus } from 'lucide-react'

import { ClientHistorySheet } from './ClientHistorySheet'
import { TaskModal } from '@/components/tasks/TaskModal'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADOS = ['nuevo', 'contactado', 'respondio', 'no_responde', 'descartado'] as const

const ESTADO_LABEL: Record<string, string> = {
  nuevo:        'Nuevo',
  contactado:   'Contactado',
  respondio:    'Respondió',
  no_responde:  'No responde',
  descartado:   'Descartado',
  convertido:   'Convertido',
}

const ESTADO_CLS: Record<string, string> = {
  nuevo:       'bg-blue-100 text-blue-700',
  contactado:  'bg-yellow-100 text-yellow-700',
  respondio:   'bg-green-100 text-green-700',
  no_responde: 'bg-gray-100 text-gray-500',
  descartado:  'bg-red-100 text-red-600',
  convertido:  'bg-emerald-100 text-emerald-700',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClientCardProps {
  client: ClientRow
  onEdit: (client: ClientRow) => void
  onDelete: (id: string) => void
  onConvert?: (id: string) => void
  onChangeEstado?: (id: string, estado: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsAppUrl(phone: string, name: string) {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return null
  const msg = encodeURIComponent(`Hola ${name}, te contacto en relación a tu consulta en Kohan & Campos.`)
  return `https://wa.me/${clean}?text=${msg}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientCard({ client, onEdit, onDelete, onConvert, onChangeEstado }: ClientCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showEstados, setShowEstados] = useState(false)
  const [taskOpen,    setTaskOpen]    = useState(false)

  const isLead    = (client.tipo ?? 'lead') === 'lead'
  const estado    = client.estado ?? 'nuevo'
  const waUrl     = client.phone ? buildWhatsAppUrl(client.phone, client.full_name) : null
  const telUrl    = client.phone ? `tel:${client.phone.replace(/\s/g, '')}` : null

  function handleDelete() {
    if (!confirm(`¿Eliminar a "${client.full_name}"?`)) return
    onDelete(client.id)
  }

  return (
    <>
      <div className="w-full rounded-2xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">

        {/* ── Cuerpo ── */}
        <div className="p-4 flex flex-col gap-2">

          {/* Fila 1: nombre + tipo | país + estado */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <p className="font-bold text-gray-900 truncate">{client.full_name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                isLead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isLead ? 'Lead' : 'Cliente'}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {client.nationality && (
                <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5">
                  {client.nationality}
                </span>
              )}
              {isLead && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEstados(v => !v)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer ${ESTADO_CLS[estado] ?? ESTADO_CLS.nuevo}`}
                  >
                    {ESTADO_LABEL[estado] ?? estado}
                  </button>
                  {showEstados && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowEstados(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                        {ESTADOS.map(e => (
                          <button
                            key={e} type="button"
                            onClick={() => { onChangeEstado?.(client.id, e); setShowEstados(false) }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${estado === e ? 'opacity-40' : ''}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${ESTADO_CLS[e].split(' ')[0]}`} />
                            {ESTADO_LABEL[e]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Datos de contacto */}
          <div className="flex flex-col gap-0.5">
            {client.apodo && (
              <p className="text-xs text-gray-400 italic">"{client.apodo}"</p>
            )}
            {client.phone && (
              <p className="text-sm font-medium text-gray-700">{client.phone}</p>
            )}
            {client.email && (
              <p className="text-xs text-gray-500 truncate">{client.email}</p>
            )}
            {client.fuente && (
              <p className="text-[11px] text-gray-400">{client.fuente}</p>
            )}
          </div>

          {client.notes && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{client.notes}</p>
          )}
        </div>

        {/* ── CTAs de comunicación ── */}
        {(waUrl || telUrl) && (
          <div className="flex gap-2 px-4 pb-3">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {telUrl && (
              <a href={telUrl}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <Phone className="w-3.5 h-3.5" /> Llamar
              </a>
            )}
          </div>
        )}

        {/* ── Acciones de gestión ── */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-t bg-gray-50/60">
          {/* Primarias */}
          <button onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
            <History className="h-3 w-3" /> Historial
          </button>

          <button onClick={() => setTaskOpen(true)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#D4AF37' }}>
            <Plus className="h-3 w-3" /> Tarea
          </button>

          {isLead && onConvert && (
            <button onClick={() => onConvert(client.id)}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-700 transition-colors">
              <UserCheck className="h-3 w-3" /> Convertir
            </button>
          )}

          {/* Secundarias — icono solo */}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => onEdit(client)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ClientHistorySheet client={client} open={historyOpen} onOpenChange={setHistoryOpen} />
      <TaskModal
        isOpen={taskOpen}
        onClose={() => setTaskOpen(false)}
        defaultValues={{ context: 'lead', lead_id: client.id }}
      />
    </>
  )
}
