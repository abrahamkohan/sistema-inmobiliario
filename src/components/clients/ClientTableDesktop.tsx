// src/components/clients/ClientTableDesktop.tsx
import { useState } from 'react'
import { Pencil, Trash2, History, Phone, MessageCircle, UserCheck, Plus } from 'lucide-react'
import { ClientHistorySheet } from './ClientHistorySheet'
import { TaskModal } from '@/components/tasks/TaskModal'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { useAgentName } from '@/hooks/useTeam'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  clients: ClientRow[]
  onEdit: (c: ClientRow) => void
  onDelete: (id: string) => void
  onConvert?: (id: string) => void
  onChangeEstado?: (id: string, estado: string) => void
  onView?: (c: ClientRow) => void
  puedeEditar?: boolean
}

// ─── Fila individual ──────────────────────────────────────────────────────────

function ClientRow({ client, onEdit, onDelete, onConvert, onChangeEstado, onView, puedeEditar = true }: Omit<Props, 'clients'> & { client: ClientRow }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [taskOpen,    setTaskOpen]    = useState(false)
  const [showEstados, setShowEstados] = useState(false)

  const isLead   = (client.tipo ?? 'lead') === 'lead'
  const estado   = client.estado ?? 'nuevo'
  const waUrl    = client.phone ? buildWhatsAppUrl(client.phone, client.full_name) : null
  const telUrl   = client.phone ? `tel:${client.phone.replace(/\s/g, '')}` : null
  const agentName = useAgentName(client.assigned_to)

  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleDelete() { setDeleteOpen(true) }

  return (
    <>
      <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors group">

        {/* Nombre + apodo */}
        <td className="px-4 py-3">
          <button onClick={() => onView?.(client)} className="flex flex-col gap-0.5 text-left">
            <span className="font-semibold text-foreground leading-tight hover:underline cursor-pointer">{client.full_name}</span>
            {client.apodo && (
              <span className="text-xs text-muted-foreground italic">"{client.apodo}"</span>
            )}
          </button>
        </td>

        {/* Tipo + Estado */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1 items-start">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isLead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isLead ? 'Lead' : 'Cliente'}
            </span>
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
          </div>
        </td>

        {/* Contacto */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            {client.phone && (
              <span className="text-sm font-medium text-foreground">{client.phone}</span>
            )}
            {client.email && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{client.email}</span>
            )}
          </div>
        </td>

        {/* País / Fuente */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            {client.nationality && (
              <span className="text-xs font-semibold text-gray-700">{client.nationality}</span>
            )}
            {client.fuente && (
              <span className="text-xs text-muted-foreground">{client.fuente}</span>
            )}
          </div>
        </td>

        {/* Agente */}
        <td className="px-4 py-3">
          {agentName ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                {agentName[0].toUpperCase()}
              </span>
              <span className="truncate max-w-[100px]">{agentName.split(' ')[0]}</span>
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ backgroundColor: '#397746' }} title="WhatsApp">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
            {telUrl && (
              <a href={telUrl}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:opacity-80 transition-opacity flex-shrink-0"
                title="Llamar">
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
            <button onClick={() => setHistoryOpen(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Historial">
              <History className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setTaskOpen(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#D4AF37' }} title="Nueva tarea">
              <Plus className="w-3.5 h-3.5" />
            </button>
            {isLead && onConvert && (
              <button onClick={() => onConvert(client.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Promover a Cliente">
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Edit + Delete: solo visibles en hover si puedeEditar */}
            {puedeEditar && (
              <>
                <button onClick={() => onEdit(client)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                  title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDelete}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

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

// ─── Tabla ────────────────────────────────────────────────────────────────────

export function ClientTableDesktop({ clients, onEdit, onDelete, onConvert, onChangeEstado, onView, puedeEditar = true }: Props) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-semibold text-foreground">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Estado</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Contacto</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">País / Fuente</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Agente</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <ClientRow
              key={client.id}
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
              onConvert={onConvert}
              onChangeEstado={onChangeEstado}
              onView={onView}
              puedeEditar={puedeEditar}
            />
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                Sin resultados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
