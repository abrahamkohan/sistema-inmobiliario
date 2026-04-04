// src/pages/MarketingPage.tsx
import { SeccionAssets } from '@/components/configuracion/SeccionAssets'

export function MarketingPage() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona imágenes, documentos y materiales de marketing.
        </p>
      </div>
      <SeccionAssets />
    </div>
  )
}
