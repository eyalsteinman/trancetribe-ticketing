-- Add DELETE policy for users to delete their own bar tabs
CREATE POLICY "Users can delete their own bar tabs" 
ON public.user_bar_tabs 
FOR DELETE 
USING (auth.uid() = user_id);