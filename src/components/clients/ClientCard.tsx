// src/components/clients/ClientCard.tsx
import { useState } from 'react'
import { Pencil, Trash2, History, Phone, MessageCircle, UserCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">

        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">

            {/* Name + tipo badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{client.full_name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                isLead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isLead ? 'Lead' : 'Cliente'}
              </span>
            </div>

            {client.apodo && (
              <p className="text-xs text-muted-foreground italic">"{client.apodo}"</p>
            )}
            {client.email && (
              <p className="text-sm text-muted-foreground truncate">{client.email}</p>
            )}
            {client.phone && (
              <p className="text-sm text-muted-foreground">{client.phone}</p>
            )}
            {client.fuente && (
              <p className="text-xs text-muted-foreground">{client.fuente}</p>
            )}
          </div>

          {/* Right: nationality + estado */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {client.nationality && (
              <span className="text-xs text-muted-foreground border rounded px-2 py-0.5">
                {client.nationality}
              </span>
            )}

            {/* Estado badge — click to change (leads only) */}
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

        {client.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{client.notes}</p>
        )}

        {/* Quick actions (phone-based) */}
        {(waUrl || telUrl) && (
          <div className="flex gap-2">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {telUrl && (
              <a href={telUrl}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Llamar
              </a>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-1.5 pt-1 border-t">
          <Button variant="outline" size="sm" className="text-xs flex-1"
            onClick={() => setHistoryOpen(true)}>
            <History className="h-3 w-3 mr-1" /> Historial
          </Button>

          <Button size="sm"
            className="text-xs text-white"
            style={{ backgroundColor: '#D4AF37' }}
            onClick={() => setTaskOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Tarea
          </Button>

          {isLead && onConvert && (
            <Button size="sm"
              className="text-xs bg-gray-900 text-white hover:bg-gray-700"
              onClick={() => onConvert(client.id)}>
              <UserCheck className="h-3 w-3 mr-1" /> Convertir
            </Button>
          )}

          <Button variant="outline" size="sm" className="text-xs" onClick={() => onEdit(client)}>
            <Pencil className="h-3 w-3 mr-1" /> Editar
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive"
            onClick={handleDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
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
