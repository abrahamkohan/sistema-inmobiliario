-- Create commercial_allies table
CREATE TABLE IF NOT EXISTS commercial_allies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  porcentaje_default NUMERIC(5,2) NOT NULL,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to commissions table for aliados
ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS has_ally BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ally_id UUID REFERENCES commercial_allies(id),
  ADD COLUMN IF NOT EXISTS ally_percentage NUMERIC(5,2);
