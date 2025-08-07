-- Ensure the trigger for creating user profiles exists and is working
-- Drop and recreate the trigger to make sure it's working properly

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Also add a policy to allow the system/trigger to insert into profiles
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);