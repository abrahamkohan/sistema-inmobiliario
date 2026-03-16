// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router'
import { Home, Building2, Users, Calculator, FileText, Settings, BookMarked } from 'lucide-react'
import { useConsultoraConfig } from '@/hooks/useConsultora'

const NAV_MAIN = [
  { to: '/inicio',    label: 'Inicio',    icon: Home },
  { to: '/',          label: 'Proyectos', icon: Building2 },
  { to: '/clientes',  label: 'Clientes',  icon: Users },
  { to: '/simulador', label: 'Simulador', icon: Calculator },
  { to: '/informes',  label: 'Informes',  icon: FileText },
] as const

const NAV_RECURSOS = [
  { to: '/recursos', label: 'Recursos', icon: BookMarked },
] as const

const NAV_CONFIG = [
  { to: '/configuracion', label: 'Configuración', icon: Settings },
] as const

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: React.ElementType; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
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


export function Sidebar() {
  const { data: consultora } = useConsultoraConfig()
  const nombre = consultora?.nombre ?? 'Consultora Inmobiliaria'
  const logoUrl = consultora?.logo_url ?? null

  return (
    <aside className="w-56 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Brand */}
      <NavLink to="/inicio" className="px-5 py-4 border-b border-sidebar-border flex items-center" style={{ minHeight: 64 }}>
        {logoUrl ? (
          <img src={logoUrl} alt={nombre} style={{ maxWidth: 184, maxHeight: 44, objectFit: 'contain' }} />
        ) : (
          <div>
            <p className="text-sm font-semibold text-sidebar-primary leading-tight">{nombre}</p>
            <p className="text-xs text-sidebar-foreground mt-0.5 opacity-60">Inversiones Inmobiliarias</p>
          </div>
        )}
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          {NAV_MAIN.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} end={to === '/'} />
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
          {NAV_RECURSOS.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} />
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
          {NAV_CONFIG.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} />
          ))}
        </div>
      </nav>
    </aside>
  )
}
