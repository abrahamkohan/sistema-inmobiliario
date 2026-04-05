// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router'
import {
  Home, Building2, Users, Calculator, FileText, Settings,
  LogOut, X, Receipt, MapPin, ClipboardList,
  NotebookPen, HandCoins, TrendingUp, Megaphone,
} from 'lucide-react'
import { useBrand } from '@/context/BrandContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTasks } from '@/hooks/useTasks'
import { getUrgency } from '@/lib/tasks'
import { useNotes } from '@/hooks/useNotes'
import { useIsAdmin } from '@/hooks/useUserRole'
import { usePermiso } from '@/hooks/usePermiso'
import { useCurrentMember } from '@/hooks/useTeam'
import { GlobalSearch } from '@/components/search/GlobalSearch'

// ── Mapeo de módulos a permisos ────────────────────────────────────────────────────

const MODULO_PERMISO: Record<string, string> = {
  '/clientes': 'crm',
  '/tareas': 'tareas',
  '/notas': 'notas',
  '/propiedades': 'propiedades',
  '/proyectos': 'proyectos',
  '/simulador': 'finanzas',
  '/flip': 'finanzas',
  '/presupuestos': 'finanzas',
  '/informes': 'reportes',
  '/marketing': 'marketing',
  '/recursos': 'configuracion',
  '/configuracion': 'configuracion',
  '/comisiones': 'finanzas',
}

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
      { to: '/flip',         label: 'Flip',         icon: TrendingUp },
      { to: '/presupuestos', label: 'Presupuestos', icon: Receipt },
      { to: '/informes',     label: 'Informes',     icon: FileText },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/marketing',    label: 'Marketing',    icon: Megaphone },
      { to: '/recursos',     label: 'Recursos',     icon: Receipt },
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
  const { engine, nombre } = useBrand()
  const { session } = useAuth()
  const { data: tasks = [] } = useTasks()
  const { data: notes = [] } = useNotes()
  const isAdmin = useIsAdmin()
  const currentMember = useCurrentMember()

  const overdueCount = tasks.filter(t => getUrgency(t) === 'overdue').length
  const inboxCount   = notes.filter(n => n.location === 'inbox').length

  const logoUrl = engine.getLogo('crm')

  function badge(to: string) {
    if (to === '/tareas') return overdueCount
    if (to === '/notas')  return inboxCount
    return undefined
  }

  // ── Permisos al top level (NUNCA dentro de filter/map) ──
  // Retorna null durante loading - no ocultar módulos mientras cargan
  const puedeVerCRM        = usePermiso('crm', 'read')
  const puedeVerTareas     = usePermiso('tareas', 'read')
  const puedeVerNotas      = usePermiso('notas', 'read')
  const puedeVerPropiedades = usePermiso('propiedades', 'read')
  const puedeVerProyectos  = usePermiso('proyectos', 'read')
  const puedeVerFinanzas   = usePermiso('finanzas', 'read')
  const puedeVerReportes   = usePermiso('reportes', 'read')
  const puedeVerMarketing  = usePermiso('marketing', 'read')
  const puedeVerConfig     = usePermiso('configuracion', 'read')

  // Mapa de permisos - null significa "loading, mostrar de todos modos"
  const permisoMap: Record<string, boolean | null> = {
    '/clientes': puedeVerCRM,
    '/tareas': puedeVerTareas,
    '/notas': puedeVerNotas,
    '/propiedades': puedeVerPropiedades,
    '/proyectos': puedeVerProyectos,
    '/simulador': puedeVerFinanzas,
    '/flip': puedeVerFinanzas,
    '/presupuestos': puedeVerFinanzas,
    '/informes': puedeVerReportes,
    '/marketing': puedeVerMarketing,
    '/recursos': puedeVerConfig,
    '/configuracion': puedeVerConfig,
    '/comisiones': (isAdmin === true) ? puedeVerFinanzas : false,
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

      {/* ── Search ── */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <GlobalSearch />
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-4 overflow-y-auto">
        {NAV_GRUPOS.map((grupo, gi) => {
          // SISTEMA (último grupo): solo admin
          if (gi === NAV_GRUPOS.length - 1 && isAdmin !== true) return null
          
          // Filtrar items por permiso - null significa "mostrar (no sabemos aún)"
          const filteredItems = grupo.items.filter(item => {
            const permiso = MODULO_PERMISO[item.to]
            if (!permiso) return true
            const tienePermiso = permisoMap[item.to]
            // Mostrar si: es true, o es null (loading - mostrar de todos modos)
            return tienePermiso === true || tienePermiso === null
          })
          
          if (filteredItems.length === 0) return null
          
          return (
            <div key={gi} className="flex flex-col gap-0.5">
              {grupo.label && (
                <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1">
                  {grupo.label}
                </p>
              )}
              {filteredItems.map(({ to, label, icon }) => (
                <NavItem key={to} to={to} label={label} icon={icon} onClick={onClose} badge={badge(to)} />
              ))}
              {/* Ventas: solo admin, al final de Inventario */}
              {gi === 2 && isAdmin === true && puedeVerFinanzas && (
                <NavItem to="/comisiones" label="Ventas" icon={HandCoins} onClick={onClose} />
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Usuario logueado ── */}
      <div className="px-3 pt-3 border-t border-sidebar-border">
        {currentMember && (
          <div className="px-3 py-2.5 rounded-md bg-sidebar-accent/40 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold text-xs flex-shrink-0">
                {(currentMember.full_name ?? session?.user?.email ?? 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-primary truncate leading-tight">
                  {currentMember.full_name ?? 'Sin nombre'}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate capitalize leading-tight">
                  {currentMember.is_owner ? 'Propietario' : (currentMember.role ?? 'Sin rol')}
                </p>
                {session?.user?.email && (
                  <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
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
