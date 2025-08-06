-- Add admin role for the existing user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('38bdfa99-9f67-4fe1-9b70-672ff81ada70', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;