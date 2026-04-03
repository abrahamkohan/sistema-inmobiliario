// src/pages/ReporteHtmlPage.tsx
import { useParams } from 'react-router'
import { Loader2, Printer, MapPin } from 'lucide-react'
import { useSimulation } from '@/hooks/useSimulations'
import { useConsultoraConfig } from '@/hooks/useConsultora'
import type { AirbnbInputs, AirbnbResult, AlquilerInputs, AlquilerResult, PlusvaliaInputs, PlusvaliaResult } from '@/simulator/engine'

type ScenarioData<I, R> = { inputs: I; result: R }

// ─── Design tokens ────────────────────────────────────────────────────────────
const KC = {
  navy:       '#14223A',
  navySoft:   '#1E3254',
  navyLight:  '#243B62',
  beige:      'rgb(100, 100, 100)',
  beigeLight: '#F7F0E8',
  bg:         '#F4F6F9',
  gray:       '#656E7E',
  graySoft:   '#828B9C',
  grayBorder: '#E4E7EB',
  grayLine:   '#F0F2F5',
  success:    '#049C3C',
  dorado:     '#C9B99A',
  doradoText: '#5C4A2A',
  white:      '#FFFFFF',
  textDark:   '#1A1F2B',
  textMid:    '#4B5563',
  textMuted:  '#8D95A3',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `USD ${n.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function pct(n: number) { return `${n.toFixed(2)}%` }
function pct1(n: number) { return `${n.toFixed(1)}%` }

// ─── Hero metric ──────────────────────────────────────────────────────────────
function HeroMetric({ label, value, accent = false, accentColor, borderRight = true }: {
  label: string
  value: string
  accent?: boolean
  accentColor?: string
  borderRight?: boolean
}) {
  return (
    <div style={{
      flex: 1,
      padding: '18px 20px',
      borderRight: borderRight ? `1px solid ${KC.grayLine}` : undefined,
      minWidth: 0,
    }}>
      <p style={{
        fontSize: 10,
        color: KC.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontWeight: 600,
        margin: '0 0 6px',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: accent ? 26 : 22,
        fontWeight: 700,
        color: accent ? (accentColor ?? KC.success) : KC.textDark,
        margin: 0,
        lineHeight: 1.15,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
    </div>
  )
}

// ─── Data item (no table borders) ─────────────────────────────────────────────
function DataItem({ label, value, muted = false }: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 12,
      padding: '5px 0',
    }}>
      <span style={{ fontSize: 13, color: muted ? KC.textMuted : KC.textMid, flex: 1 }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: muted ? KC.textMuted : KC.textDark,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Data group (section with label) ─────────────────────────────────────────
function DataGroup({ title, items, mt = 0 }: {
  title: string
  items: Array<{ label: string; value: string; muted?: boolean }>
  mt?: number
}) {
  return (
    <div style={{ marginTop: mt }}>
      <p style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        fontWeight: 700,
        color: KC.textMuted,
        margin: '0 0 8px',
        paddingBottom: 4,
        borderBottom: `1px solid ${KC.grayLine}`,
      }}>
        {title}
      </p>
      {items.map((item, i) => <DataItem key={i} {...item} />)}
    </div>
  )
}

// ─── Scenario card ────────────────────────────────────────────────────────────
function ScenarioCard({ title, accentBg, accentText, heroMetrics, leftGroups, rightGroups }: {
  title: string
  accentBg: string
  accentText?: string
  heroMetrics: Array<{ label: string; value: string; accent?: boolean; accentColor?: string }>
  leftGroups: Array<{ title: string; items: Array<{ label: string; value: string; muted?: boolean }> }>
  rightGroups: Array<{ title: string; items: Array<{ label: string; value: string; muted?: boolean }> }>
}) {
  return (
    <div style={{
      backgroundColor: KC.white,
      borderRadius: 14,
      border: `1px solid ${KC.grayBorder}`,
      overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: accentBg,
        padding: '13px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <p style={{
          fontSize: 12,
          fontWeight: 700,
          color: accentText ?? KC.white,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: 0,
        }}>
          {title}
        </p>
      </div>

      {/* Hero metrics row */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${KC.grayLine}`,
        background: KC.white,
      }} className="hero-row">
        {heroMetrics.map((m, i) => (
          <HeroMetric
            key={i}
            {...m}
            borderRight={i < heroMetrics.length - 1}
          />
        ))}
      </div>

      {/* Data groups — 2 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0 32px',
        padding: '20px 24px 24px',
      }} className="data-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {leftGroups.map((g, i) => <DataGroup key={i} title={g.title} items={g.items} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {rightGroups.map((g, i) => <DataGroup key={i} title={g.title} items={g.items} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Fiscal block ─────────────────────────────────────────────────────────────
const IVA_VIVIENDA = 0.10
const INR_RATE     = 0.075

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

function FiscalColumn({ title, items, borderRight = false }: {
  title: string
  items: Array<{ label: string; value: string; highlight?: boolean }>
  borderRight?: boolean
}) {
  return (
    <div style={{
      flex: 1,
      borderRight: borderRight ? `1px solid ${KC.grayLine}` : undefined,
      padding: '16px 20px',
    }}>
      <p style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        fontWeight: 700,
        color: KC.doradoText,
        margin: '0 0 12px',
      }}>
        {title}
      </p>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: item.highlight ? '8px 12px' : '5px 0',
          margin: item.highlight ? '6px -12px' : undefined,
          borderRadius: item.highlight ? 8 : undefined,
          backgroundColor: item.highlight ? KC.beigeLight : undefined,
          gap: 12,
        }}>
          <span style={{
            fontSize: item.highlight ? 14 : 13,
            color: item.highlight ? KC.textDark : KC.textMid,
            fontWeight: item.highlight ? 600 : 400,
            flex: 1,
          }}>
            {item.label}
          </span>
          <span style={{
            fontSize: item.highlight ? 16 : 13,
            fontWeight: 700,
            color: item.highlight ? KC.success : KC.textDark,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function FiscalBlock({ ingresoBruto, gananciaNeta, inversionTotal }: {
  ingresoBruto: number
  gananciaNeta: number
  inversionTotal: number
}) {
  const f = calcFiscal(ingresoBruto, gananciaNeta, inversionTotal)

  return (
    <div style={{
      backgroundColor: KC.white,
      borderRadius: 14,
      border: `1px solid ${KC.grayBorder}`,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: KC.beigeLight,
        padding: '11px 24px',
        borderBottom: `1px solid ${KC.grayBorder}`,
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: KC.doradoText,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          margin: 0,
        }}>
          Impacto Fiscal — Vivienda
        </p>
      </div>

      {/* Two columns */}
      <div style={{ display: 'flex' }} className="fiscal-grid">
        <FiscalColumn
          title="Residente en Paraguay"
          borderRight
          items={[
            { label: 'IVA mensual (10%)',  value: fmt(f.iva) },
            { label: 'Ingreso neto / mes', value: fmt(f.residente.netaMes) },
            { label: 'Ingreso neto anual', value: fmt(f.residente.netaAno), highlight: true },
            { label: 'Rentabilidad final', value: pct1(f.residente.rent), highlight: true },
          ]}
        />
        <FiscalColumn
          title="No Residente"
          items={[
            { label: 'IVA mensual (10%)',  value: fmt(f.iva) },
            { label: 'INR mensual (7.5%)', value: fmt(f.inr) },
            { label: 'Ingreso neto / mes', value: fmt(f.noResidente.netaMes) },
            { label: 'Ingreso neto anual', value: fmt(f.noResidente.netaAno), highlight: true },
            { label: 'Rentabilidad final', value: pct1(f.noResidente.rent), highlight: true },
          ]}
        />
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '9px 20px',
        borderTop: `1px solid ${KC.grayLine}`,
        backgroundColor: KC.beigeLight,
      }}>
        <p style={{ fontSize: 10, color: KC.textMuted, margin: 0, lineHeight: 1.5 }}>
          Cálculos estimativos según normativa vigente en Paraguay · IVA 10% vivienda · INR 7.5% sobre alquiler bruto (presunción legal 50% × 15%) · Pueden variar según la situación particular del contribuyente.
        </p>
      </div>
    </div>
  )
}

