// src/context/BrandContext.tsx
// Provee brand engine a todos los componentes CRM (auth'd).
// Las páginas públicas obtienen su propia data via getConsultoraPublic().
import { createContext, useContext, useEffect, useMemo } from 'react'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { createBrandEngine } from '@/lib/brand/BrandEngine'
import type { BrandEngine } from '@/lib/brand/BrandEngine'

interface BrandContextValue {
  engine:    BrandEngine
  nombre:    string
  isLoading: boolean
}

const BrandCtx = createContext<BrandContextValue | null>(null)

const FALLBACK: Parameters<typeof createBrandEngine>[0] = {
  nombre:          '',
  logo_url:        null,
  logo_light_url:  null,
  color_primary:   '#C9A34E',
  color_secondary: '#1E3A5F',
  color_accent:    '#C9A34E',
  version:         1,
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { data: config, isLoading } = useConsultoraConfig()
  const settings = config ?? FALLBACK

  const engine = useMemo(() => createBrandEngine(settings), [config])

  // Aplica --brand-* en :root cada vez que cambian los colores
  useEffect(() => {
    const { primary, secondary, accent } = engine.getColors()
    const root = document.documentElement
    root.style.setProperty('--brand-primary',   primary)
    root.style.setProperty('--brand-secondary', secondary)
    root.style.setProperty('--brand-accent',    accent)
  }, [engine])

  const value = useMemo<BrandContextValue>(() => ({
    engine,
    nombre: settings.nombre ?? '',
    isLoading,
  }), [engine, settings, isLoading])

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandCtx)
  if (!ctx) throw new Error('useBrand must be used inside <BrandProvider>')
  return ctx
}
