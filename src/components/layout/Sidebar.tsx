// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router'
import { Home, Building2, Users, Calculator, FileText, Settings, BookMarked, LogOut, X, Receipt } from 'lucide-react'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { supabase } from '@/lib/supabase'

const NAV_MAIN = [
  { to: '/inicio',    label: 'Inicio',    icon: Home },
  { to: '/proyectos', label: 'Proyectos', icon: Building2 },
  { to: '/clientes',  label: 'Clientes',  icon: Users },
  { to: '/simulador', label: 'Simulador', icon: Calculator },
  { to: '/informes',  label: 'Informes',  icon: FileText },
] as const

const NAV_RECURSOS = [
  { to: '/presupuestos', label: 'Presupuestos', icon: Receipt },
  { to: '/recursos',     label: 'Recursos',     icon: BookMarked },
] as const

const NAV_CONFIG = [
  { to: '/configuracion', label: 'Configuración', icon: Settings },
] as const

function NavItem({
  to, label, icon: Icon, end, onClick,
}: {
  to: string; label: string; icon: React.ElementType; end?: boolean; onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
            : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
        }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </NavLink>
  )
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { data: consultora } = useConsultoraConfig()
  const nombre  = consultora?.nombre  ?? 'Consultora Inmobiliaria'
  const logoUrl = consultora?.logo_url ?? null

  return (
    <aside className="w-56 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-sidebar-border flex items-center justify-between" style={{ minHeight: 64 }}>
        <NavLink
          to="/inicio"
          onClick={() => {
            onClose?.()
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' })
          }}
          className="flex items-center flex-1 min-w-0"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={nombre} style={{ maxWidth: 160, maxHeight: 44, objectFit: 'contain' }} />
          ) : (
            <div>
              <p className="text-sm font-semibold text-sidebar-primary leading-tight">{nombre}</p>
              <p className="text-xs text-sidebar-foreground mt-0.5 opacity-60">Inversiones Inmobiliarias</p>
            </div>
          )}
        </NavLink>
        {/* Botón cerrar — solo en mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-2 p-1 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-2 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {NAV_MAIN.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} onClick={onClose} />
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
          {NAV_RECURSOS.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} onClick={onClose} />
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
          {NAV_CONFIG.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} onClick={onClose} />
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <button
          onClick={() => { supabase.auth.signOut(); onClose?.() }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
