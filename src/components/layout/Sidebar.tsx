// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router'
import {
  Home, Building2, Users, Calculator, FileText, Settings,
  BookMarked, LogOut, X, Receipt, MapPin, ClipboardList,
  NotebookPen, HandCoins,
} from 'lucide-react'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { supabase } from '@/lib/supabase'
import { useTasks } from '@/hooks/useTasks'
import { getUrgency } from '@/lib/tasks'
import { useNotes } from '@/hooks/useNotes'
import { useIsAdmin } from '@/hooks/useUserRole'

// ── Estructura de menú ────────────────────────────────────────────────────────

const NAV_GRUPOS: {
  label?: string
  items: { to: string; label: string; icon: React.ElementType }[]
}[] = [
  {
    label: 'General',
    items: [
      { to: '/inicio', label: 'Inicio', icon: Home },
    ],
  },
  {
    label: 'CRM',
    items: [
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/tareas',   label: 'Tareas',   icon: ClipboardList },
      { to: '/notas',    label: 'Notas',    icon: NotebookPen },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: '/propiedades', label: 'Propiedades', icon: MapPin },
      { to: '/proyectos',   label: 'Proyectos',   icon: Building2 },
      // Ventas se agrega dinámicamente (solo admin)
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/simulador',    label: 'Simulador',    icon: Calculator },
      { to: '/presupuestos', label: 'Presupuestos', icon: Receipt },
      { to: '/informes',     label: 'Informes',     icon: FileText },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/recursos',     label: 'Recursos',     icon: BookMarked },
      { to: '/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  to, label, icon: Icon, onClick, badge,
}: {
  to: string; label: string; icon: React.ElementType; onClick?: () => void; badge?: number
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
            : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
        }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { data: consultora } = useConsultoraConfig()
  const { data: tasks = [] } = useTasks()
  const { data: notes = [] } = useNotes()
  const isAdmin = useIsAdmin()

  const overdueCount = tasks.filter(t => getUrgency(t) === 'overdue').length
  const inboxCount   = notes.filter(n => n.location === 'inbox').length

  const nombre  = consultora?.nombre  ?? 'Consultora Inmobiliaria'
  const logoUrl = consultora?.logo_url ?? null

  function badge(to: string) {
    if (to === '/tareas') return overdueCount
    if (to === '/notas')  return inboxCount
    return undefined
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-full">

      {/* ── Brand ── */}
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
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-2 p-1 rounded text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-4 overflow-y-auto">
        {NAV_GRUPOS.map((grupo, gi) => {
          // SISTEMA (último grupo): solo admin
          if (gi === NAV_GRUPOS.length - 1 && !isAdmin) return null
          return (
            <div key={gi} className="flex flex-col gap-0.5">
              {grupo.label && (
                <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1">
                  {grupo.label}
                </p>
              )}
              {grupo.items.map(({ to, label, icon }) => (
                <NavItem key={to} to={to} label={label} icon={icon} onClick={onClose} badge={badge(to)} />
              ))}
              {/* Ventas: solo admin, al final de Inventario */}
              {gi === 2 && isAdmin && (
                <NavItem to="/comisiones" label="Ventas" icon={HandCoins} onClick={onClose} />
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Cerrar sesión (separado del flujo) ── */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <button
          onClick={() => { supabase.auth.signOut(); onClose?.() }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}
