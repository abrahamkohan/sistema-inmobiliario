// src/lib/pdfService.ts
// Generates a PDF blob from a simulation and uploads it to the 'reports' bucket.
import { pdf } from '@react-pdf/renderer'
import { supabase } from './supabase'
import { getPublicUrl } from './storage'
import { getConsultoraConfig } from './consultoraConfig'
import { SimReport } from '@/simulator/pdf/SimReport'
import type { SimReportProps, ConsultoraInfo } from '@/simulator/pdf/SimReport'
import type { Database } from '@/types/database'
import type { AirbnbInputs, AirbnbResult, AlquilerInputs, AlquilerResult, PlusvaliaInputs, PlusvaliaResult } from '@/simulator/engine/types'
import { centsToUsd } from '@/utils/money'

type SimRow = Database['public']['Tables']['simulations']['Row']

const REPORTS_BUCKET = 'reports'

// Build SimReportProps from a saved simulation row + client name.
// Resolves storage paths → public URLs for images.
async function fetchConsultora(): Promise<ConsultoraInfo> {
  try {
    const cfg = await getConsultoraConfig()
    return {
      nombre: cfg?.nombre ?? 'Consultora Inmobiliaria',
      logoUrl: cfg?.logo_light_url ?? cfg?.logo_url ?? null,
      telefono: cfg?.telefono ?? null,
      email: cfg?.email ?? null,
    }
  } catch {
    return { nombre: 'Consultora Inmobiliaria', logoUrl: null, telefono: null, email: null }
  }
}

export async function buildReportProps(sim: SimRow, clientName: string): Promise<SimReportProps> {
  const project = sim.snapshot_project as Record<string, unknown>
  const typology = sim.snapshot_typology as Record<string, unknown>

  // Resolve cover photo URL (first photo path stored in snapshot)
  const coverPhotoPath = (project.cover_photo_path as string | null) ?? null
  const coverPhotoUrl = coverPhotoPath ? getPublicUrl(coverPhotoPath) : null

  // Resolve floor plan URL
  const floorPlanPath = (typology.floor_plan_path as string | null) ?? null
  const floorPlanUrl = floorPlanPath ? getPublicUrl(floorPlanPath) : null

  // Price in dollars for display
  const priceUsdCents = (typology.price_usd as number) ?? 0
  const priceDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(centsToUsd(priceUsdCents))

  // Parse delivery date
  const deliveryRaw = (project.delivery_date as string | null) ?? null
  const deliveryDisplay = deliveryRaw
    ? new Date(deliveryRaw).toLocaleDateString('es-PY', { year: 'numeric', month: 'long' })
    : null

  // Parse scenarios
  function parseAirbnb() {
    if (!sim.scenario_airbnb) return null
    const s = sim.scenario_airbnb as Record<string, unknown>
    return {
      inputs: s.inputs as AirbnbInputs,
      result: s.result as AirbnbResult,
    }
  }

  function parseAlquiler() {
    if (!sim.scenario_alquiler) return null
    const s = sim.scenario_alquiler as Record<string, unknown>
    return {
      inputs: s.inputs as AlquilerInputs,
      result: s.result as AlquilerResult,
    }
  }

  function parsePlusvalia() {
    if (!sim.scenario_plusvalia) return null
    const s = sim.scenario_plusvalia as Record<string, unknown>
    return {
      inputs: s.inputs as PlusvaliaInputs,
      result: s.result as PlusvaliaResult,
    }
  }

  const consultora = await fetchConsultora()

  return {
    consultora,
    clientName,
    date: new Date(sim.created_at).toLocaleDateString('es-PY', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    projectName: (project.name as string) ?? 'Proyecto',
    projectLocation: (project.location as string | null) ?? null,
    projectStatus: (project.status as string) ?? 'en_pozo',
    projectDelivery: deliveryDisplay,
    projectDeveloper: (project.developer_name as string | null) ?? null,
    amenities: (project.amenities as string[]) ?? [],
    coverPhotoUrl,
    typologyName: (typology.name as string) ?? 'Tipología',
    typologyArea: (typology.area_m2 as number) ?? 0,
    typologyPriceDisplay: priceDisplay,
    floorPlanUrl,
    airbnb: parseAirbnb(),
    alquiler: parseAlquiler(),
    plusvalia: parsePlusvalia(),
  }
}

// Generate PDF blob and open it in a new browser tab directly (no storage needed).
export async function generateAndOpenReport(sim: SimRow, clientName: string): Promise<void> {
  const props = await buildReportProps(sim, clientName)
  const blob = await pdf(<SimReport {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Revoke after a delay to free memory
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// Legacy: upload to storage bucket (requires bucket to exist).
export async function generateAndUploadReport(sim: SimRow, clientName: string): Promise<string> {
  const props = await buildReportProps(sim, clientName)
  const blob = await pdf(<SimReport {...props} />).toBlob()
  const path = `${sim.id}/report.pdf`
  const { error } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(path, blob, { contentType: 'application/pdf', upsert: true })
  if (error) throw error
  return path
}

export function getReportUrl(path: string): string {
  const { data } = supabase.storage.from(REPORTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
