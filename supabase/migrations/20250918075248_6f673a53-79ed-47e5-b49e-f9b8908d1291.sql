-- Allow users to view basic profile info for friends lookup
CREATE POLICY "Allow viewing profiles for friends lookup" 
ON public.profiles 
FOR SELECT 
USING (true);