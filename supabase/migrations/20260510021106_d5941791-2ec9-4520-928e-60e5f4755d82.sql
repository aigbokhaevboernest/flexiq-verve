-- Add columns to existing app_settings or create
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='app_settings') THEN
    CREATE TABLE public.app_settings (
      id text PRIMARY KEY DEFAULT 'global',
      receive_enabled boolean NOT NULL DEFAULT true,
      wallet_address text DEFAULT '',
      wallet_crypto text DEFAULT 'BTC',
      cot_enabled boolean NOT NULL DEFAULT true,
      tax_enabled boolean NOT NULL DEFAULT false,
      itc_enabled boolean NOT NULL DEFAULT false,
      imf_enabled boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
    CREATE POLICY "admins manage app_settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS network text DEFAULT 'Bitcoin';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS qr_image_url text DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- Storage bucket for QR images
INSERT INTO storage.buckets (id, name, public) VALUES ('app-assets','app-assets', true) ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='public read app-assets') THEN
    CREATE POLICY "public read app-assets" ON storage.objects FOR SELECT USING (bucket_id='app-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='admins write app-assets') THEN
    CREATE POLICY "admins write app-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id='app-assets' AND public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- digital_payments table
CREATE TABLE IF NOT EXISTS public.digital_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  amount numeric NOT NULL,
  recipient text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.digital_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='digital_payments' AND policyname='users view own digital_payments') THEN
    CREATE POLICY "users view own digital_payments" ON public.digital_payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='digital_payments' AND policyname='users insert own digital_payments') THEN
    CREATE POLICY "users insert own digital_payments" ON public.digital_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='digital_payments' AND policyname='admins manage digital_payments') THEN
    CREATE POLICY "admins manage digital_payments" ON public.digital_payments FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;