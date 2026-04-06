import { createBrowserRouter, Navigate } from 'react-router'
import { SimuladorPublicoPage } from '@/pages/SimuladorPublicoPage'
import { AppShell } from '@/components/layout/AppShell'
import { InicioPage } from '@/pages/InicioPage'
import { ProyectosPage } from '@/pages/ProyectosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { SimuladorPage } from '@/pages/SimuladorPage'
import { InformesPage } from '@/pages/InformesPage'
import { ReporteHtmlPage } from '@/pages/ReporteHtmlPage'
import { ConfiguracionPage } from '@/pages/ConfiguracionPage'
import { RecursosPage } from '@/pages/RecursosPage'
import { MarketingPage } from '@/pages/MarketingPage'
import { PresupuestosPage } from '@/pages/PresupuestosPage'
import { PresupuestoPdfPage } from '@/pages/PresupuestoPdfPage'
import { PresupuestoFormPage } from '@/pages/PresupuestoFormPage'
import { PropiedadesPage } from '@/pages/PropiedadesPage'
import { PropiedadDetallePage } from '@/pages/PropiedadDetallePage'
import { PropiedadNuevaPage } from '@/pages/PropiedadNuevaPage'
import { PropiedadEditarPage } from '@/pages/PropiedadEditarPage'
import { ProyectoFormPage } from '@/pages/ProyectoFormPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { ClienteFormPage } from '@/pages/ClienteFormPage'
import { LeadQuickPage } from '@/pages/LeadQuickPage'
import { LeadShortLinkPage } from '@/pages/LeadShortLinkPage'
import { PropiedadLandingPage } from '@/pages/PropiedadLandingPage'
import { ProyectoLandingPage } from '@/pages/ProyectoLandingPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { TareasPage } from '@/pages/TareasPage'
import { NotasPage }  from '@/pages/NotasPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ComisionesPage } from '@/pages/ComisionesPage'
import { VentaFormPage } from '@/pages/VentaFormPage'
import { FlipPage } from '@/pages/FlipPage'
import { FlipFormPage } from '@/pages/FlipFormPage'
import { FlipPrintPage } from '@/pages/FlipPrintPage'
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage'
import { CatalogoCoverPage } from '@/pages/CatalogoCoverPage'
import { PropiedadesCatalogoPage } from '@/pages/PropiedadesCatalogoPage'
import { ProyectosCatalogoPage } from '@/pages/ProyectosCatalogoPage'
import { PropiedadFichaPage } from '@/pages/PropiedadFichaPage'
import { ProyectoFichaPage } from '@/pages/ProyectoFichaPage'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireRole } from '@/components/auth/RequireRole'
import { RequirePermiso } from '@/components/auth/RequirePermiso'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/inicio" replace /> },
      { path: 'inicio',     element: <InicioPage /> },
      { path: 'proyectos',              element: <RequirePermiso modulo="proyectos"><ProyectosPage /></RequirePermiso> },
      { path: 'proyectos/nueva',        element: <RequirePermiso modulo="proyectos"><ProyectoFormPage /></RequirePermiso> },
      { path: 'proyectos/:id',          element: <RequirePermiso modulo="proyectos"><ProjectDetailPage /></RequirePermiso> },
      { path: 'proyectos/:id/editar',   element: <RequirePermiso modulo="proyectos"><ProyectoFormPage /></RequirePermiso> },
      { path: 'clientes', element: <RequirePermiso modulo="crm"><ClientesPage /></RequirePermiso> },
      { path: 'clientes/nuevo', element: <RequirePermiso modulo="crm"><ClienteFormPage /></RequirePermiso> },
      { path: 'clientes/:id', element: <RequirePermiso modulo="crm"><ClientDetailPage /></RequirePermiso> },
      { path: 'clientes/:id/editar', element: <RequirePermiso modulo="crm"><ClienteFormPage /></RequirePermiso> },
      { path: 'simulador', element: <SimuladorPage /> },
      { path: 'flip',              element: <FlipPage /> },
      { path: 'flip/nuevo',        element: <FlipFormPage /> },
      { path: 'flip/:id/editar',   element: <FlipFormPage /> },
      { path: 'informes', element: <InformesPage /> },
      { path: 'presupuestos',             element: <PresupuestosPage /> },
      { path: 'presupuestos/nuevo',       element: <PresupuestoFormPage /> },
      { path: 'presupuestos/:id/editar',  element: <PresupuestoFormPage /> },
      { path: 'recursos',      element: <RequireRole role="admin" fallback={<Navigate to="/inicio" replace />}><RecursosPage /></RequireRole> },
      { path: 'propiedades',        element: <RequirePermiso modulo="propiedades"><PropiedadesPage /></RequirePermiso> },
      { path: 'propiedades/nueva',  element: <RequirePermiso modulo="propiedades"><PropiedadNuevaPage /></RequirePermiso> },
      { path: 'propiedades/:id',         element: <RequirePermiso modulo="propiedades"><PropiedadDetallePage /></RequirePermiso> },
      { path: 'propiedades/:id/editar', element: <RequirePermiso modulo="propiedades"><PropiedadEditarPage /></RequirePermiso> },
      { path: 'tareas',        element: <TareasPage /> },
      { path: 'notas',         element: <NotasPage /> },
      { path: 'marketing',     element: <RequirePermiso modulo="marketing"><MarketingPage /></RequirePermiso> },
      { path: 'comisiones',            element: <RequireRole role="admin"><ComisionesPage /></RequireRole> },
      { path: 'comisiones/nueva',      element: <RequireRole role="admin"><VentaFormPage /></RequireRole> },
      { path: 'comisiones/:id/editar', element: <RequireRole role="admin"><VentaFormPage /></RequireRole> },
      { path: 'configuracion', element: <RequireRole role="admin"><ConfiguracionPage /></RequireRole> },
    ],
  },
  // Rutas públicas (sin auth)
  { path: 'catalogo',             element: <CatalogoCoverPage /> },
  { path: 'catalogo/propiedades', element: <PropiedadesCatalogoPage /> },
  { path: 'catalogo/proyectos',   element: <ProyectosCatalogoPage /> },
  { path: 'p/:id',              element: <PropiedadLandingPage /> },
  { path: 'p/:id/ficha',        element: <PropiedadFichaPage /> },
  { path: 'proyecto/:id',       element: <ProyectoLandingPage /> },
  { path: 'proyecto/:id/ficha', element: <ProyectoFichaPage /> },
  { path: 'simulador', element: <SimuladorPublicoPage /> },
  { path: 'lead-quick', element: <LeadQuickPage /> },
  { path: 'l/:ref',     element: <LeadShortLinkPage /> },
  { path: 'informes/:id',      element: <ReporteHtmlPage /> },
  { path: 'presupuestos/:id/pdf', element: <PresupuestoPdfPage /> },
  { path: 'flip/:id/imprimir',   element: <FlipPrintPage /> },
  { path: 'auth/callback',        element: <AuthCallbackPage /> },
  { path: 'auth/google/callback', element: <GoogleCallbackPage /> },
  { path: 'reset-password', element: <ResetPasswordPage /> },
])
