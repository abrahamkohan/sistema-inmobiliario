-- Setea el custom_domain para tenants que usan dominio propio.
-- El brandLoader ya hace lookup por custom_domain, solo faltaba el dato.

UPDATE consultants
SET custom_domain = 'sistema.kohancampos.com.py'
WHERE subdomain = 'kohancampos'
  AND (custom_domain IS NULL OR custom_domain = '');
