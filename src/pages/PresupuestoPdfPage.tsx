// src/pages/PresupuestoPdfPage.tsx
import { useParams } from 'react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { Loader2 } from 'lucide-react'
import { usePresupuestoById } from '@/hooks/usePresupuestos'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import { getPublicUrl } from '@/lib/storage'
import { PresupuestoReport } from '@/simulator/pdf/PresupuestoReport'

function isRasterImage(url: string) {
  return /\.(png|jpe?g)(\?.*)?$/i.test(url)
}

export function PresupuestoPdfPage() {
  const { id } = useParams<{ id: string }>()
  const { data: p, isLoading: loadingP } = usePresupuestoById(id!)
  const { data: consultora, isLoading: loadingC } = useConsultoraConfig()

  if (loadingP || loadingC) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 style={{ width: 28, height: 28, color: '#9ca3af' }} className="animate-spin" />
      </div>
    )
  }

  if (!p) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6b7280' }}>Presupuesto no encontrado.</p>
      </div>
    )
  }

  const floorPlanUrl = p.floor_plan_path ? getPublicUrl(p.floor_plan_path) : null
  const logoUrl      = consultora?.logo_url ?? null
  const logoRaster   = logoUrl && isRasterImage(logoUrl) ? logoUrl : null

  const props = {
    consultora: {
      nombre:   consultora?.nombre   ?? 'Consultora Inmobiliaria',
      logoUrl:  logoRaster,
      telefono: consultora?.telefono ?? null,
      email:    consultora?.email    ?? null,
    },
    clientName:          p.client_name,
    unidadNombre:        p.unidad_nombre,
    superficieM2:        p.superficie_m2,
    precioUsd:           p.precio_usd,
    cocheraNombre:       p.cochera_nombre,
    cocheraPrecioUsd:    p.cochera_precio_usd,
    floorPlanUrl:        floorPlanUrl && isRasterImage(floorPlanUrl) ? floorPlanUrl : null,
    entrega:             p.entrega,
    cuotasCantidad:      p.cuotas_cantidad,
    cuotasValor:         p.cuotas_valor,
    refuerzosCantidad:   p.refuerzos_cantidad,
    refuerzosValor:      p.refuerzos_valor,
    refuerzosPeriodicidad: p.refuerzos_periodicidad,
    saldoContraEntrega:  p.saldo_contra_entrega,
    notas:               p.notas,
    date:                new Date(p.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' }),
  }

  return (
    <PDFViewer style={{ width: '100vw', height: '100vh', border: 'none' }}>
      <PresupuestoReport {...props} />
    </PDFViewer>
  )
}
