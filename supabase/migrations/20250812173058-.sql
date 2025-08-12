-- Ensure the 'production-logos' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('production-logos', 'production-logos', true)
on conflict (id) do update set public = excluded.public;

-- Public read access policy for production logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read production logos'
  ) THEN
    CREATE POLICY "Public can read production logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'production-logos');
  END IF;
END $$;

-- Admins can upload to production logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload production logos'
  ) THEN
    CREATE POLICY "Admins can upload production logos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'production-logos' AND public.is_admin(auth.uid()));
  END IF;
END $$;

-- Admins can update production logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update production logos'
  ) THEN
    CREATE POLICY "Admins can update production logos"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'production-logos' AND public.is_admin(auth.uid()));
  END IF;
END $$;

-- Admins can delete production logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete production logos'
  ) THEN
    CREATE POLICY "Admins can delete production logos"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'production-logos' AND public.is_admin(auth.uid()));
  END IF;
END $$;