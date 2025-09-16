-- First, approve the admin user that just signed up
UPDATE public.profiles 
SET approved = true 
WHERE name = 'Administrador' AND phone = '(11) 99999-9999';

-- Update RLS policy to allow all authenticated users to view photos
DROP POLICY IF EXISTS "Approved users can view photos" ON public.photos;

CREATE POLICY "Authenticated users can view photos" 
ON public.photos 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the admin management policy unchanged
-- The download restriction will be handled in the application logic