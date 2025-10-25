-- Добавляем поля для интеграции с платежным шлюзом
-- external_id: ID платежа в системе платежного шлюза (Enot.io)
-- gateway_data: полные данные от шлюза в формате JSONB для отладки и аудита

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_data JSONB;

-- Создаем индекс для быстрого поиска по external_id
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);

-- Комментарии для документации
COMMENT ON COLUMN payments.external_id IS 'ID платежа в системе платежного шлюза (Enot.io/YooKassa)';
COMMENT ON COLUMN payments.gateway_data IS 'Полные данные от платежного шлюза для отладки и аудита';

