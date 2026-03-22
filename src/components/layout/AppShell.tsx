// src/components/layout/AppShell.tsx
import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useConsultoraConfig } from '@/hooks/useConsultora'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: consultora } = useConsultoraConfig()
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar desktop (siempre visible ≥ md) ── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Overlay mobile ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Drawer mobile ── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:hidden
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar mobile */}
        <header className="md:hidden flex items-center justify-between px-4 border-b bg-sidebar" style={{ minHeight: 56 }}>
          <button
            onClick={() => {
              navigate('/inicio')
              mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
            }}
            className="flex items-center gap-3"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {consultora?.logo_url ? (
              <img src={consultora.logo_url} alt={consultora.nombre} style={{ height: 28, objectFit: 'contain' }} />
            ) : (
              <span className="text-sm font-semibold text-sidebar-primary">
                {consultora?.nombre ?? 'Sistema'}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
