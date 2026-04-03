// supabase/functions/pwa-manifest/index.ts
// Sirve el manifest.json dinámico para la PWA
// Permite cambiar el ícono desde Configuración sin redeploy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const FALLBACK_ICON_192 = 'https://sistema.kohancampos.com.py/pwa-192.png'
const FALLBACK_ICON_512 = 'https://sistema.kohancampos.com.py/pwa-512.png'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: config } = await supabase
      .from('consultora_config')
      .select('nombre, pwa_icon_url')
      .limit(1)
      .single()

    const nombre    = config?.nombre      ?? 'Kohan & Campos CRM'
    const iconUrl   = config?.pwa_icon_url ?? null

    const manifest = {
      name:             `${nombre} — CRM`,
      short_name:       'K&C CRM',
      description:      'Sistema de gestión inmobiliaria',
      theme_color:      '#14223A',
      background_color: '#14223A',
      display:          'standalone',
      orientation:      'portrait',
      scope:            '/',
      start_url:        '/inicio',
      icons: iconUrl
        ? [
            { src: iconUrl, sizes: '192x192', type: 'image/png' },
            { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ]
        : [
            { src: FALLBACK_ICON_192, sizes: '192x192', type: 'image/png' },
            { src: FALLBACK_ICON_512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
    }

    return new Response(JSON.stringify(manifest), { headers: corsHeaders(req) })
  } catch (err) {
    // Fallback manifest si algo falla
    const fallback = {
      name: 'Kohan & Campos CRM',
      short_name: 'K&C CRM',
      theme_color: '#14223A',
      background_color: '#14223A',
      display: 'standalone',
      start_url: '/inicio',
      icons: [
        { src: FALLBACK_ICON_192, sizes: '192x192', type: 'image/png' },
        { src: FALLBACK_ICON_512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    }
    return new Response(JSON.stringify(fallback), { headers: corsHeaders(req) })
  }
})
