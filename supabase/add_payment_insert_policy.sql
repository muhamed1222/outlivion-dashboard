-- Добавление политики для создания платежей
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- Разрешаем сервисной роли создавать платежи
CREATE POLICY "Service role can insert payments" ON payments
  FOR INSERT WITH CHECK (true);

-- Разрешаем аутентифицированным пользователям создавать свои платежи
CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

