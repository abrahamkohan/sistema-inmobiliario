-- ═══════════════════════════════════════════════════════════════════════════════
-- MÓDULO COMISIONES COMPLETO
-- Ejecutar en Supabase Dashboard → SQL Editor
-- NOTA: Elimina y recrea las tablas de comisiones desde cero
-- ═══════════════════════════════════════════════════════════════════════════════

-- Limpiar tablas anteriores si existen
DROP TABLE IF EXISTS commission_incomes   CASCADE;
DROP TABLE IF EXISTS commission_clients   CASCADE;
DROP TABLE IF EXISTS commission_splits    CASCADE;
DROP TABLE IF EXISTS commissions          CASCADE;
DROP TABLE IF EXISTS agentes              CASCADE;
DROP TABLE IF EXISTS user_roles           CASCADE;

-- ─── 1. AGENTES / SOCIOS ─────────────────────────────────────────────────────
CREATE TABLE agentes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               TEXT NOT NULL UNIQUE,
  porcentaje_comision  NUMERIC(5,2) NOT NULL CHECK (porcentaje_comision > 0 AND porcentaje_comision <= 100),
  activo               BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. ROLES DE USUARIOS ────────────────────────────────────────────────────
CREATE TABLE user_roles (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'agente')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- ─── 3. COMISIONES ───────────────────────────────────────────────────────────
CREATE TABLE commissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_vendido     TEXT NOT NULL,
  project_id           UUID REFERENCES projects(id) ON DELETE SET NULL,
  valor_venta          NUMERIC(12,2),
  porcentaje_comision  NUMERIC(5,2),
  importe_comision     NUMERIC(12,2) NOT NULL,
  fecha_cierre         DATE,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. SPLITS POR AGENTE ────────────────────────────────────────────────────
CREATE TABLE commission_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id   UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  agente_id       UUID NOT NULL REFERENCES agentes(id),
  agente_nombre   TEXT NOT NULL,
  porcentaje      NUMERIC(5,2) NOT NULL,
  monto           NUMERIC(12,2) NOT NULL,
  facturada       BOOLEAN DEFAULT false,
  numero_factura  TEXT,
  fecha_factura   DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. CLIENTES VINCULADOS ──────────────────────────────────────────────────
CREATE TABLE commission_clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id  UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tipo           TEXT CHECK (tipo IN ('vendedor', 'comprador')),
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(commission_id, client_id)
);

-- ─── 6. INGRESOS / PAGOS ─────────────────────────────────────────────────────
CREATE TABLE commission_incomes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id    UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL,
  fecha_ingreso    DATE NOT NULL,
  monto_ingresado  NUMERIC(12,2) NOT NULL,
  medio_pago       TEXT CHECK (medio_pago IN ('transferencia', 'efectivo')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. ÍNDICES ──────────────────────────────────────────────────────────────
CREATE INDEX idx_commissions_project      ON commissions(project_id);
CREATE INDEX idx_commission_splits_comm   ON commission_splits(commission_id);
CREATE INDEX idx_commission_splits_agent  ON commission_splits(agente_id);
CREATE INDEX idx_commission_clients_comm  ON commission_clients(commission_id);
CREATE INDEX idx_commission_incomes_comm  ON commission_incomes(commission_id);

-- ─── 8. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE agentes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_splits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_clients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_incomes  ENABLE ROW LEVEL SECURITY;

-- Agentes: solo admins
CREATE POLICY "admins_agentes" ON agentes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Comisiones: solo admins
CREATE POLICY "admins_comisiones" ON commissions FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Splits: solo admins
CREATE POLICY "admins_splits" ON commission_splits FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Clientes vinculados: solo admins
CREATE POLICY "admins_comm_clients" ON commission_clients FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ingresos: solo admins
CREATE POLICY "admins_incomes" ON commission_incomes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Roles: cada usuario lee el suyo
CREATE POLICY "self_read_role" ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Roles: solo admins pueden asignar
CREATE POLICY "admins_assign_roles" ON user_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ─── 9. INSERTAR TU PROPIO USER COMO ADMIN ───────────────────────────────────
-- Reemplazá el UUID con tu auth.uid() real (lo encontrás en Authentication → Users)
-- INSERT INTO user_roles (user_id, role) VALUES ('TU-UUID-AQUI', 'admin');
