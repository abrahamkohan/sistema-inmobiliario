// src/pages/ReporteHtmlPage.tsx
import { useParams } from 'react-router'
import { Loader2, Printer, MapPin } from 'lucide-react'
import { useSimulation } from '@/hooks/useSimulations'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import type { AirbnbInputs, AirbnbResult, AlquilerInputs, AlquilerResult, PlusvaliaInputs, PlusvaliaResult } from '@/simulator/engine'

type ScenarioData<I, R> = { inputs: I; result: R }

// ─── Design tokens ────────────────────────────────────────────────────────────
const KC = {
  navy:      '#14223A',
  navySoft:  '#1E3254',
  navyLight: '#243B62',
  beige:     'rgb(100, 100, 100)',
  beigeLight:'#F7F0E8',
  gray:      '#656E7E',
  graySoft:  '#828B9C',
  grayBorder:'#E4E7EB',
  success:   '#049C3C',
  dorado:    '#C9B99A',
  doradoText:'#5C4A2A',
  white:     '#FFFFFF',
  textDark:  '#1A1F2B',
  textMid:   '#4B5563',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `USD ${n.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function pct(n: number) { return `${n.toFixed(2)}%` }

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, bg, textColor = '#fff' }: { title: string; bg: string; textColor?: string }) {
  return (
    <div style={{
      backgroundColor: bg,
      color: textColor,
      padding: '12px 24px',
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
    }}>
      {title}
    </div>
  )
}

// ─── Metric row ───────────────────────────────────────────────────────────────
type RowVariant = 'normal' | 'highlight' | 'muted'

function MetricRow({ label, value, variant = 'normal', accentColor }: {
  label: string
  value: string
  variant?: RowVariant
  accentColor?: string
}) {
  const isHighlight = variant === 'highlight'
  const isMuted     = variant === 'muted'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isHighlight ? '14px 24px' : '10px 24px',
      borderBottom: `1px solid ${KC.grayBorder}`,
      backgroundColor: isHighlight ? KC.beigeLight : KC.white,
      gap: 16,
    }}>
      <span style={{
        fontSize: isHighlight ? 15 : 14,
        color: isMuted ? KC.graySoft : KC.textMid,
        fontWeight: isHighlight ? 600 : 400,
        flex: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: isHighlight ? 18 : 14,
        fontWeight: isHighlight ? 700 : 600,
        color: isHighlight ? (accentColor ?? KC.success) : KC.textDark,
        textAlign: 'right' as const,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Two-column metric block ──────────────────────────────────────────────────
function MetricColumns({ left, right }: {
  left: Array<{ label: string; value: string; variant?: RowVariant; accentColor?: string }>
  right: Array<{ label: string; value: string; variant?: RowVariant; accentColor?: string }>
}) {
  const maxRows = Math.max(left.length, right.length)
  return (
    <div className="metric-grid">
      {/* Left col */}
      <div className="metric-col-left">
        {left.map((r, i) => <MetricRow key={i} {...r} />)}
        {Array.from({ length: maxRows - left.length }).map((_, i) => (
          <div key={i} style={{ padding: '10px 24px', borderBottom: `1px solid ${KC.grayBorder}`, backgroundColor: KC.white, minHeight: 44 }} />
        ))}
      </div>
      {/* Right col */}
      <div>
        {right.map((r, i) => <MetricRow key={i} {...r} />)}
      </div>
    </div>
  )
}

// ─── Fiscal block ─────────────────────────────────────────────────────────────

const IVA_VIVIENDA = 0.05
const INR_RATE     = 0.075 // 50% de renta × 15% INR = 7.5% del alquiler bruto

function calcFiscal(ingresoBruto: number, gananciaNeta: number, inversionTotal: number) {
  const iva = ingresoBruto * IVA_VIVIENDA
  const inr = ingresoBruto * INR_RATE

  const resNetaMes  = gananciaNeta - iva
  const resNetaAno  = resNetaMes * 12
  const resRent     = inversionTotal > 0 ? (resNetaAno / inversionTotal) * 100 : 0

  const nrNetaMes   = gananciaNeta - iva - inr
  const nrNetaAno   = nrNetaMes * 12
  const nrRent      = inversionTotal > 0 ? (nrNetaAno / inversionTotal) * 100 : 0

  return { iva, inr, residente: { netaMes: resNetaMes, netaAno: resNetaAno, rent: resRent }, noResidente: { netaMes: nrNetaMes, netaAno: nrNetaAno, rent: nrRent } }
}

function FiscalBlock({ ingresoBruto, gananciaNeta, inversionTotal }: {
  ingresoBruto: number
  gananciaNeta: number
  inversionTotal: number
}) {
  const f = calcFiscal(ingresoBruto, gananciaNeta, inversionTotal)

  const subHeader = (label: string, borderRight = false) => (
    <div style={{
      padding: '9px 24px',
      borderRight: borderRight ? `1px solid ${KC.grayBorder}` : undefined,
      background: KC.beigeLight,
      borderBottom: `1px solid ${KC.grayBorder}`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: KC.doradoText, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
        {label}
      </span>
    </div>
  )

  return (
    <div style={{
      backgroundColor: KC.white,
      borderRadius: 14,
      border: `1px solid ${KC.grayBorder}`,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
      marginTop: -12,   // visually attached to the scenario card above
    }}>
      <SectionHeader title="Impacto Fiscal — Vivienda" bg={KC.beigeLight} textColor={KC.doradoText} />

      {/* Sub-column headers */}
      <div className="metric-grid">
        {subHeader('Residente en Paraguay', true)}
        {subHeader('No Residente')}
      </div>

      <MetricColumns
        left={[
          { label: 'IVA mensual (5%)',    value: fmt(f.iva) },
          { label: 'Ingreso neto / mes',  value: fmt(f.residente.netaMes) },
          { label: 'Ingreso neto anual',  value: fmt(f.residente.netaAno),  variant: 'highlight', accentColor: KC.success },
          { label: 'Rentabilidad final',  value: pct(f.residente.rent),     variant: 'highlight', accentColor: KC.navy },
        ]}
        right={[
          { label: 'IVA mensual (5%)',    value: fmt(f.iva) },
          { label: 'INR mensual (7.5%)',  value: fmt(f.inr) },
          { label: 'Ingreso neto / mes',  value: fmt(f.noResidente.netaMes) },
          { label: 'Ingreso neto anual',  value: fmt(f.noResidente.netaAno), variant: 'highlight', accentColor: KC.success },
          { label: 'Rentabilidad final',  value: pct(f.noResidente.rent),    variant: 'highlight', accentColor: KC.navy },
        ]}
      />

      <div style={{ padding: '10px 24px', borderTop: `1px solid ${KC.grayBorder}`, background: KC.beigeLight }}>
        <p style={{ fontSize: 11, color: KC.graySoft, margin: 0 }}>
          Cálculos estimativos según normativa vigente en Paraguay · IVA 5% vivienda · INR 7.5% sobre alquiler bruto (presunción legal 50% × 15%) · Pueden variar según la situación particular del contribuyente.
        </p>
      </div>
    </div>
  )
}

// ─── Fiscal block — venta (plusvalía) ────────────────────────────────────────

const TASA_FISCAL_RES = 0.024  // estimación promedio residente
const TASA_FISCAL_NR  = 0.06   // INR 4.5% + IVA 1.5% no residente

function FiscalVentaBlock({ precioVenta, inversionTotal }: {
  precioVenta: number
  inversionTotal: number
}) {
  // Residente
  const impRes      = precioVenta * TASA_FISCAL_RES
  const netoRes     = precioVenta - impRes
  const plusRes     = netoRes - inversionTotal
  const roiRes      = inversionTotal > 0 ? (plusRes / inversionTotal) * 100 : 0

  // No residente
  const impNr       = precioVenta * TASA_FISCAL_NR
  const netoNr      = precioVenta - impNr
  const plusNr      = netoNr - inversionTotal
  const roiNr       = inversionTotal > 0 ? (plusNr / inversionTotal) * 100 : 0

  const subHeader = (label: string, borderRight = false) => (
    <div style={{
      padding: '9px 24px',
      borderRight: borderRight ? `1px solid ${KC.grayBorder}` : undefined,
      background: KC.beigeLight,
      borderBottom: `1px solid ${KC.grayBorder}`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: KC.doradoText, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
        {label}
      </span>
    </div>
  )

  return (
    <div style={{
      backgroundColor: KC.white,
      borderRadius: 14,
      border: `1px solid ${KC.grayBorder}`,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
      marginTop: -12,
    }}>
      <SectionHeader title="Impacto Fiscal — Venta" bg={KC.beigeLight} textColor={KC.doradoText} />

      <div className="metric-grid">
        {subHeader('Residente en Paraguay', true)}
        {subHeader('No Residente')}
      </div>

      <MetricColumns
        left={[
          { label: 'Impuestos estimados (2.4%)', value: fmt(impRes) },
          { label: 'Precio neto de venta',        value: fmt(netoRes) },
          { label: 'Plusvalía neta',               value: fmt(plusRes), variant: 'highlight', accentColor: KC.success },
          { label: 'ROI final',                    value: pct(roiRes),  variant: 'highlight', accentColor: KC.navy },
        ]}
        right={[
          { label: 'Impuestos estimados (6%)',   value: fmt(impNr), },
          { label: 'Precio neto de venta',        value: fmt(netoNr) },
          { label: 'Plusvalía neta',               value: fmt(plusNr), variant: 'highlight', accentColor: KC.success },
          { label: 'ROI final',                    value: pct(roiNr),  variant: 'highlight', accentColor: KC.navy },
        ]}
      />

      <div style={{ padding: '10px 24px', borderTop: `1px solid ${KC.grayBorder}`, background: KC.beigeLight }}>
        <p style={{ fontSize: 11, color: KC.graySoft, margin: 0 }}>
          Cálculos estimativos según normativa vigente en Paraguay · Residente: estimación promedio 2.4% sobre precio de venta · No residente: INR 4.5% + IVA 1.5% (presunción 30% renta × 15% + 30% VA × 5%) · Los impuestos pueden variar según la estructura jurídica del vendedor.
        </p>
      </div>
    </div>
  )
}

// ─── Scenario card ────────────────────────────────────────────────────────────
function ScenarioCard({ title, headerBg, headerTextColor = '#fff', left, right }: {
  title: string
  headerBg: string
  headerTextColor?: string
  left: Array<{ label: string; value: string; variant?: RowVariant; accentColor?: string }>
  right: Array<{ label: string; value: string; variant?: RowVariant; accentColor?: string }>
}) {
  return (
    <div style={{
      backgroundColor: KC.white,
      borderRadius: 14,
      border: `1px solid ${KC.grayBorder}`,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
    }}>
      <SectionHeader title={title} bg={headerBg} textColor={headerTextColor} />
      <MetricColumns left={left} right={right} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ReporteHtmlPage() {
  const { id } = useParams<{ id: string }>()
  const { data: sim, isLoading, error } = useSimulation(id ?? '')
  const { data: consultora } = useConsultoraConfig()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: KC.beige }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: KC.navy }} />
      </div>
    )
  }

  if (error || !sim) {
    return (
      <div className="flex items-center justify-center h-screen text-sm" style={{ backgroundColor: KC.beige, color: KC.gray }}>
        No se encontró el informe.
      </div>
    )
  }

  const snap     = sim.snapshot_project  as Record<string, unknown>
  const snapTyp  = sim.snapshot_typology as Record<string, unknown>
  const projectName  = (snap?.name            as string) ?? '—'
  const typologyName = (snapTyp?.name         as string) ?? '—'
  const location     = (snap?.location        as string) ?? ''
  const developer    = (snap?.developer_name  as string) ?? ''
  const mapsUrl      = (snap?.maps_url        as string) ?? ''
  const date = new Date(sim.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })

  const airbnb    = sim.scenario_airbnb   as unknown as ScenarioData<AirbnbInputs,   AirbnbResult>   | null
  const alquiler  = sim.scenario_alquiler as unknown as ScenarioData<AlquilerInputs, AlquilerResult> | null
  const plusvalia = sim.scenario_plusvalia as unknown as ScenarioData<PlusvaliaInputs, PlusvaliaResult> | null

  return (
    <>
      {/* CSS variables + print styles */}
      <style>{`
        :root {
          --kc-navy:     ${KC.navy};
          --kc-beige:    ${KC.beige};
          --kc-gray:     ${KC.gray};
          --kc-gray-soft:${KC.graySoft};
          --kc-success:  ${KC.success};
        }
        body { margin: 0; }

        /* ── Metric grid — desktop: 2 cols, mobile: 1 col ── */
        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .metric-col-left {
          border-right: 1px solid ${KC.grayBorder};
        }

        @media (max-width: 600px) {
          .metric-grid {
            grid-template-columns: 1fr;
          }
          .metric-col-left {
            border-right: none;
            border-bottom: 2px solid ${KC.grayBorder};
          }
          /* Header apilado en mobile */
          .rpt-hdr {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .rpt-hdr > div:last-child {
            text-align: left !important;
          }
        }

        @media screen {
          .print-footer { display: none !important; }
        }

        @media print {
          @page { margin: 10mm 12mm 18mm; size: A4 portrait; }
          .no-print   { display: none !important; }
          .scr-footer { display: none !important; }
          body        { background: ${KC.beige} !important; }

          /* Compactar header */
          .rpt-hdr          { padding: 16px 24px 12px !important; margin-bottom: 14px !important; }
          .rpt-hdr h1       { font-size: 22px !important; margin: 0 0 3px !important; }
          .rpt-hdr .sub     { font-size: 13px !important; margin: 0 0 6px !important; }
          .rpt-hdr .loc     { font-size: 12px !important; margin: 0 0 4px !important; }
          .rpt-hdr .dt      { margin-top: 10px !important; padding-top: 10px !important; }

          /* Salto de página antes de escenario 2 y 3 */
          .print-break      { break-before: page; }

          /* Footer fijo en cada hoja */
          .print-footer {
            display: flex !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: ${KC.navy};
            padding: 10px 20px 8px;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            z-index: 1000;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: KC.beige, padding: 'clamp(16px, 4vw, 32px) clamp(8px, 3vw, 16px)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

        {/* Print button */}
        <div className="no-print" style={{ maxWidth: 760, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: KC.gray, border: `1px solid ${KC.grayBorder}`,
              borderRadius: 8, padding: '7px 14px', backgroundColor: KC.white,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Printer size={14} />
            Imprimir / Guardar PDF
          </button>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* ── Header del proyecto ── */}
          <div className="rpt-hdr" style={{
            backgroundColor: KC.navy,
            borderRadius: 14,
            padding: '22px 28px',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(20,34,58,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}>
            {/* Izquierda: nombre + tipología */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, color: KC.dorado, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 600 }}>
                Informe de inversión
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: KC.white, margin: '0 0 4px', lineHeight: 1.15 }}>
                {projectName}
              </h1>
              <p className="sub" style={{ fontSize: 15, color: KC.dorado, margin: 0, fontWeight: 500 }}>
                {typologyName}
              </p>
            </div>

            {/* Derecha: ubicación, fecha, maps */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {(location || developer) && (
                <p className="loc" style={{ fontSize: 13, color: '#8FA3BF', margin: '0 0 6px' }}>
                  {[location, developer].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="dt" style={{ fontSize: 12, color: '#6B84A3', margin: '0 0 6px' }}>
                {date}
              </p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: KC.dorado, textDecoration: 'none' }}
                >
                  <MapPin size={12} />
                  Abrir en Google Maps
                </a>
              )}
            </div>
          </div>

          {/* ── Airbnb ── */}
          {airbnb && (
            <>
              <ScenarioCard
                title="Escenario 1 — Alquiler Temporal (Airbnb)"
                headerBg={KC.navySoft}
                left={[
                  { label: 'Precio de compra',    value: fmt(airbnb.inputs.precio_compra_propiedad_usd) },
                  { label: 'Amoblamiento STR',    value: fmt(airbnb.inputs.amoblamiento_preparacion_str_usd) },
                  { label: 'Noches ocupadas/mes', value: `${airbnb.inputs.noches_ocupadas_mes} noches` },
                  { label: 'Tarifa diaria',        value: fmt(airbnb.inputs.tarifa_diaria_promedio_usd) },
                  { label: 'Administración',       value: pct(airbnb.inputs.tarifa_administracion_percent), variant: 'muted' },
                  { label: 'Expensas/mes',         value: fmt(airbnb.inputs.expensas_usd_mes),        variant: 'muted' },
                  { label: 'Electricidad/mes',     value: fmt(airbnb.inputs.electricidad_usd_mes),    variant: 'muted' },
                  { label: 'Internet/mes',         value: fmt(airbnb.inputs.internet_usd_mes),        variant: 'muted' },
                  { label: 'Cable / TV / mes',     value: fmt(airbnb.inputs.cable_tv_usd_mes),        variant: 'muted' },
                ]}
                right={[
                  { label: 'Inversión total',     value: fmt(airbnb.result.inversion_total) },
                  { label: 'Ingresos brutos/mes', value: fmt(airbnb.result.ingresos_brutos_mensuales) },
                  { label: 'Ganancia neta/mes',   value: fmt(airbnb.result.ganancia_neta_mensual),   variant: 'highlight', accentColor: KC.success },
                  { label: 'Ganancia neta anual', value: fmt(airbnb.result.ganancia_neta_anual),     variant: 'highlight', accentColor: KC.success },
                  { label: 'Rentabilidad anual',  value: pct(airbnb.result.rentabilidad_percent),    variant: 'highlight', accentColor: KC.navy },
                  { label: 'Recupero inversión',  value: isFinite(airbnb.result.anos_recuperacion) ? `${airbnb.result.anos_recuperacion.toFixed(1)} años` : '—' },
                ]}
              />
              <FiscalBlock
                ingresoBruto={airbnb.result.ingresos_brutos_mensuales}
                gananciaNeta={airbnb.result.ganancia_neta_mensual}
                inversionTotal={airbnb.result.inversion_total}
              />
            </>
          )}

          {/* ── Alquiler tradicional ── */}
          {alquiler && (
            <div className="print-break">
              <ScenarioCard
                title="Escenario 2 — Alquiler Tradicional"
                headerBg={KC.gray}
                left={[
                  { label: 'Precio de compra',  value: fmt(alquiler.inputs.precio_compra_propiedad_usd) },
                  { label: 'Alquiler mensual',  value: fmt(alquiler.inputs.alquiler_mensual_usd) },
                  { label: 'Administración',    value: pct(alquiler.inputs.tarifa_administracion_percent), variant: 'muted' },
                  { label: 'Expensas/mes',      value: fmt(alquiler.inputs.expensas_usd_mes), variant: 'muted' },
                ]}
                right={[
                  { label: 'Inversión total',     value: fmt(alquiler.result.inversion_total) },
                  { label: 'Ganancia neta/mes',   value: fmt(alquiler.result.ganancia_neta_mensual),   variant: 'highlight', accentColor: KC.success },
                  { label: 'Ganancia neta anual', value: fmt(alquiler.result.ganancia_neta_anual),     variant: 'highlight', accentColor: KC.success },
                  { label: 'Rentabilidad anual',  value: pct(alquiler.result.rentabilidad_percent),    variant: 'highlight', accentColor: KC.navy },
                  { label: 'Recupero inversión',  value: isFinite(alquiler.result.anos_recuperacion) ? `${alquiler.result.anos_recuperacion.toFixed(1)} años` : '—' },
                ]}
              />
              <FiscalBlock
                ingresoBruto={alquiler.inputs.alquiler_mensual_usd}
                gananciaNeta={alquiler.result.ganancia_neta_mensual}
                inversionTotal={alquiler.result.inversion_total}
              />
            </div>
          )}

          {/* ── Plusvalía ── */}
          {plusvalia && (
            <div className="print-break">
              <ScenarioCard
                title="Escenario 3 — Plusvalía en Obra"
                headerBg={KC.dorado}
                headerTextColor={KC.doradoText}
                left={[
                  { label: 'Precio de compra',         value: fmt(plusvalia.inputs.precio_compra_propiedad_usd) },
                  { label: 'Precio estimado de venta', value: fmt(plusvalia.inputs.precio_estimado_venta_usd) },
                  { label: 'Años de tenencia',         value: `${plusvalia.inputs.anios_tenencia} años` },
                ]}
                right={[
                  { label: 'Inversión total', value: fmt(plusvalia.result.inversion_total) },
                  { label: 'Plusvalía',       value: fmt(plusvalia.result.plusvalia),              variant: 'highlight', accentColor: KC.success },
                  { label: 'ROI total',       value: pct(plusvalia.result.roi_total_percent),      variant: 'highlight', accentColor: KC.navy },
                  { label: 'ROI anualizado',  value: pct(plusvalia.result.roi_anualizado_percent), variant: 'highlight', accentColor: KC.navy },
                ]}
              />
              <FiscalVentaBlock
                precioVenta={plusvalia.inputs.precio_estimado_venta_usd}
                inversionTotal={plusvalia.result.inversion_total}
              />
            </div>
          )}

          {/* ── Footer pantalla ── */}
          <div className="scr-footer" style={{
            backgroundColor: KC.navy,
            borderRadius: 14,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 2px 12px rgba(20,34,58,0.18)',
          }}>
            {consultora?.logo_url ? (
              <img src={consultora.logo_url} alt={consultora.nombre} style={{ height: 36, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 700, color: KC.white, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
                {consultora?.nombre ?? 'Consultora Inmobiliaria'}
              </span>
            )}
            {consultora?.sitio_web && (
              <a href={consultora.sitio_web} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: KC.dorado, textDecoration: 'none' }}>
                {consultora.sitio_web.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          <p className="scr-footer" style={{ textAlign: 'center', fontSize: 11, color: KC.graySoft, marginTop: 16 }}>
            Informe generado el {date} · Este documento es de carácter informativo y no constituye asesoramiento financiero.
          </p>

          {/* ── Footer impresión (fijo, aparece en cada hoja) ── */}
          <div className="print-footer">
            {consultora?.logo_url ? (
              <img src={consultora.logo_url} alt={consultora.nombre} style={{ height: 28, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 15, fontWeight: 700, color: KC.white, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
                {consultora?.nombre ?? 'Consultora Inmobiliaria'}
              </span>
            )}
            {consultora?.sitio_web && (
              <span style={{ fontSize: 11, color: KC.dorado }}>
                {consultora.sitio_web.replace(/^https?:\/\//, '')}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
