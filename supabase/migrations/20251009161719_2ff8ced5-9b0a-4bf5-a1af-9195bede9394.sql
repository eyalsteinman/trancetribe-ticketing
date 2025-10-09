-- First, delete duplicate passwords keeping only the most recent one for each email+creator combination
DELETE FROM public.admin_passwords a
WHERE is_used = false
AND id NOT IN (
  SELECT DISTINCT ON (admin_email, created_by) id
  FROM public.admin_passwords
  WHERE is_used = false
  ORDER BY admin_email, created_by, created_at DESC
);

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS admin_passwords_unique_per_creator 
ON public.admin_passwords (admin_email, created_by) 
WHERE is_used = false;