// ─── Fiscal block — venta (plusvalía) ────────────────────────────────────────
const TASA_FISCAL_RES = 0.024
const TASA_FISCAL_NR  = 0.06

function FiscalVentaBlock({ precioVenta, inversionTotal, comisionPct, escribaniaUsd }: {
  precioVenta: number
  inversionTotal: number
  comisionPct: number
  escribaniaUsd: number
}) {
  const comision   = precioVenta * (comisionPct / 100)
  const precioNeto = precioVenta - comision - escribaniaUsd   // igual para ambos perfiles

  const impRes  = precioVenta * TASA_FISCAL_RES
  const plusRes = precioNeto - impRes - inversionTotal
  const roiRes  = inversionTotal > 0 ? (plusRes / inversionTotal) * 100 : 0

  const impNr   = precioVenta * TASA_FISCAL_NR
  const plusNr  = precioNeto - impNr - inversionTotal
  const roiNr   = inversionTotal > 0 ? (plusNr / inversionTotal) * 100 : 0

  return (
    <div style={{
      backgroundColor: KC.white,
      borderRadius: 14,
      border: `1px solid ${KC.grayBorder}`,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
    }}>
      <div style={{
        backgroundColor: KC.beigeLight,
        padding: '11px 24px',
        borderBottom: `1px solid ${KC.grayBorder}`,
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: KC.doradoText,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          margin: 0,
        }}>
          Impacto Fiscal — Venta
        </p>
      </div>

      <div style={{ display: 'flex' }} className="fiscal-grid">
        <FiscalColumn
          title="Residente en Paraguay"
          borderRight
          items={[
            { label: 'Precio de venta',                value: fmt(precioVenta) },
            { label: `Comisión inmobiliaria (${comisionPct}%)`, value: fmt(comision) },
            { label: 'Impuestos estimados (2.4%)',   value: fmt(impRes) },
            { label: 'Gasto Escribanía',             value: fmt(escribaniaUsd) },
            { label: 'Plusvalía neta',                value: fmt(plusRes), highlight: true },
            { label: 'ROI final',                     value: pct1(roiRes), highlight: true },
          ]}
        />
        <FiscalColumn
          title="No Residente"
          items={[
            { label: 'Precio de venta',                value: fmt(precioVenta) },
            { label: `Comisión inmobiliaria (${comisionPct}%)`, value: fmt(comision) },
            { label: 'Impuestos estimados (6%)',     value: fmt(impNr) },
            { label: 'Gasto Escribanía',             value: fmt(escribaniaUsd) },
            { label: 'Plusvalía neta',                value: fmt(plusNr), highlight: true },
            { label: 'ROI final',                     value: pct1(roiNr),  highlight: true },
          ]}
        />
      </div>

      <div style={{
        padding: '9px 20px',
        borderTop: `1px solid ${KC.grayLine}`,
        backgroundColor: KC.beigeLight,
      }}>
        <p style={{ fontSize: 10, color: KC.textMuted, margin: 0, lineHeight: 1.5 }}>
          Cálculos estimativos según normativa vigente en Paraguay · Residente: estimación promedio 2.4% sobre precio de venta · No residente: INR 4.5% + IVA 1.5% (presunción 30% renta × 15% + 30% VA × 5%) · Escribanía: USD 300 fijo · Los impuestos pueden variar según la estructura jurídica del vendedor.
        </p>
      </div>
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
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: KC.bg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: KC.navy }} />
      </div>
    )
  }

  if (error || !sim) {
    return (
      <div className="flex items-center justify-center h-screen text-sm" style={{ backgroundColor: KC.bg, color: KC.gray }}>
        No se encontró el informe.
      </div>
    )
  }

  const snap         = sim.snapshot_project  as Record<string, unknown>
  const snapTyp      = sim.snapshot_typology as Record<string, unknown>
  const projectName  = (snap?.name           as string) ?? '—'
  const typologyName = (snapTyp?.name        as string) ?? '—'
  const location     = (snap?.location       as string) ?? ''
  const developer    = (snap?.developer_name as string) ?? ''
  const mapsUrl      = (snap?.maps_url       as string) ?? ''
  const date         = new Date(sim.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })

  const airbnb    = sim.scenario_airbnb    as unknown as ScenarioData<AirbnbInputs,    AirbnbResult>    | null
  const alquiler  = sim.scenario_alquiler  as unknown as ScenarioData<AlquilerInputs,  AlquilerResult>  | null
  const plusvalia = sim.scenario_plusvalia as unknown as ScenarioData<PlusvaliaInputs, PlusvaliaResult> | null

  return (
    <>
      <style>{`
        body { margin: 0; }

        .hero-row > div:last-child { border-right: none !important; }

        @media (max-width: 600px) {
          .hero-row   { flex-wrap: wrap !important; }
          .hero-row > div { min-width: 50% !important; border-bottom: 1px solid #F0F2F5; }
          .data-grid  { grid-template-columns: 1fr !important; }
          .fiscal-grid { flex-direction: column !important; }
          .rpt-hdr    { flex-direction: column !important; gap: 12px !important; }
          .rpt-hdr > div:last-child { text-align: left !important; }
        }

        @media screen {
          .print-footer { display: none !important; }
        }

        @media print {
          @page { margin: 10mm 12mm 18mm; size: A4 portrait; }
          .no-print    { display: none !important; }
          .scr-footer  { display: none !important; }
          body         { background: ${KC.bg} !important; }
          .rpt-hdr     { padding: 16px 24px 12px !important; margin-bottom: 14px !important; }
          .print-break { break-before: page; }
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

      <div style={{ minHeight: '100vh', backgroundColor: KC.bg, padding: 'clamp(16px, 4vw, 32px) clamp(8px, 3vw, 16px)', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

        {/* Print button */}
        <div className="no-print" style={{ maxWidth: 760, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: KC.gray, border: `1px solid ${KC.grayBorder}`,
              borderRadius: 8, padding: '7px 14px', backgroundColor: KC.white,
              cursor: 'pointer',
            }}
          >
            <Printer size={14} />
            Imprimir / Guardar PDF
          </button>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* ── Encabezado del proyecto ── */}
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
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, color: KC.dorado, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 600 }}>
                Informe de inversión
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: KC.white, margin: '0 0 4px', lineHeight: 1.15 }}>
                {projectName}
              </h1>
              <p style={{ fontSize: 15, color: KC.dorado, margin: 0, fontWeight: 500 }}>
                {typologyName}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {(location || developer) && (
                <p style={{ fontSize: 13, color: '#8FA3BF', margin: '0 0 6px' }}>
                  {[location, developer].filter(Boolean).join(' · ')}
                </p>
              )}
              <p style={{ fontSize: 12, color: '#6B84A3', margin: '0 0 6px' }}>{date}</p>
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

          {/* ── Escenario 1: Airbnb ── */}
          {airbnb && (
            <>
              <ScenarioCard
                title="Escenario 1 — Alquiler Temporal (Airbnb)"
                accentBg={KC.navySoft}
                heroMetrics={[
                  { label: 'Ganancia neta / mes',  value: fmt(airbnb.result.ganancia_neta_mensual),  accent: true,  accentColor: KC.success },
                  { label: 'Ganancia neta / año',  value: fmt(airbnb.result.ganancia_neta_anual),    accent: true,  accentColor: KC.success },
                  { label: 'Rentabilidad anual',   value: pct1(airbnb.result.rentabilidad_percent),  accent: false },
                  { label: 'Recupero inversión',   value: isFinite(airbnb.result.anos_recuperacion) ? `${airbnb.result.anos_recuperacion.toFixed(1)} años` : '—', accent: false },
                ]}
                leftGroups={[
                  {
                    title: 'Datos base',
                    items: [
                      { label: 'Precio de compra',   value: fmt(airbnb.inputs.precio_compra_propiedad_usd) },
                      { label: 'Amoblamiento STR',   value: fmt(airbnb.inputs.amoblamiento_preparacion_str_usd) },
                      { label: 'Inversión total',    value: fmt(airbnb.result.inversion_total) },
                    ],
                  },
                  {
                    title: 'Rendimiento',
                    items: [
                      { label: 'Noches ocupadas / mes', value: `${airbnb.inputs.noches_ocupadas_mes} noches` },
                      { label: 'Tarifa diaria',          value: fmt(airbnb.inputs.tarifa_diaria_promedio_usd) },
                      { label: 'Ingresos brutos / mes',  value: fmt(airbnb.result.ingresos_brutos_mensuales) },
                    ],
                  },
                ]}
                rightGroups={[
                  {
                    title: 'Operativa',
                    items: [
                      { label: 'Administración',   value: pct(airbnb.inputs.tarifa_administracion_percent), muted: true },
                    ],
                  },
                  {
                    title: 'Gastos mensuales',
                    items: [
                      { label: 'Expensas',      value: fmt(airbnb.inputs.expensas_usd_mes),     muted: true },
                      { label: 'Electricidad',  value: fmt(airbnb.inputs.electricidad_usd_mes), muted: true },
                      { label: 'Internet',      value: fmt(airbnb.inputs.internet_usd_mes),     muted: true },
                      { label: 'Cable / TV',    value: fmt(airbnb.inputs.cable_tv_usd_mes),     muted: true },
                    ],
                  },
                ]}
              />
              <FiscalBlock
                ingresoBruto={airbnb.result.ingresos_brutos_mensuales}
                gananciaNeta={airbnb.result.ganancia_neta_mensual}
                inversionTotal={airbnb.result.inversion_total}
              />
            </>
          )}

          {/* ── Escenario 2: Alquiler tradicional ── */}
          {alquiler && (
            <div className="print-break">
              <ScenarioCard
                title="Escenario 2 — Alquiler Tradicional"
                accentBg={KC.gray}
                heroMetrics={[
                  { label: 'Ganancia neta / mes',  value: fmt(alquiler.result.ganancia_neta_mensual),  accent: true,  accentColor: KC.success },
                  { label: 'Ganancia neta / año',  value: fmt(alquiler.result.ganancia_neta_anual),    accent: true,  accentColor: KC.success },
                  { label: 'Rentabilidad anual',   value: pct1(alquiler.result.rentabilidad_percent),  accent: false },
                  { label: 'Recupero inversión',   value: isFinite(alquiler.result.anos_recuperacion) ? `${alquiler.result.anos_recuperacion.toFixed(1)} años` : '—', accent: false },
                ]}
                leftGroups={[
                  {
                    title: 'Datos base',
                    items: [
                      { label: 'Precio de compra',  value: fmt(alquiler.inputs.precio_compra_propiedad_usd) },
                      { label: 'Alquiler mensual',  value: fmt(alquiler.inputs.alquiler_mensual_usd) },
                      { label: 'Inversión total',   value: fmt(alquiler.result.inversion_total) },
                    ],
                  },
                ]}
                rightGroups={[
                  {
                    title: 'Costos',
                    items: [
                      { label: 'Administración', value: pct(alquiler.inputs.tarifa_administracion_percent), muted: true },
                      { label: 'Expensas / mes', value: fmt(alquiler.inputs.expensas_usd_mes),              muted: true },
                    ],
                  },
                ]}
              />
              <FiscalBlock
                ingresoBruto={alquiler.inputs.alquiler_mensual_usd}
                gananciaNeta={alquiler.result.ganancia_neta_mensual}
                inversionTotal={alquiler.result.inversion_total}
              />
            </div>
          )}

          {/* ── Escenario 3: Plusvalía ── */}
          {plusvalia && (
            <div className="print-break">
              <ScenarioCard
                title="Escenario 3 — Plusvalía en Obra"
                accentBg={KC.dorado}
                accentText={KC.doradoText}
                heroMetrics={[
                  { label: 'Plusvalía total',    value: fmt(plusvalia.result.plusvalia),                    accent: true,  accentColor: KC.success },
                  { label: 'ROI anualizado',     value: pct1(plusvalia.result.roi_anualizado_percent),      accent: true,  accentColor: KC.navy },
                  { label: 'ROI total',          value: pct1(plusvalia.result.roi_total_percent),           accent: false },
                  { label: 'Inversión total',    value: fmt(plusvalia.result.inversion_total),              accent: false },
                ]}
                leftGroups={[
                  {
                    title: 'Datos base',
                    items: [
                      { label: 'Precio de compra',         value: fmt(plusvalia.inputs.precio_compra_propiedad_usd) },
                      { label: 'Precio estimado de venta', value: fmt(plusvalia.inputs.precio_estimado_venta_usd) },
                    ],
                  },
                ]}
                rightGroups={[
                  {
                    title: 'Horizonte',
                    items: [
                      { label: 'Años de tenencia', value: `${plusvalia.inputs.anios_tenencia} años` },
                    ],
                  },
                ]}
              />
              <FiscalVentaBlock
                precioVenta={plusvalia.inputs.precio_estimado_venta_usd}
                inversionTotal={plusvalia.result.inversion_total}
                comisionPct={plusvalia.inputs.comision_inmobiliaria_pct ?? 5.5}
                escribaniaUsd={plusvalia.inputs.escribania_usd ?? 300}
              />
            </div>
          )}

          {/* ── Footer pantalla ── */}
          <div className="scr-footer" style={{
            backgroundColor: KC.navy,
            borderRadius: 14,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 2px 12px rgba(20,34,58,0.18)',
          }}>
            {consultora?.logo_url ? (
              <img src={consultora.logo_url} alt={consultora.nombre} style={{ height: 36, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 700, color: KC.white, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
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

          <div className="print-footer">
            {consultora?.logo_url ? (
              <img src={consultora.logo_url} alt={consultora.nombre} style={{ height: 28, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 15, fontWeight: 700, color: KC.white, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
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
