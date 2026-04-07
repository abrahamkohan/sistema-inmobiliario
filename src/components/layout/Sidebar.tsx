// src/components/layout/Sidebar.tsx
import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router'
import {
  Home, Building2, Users, Calculator, FileText, Settings,
  LogOut, X, Receipt, MapPin, ClipboardList,
  NotebookPen, HandCoins, TrendingUp, Megaphone, Loader2, LayoutDashboard,
} from 'lucide-react'
import { useBrand } from '@/context/BrandContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTasks } from '@/hooks/useTasks'
import { getUrgency } from '@/lib/tasks'
import { useNotes } from '@/hooks/useNotes'
import { useIsAdmin } from '@/hooks/useUserRole'
import { usePermiso } from '@/hooks/usePermiso'
import { useIsSaasOwner } from '@/hooks/useIsSaasOwner'
import { useCurrentMember } from '@/hooks/useTeam'
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile'
import { GlobalSearch } from '@/components/search/GlobalSearch'

// ── Mapeo de módulos a permisos ────────────────────────────────────────────────────

const MODULO_PERMISO: Record<string, string> = {
  '/clientes':     'crm',
  '/tareas':       'tareas',
  '/notas':        'notas',
  '/propiedades':  'propiedades',
  '/proyectos':    'proyectos',
  '/comisiones':   'ventas',
  '/simulador':    'simulador',
  '/flip':         'flip',
  '/presupuestos': 'presupuestos',
  '/informes':     'reportes',
  '/marketing':    'marketing',
  '/recursos':     'configuracion',
  '/configuracion':'configuracion',
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
      { to: '/comisiones',  label: 'Ventas',      icon: HandCoins },
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
  const isSaasOwner = useIsSaasOwner()
  const currentMember = useCurrentMember()

  // Perfil propio
  const { data: profile } = useMyProfile()
  const updateMyProfile   = useUpdateMyProfile()
  const [showProfile, setShowProfile] = useState(false)
  const [myName,     setMyName]     = useState('')
  const [myWhatsapp, setMyWhatsapp] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) return
    setMyName(profile.full_name ?? '')
    setMyWhatsapp((profile as any).whatsapp ?? '')
  }, [profile])

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!showProfile) return
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfile])

  const overdueCount = tasks.filter(t => getUrgency(t) === 'overdue').length
  const inboxCount   = notes.filter(n => n.location === 'inbox').length

  const logoUrl = engine.getLogo('crm')

  function badge(to: string) {
    if (to === '/tareas') return overdueCount
    if (to === '/notas')  return inboxCount
    return undefined
  }

  const puedeVerCRM         = usePermiso('crm')
  const puedeVerTareas      = usePermiso('tareas')
  const puedeVerNotas       = usePermiso('notas')
  const puedeVerPropiedades = usePermiso('propiedades')
  const puedeVerProyectos   = usePermiso('proyectos')
  const puedeVerVentas      = usePermiso('ventas')
  const puedeVerSimulador   = usePermiso('simulador')
  const puedeVerFlip        = usePermiso('flip')
  const puedeVerPresupuestos = usePermiso('presupuestos')
  const puedeVerReportes    = usePermiso('reportes')
  const puedeVerMarketing   = usePermiso('marketing')

  const permisoMap: Record<string, boolean> = {
    '/clientes':     puedeVerCRM,
    '/tareas':       puedeVerTareas,
    '/notas':        puedeVerNotas,
    '/propiedades':  puedeVerPropiedades,
    '/proyectos':    puedeVerProyectos,
    '/comisiones':   puedeVerVentas,
    '/simulador':    puedeVerSimulador,
    '/flip':         puedeVerFlip,
    '/presupuestos': puedeVerPresupuestos,
    '/informes':     puedeVerReportes,
    '/marketing':    puedeVerMarketing,
    '/recursos':     isAdmin === true,
    '/configuracion':isAdmin === true,
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
          const filteredItems = grupo.items.filter(item => {
            const modulo = MODULO_PERMISO[item.to]
            if (!modulo) return true
            return permisoMap[item.to] !== false
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
            </div>
          )
        })}
        {isSaasOwner === true && (
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1">
              SaaS
            </p>
            <NavItem to="/admin" label="Admin SaaS" icon={LayoutDashboard} onClick={onClose} />
          </div>
        )}
      </nav>

      {/* ── Usuario logueado ── */}
      <div className="px-3 pt-3 border-t border-sidebar-border">
        {currentMember && (
          <div ref={profileRef} className="relative mb-2">
            {/* Popover Mi perfil */}
            {showProfile && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col gap-3 z-50">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Mi perfil</p>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Nombre completo</label>
                  <input
                    type="text"
                    value={myName}
                    onChange={e => setMyName(e.target.value)}
                    placeholder="Tu nombre"
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">WhatsApp</label>
                  <input
                    type="text"
                    value={myWhatsapp}
                    onChange={e => setMyWhatsapp(e.target.value)}
                    placeholder="+54 9 11 12345678"
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <button
                  disabled={updateMyProfile.isPending}
                  onClick={() => updateMyProfile.mutate(
                    { full_name: myName.trim(), whatsapp: myWhatsapp.trim() },
                    { onSuccess: () => setShowProfile(false) }
                  )}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  {updateMyProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            )}

            {/* Botón usuario */}
            <button
              onClick={() => setShowProfile(v => !v)}
              className="w-full px-3 py-2.5 rounded-md bg-sidebar-accent/40 hover:bg-sidebar-accent/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold text-xs flex-shrink-0">
                  {(currentMember.full_name ?? session?.user?.email ?? 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-sidebar-primary truncate leading-tight">
                    {currentMember.full_name || session?.user?.email?.split('@')[0] || 'Sin nombre'}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/60 truncate capitalize leading-tight">
                    {currentMember.is_owner ? 'Propietario' : (currentMember.role ?? 'Sin rol')}
                  </p>
                </div>
              </div>
            </button>
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
