-- Add running total to the order
ALTER TABLE orders ADD COLUMN total_amount_paid NUMERIC(14,2) DEFAULT 0;

-- Add payment details to the event log (the ledger)
ALTER TABLE order_events ADD COLUMN payment_type VARCHAR(255);
ALTER TABLE order_events ADD COLUMN payment_amount NUMERIC(14,2);