// src/components/whatsapp/WhatsAppShareButton.tsx
// Botón liviano. Solo abre el ContactPickerSheet.
// Toda la orquestación vive en el sheet.

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { ContactPickerSheet } from './ContactPickerSheet'

type Props = {
  resourceTitle:   string
  resourceUrl:     string
  resourceContext: string
}

export function WhatsAppShareButton({ resourceTitle, resourceUrl, resourceContext }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Compartir
      </button>

      <ContactPickerSheet
        open={open}
        onOpenChange={setOpen}
        resourceTitle={resourceTitle}
        resourceUrl={resourceUrl}
        resourceContext={resourceContext}
      />
    </>
  )
}
