-- Fix RLS policy for direct_messages to allow users to delete their received messages
CREATE POLICY "Users can delete their received messages"
ON direct_messages
FOR DELETE
USING (auth.uid() = recipient_id);

-- Update parties RLS to ensure proper data isolation
DROP POLICY IF EXISTS "Admins can manage their own parties" ON parties;
CREATE POLICY "Admins can manage their own parties"
ON parties
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
);

-- Update productions RLS to ensure proper data isolation  
DROP POLICY IF EXISTS "Admins can manage their own productions" ON productions;
CREATE POLICY "Admins can manage their own productions"
ON productions
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
);

-- Update bar_tabs RLS to ensure proper data isolation
DROP POLICY IF EXISTS "Admins can manage their own bar tabs" ON bar_tabs;
CREATE POLICY "Admins can manage their own bar tabs"
ON bar_tabs
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
);

-- Update messages RLS to ensure proper data isolation
DROP POLICY IF EXISTS "Admins can manage their own messages" ON messages;
CREATE POLICY "Admins can manage their own messages"
ON messages
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
);

-- Update FAQs RLS to ensure proper data isolation
DROP POLICY IF EXISTS "Admins can manage their own FAQs" ON faqs;
CREATE POLICY "Admins can manage their own FAQs"
ON faqs
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()
);

-- Update registered users visibility - admins should only see users who have QR codes for their parties
DROP POLICY IF EXISTS "Admins can view any profile" ON profiles;
CREATE POLICY "Admins can view their party attendees"
ON profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    -- Admins can see users who have QR codes for their parties
    EXISTS (
      SELECT 1 FROM qr_codes qr
      JOIN parties p ON p.id = qr.party_id
      WHERE qr.user_id = profiles.user_id
      AND p.created_by = auth.uid()
    )
  )
);

-- Keep super admin override policies
-- These allow super admin to see everything