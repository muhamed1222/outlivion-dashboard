#!/bin/bash

# Автоматическое обновление SQL функции в Supabase

SUPABASE_URL="https://ftqpccuyibzdczzowzkw.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXBjY3V5aWJ6ZGN6em93emt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzMzQwMywiZXhwIjoyMDc2OTA5NDAzfQ.SUE6yANk72zYF9c3m-HQqHSE2HXqq200_yMxuaaq1ko"

SQL=$(cat << 'EOF'
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
    'auth_url', 'https://outliviondashboard.vercel.app/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;
EOF
)

echo "📝 Обновление функции generate_auth_token в Supabase..."

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL}\"}"

echo ""
echo "✅ Готово!"

