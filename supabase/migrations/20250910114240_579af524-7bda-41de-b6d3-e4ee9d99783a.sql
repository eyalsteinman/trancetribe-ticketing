-- Fix infinite recursion in tribe_members policies
DROP POLICY IF EXISTS "Tribe owners can add members" ON tribe_members;
DROP POLICY IF EXISTS "Users can view members of tribes they belong to" ON tribe_members;

-- Create corrected policies for tribe_members
CREATE POLICY "Tribe owners can add members" ON tribe_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tribes 
    WHERE tribes.id = tribe_id 
    AND tribes.created_by = auth.uid()
  ) OR (auth.uid() = user_id AND role = 'owner')
);

CREATE POLICY "Users can view members of tribes they belong to" ON tribe_members
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM tribes 
    WHERE tribes.id = tribe_id 
    AND tribes.created_by = auth.uid()
  )
);