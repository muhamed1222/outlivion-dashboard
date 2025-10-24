-- Таблица тарифных планов (СОЗДАЁМ ПЕРВОЙ!)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  subscription_expires TIMESTAMP WITH TIME ZONE,
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица кодов активации
CREATE TABLE IF NOT EXISTS codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,
  days_valid INTEGER NOT NULL,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица реферальной программы
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id) NOT NULL,
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Таблица транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT CHECK (type IN ('payment', 'referral', 'code', 'subscription')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT CHECK (method IN ('card', 'sbp', 'promo')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица токенов авторизации
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_codes_code ON codes(code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS политики
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid()::text = referrer_id::text OR auth.uid()::text = referred_id::text);

-- Базовые тарифы
INSERT INTO plans (name, price, duration_days) VALUES
  ('1 месяц', 199, 30),
  ('3 месяца', 499, 90),
  ('12 месяцев', 1499, 365)
ON CONFLICT DO NOTHING;

-- Функция для генерации токенов
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
  new_token := gen_random_uuid();
  expires_at := NOW() + INTERVAL '1 hour';
  
  INSERT INTO auth_tokens (telegram_id, token, expires_at, used)
  VALUES (tg_id, new_token, expires_at, false);
  
  result := json_build_object(
    'success', true,
    'token', new_token::text,
    'auth_url', 'https://outliviondashboard-kjtc8q3c5-outtime.vercel.app/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;

