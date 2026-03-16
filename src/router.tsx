import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { InicioPage } from '@/pages/InicioPage'
import { ProyectosPage } from '@/pages/ProyectosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { SimuladorPage } from '@/pages/SimuladorPage'
import { InformesPage } from '@/pages/InformesPage'
import { ReporteHtmlPage } from '@/pages/ReporteHtmlPage'
import { ConfiguracionPage } from '@/pages/ConfiguracionPage'
import { RecursosPage } from '@/pages/RecursosPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ProyectosPage /> },
      { path: 'inicio', element: <InicioPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'simulador', element: <SimuladorPage /> },
      { path: 'informes', element: <InformesPage /> },
      { path: 'recursos',      element: <RecursosPage /> },
      { path: 'configuracion', element: <ConfiguracionPage /> },
    ],
  },
  // Full-page routes (no sidebar)
  { path: 'informes/:id', element: <ReporteHtmlPage /> },
  { path: 'auth/callback', element: <AuthCallbackPage /> },
])
