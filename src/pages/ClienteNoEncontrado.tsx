// src/pages/ClienteNoEncontrado.tsx
// Página mostrada cuando el subdomain no corresponde a ningún consultant
import { Link } from 'react-router'

interface ClienteNoEncontradoProps {
  subdomain: string | null
}

export function ClienteNoEncontrado({ subdomain }: ClienteNoEncontradoProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Cliente no encontrado
        </h1>

        <p className="text-gray-600 mb-6">
          {subdomain ? (
            <>
              No tenemos registrado ningún cliente con el dominio{' '}
              <span className="font-semibold text-gray-800">{subdomain}</span>
            </>
          ) : (
            'El dominio solicitado no está registrado en nuestro sistema.'
          )}
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ir a la página principal
          </Link>

          <Link
            to="/login"
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ir al login
          </Link>
        </div>
      </div>
    </div>
  )
}