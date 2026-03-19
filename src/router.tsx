import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { InicioPage } from '@/pages/InicioPage'
import { ProyectosPage } from '@/pages/ProyectosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { SimuladorPage } from '@/pages/SimuladorPage'
import { InformesPage } from '@/pages/InformesPage'
import { ReporteHtmlPage } from '@/pages/ReporteHtmlPage'
import { ConfiguracionPage } from '@/pages/ConfiguracionPage'
import { RecursosPage } from '@/pages/RecursosPage'
import { PresupuestosPage } from '@/pages/PresupuestosPage'
import { PresupuestoPdfPage } from '@/pages/PresupuestoPdfPage'
import { PropiedadesPage } from '@/pages/PropiedadesPage'
import { PropiedadDetallePage } from '@/pages/PropiedadDetallePage'
import { PropiedadNuevaPage } from '@/pages/PropiedadNuevaPage'
import { PropiedadEditarPage } from '@/pages/PropiedadEditarPage'
import { ProyectoFormPage } from '@/pages/ProyectoFormPage'
import { LeadQuickPage } from '@/pages/LeadQuickPage'
import { LeadShortLinkPage } from '@/pages/LeadShortLinkPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { RequireAuth } from '@/components/auth/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/inicio" replace /> },
      { path: 'inicio',     element: <InicioPage /> },
      { path: 'proyectos',              element: <ProyectosPage /> },
      { path: 'proyectos/nueva',        element: <ProyectoFormPage /> },
      { path: 'proyectos/:id/editar',   element: <ProyectoFormPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'simulador', element: <SimuladorPage /> },
      { path: 'informes', element: <InformesPage /> },
      { path: 'presupuestos', element: <PresupuestosPage /> },
      { path: 'recursos',      element: <RecursosPage /> },
      { path: 'propiedades',        element: <PropiedadesPage /> },
      { path: 'propiedades/nueva',  element: <PropiedadNuevaPage /> },
      { path: 'propiedades/:id',         element: <PropiedadDetallePage /> },
      { path: 'propiedades/:id/editar', element: <PropiedadEditarPage /> },
      { path: 'configuracion', element: <ConfiguracionPage /> },
    ],
  },
  // Rutas públicas (sin auth)
  { path: 'lead-quick', element: <LeadQuickPage /> },
  { path: 'l/:ref',     element: <LeadShortLinkPage /> },
  { path: 'informes/:id',      element: <ReporteHtmlPage /> },
  { path: 'presupuestos/:id/pdf', element: <PresupuestoPdfPage /> },
  { path: 'auth/callback', element: <AuthCallbackPage /> },
  { path: 'reset-password', element: <ResetPasswordPage /> },
])
