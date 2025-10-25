#!/bin/bash

# Автоматическое обновление SQL функции в Supabase

SUPABASE_URL="${TELEGRAM_BOT_SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${TELEGRAM_BOT_SUPABASE_SERVICE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-}}"
DASHBOARD_URL="${TELEGRAM_BOT_DASHBOARD_URL:-${NEXT_PUBLIC_APP_URL:-https://your-dashboard.example.com}}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Не заданы переменные TELEGRAM_BOT_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL или TELEGRAM_BOT_SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

SQL=$(cat <<'EOF'
CREATE OR REPLACE FUNCTION generate_auth_token(tg_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
  result JSON;
BEGIN
  -- Генерируем новый токен
  new_token := gen_random_uuid();
  expires_at := NOW() + INTERVAL '1 hour';
  
  -- Сохраняем токен в базу
  INSERT INTO auth_tokens (telegram_id, token, expires_at, used)
  VALUES (tg_id, new_token, expires_at, false);
  
  -- Формируем результат
  result := json_build_object(
    'success', true,
    'token', new_token::text,
    'auth_url', '__DASHBOARD_URL__/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;
EOF
)

SQL=${SQL/__DASHBOARD_URL__/${DASHBOARD_URL%/}}

echo "📝 Обновление функции generate_auth_token в Supabase..."

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL}\"}"

echo ""
echo "✅ Готово!"
