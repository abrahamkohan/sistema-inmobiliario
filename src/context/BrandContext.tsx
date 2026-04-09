// src/context/BrandContext.tsx
// Provee brand engine a todos los componentes CRM (auth'd).
// Usa consultant_id de user_roles como fuente de verdad para branding.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useHost } from './HostContext'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
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
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<Consultant>(DEFAULT_CONSULTANT)
  const [notFound, setNotFound] = useState(false)
  const [isDefault, setIsDefault] = useState(true)

  const userId = session?.user?.id

  // Cargar consultant cuando cambia hostname/subdomain o el USER ID (no el token)
  useEffect(() => {
    let cancelled = false

    async function loadConsultant() {
      setLoading(true)

      // Obtener consultant_id desde user_roles (fuente de verdad)
      let consultantId: string | null = null
      
      if (userId) {
        const { data } = await supabase
          .from('user_roles')
          .select('consultant_id')
          .eq('user_id', userId as unknown as never)
          .maybeSingle() as { data: { consultant_id: string | null } | null }
        
        consultantId = data?.consultant_id ?? null
      }

      let result: { consultant: Consultant; isDefault: boolean; notFound: boolean }
      try {
        result = await loadBrand(hostname, subdomain, consultantId)
      } catch (err) {
        console.error('[BrandContext] loadBrand threw:', err)
        result = { consultant: DEFAULT_CONSULTANT, isDefault: true, notFound: false }
      }

      if (!cancelled) {
        setConsultant(result.consultant)
        setNotFound(result.notFound)
        setIsDefault(result.isDefault)
        setLoading(false)
      }
    }

    loadConsultant()

    return () => {
      cancelled = true
    }
  }, [hostname, subdomain, userId])

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