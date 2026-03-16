// src/simulator/pdf/PresupuestoReport.tsx
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { StyleSheet } from '@react-pdf/renderer'
import { COLOR } from './styles'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresupuestoReportProps {
  consultora: {
    nombre: string
    logoUrl: string | null
    telefono: string | null
    email: string | null
  }
  clientName: string | null
  unidadNombre: string
  superficieM2: number | null
  precioUsd: number
  cocheraNombre: string | null
  cocheraPrecioUsd: number
  floorPlanUrl: string | null
  entrega: number
  cuotasCantidad: number
  cuotasValor: number
  refuerzosCantidad: number
  refuerzosValor: number
  refuerzosPeriodicidad: number
  saldoContraEntrega: number
  notas: string | null
  date: string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLOR.dark,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.primary,
  },
  headerBrand: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLOR.primary },
  headerContact: { fontSize: 8, color: COLOR.gray, textAlign: 'right' },
  titleBlock: { marginBottom: 20 },
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLOR.dark, marginBottom: 2 },
  docSubtitle: { fontSize: 10, color: COLOR.gray },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
    paddingVertical: 5,
  },
  tableLabel: { flex: 1.2, fontSize: 8, color: COLOR.gray },
  tableValue: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  highlightRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 6,
  },
  highlightLabel: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLOR.primary },
  highlightValue: { flex: 1, fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLOR.primary, textAlign: 'right' },
  floorPlan: { width: '100%', maxHeight: 180, objectFit: 'contain', borderWidth: 1, borderColor: COLOR.border, borderRadius: 3, marginTop: 6 },
  notesBox: {
    backgroundColor: COLOR.light,
    borderRadius: 3,
    padding: 8,
    marginTop: 6,
    fontSize: 8,
    color: COLOR.dark,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: COLOR.gray },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function isRasterImage(url: string) {
  return /\.(png|jpe?g)(\?.*)?$/i.test(url)
}

// ─── Components ───────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.tableRow}>
      <Text style={s.tableLabel}>{label}</Text>
      <Text style={s.tableValue}>{value}</Text>
    </View>
  )
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function PresupuestoReport(p: PresupuestoReportProps) {
  const showLogo = p.consultora.logoUrl && isRasterImage(p.consultora.logoUrl)
  const totalUnidad = p.precioUsd + p.cocheraPrecioUsd
  const comprometido = p.entrega + p.cuotasCantidad * p.cuotasValor + p.refuerzosCantidad * p.refuerzosValor + p.saldoContraEntrega
  const saldoPendiente = totalUnidad - comprometido

  return (
    <Document title={`Presupuesto — ${p.unidadNombre}`} author={p.consultora.nombre}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            {showLogo
              ? <Image src={p.consultora.logoUrl!} style={{ height: 28, maxWidth: 120, objectFit: 'contain' }} />
              : <Text style={s.headerBrand}>{p.consultora.nombre}</Text>
            }
          </View>
          <View>
            {p.consultora.telefono && <Text style={s.headerContact}>{p.consultora.telefono}</Text>}
            {p.consultora.email    && <Text style={s.headerContact}>{p.consultora.email}</Text>}
          </View>
        </View>

        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.docTitle}>PRESUPUESTO</Text>
          <Text style={s.docSubtitle}>
            {p.clientName ? `Preparado para: ${p.clientName}  ·  ` : ''}{p.date}
          </Text>
        </View>

        <View style={s.row}>
          {/* Left column — unidad + plan de pagos */}
          <View style={s.col}>

            {/* Unidad */}
            <Text style={s.sectionTitle}>Unidad</Text>
            <View>
              <DataRow label="Unidad"     value={p.unidadNombre || '—'} />
              {p.superficieM2 != null && <DataRow label="Superficie" value={`${p.superficieM2} m²`} />}
              <DataRow label="Precio"     value={fmt(p.precioUsd)} />
              {p.cocheraNombre && <DataRow label={p.cocheraNombre} value={fmt(p.cocheraPrecioUsd)} />}
              {p.cocheraPrecioUsd > 0 && !p.cocheraNombre && <DataRow label="Cochera" value={fmt(p.cocheraPrecioUsd)} />}
            </View>

            {/* Plan de pagos */}
            <Text style={s.sectionTitle}>Plan de pagos</Text>
            <View>
              {p.entrega > 0 && <DataRow label="Entrega / anticipo" value={fmt(p.entrega)} />}
              {p.cuotasCantidad > 0 && (
                <DataRow
                  label={`${p.cuotasCantidad} cuota${p.cuotasCantidad > 1 ? 's' : ''}`}
                  value={`${p.cuotasCantidad} × ${fmt(p.cuotasValor)}`}
                />
              )}
              {p.refuerzosCantidad > 0 && (
                <DataRow
                  label={`${p.refuerzosCantidad} refuerzo${p.refuerzosCantidad > 1 ? 's' : ''} c/${p.refuerzosPeriodicidad} meses`}
                  value={`${p.refuerzosCantidad} × ${fmt(p.refuerzosValor)}`}
                />
              )}
              {p.saldoContraEntrega > 0 && <DataRow label="Saldo contra entrega" value={fmt(p.saldoContraEntrega)} />}
            </View>

            {/* Resumen */}
            <Text style={s.sectionTitle}>Resumen</Text>
            <View>
              <DataRow label="Total unidad"  value={fmt(totalUnidad)} />
              <DataRow label="Comprometido"  value={fmt(comprometido)} />
            </View>
            <View style={s.highlightRow}>
              <Text style={s.highlightLabel}>Saldo pendiente</Text>
              <Text style={s.highlightValue}>{fmt(saldoPendiente)}</Text>
            </View>

            {/* Notas */}
            {p.notas && (
              <>
                <Text style={s.sectionTitle}>Notas</Text>
                <Text style={s.notesBox}>{p.notas}</Text>
              </>
            )}
          </View>

          {/* Right column — plano */}
          {p.floorPlanUrl && (
            <View style={s.col}>
              <Text style={s.sectionTitle}>Plano de planta</Text>
              <Image src={p.floorPlanUrl} style={s.floorPlan} />
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{p.consultora.nombre} — Presupuesto</Text>
          <Text style={s.footerText}>{p.date}</Text>
        </View>

      </Page>
    </Document>
  )
}
