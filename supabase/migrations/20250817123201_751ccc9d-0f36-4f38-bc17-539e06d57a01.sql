-- Add QR approval system columns to qr_codes table
ALTER TABLE public.qr_codes 
ADD COLUMN is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN auto_approved boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_qr_codes_approval ON public.qr_codes(is_approved, party_id);
CREATE INDEX idx_qr_codes_user_party ON public.qr_codes(user_id, party_id);