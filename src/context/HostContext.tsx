// src/context/HostContext.tsx
// Extrae hostname y parsea subdominio para multi-tenant routing
import { createContext, useContext, useMemo } from 'react'

export interface HostContextValue {
  hostname: string
  subdomain: string | null
  isLocalhost: boolean
  isProduction: boolean
}

const HostCtx = createContext<HostContextValue | null>(null)

export function HostProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<HostContextValue>(() => {
    const hostname = window.location.hostname
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isProduction = !isLocalhost && !hostname.includes('.test')

    // Parse subdomain: subdomain.domain.com -> subdomain
    let subdomain: string | null = null

    if (isLocalhost) {
      // En localhost no hay subdominio, usamos 'default'
      subdomain = 'default'
    } else {
      // Producción: parsear subdominio del hostname
      // Ejemplo: "inmuebles.midominio.com" -> "inmuebles"
      const parts = hostname.split('.')
      if (parts.length >= 3) {
        // Hay subdominio (subdomain.domain.com)
        subdomain = parts[0]
      }
      // Si parts.length < 3 (ej: domain.com), es dominio directo,
      // podría ser custom_domain, no subdomain
    }

    return {
      hostname,
      subdomain,
      isLocalhost,
      isProduction,
    }
  }, [])

  return <HostCtx.Provider value={value}>{children}</HostCtx.Provider>
}

export function useHost(): HostContextValue {
  const ctx = useContext(HostCtx)
  if (!ctx) {
    throw new Error('useHost must be used inside <HostProvider>')
  }
  return ctx
}