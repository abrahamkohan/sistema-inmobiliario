import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const { token, lead } = await req.json()

    const VALID_TOKEN = Deno.env.get('LEAD_QUICK_TOKEN')
    if (!VALID_TOKEN || token !== VALID_TOKEN) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase.from('clients').insert({
      tipo:         'lead',
      full_name:    String(lead.full_name ?? '').trim(),
      phone:        lead.phone        || null,
      nationality:  lead.nationality  || null,
      fuente:       lead.fuente       || null,
      notes:        lead.notes        || null,
      apodo:        lead.apodo        || null,
      referido_por: lead.referido_por || null,
    }).select('id').single()

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
