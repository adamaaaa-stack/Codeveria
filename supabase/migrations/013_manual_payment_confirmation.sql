-- Remove payment gateway usage and add manual two-party payment confirmation.
-- Payments are handled externally; code unlocks only when both parties confirm.

-- Drop payment session table
drop table if exists public.submission_payments;

-- Add manual confirmation fields to escrow_records
alter table public.escrow_records
  add column if not exists company_payment_confirmed boolean not null default false,
  add column if not exists developer_payment_confirmed boolean not null default false;

-- Remove gateway payment_status (keep only code release state via code_access_granted)
alter table public.escrow_records drop constraint if exists escrow_records_payment_status_check;
alter table public.escrow_records drop column if exists payment_status;
