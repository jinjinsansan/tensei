-- Add is_admin column to app_users table
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Set goldbenchan@gmail.com as admin
UPDATE public.app_users SET is_admin = true WHERE email = 'goldbenchan@gmail.com';
