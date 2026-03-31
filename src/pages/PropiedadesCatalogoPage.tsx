// src/pages/PropiedadesCatalogoPage.tsx
// Ruta pública: /catalogo/propiedades — sin auth, sin AppShell
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getPublicProperties, getConsultoraPublic } from '@/lib/publicData'
import { PublicHeader } from '@/components/landing/PublicHeader'
import { PropertyPublicCard } from '@/components/landing/PropertyPublicCard'
import type { Database } from '@/types/database'

type PropertyRow   = Database['public']['Tables']['properties']['Row']
type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="h-36 bg-[#1a2744] animate-pulse" />
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ config }: { config: ConsultoraRow | null }) {
  const contactUrl = config?.whatsapp
    ? `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`
    : config?.telefono
      ? `tel:${config.telefono}`
      : config?.email
        ? `mailto:${config.email}`
        : null

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-5xl mb-4">🏠</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        No hay propiedades disponibles en este momento
      </h2>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        Estamos actualizando el inventario. Volvé pronto o contactanos para más información.
      </p>
      {contactUrl && (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold"
        >
          Contactar
        </a>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PropiedadesCatalogoPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [config, setConfig]         = useState<ConsultoraRow | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([getPublicProperties(), getConsultoraPublic()])
      .then(([props, cfg]) => {
        setProperties(props)
        setConfig(cfg)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  const contactLinks = [
    config?.whatsapp
      ? { href: `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`, label: 'WhatsApp', external: true }
      : config?.telefono
        ? { href: `tel:${config.telefono}`, label: config.telefono, external: false }
        : null,
    config?.email
      ? { href: `mailto:${config.email}`, label: config.email, external: false }
      : null,
    config?.sitio_web
      ? { href: config.sitio_web, label: config.sitio_web.replace(/^https?:\/\//, ''), external: true }
      : null,
  ].filter(Boolean) as { href: string; label: string; external: boolean }[]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader config={config} />

      {/* ── Hero ── */}
      <div className="bg-[#1a2744] px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs mb-4 transition-colors"
          >
            ← Catálogo
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Propiedades
          </h1>
          <p className="text-white/60 text-sm mt-1.5">
            Casas, departamentos y locales disponibles
          </p>
        </div>
      </div>

      {/* ── Grilla ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-8 pb-12">
        {properties.length === 0 ? (
          <EmptyState config={config} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(p => (
              <PropertyPublicCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer consolidado ── */}
      <footer className="border-t border-gray-200 bg-white py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {config?.nombre && (
            <span className="text-sm font-medium text-gray-700">{config.nombre}</span>
          )}
          {contactLinks.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {contactLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
