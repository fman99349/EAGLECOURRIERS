-- EagleCourier — Seed system statuses + transition matrix
-- Migration 002

-- =========================================================
-- 12 system statuses
-- =========================================================
INSERT INTO statuses
  (slug, internal_name, customer_label, description, category,
   color, customer_visible, requires_action, is_system, sort_order)
VALUES
  ('placed', 'Placed', 'Order Placed',
   'Order has been created in the system',
   'initial', '#3b82f6', TRUE, FALSE, TRUE, 10),

  ('parked', 'Parked', 'On Hold',
   'Order temporarily on hold (paperwork / verification)',
   'hold_operational', '#f59e0b', TRUE, FALSE, TRUE, 20),

  ('processing', 'Processing', 'Processing',
   'Order is being prepared for shipment',
   'in_transit', '#8b5cf6', TRUE, FALSE, TRUE, 30),

  ('pending_insurance', 'Pending Insurance', 'Insurance Payment Required',
   'Insurance payment is required before shipment can proceed',
   'hold_financial', '#f97316', TRUE, TRUE, TRUE, 40),

  ('pending_activation_amount', 'Pending Activation Amount', 'Activation Payment Required',
   'Activation amount payment is required',
   'hold_financial', '#ea580c', TRUE, TRUE, TRUE, 45),

  ('pending_tax', 'Pending Tax', 'Tax Payment Required',
   'Customs / tax payment is required',
   'hold_financial', '#ef4444', TRUE, TRUE, TRUE, 50),

  ('tax_paid', 'Tax Paid', 'Tax Paid',
   'Tax payment confirmed — proceeding',
   'in_transit', '#22c55e', TRUE, FALSE, TRUE, 60),

  ('shipped', 'Shipped', 'Shipped',
   'Order is in transit to the recipient',
   'in_transit', '#06b6d4', TRUE, FALSE, TRUE, 70),

  ('delivered', 'Delivered', 'Delivered',
   'Order delivered successfully',
   'delivered', '#10b981', TRUE, FALSE, TRUE, 80),

  ('cancelled', 'Cancelled', 'Cancelled',
   'Order has been cancelled',
   'failed', '#6b7280', TRUE, FALSE, TRUE, 90),

  ('returned', 'Returned to Sender', 'Returned to Sender',
   'Order was returned to the sender',
   'failed', '#dc2626', TRUE, FALSE, TRUE, 91),

  ('lost', 'Lost', 'Lost in Transit',
   'Order has been lost in transit',
   'failed', '#991b1b', TRUE, FALSE, TRUE, 92)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Transitions FROM creation (from_status_id = NULL)
-- placed is the entry state; cancelled as "escape hatch"
-- =========================================================
INSERT INTO status_transitions (from_status_id, to_status_id)
SELECT NULL, t.id
FROM statuses t
WHERE t.slug IN ('placed', 'cancelled')
ON CONFLICT DO NOTHING;

-- =========================================================
-- Transitions BETWEEN statuses
-- =========================================================
INSERT INTO status_transitions (from_status_id, to_status_id)
SELECT f.id, t.id
FROM (VALUES
  -- placed →
  ('placed', 'parked'),
  ('placed', 'processing'),
  ('placed', 'pending_insurance'),
  ('placed', 'pending_activation_amount'),
  ('placed', 'cancelled'),

  -- parked →
  ('parked', 'processing'),
  ('parked', 'cancelled'),

  -- processing →
  ('processing', 'pending_insurance'),
  ('processing', 'pending_activation_amount'),
  ('processing', 'pending_tax'),
  ('processing', 'shipped'),
  ('processing', 'cancelled'),

  -- pending_insurance →
  ('pending_insurance', 'processing'),
  ('pending_insurance', 'cancelled'),

  -- pending_activation_amount →
  ('pending_activation_amount', 'processing'),
  ('pending_activation_amount', 'cancelled'),

  -- pending_tax →
  ('pending_tax', 'tax_paid'),
  ('pending_tax', 'cancelled'),

  -- tax_paid →
  ('tax_paid', 'shipped'),
  ('tax_paid', 'cancelled'),

  -- shipped →
  ('shipped', 'delivered'),
  ('shipped', 'returned'),
  ('shipped', 'lost'),

  -- delivered → (redelivery / return path)
  ('delivered', 'returned'),

  -- returned → (retry)
  ('returned', 'processing')
) AS map(from_slug, to_slug)
JOIN statuses f ON f.slug = map.from_slug
JOIN statuses t ON t.slug = map.to_slug
ON CONFLICT DO NOTHING;