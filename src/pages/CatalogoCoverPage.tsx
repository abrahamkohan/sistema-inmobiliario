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
      <div className="max-w-xl mx-auto px-6 pt-20 flex flex-col items-center gap-6">
        <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1 h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="flex-1 h-32 bg-gray-100 rounded-2xl animate-pulse" />
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader config={config} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">

          {/* Logo o nombre grande */}
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.nombre ?? 'Catálogo'}
              className="h-14 w-auto object-contain mx-auto mb-12"
            />
          ) : config?.nombre ? (
            <h1 className="text-3xl font-bold text-gray-900 mb-12 tracking-tight">
              {config.nombre}
            </h1>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-12 tracking-tight">
              Catálogo
            </h1>
          )}

          {/* Cards de acceso */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/catalogo/propiedades"
              className="flex-1 group flex flex-col items-center gap-3 px-6 py-8 rounded-2xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all"
            >
              <span className="text-3xl">🏠</span>
              <div>
                <p className="text-base font-semibold text-gray-900">Propiedades</p>
                <p className="text-sm text-gray-400 mt-0.5">Casas, departamentos y más</p>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors mt-1">
                Ver propiedades →
              </span>
            </Link>

            <Link
              to="/catalogo/proyectos"
              className="flex-1 group flex flex-col items-center gap-3 px-6 py-8 rounded-2xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all"
            >
              <span className="text-3xl">🏗️</span>
              <div>
                <p className="text-base font-semibold text-gray-900">Proyectos</p>
                <p className="text-sm text-gray-400 mt-0.5">Desarrollos en construcción y pozo</p>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors mt-1">
                Ver proyectos →
              </span>
            </Link>
          </div>

          {/* Contacto */}
          {(config?.whatsapp || config?.telefono || config?.email) && (
            <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
              {config.whatsapp && (
                <a
                  href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {config.telefono && !config.whatsapp && (
                <a
                  href={`tel:${config.telefono}`}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {config.telefono}
                </a>
              )}
              {config.email && (
                <a
                  href={`mailto:${config.email}`}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {config.email}
                </a>
              )}
              {config.sitio_web && (
                <a
                  href={config.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {config.sitio_web.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
        </div>
      </main>

      {config?.nombre && (
        <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
          {config.nombre}
        </footer>
      )}
    </div>
  )
}
