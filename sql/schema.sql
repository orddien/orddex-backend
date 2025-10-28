CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  token TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(merchant_id, provider)
);

CREATE TABLE IF NOT EXISTS merchant_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  title TEXT, type TEXT CHECK (type IN ('group','channel')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  code TEXT NOT NULL, name TEXT NOT NULL,
  price_cents INT NOT NULL, duration_days INT NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(merchant_id, code)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT, username TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','active','expired','canceled')),
  start_at TIMESTAMPTZ, end_at TIMESTAMPTZ, last_renewal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  gateway TEXT NOT NULL DEFAULT 'pushinpay',
  external_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','expired')),
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
