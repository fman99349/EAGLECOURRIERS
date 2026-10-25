-- EagleCourier — Initial Schema
-- Migration 001

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- ADMINS
-- =========================================================
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'operations'
                CHECK (role IN ('super_admin','operations','finance')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- RECIPIENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS recipients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(120) NOT NULL,
  last_name  VARCHAR(120) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(50)  NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients (LOWER(email));

-- =========================================================
-- STATUSES
-- =========================================================
CREATE TABLE IF NOT EXISTS statuses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              VARCHAR(100) NOT NULL UNIQUE,
  internal_name     VARCHAR(150) NOT NULL,
  customer_label    VARCHAR(150) NOT NULL,
  description       TEXT,
  category          VARCHAR(50) NOT NULL
                    CHECK (category IN (
                      'initial','in_transit','hold_financial',
                      'hold_operational','action_required','delivered','failed'
                    )),
  color             VARCHAR(20) NOT NULL DEFAULT '#64748b',
  customer_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  requires_action   BOOLEAN NOT NULL DEFAULT FALSE,
  is_system         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 100,
  email_subject     TEXT,
  email_body        TEXT,
  created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- STATUS TRANSITIONS  (from_status_id NULL = from creation)
-- =========================================================
CREATE TABLE IF NOT EXISTS status_transitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_status_id      UUID REFERENCES statuses(id) ON DELETE CASCADE,
  to_status_id        UUID NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
  created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_status_id, to_status_id)
);

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        VARCHAR(30) NOT NULL UNIQUE,
  item_name           VARCHAR(255) NOT NULL,
  item_description    TEXT,
  from_location       VARCHAR(255) NOT NULL,
  to_location         VARCHAR(255) NOT NULL,
  recipient_id        UUID NOT NULL REFERENCES recipients(id) ON DELETE RESTRICT,
  declared_value      NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  insurance_required  BOOLEAN NOT NULL DEFAULT FALSE,
  current_status_id   UUID NOT NULL REFERENCES statuses(id) ON DELETE RESTRICT,
  internal_notes      TEXT,
  created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(current_status_id);
CREATE INDEX IF NOT EXISTS idx_orders_number     ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =========================================================
-- ORDER EVENTS  (immutable audit trail)
-- =========================================================
CREATE TABLE IF NOT EXISTS order_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status_id      UUID REFERENCES statuses(id) ON DELETE SET NULL,
  to_status_id        UUID NOT NULL REFERENCES statuses(id) ON DELETE RESTRICT,
  note                TEXT,
  is_customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id, created_at DESC);

-- =========================================================
-- NOTIFICATION LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_event_id  UUID REFERENCES order_events(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  channel         VARCHAR(20)  NOT NULL DEFAULT 'email',
  status          VARCHAR(20)  NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','sent','failed')),
  subject         TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notif_event  ON notification_log(order_event_id);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notification_log(status);

-- =========================================================
-- updated_at triggers
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admins_updated   ON admins;
CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_statuses_updated ON statuses;
CREATE TRIGGER trg_statuses_updated BEFORE UPDATE ON statuses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated   ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();