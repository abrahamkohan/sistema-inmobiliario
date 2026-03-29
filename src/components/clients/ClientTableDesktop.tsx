// src/components/clients/ClientTableDesktop.tsx
import { useState } from 'react'
import { Pencil, Trash2, History, Phone, MessageCircle, UserCheck, Plus, MapPin, Zap } from 'lucide-react'
import { ClientHistorySheet } from './ClientHistorySheet'
import { TaskModal } from '@/components/tasks/TaskModal'
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

const AVATAR_GRADIENTS = [
  'from-violet-600 to-indigo-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-700',
  'from-sky-500 to-blue-700',
  'from-slate-600 to-gray-800',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
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
}

// ─── Card individual ──────────────────────────────────────────────────────────

function ClientCard({ client, onEdit, onDelete, onConvert, onChangeEstado, onView }: Omit<Props, 'clients'> & { client: ClientRow }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [taskOpen,    setTaskOpen]    = useState(false)
  const [showEstados, setShowEstados] = useState(false)

  const isLead   = (client.tipo ?? 'lead') === 'lead'
  const estado   = client.estado ?? 'nuevo'
  const waUrl    = client.phone ? buildWhatsAppUrl(client.phone, client.full_name) : null
  const telUrl   = client.phone ? `tel:${client.phone.replace(/\s/g, '')}` : null
  const initials = client.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(client.full_name)

  function handleDelete() {
    if (!confirm(`¿Eliminar a "${client.full_name}"?`)) return
    onDelete(client.id)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group flex flex-col">

        {/* ── Top: avatar + info + quick contact ── */}
        <div className="flex items-start gap-3 p-4">

          {/* Avatar */}
          <button onClick={() => onView?.(client)} className="flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
              {initials}
            </div>
          </button>

          {/* Name + contact */}
          <div className="flex-1 min-w-0">
            <button onClick={() => onView?.(client)} className="text-left block w-full">
              <p className="font-semibold text-gray-900 leading-tight hover:text-blue-600 transition-colors truncate">
                {client.full_name}
              </p>
              {client.apodo && (
                <p className="text-xs text-gray-400 italic truncate">"{client.apodo}"</p>
              )}
            </button>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLead ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isLead ? 'Lead' : 'Cliente'}
              </span>

              {isLead && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEstados(v => !v)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-80 ${ESTADO_CLS[estado] ?? ESTADO_CLS.nuevo}`}
                  >
                    {ESTADO_LABEL[estado] ?? estado}
                  </button>
                  {showEstados && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowEstados(false)} />
                      <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[148px]">
                        {ESTADOS.map(e => (
                          <button key={e} type="button"
                            onClick={() => { onChangeEstado?.(client.id, e); setShowEstados(false) }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors ${estado === e ? 'opacity-40 pointer-events-none' : ''}`}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ESTADO_CLS[e].split(' ')[0]}`} />
                            {ESTADO_LABEL[e]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Contact info */}
            <div className="mt-2 flex flex-col gap-0.5">
              {client.phone && (
                <p className="text-xs text-gray-500 font-medium">{client.phone}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {client.nationality && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPin className="w-3 h-3" />{client.nationality}
                  </span>
                )}
                {client.fuente && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Zap className="w-3 h-3" />{client.fuente}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick contact buttons */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#25D366' }} title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {telUrl && (
              <a href={telUrl}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm hover:opacity-90 transition-opacity"
                title="Llamar"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* ── Bottom: acciones ── */}
        <div className="flex items-center gap-1 px-4 pb-3 pt-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button onClick={() => onView?.(client)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            Ver ficha
          </button>
          <div className="w-px h-4 bg-gray-100" />
          <button onClick={() => setHistoryOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Historial">
            <History className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setTaskOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:opacity-80 transition-opacity shadow-sm"
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
        </div>
      </div>

      <ClientHistorySheet client={client} open={historyOpen} onOpenChange={setHistoryOpen} />
      <TaskModal isOpen={taskOpen} onClose={() => setTaskOpen(false)}
        defaultValues={{ context: 'lead', lead_id: client.id }} />
    </>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function ClientTableDesktop({ clients, onEdit, onDelete, onConvert, onChangeEstado, onView }: Props) {
  if (clients.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Sin resultados.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={onEdit}
          onDelete={onDelete}
          onConvert={onConvert}
          onChangeEstado={onChangeEstado}
          onView={onView}
        />
      ))}
    </div>
  )
}
