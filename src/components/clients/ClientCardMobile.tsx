// src/components/clients/ClientCardMobile.tsx
import { useState } from 'react'
import { Pencil, Trash2, History, Phone, MessageCircle, UserCheck, Plus } from 'lucide-react'
import { ClientHistorySheet } from './ClientHistorySheet'
import { TaskModal } from '@/components/tasks/TaskModal'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { useAgentName } from '@/hooks/useTeam'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

const ESTADOS = ['nuevo', 'contactado', 'respondio', 'no_responde', 'descartado'] as const

const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', respondio: 'Respondió',
  no_responde: 'No responde', descartado: 'Descartado', convertido: 'Convertido',
}

const ESTADO_CLS: Record<string, string> = {
  nuevo:       'bg-blue-100 text-blue-700',
  contactado:  'bg-yellow-100 text-yellow-700',
  respondio:   'bg-green-100 text-green-700',
  no_responde: 'bg-gray-100 text-gray-500',
  descartado:  'bg-red-100 text-red-600',
  convertido:  'bg-emerald-100 text-emerald-700',
}

function buildWhatsAppUrl(phone: string, name: string) {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return null
  const msg = encodeURIComponent(`Hola ${name}, te contacto en relación a tu consulta en Kohan & Campos.`)
  return `https://wa.me/${clean}?text=${msg}`
}

interface Props {
  client: ClientRow
  onEdit: (c: ClientRow) => void
  onDelete: (id: string) => void
  onConvert?: (id: string) => void
  onChangeEstado?: (id: string, estado: string) => void
  onView?: (c: ClientRow) => void
  puedeEditar?: boolean
}

export function ClientCardMobile({ client, onEdit, onDelete, onConvert, onChangeEstado, onView, puedeEditar = true }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [taskOpen,    setTaskOpen]    = useState(false)
  const [showEstados, setShowEstados] = useState(false)

  const isLead    = (client.tipo ?? 'lead') === 'lead'
  const estado    = client.estado ?? 'nuevo'
  const waUrl     = client.phone ? buildWhatsAppUrl(client.phone, client.full_name) : null
  const telUrl    = client.phone ? `tel:${client.phone.replace(/\s/g, '')}` : null
  const agentName = useAgentName(client.assigned_to)

  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleDelete() { setDeleteOpen(true) }

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm p-3 flex flex-col gap-2.5">

        {/* Fila 1: nombre + chips */}
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => onView?.(client)}
            className="flex flex-col gap-0.5 min-w-0 text-left"
          >
            <span className="font-semibold text-gray-900 text-sm leading-tight truncate hover:underline">{client.full_name}</span>
            {client.apodo && (
              <span className="text-xs text-gray-400 italic">"{client.apodo}"</span>
            )}
          </button>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isLead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isLead ? 'Lead' : 'Cliente'}
            </span>
            {client.nationality && (
              <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
                {client.nationality}
              </span>
            )}
          </div>
        </div>

        {/* Fila 2: teléfono + estado + fuente */}
        <div className="flex items-center gap-2 flex-wrap">
          {client.phone && (
            <span className="text-sm font-medium text-gray-700">{client.phone}</span>
          )}
          {isLead && (
            <div className="relative">
              <button type="button"
                onClick={() => setShowEstados(v => !v)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer ${ESTADO_CLS[estado] ?? ESTADO_CLS.nuevo}`}>
                {ESTADO_LABEL[estado] ?? estado}
              </button>
              {showEstados && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEstados(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                    {ESTADOS.map(e => (
                      <button key={e} type="button"
                        onClick={() => { onChangeEstado?.(client.id, e); setShowEstados(false) }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${estado === e ? 'opacity-40' : ''}`}>
                        <span className={`w-2 h-2 rounded-full ${ESTADO_CLS[e].split(' ')[0]}`} />
                        {ESTADO_LABEL[e]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {client.fuente && (
            <span className="text-[11px] text-gray-400">{client.fuente}</span>
          )}
          {agentName && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 ml-auto flex-shrink-0">
              <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                {agentName[0].toUpperCase()}
              </span>
              {agentName.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Fila 3: acciones */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: '#397746' }}>
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          )}
          {telUrl && (
            <a href={telUrl}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold">
              <Phone className="w-3 h-3" /> Llamar
            </a>
          )}
          <button onClick={() => setHistoryOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
            title="Historial">
            <History className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setTaskOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:opacity-80"
            style={{ backgroundColor: '#D4AF37' }} title="Nueva tarea">
            <Plus className="w-3.5 h-3.5" />
          </button>
          {isLead && onConvert && (
            <button onClick={() => onConvert(client.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Promover a Cliente">
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {puedeEditar && (
            <>
              <button onClick={() => onEdit(client)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Editar">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleDelete}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <ClientHistorySheet client={client} open={historyOpen} onOpenChange={setHistoryOpen} />
      <TaskModal isOpen={taskOpen} onClose={() => setTaskOpen(false)}
        defaultValues={{ context: 'lead', lead_id: client.id }} />
      <DeleteConfirmDialog
        open={deleteOpen}
        mode="name"
        entityName={client.full_name}
        onConfirm={() => { onDelete(client.id); setDeleteOpen(false) }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
