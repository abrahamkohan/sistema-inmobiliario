import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function buildWelcomeEmail(opts: {
  recipientName: string | null
  recipientEmail: string
  consultoraNombre: string
  logoUrl: string | null
  colorPrimary: string
  subdomain: string | null
  appUrl: string
}): string {
  const { recipientName, recipientEmail, consultoraNombre, logoUrl, colorPrimary, subdomain, appUrl } = opts
  const accessUrl  = subdomain ? `https://${subdomain}.${new URL(appUrl).host}` : appUrl
  const displayName = recipientName || recipientEmail.split('@')[0]
  const greeting    = `Hola ${displayName},`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header con color de marca -->
        <tr>
          <td style="background:${colorPrimary};padding:32px;text-align:center;">
            ${logoUrl
              ? `<img src="${logoUrl}" alt="${consultoraNombre}" style="max-height:56px;max-width:200px;object-fit:contain;">`
              : `<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.05em;">${consultoraNombre.toUpperCase()}</h1>`
            }
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
              Tu acceso al sistema ya está listo.
            </p>

            <!-- Botón -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
              <tr>
                <td style="background:${colorPrimary};border-radius:8px;">
                  <a href="${accessUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    Acceder al sistema
                  </a>
                </td>
              </tr>
            </table>

            <!-- URL visible como fallback -->
            <p style="margin:0 0 28px;font-size:12px;color:#9ca3af;">
              <a href="${accessUrl}" style="color:#9ca3af;">${accessUrl}</a>
            </p>

            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
              En unos minutos vas a recibir un email separado para crear tu contraseña.
              Si no llega, revisá la carpeta de spam.
            </p>
            <p style="margin:0;font-size:13px;color:#9ca3af;">
              Si no esperabas este email, podés ignorarlo.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">${consultoraNombre}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendKey    = Deno.env.get('RESEND_API_KEY')
  const resendFrom   = Deno.env.get('RESEND_FROM') ?? 'Sistema <noreply@resend.dev>'
  const appUrl       = Deno.env.get('APP_URL') ?? 'https://sistema.kohancampos.com.py'

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verificar autenticación
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await admin.auth.getUser(jwt)
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Verificar que es admin del tenant
  const { data: callerRole } = await admin
    .from('user_roles')
    .select('consultant_id, role, is_owner')
    .eq('user_id', user.id)
    .single()

  if (!callerRole || (callerRole.role !== 'admin' && !callerRole.is_owner)) {
    return new Response(JSON.stringify({ error: 'Sin permisos para invitar usuarios' }), {
      status: 403, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const { email, name } = await req.json()
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Email requerido' }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Invitar via Supabase Auth
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { consultant_id: callerRole.consultant_id, full_name: name ?? null },
  })

  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Email de bienvenida con branding (no bloquea si falla)
  if (resendKey && callerRole.consultant_id) {
    try {
      const { data: consultant } = await admin
        .from('consultants')
        .select('nombre, logo_url, color_primary, subdomain')
        .eq('uuid', callerRole.consultant_id)
        .single()

      if (consultant) {
        const html = buildWelcomeEmail({
          recipientName:    name ?? null,
          recipientEmail:   email,
          consultoraNombre: consultant.nombre,
          logoUrl:          consultant.logo_url,
          colorPrimary:     consultant.color_primary ?? '#1e293b',
          subdomain:        consultant.subdomain,
          appUrl,
        })

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    resendFrom,
            to:      email,
            subject: `Tu acceso al CRM de ${consultant.nombre} ya está listo`,
            html,
          }),
        })
      }
    } catch (e) {
      // El email de bienvenida no es crítico — la invitación de Supabase ya fue enviada
      console.error('[invite-user] error enviando email de bienvenida:', e)
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
})
