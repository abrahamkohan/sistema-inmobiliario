// src/context/BrandContext.tsx
// Provee brand engine a todos los componentes CRM (auth'd).
// Ahora usa multi-tenant: consulta consultants por subdomain.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useHost } from './HostContext'
import { loadBrand, clearBrandCache } from '@/lib/brandLoader'
import { BrandEngine } from '@/lib/brand/BrandEngine'
import type { Consultant } from '@/types/consultant'
import { DEFAULT_CONSULTANT } from '@/types/consultant'

interface BrandContextValue {
  engine: BrandEngine
  consultant: Consultant
  nombre: string
  isLoading: boolean
  notFound: boolean
  isDefault: boolean
}

const BrandCtx = createContext<BrandContextValue | null>(null)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { hostname, subdomain } = useHost()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<Consultant>(DEFAULT_CONSULTANT)
  const [notFound, setNotFound] = useState(false)
  const [isDefault, setIsDefault] = useState(true)

  // Cargar consultant cuando cambia el hostname/subdomain
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      const result = await loadBrand(hostname, subdomain)

      if (!cancelled) {
        setConsultant(result.consultant)
        setNotFound(result.notFound)
        setIsDefault(result.isDefault)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [hostname, subdomain])

  // Crear engine con settings del consultant
  const engine = useMemo(() => {
    const settings = {
      nombre: consultant.nombre,
      logo_url: consultant.logo_url,
      logo_light_url: consultant.logo_light_url,
      color_primary: consultant.color_primary,
      color_secondary: consultant.color_secondary,
      color_accent: consultant.color_accent,
      version: 1,
    }
    return new BrandEngine(settings)
  }, [consultant])

  // Aplicar colores como CSS variables en :root
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-primary', consultant.color_primary)
    root.style.setProperty('--brand-secondary', consultant.color_secondary)
    root.style.setProperty('--brand-accent', consultant.color_accent)
    root.style.setProperty('--brand-nombre', consultant.nombre)
    if (consultant.logo_url) {
      root.style.setProperty('--brand-logo', consultant.logo_url)
    }
    if (consultant.logo_light_url) {
      root.style.setProperty('--brand-logo-light', consultant.logo_light_url)
    }
  }, [consultant])

  const value = useMemo<BrandContextValue>(() => ({
    engine,
    consultant,
    nombre: consultant.nombre,
    isLoading: loading,
    notFound,
    isDefault,
  }), [engine, consultant, loading, notFound, isDefault])

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandCtx)
  if (!ctx) throw new Error('useBrand must be used inside <BrandProvider>')
  return ctx
}

/**
 * Hook para limpiar el caché de brand (útil en logout)
 */
export function useClearBrandCache() {
  return clearBrandCache
}