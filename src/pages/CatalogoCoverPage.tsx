// src/pages/CatalogoCoverPage.tsx
// Ruta pública: /catalogo — sin auth, sin AppShell
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getConsultoraPublic } from '@/lib/publicData'
import { PublicHeader } from '@/components/landing/PublicHeader'
import type { Database } from '@/types/database'

type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="h-52 bg-[#1a2744] animate-pulse" />
      <div className="max-w-[940px] mx-auto px-6 py-10 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 h-44 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="flex-1 h-44 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CatalogoCoverPage() {
  const [config, setConfig] = useState<ConsultoraRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConsultoraPublic()
      .then(setConfig)
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
      <div className="bg-[#1a2744] px-6 py-14 flex flex-col items-center text-center">
        {(config?.logo_light_url || config?.logo_url) ? (
          <img
            src={config.logo_light_url ?? config.logo_url!}
            alt={config.nombre ?? 'Catálogo'}
            className="h-14 w-auto object-contain mb-5"
            style={!config.logo_light_url ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
        ) : (
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {config?.nombre ?? 'Catálogo'}
          </h1>
        )}
        {(config?.logo_light_url || config?.logo_url) && config?.nombre && (
          <p className="text-white/70 text-sm font-medium tracking-wide uppercase">
            {config.nombre}
          </p>
        )}
      </div>

      {/* ── Cards de acceso ── */}
      <main className="flex-1 max-w-[940px] w-full mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/catalogo/propiedades"
            className="flex-1 group flex flex-col items-center gap-4 px-6 py-10 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#1a2744] transition-all"
          >
            <span className="text-4xl">🏠</span>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900 group-hover:text-[#1a2744] transition-colors">
                Propiedades →
              </p>
              <p className="text-sm text-gray-400 mt-1">Casas, departamentos y más</p>
            </div>
          </Link>

          <Link
            to="/catalogo/proyectos"
            className="flex-1 group flex flex-col items-center gap-4 px-6 py-10 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#1a2744] transition-all"
          >
            <span className="text-4xl">🏗️</span>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900 group-hover:text-[#1a2744] transition-colors">
                Proyectos →
              </p>
              <p className="text-sm text-gray-400 mt-1">Desarrollos en construcción y pozo</p>
            </div>
          </Link>
        </div>
      </main>

      {/* ── Footer consolidado ── */}
      <footer className="border-t border-gray-200 bg-white py-6 px-6">
        <div className="max-w-[940px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
