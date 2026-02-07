-- Add staff role in separate transaction
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';