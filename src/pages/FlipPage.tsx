// src/pages/FlipPage.tsx
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { FlipCalculator } from '@/components/simulator/FlipCalculator'

export function FlipPage() {
  // Usamos key para resetear el componente internamente
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Flip</h1>
          <p className="text-sm text-muted-foreground">Calculadora de reventa · ROI de inversión</p>
        </div>
        <button
          onClick={() => setResetKey(k => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Resetear
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-5">
        <FlipCalculator key={resetKey} />
      </div>
    </div>
  )
}
