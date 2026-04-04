// src/App.tsx
import { Theme } from '@radix-ui/themes'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { HostProvider } from '@/context/HostContext'
import { BrandProvider } from '@/context/BrandContext'
import { useBrand } from '@/context/BrandContext'
import { ClienteNoEncontrado } from '@/pages/ClienteNoEncontrado'

// Componente interno que usa BrandContext
function AppContent() {
  const { isLoading, notFound, consultant } = useBrand()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no se encontró consultant y no es default, mostrar error
  if (notFound && consultant.subdomain !== 'default') {
    return <ClienteNoEncontrado subdomain={consultant.subdomain} />
  }

  return <RouterProvider router={router} />
}

export function App() {
  return (
    <Theme
      accentColor="indigo"
      grayColor="slate"
      radius="large"
      scaling="100%"
      appearance="light"
      hasBackground={false}
    >
      <HostProvider>
        <BrandProvider>
          <AppContent />
        </BrandProvider>
      </HostProvider>
    </Theme>
  )
}