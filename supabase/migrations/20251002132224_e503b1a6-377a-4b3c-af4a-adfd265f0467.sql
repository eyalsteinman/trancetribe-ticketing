-- Allow anyone to verify admin passwords during signup
-- Only expose unused and non-expired passwords for verification
CREATE POLICY "Anyone can verify unused admin passwords"
ON admin_passwords
FOR SELECT
USING (
  is_used = false 
  AND expires_at > now()
);