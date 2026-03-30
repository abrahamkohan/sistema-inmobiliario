// src/components/ui/MobileFormScreen.tsx
import { useEffect, useRef } from 'react'
import { ChevronLeft, X } from 'lucide-react'

interface MobileFormScreenProps {
  open:     boolean
  onClose:  () => void
  title:    string
  children: React.ReactNode
  footer?:  React.ReactNode   // queda fuera del scroll, siempre visible
}

export function MobileFormScreen({ open, onClose, title, children, footer }: MobileFormScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 })
  }, [open])

  if (!open) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 relative flex items-center justify-between px-2 bg-white border-b border-gray-100"
        style={{ height: 56 }}>

        <button
          onClick={onClose}
          className="flex items-center gap-1 pl-2 pr-3 py-2 text-gray-600 active:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-[15px] font-medium">Volver</span>
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-gray-900 pointer-events-none">
          {title}
        </h2>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full text-gray-400 hover:text-gray-700 active:bg-gray-100 transition-colors"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* ── CONTENT (scrollable) ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden px-4 py-5"
        >
          {children}
        </div>
      </div>

      {/* ── FOOTER (fijo, fuera del scroll, nunca lo tapa el teclado) ────────── */}
      {footer && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100"
          style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.06)' }}>
          {footer}
        </div>
      )}
    </div>
  )
}
