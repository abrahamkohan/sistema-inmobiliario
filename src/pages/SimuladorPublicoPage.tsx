// src/pages/SimuladorPublicoPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicProjects, getPublicTypologies, getConsultoraPublic } from '@/lib/publicData'
import { calcAirbnb, calcAlquiler, calcPlusvalia } from '@/simulator/engine'
import { formatUsd } from '@/utils/money'
import { MARKET_DEFAULTS } from '@/simulator/store'

const APP_URL = ((import.meta.env.VITE_APP_URL as string) || window.location.origin).replace(/\/$/, '')

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

function ScenarioCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

export function SimuladorPublicoPage() {
  const { data: consultora, isLoading: loadingConfig } = useQuery({
    queryKey: ['consultora-public'],
    queryFn: getConsultoraPublic,
  })

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['public-projects'],
    queryFn: getPublicProjects,
    enabled: consultora?.simulador_publico === true,
  })

  const [projectId, setProjectId]   = useState<string>('')
  const [typologyId, setTypologyId] = useState<string>('')
  const [priceInput, setPriceInput] = useState<string>('')

  const { data: typologies = [] } = useQuery({
    queryKey: ['public-typologies', projectId],
    queryFn: () => getPublicTypologies(projectId),
    enabled: !!projectId,
  })

  const units = useMemo(() => typologies.filter(t => !t.category || t.category === 'unidad'), [typologies])

  const selectedProject  = projects.find(p => p.id === projectId)
  const selectedTypology = units.find(t => t.id === typologyId)

  // Reset typology when project changes
  useEffect(() => { setTypologyId(''); setPriceInput('') }, [projectId])
  useEffect(() => { setPriceInput('') }, [typologyId])

  // Gate — simulador desactivado
  if (loadingConfig) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Cargando...</p>
      </div>
    )
  }

  if (!consultora?.simulador_publico) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', gap: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 18, color: '#14223A', margin: 0 }}>Kohan &amp; Campos</p>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>El simulador no está disponible en este momento.</p>
      </div>
    )
  }

  const price = useMemo(() => {
    const override = parseFloat(priceInput)
    if (!isNaN(override) && override > 0) return override
    return (selectedTypology?.price_usd ?? 0) / 100  // stored as cents
  }, [priceInput, selectedTypology])

  const airbnb = useMemo(() => {
    if (!price) return null
    return calcAirbnb({
      precio_compra_propiedad_usd:       price,
      amoblamiento_preparacion_str_usd:  MARKET_DEFAULTS.airbnb_amoblamiento,
      noches_ocupadas_mes:               MARKET_DEFAULTS.airbnb_noches_mes,
      tarifa_diaria_promedio_usd:        MARKET_DEFAULTS.airbnb_tarifa_diaria,
      tarifa_administracion_percent:     MARKET_DEFAULTS.airbnb_admin_pct,
      expensas_usd_mes:                  MARKET_DEFAULTS.expensas,
      electricidad_usd_mes:              MARKET_DEFAULTS.airbnb_electricidad,
      internet_usd_mes:                  MARKET_DEFAULTS.airbnb_internet,
      cable_tv_usd_mes:                  MARKET_DEFAULTS.airbnb_cable_tv,
    })
  }, [price])

  const alquiler = useMemo(() => {
    if (!price) return null
    return calcAlquiler({
      precio_compra_propiedad_usd:      price,
      amoblamiento_preparacion_str_usd: 0,
      incluir_amoblamiento:             false,
      alquiler_mensual_usd:             MARKET_DEFAULTS.alquiler_mensual,
      tarifa_administracion_percent:    MARKET_DEFAULTS.alquiler_admin_pct,
      expensas_usd_mes:                 MARKET_DEFAULTS.expensas,
      otros_usd_mes:                    0,
    })
  }, [price])

  const plusvalia = useMemo(() => {
    if (!price) return null
    return calcPlusvalia({
      precio_compra_propiedad_usd:  price,
      precio_estimado_venta_usd:    price * 1.30,  // +30% estimado
      anios_tenencia:               MARKET_DEFAULTS.plusvalia_anios,
    })
  }, [price])

  const hasResults = !!(airbnb && alquiler && plusvalia && price > 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#14223A', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>Kohan &amp; Campos</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '2px 0 0' }}>Simulador de inversión</p>
        </div>
        <a
          href={`${APP_URL}/lead-quick`}
          style={{ background: '#D4AF37', color: '#14223A', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
        >
          Contactar
        </a>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Selector */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e4e7eb', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#14223A' }}>Seleccioná el proyecto</p>

          {loadingProjects ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando proyectos...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyecto</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 14, color: '#1a1f2b', background: '#fff', outline: 'none' }}
                >
                  <option value="">Seleccioná un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {projectId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipología</label>
                  <select
                    value={typologyId}
                    onChange={e => setTypologyId(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 14, color: '#1a1f2b', background: '#fff', outline: 'none' }}
                  >
                    <option value="">Seleccioná una tipología...</option>
                    {units.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {formatUsd((t.price_usd ?? 0) / 100)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {typologyId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Precio de compra (USD) <span style={{ fontWeight: 400, textTransform: 'none' }}>— opcional, para simular con otro valor</span>
                  </label>
                  <input
                    type="number"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    placeholder={`${formatUsd((selectedTypology?.price_usd ?? 0) / 100)} (precio del proyecto)`}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e4e7eb', fontSize: 14, color: '#1a1f2b', background: '#fff', outline: 'none' }}
                  />
                </div>
              )}
            </div>
          )}

          {selectedProject && (
            <div style={{ padding: '12px 14px', background: '#f8f7f4', borderRadius: 10, fontSize: 13, color: '#6b7280' }}>
              <span style={{ fontWeight: 600, color: '#14223A' }}>{selectedProject.name}</span>
              {selectedProject.ciudad && ` · ${selectedProject.ciudad}`}
              {selectedProject.status && ` · ${selectedProject.status.replace('_', ' ')}`}
            </div>
          )}
        </div>

        {/* Resultados */}
        {hasResults && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e4e7eb' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Escenarios de inversión — {formatUsd(price)}
              </p>
              <div style={{ flex: 1, height: 1, background: '#e4e7eb' }} />
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
              Valores estimados con parámetros de mercado conservadores. No constituyen asesoramiento financiero.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

              {/* Airbnb */}
              <ScenarioCard title="Airbnb / Short-term" color="#0369a1">
                <StatRow label="Ingreso mensual bruto"  value={formatUsd(airbnb!.ingresos_brutos_mensuales)} />
                <StatRow label="Costos mensuales"       value={formatUsd(airbnb!.costos_totales_mensuales)} />
                <StatRow label="Ganancia neta mensual"  value={formatUsd(airbnb!.ganancia_neta_mensual)} highlight />
                <StatRow label="Rentabilidad anual"     value={`${airbnb!.rentabilidad_percent.toFixed(1)}%`} highlight />
                <StatRow label="Recupero de inversión"  value={`${airbnb!.anos_recuperacion.toFixed(1)} años`} />
              </ScenarioCard>

              {/* Alquiler */}
              <ScenarioCard title="Alquiler tradicional" color="#475569">
                <StatRow label="Alquiler mensual"       value={formatUsd(alquiler!.ingresos_brutos_mensuales)} />
                <StatRow label="Costos mensuales"       value={formatUsd(alquiler!.costos_totales_mensuales)} />
                <StatRow label="Ganancia neta mensual"  value={formatUsd(alquiler!.ganancia_neta_mensual)} highlight />
                <StatRow label="Rentabilidad anual"     value={`${alquiler!.rentabilidad_percent.toFixed(1)}%`} highlight />
                <StatRow label="Recupero de inversión"  value={`${alquiler!.anos_recuperacion.toFixed(1)} años`} />
              </ScenarioCard>

              {/* Plusvalía */}
              <ScenarioCard title="Plusvalía (3 años)" color="#16a34a">
                <StatRow label="Precio de compra"       value={formatUsd(plusvalia!.inversion_total)} />
                <StatRow label="Precio estimado venta"  value={formatUsd(plusvalia!.inversion_total * 1.30)} />
                <StatRow label="Plusvalía estimada"     value={formatUsd(plusvalia!.plusvalia)} highlight />
                <StatRow label="ROI total"              value={`${plusvalia!.roi_total_percent.toFixed(1)}%`} highlight />
                <StatRow label="ROI anualizado"         value={`${plusvalia!.roi_anualizado_percent.toFixed(1)}%`} />
              </ScenarioCard>

            </div>

            {/* CTA */}
            <div style={{ background: '#14223A', borderRadius: 16, padding: '28px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>¿Te interesa invertir?</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
                Dejanos tus datos y un asesor se contacta con vos.
              </p>
              <a
                href={`${APP_URL}/lead-quick`}
                style={{ background: '#D4AF37', color: '#14223A', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
              >
                Quiero más información
              </a>
            </div>
          </>
        )}

        {!hasResults && !loadingProjects && projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
            No hay proyectos disponibles en este momento.
          </div>
        )}

      </div>
    </div>
  )
}
