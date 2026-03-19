// src/components/ui/MobileFormScreen.tsx
import { useEffect, useRef } from 'react'
import { ChevronLeft, X } from 'lucide-react'

interface MobileFormScreenProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * Patrón mobile para formularios: pantalla full-screen tipo app.
 * Solo visible en mobile (md:hidden). Para desktop usar Modal.
 */
export function MobileFormScreen({ open, onClose, title, children }: MobileFormScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [open])

  if (!open) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col" style={{ background: '#f1f5f9' }}>
      {/* App header sticky */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-2 bg-white border-b"
        style={{ minHeight: 52 }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-0.5 text-gray-500 px-2 py-1.5 rounded-lg active:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Volver</span>
        </button>
        <h2 className="text-[15px] font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 active:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4">
        {children}
      </div>
    </div>
  )
}
