import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Cliente admin — service_role, nunca sale del servidor
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verificar que el caller está autenticado
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

  // Verificar que el caller es admin del tenant
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

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Email requerido' }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Invitar — consultant_id va en metadata para que el trigger lo asigne al perfil
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { consultant_id: callerRole.consultant_id },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
})
