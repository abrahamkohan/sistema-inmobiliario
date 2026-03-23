// src/components/tasks/LeadPeekSheet.tsx
// Bottom sheet de previsualización rápida de un lead desde TaskItem.

import { useNavigate } from 'react-router'
import { MessageCircle, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useClient } from '@/hooks/useClients'

interface LeadPeekSheetProps {
  isOpen:  boolean
  leadId:  string | null
  onClose: () => void
}

function buildWaUrl(phone: string, name: string): string {
  const clean = phone.replace(/\D/g, '').replace(/^0/, '')
  const msg   = encodeURIComponent(`Hola ${name}, te contacto de Kohan & Campos.`)
  return `https://wa.me/595${clean}?text=${msg}`
}

export function LeadPeekSheet({ isOpen, leadId, onClose }: LeadPeekSheetProps) {
  const navigate  = useNavigate()
  const { data: lead, isLoading } = useClient(leadId ?? '')

  if (!leadId) return null

  return (
    <Sheet open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[75vh] overflow-y-auto pb-safe"
      >
        {/* Handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !lead && (
          <p className="text-sm text-muted-foreground text-center py-8">Lead no encontrado.</p>
        )}

        {!isLoading && lead && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="text-lg">{lead.full_name}</SheetTitle>
              {lead.apodo && (
                <p className="text-xs text-muted-foreground italic">"{lead.apodo}"</p>
              )}
            </SheetHeader>

            {/* Datos */}
            <div className="flex flex-col gap-1.5 text-sm mb-5">
              {lead.phone && (
                <p className="text-muted-foreground">{lead.phone}</p>
              )}
              {lead.nationality && (
                <p className="text-muted-foreground">{lead.nationality}</p>
              )}
              {lead.fuente && (
                <p className="text-xs text-muted-foreground">
                  Fuente: {lead.fuente}
                </p>
              )}
              {lead.notes && (
                <p className="text-sm text-muted-foreground border-t pt-3 mt-1 line-clamp-3">
                  {lead.notes}
                </p>
              )}
            </div>

            {/* Acciones rápidas */}
            {lead.phone && (
              <div className="flex gap-2 mb-4">
                <a
                  href={buildWaUrl(lead.phone, lead.full_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold text-white transition-colors"
                  style={{ backgroundColor: '#397746' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${lead.phone.replace(/\s/g, '')}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Llamar
                </a>
              </div>
            )}

            {/* Ver perfil completo */}
            <Button
              variant="outline"
              className="w-full justify-between text-sm"
              onClick={() => { navigate(`/clientes/${lead.id}`); onClose() }}
            >
              Ver perfil completo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
