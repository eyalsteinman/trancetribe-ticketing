-- Create foreign key relationship between qr_codes.user_id and profiles.user_id
ALTER TABLE public.qr_codes 
DROP CONSTRAINT IF EXISTS qr_codes_user_id_fkey;

ALTER TABLE public.qr_codes 
ADD CONSTRAINT qr_codes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;