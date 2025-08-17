-- Add function to automatically delete ended parties after 24 hours
CREATE OR REPLACE FUNCTION public.delete_ended_parties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete parties that ended more than 24 hours ago
  DELETE FROM public.parties 
  WHERE date < (CURRENT_DATE - INTERVAL '1 day');
END;
$function$;

-- Create a cron job to run this function daily at midnight
-- Note: This requires pg_cron extension to be enabled in your Supabase project
SELECT cron.schedule(
  'delete-old-parties',
  '0 0 * * *', -- Run daily at midnight
  'SELECT public.delete_ended_parties();'
);