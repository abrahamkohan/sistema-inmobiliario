// src/pages/LeadShortLinkPage.tsx
// Ruta pública: /l/:ref  →  redirect a /lead-quick?token=xxx&ref=:ref
import { Navigate, useParams } from 'react-router'

const TOKEN = import.meta.env.VITE_LEAD_QUICK_TOKEN as string ?? ''

export function LeadShortLinkPage() {
  const { ref = '' } = useParams<{ ref: string }>()
  const dest = `/lead-quick?token=${TOKEN}${ref ? `&ref=${ref}` : ''}`
  return <Navigate to={dest} replace />
}
