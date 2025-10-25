-- Migration: Add payment gateway support fields
-- Description: Adds support for multiple payment gateways (Enot.io, YooKassa)
-- Date: 2025-10-26

-- Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT 'enot',
ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50);

-- Create index for gateway queries
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);

-- Add comments for documentation
COMMENT ON COLUMN payments.gateway IS 'Payment gateway identifier (enot, yookassa)';
COMMENT ON COLUMN payments.gateway_payment_id IS 'Payment ID from the gateway system (UUID for YooKassa)';
COMMENT ON COLUMN payments.payment_method_type IS 'Payment method type (bank_card, sbp, sberbank, yoo_money, etc.)';

-- Migrate existing data
UPDATE payments SET gateway = 'enot' WHERE gateway IS NULL;

-- Add check constraint to ensure valid gateway values
ALTER TABLE payments 
ADD CONSTRAINT check_payment_gateway 
CHECK (gateway IN ('enot', 'yookassa'));

