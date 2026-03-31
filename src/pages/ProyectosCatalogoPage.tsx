// src/pages/ProyectosCatalogoPage.tsx
// Ruta pública: /catalogo/proyectos — sin auth, sin AppShell
import { useEffect, useState } from 'react'
import { getPublicProjects, getConsultoraPublic } from '@/lib/publicData'
import { PublicHeader } from '@/components/landing/PublicHeader'
import { ProjectPublicCard } from '@/components/landing/ProjectPublicCard'
import type { Database } from '@/types/database'

type ProjectRow    = Database['public']['Tables']['projects']['Row']
type ConsultoraRow = Database['public']['Tables']['consultora_config']['Row']

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100 animate-pulse" />
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse mb-6" />
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
      <div className="text-5xl mb-4">🏗️</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        No hay proyectos disponibles en este momento
      </h2>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        Estamos actualizando el catálogo. Volvé pronto o contactanos para más información.
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
      {config?.nombre && (
        <p className="text-xs text-gray-400 mt-6">{config.nombre}</p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProyectosCatalogoPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [config, setConfig]     = useState<ConsultoraRow | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getPublicProjects(), getConsultoraPublic()])
      .then(([projs, cfg]) => {
        setProjects(projs)
        setConfig(cfg)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader config={config} />

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-12">
        <h1 className="text-xl font-bold text-gray-900 mb-5">
          Proyectos
          {projects.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({projects.length})
            </span>
          )}
        </h1>

        {projects.length === 0 ? (
          <EmptyState config={config} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectPublicCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>

      {config?.nombre && (
        <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
          {config.nombre}
        </footer>
      )}
    </div>
  )
}
