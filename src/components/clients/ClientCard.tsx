// src/components/clients/ClientCard.tsx
import { useState } from 'react'
import { Pencil, Trash2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientHistorySheet } from './ClientHistorySheet'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

interface ClientCardProps {
  client: ClientRow
  onEdit: (client: ClientRow) => void
  onDelete: (id: string) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false)

  function handleDelete() {
    if (!confirm(`¿Eliminar a "${client.full_name}"?`)) return
    onDelete(client.id)
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{client.full_name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                (client.tipo ?? 'lead') === 'cliente'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {(client.tipo ?? 'lead') === 'cliente' ? 'Cliente' : 'Lead'}
              </span>
            </div>
            {client.email && (
              <p className="text-sm text-muted-foreground truncate">{client.email}</p>
            )}
            {client.phone && (
              <p className="text-sm text-muted-foreground">{client.phone}</p>
            )}
            {client.apodo && (
              <p className="text-xs text-muted-foreground italic">"{client.apodo}"</p>
            )}
            {client.fuente && (
              <p className="text-xs text-muted-foreground">{client.fuente}</p>
            )}
          </div>
          {client.nationality && (
            <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 flex-shrink-0">
              {client.nationality}
            </span>
          )}
        </div>

        {client.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{client.notes}</p>
        )}

        <div className="flex gap-1.5 pt-1 border-t">
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex-1"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-3 w-3 mr-1" />
            Historial
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onEdit(client)}>
            <Pencil className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ClientHistorySheet
        client={client}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  )
}
