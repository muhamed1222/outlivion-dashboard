// Supabase Edge Function для генерации токена авторизации
// Деплой: supabase functions deploy get-token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { telegram_id } = await req.json()

    if (!telegram_id) {
      return new Response(
        JSON.stringify({ error: 'telegram_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Генерируем новый токен
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Токен действителен 1 час

    // Сохраняем токен в базу
    const { error: insertError } = await supabase
      .from('auth_tokens')
      .insert({
        telegram_id,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      throw insertError
    }

    // Формируем ссылку для авторизации
    const authUrl = `${Deno.env.get('DASHBOARD_URL')}/auth/login?token=${token}`

    return new Response(
      JSON.stringify({
        success: true,
        token,
        auth_url: authUrl,
        expires_at: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

