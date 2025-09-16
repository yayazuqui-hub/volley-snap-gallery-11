-- Fix security warnings by setting search_path for functions

-- Update create_admin_user function with proper search_path
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Insert or update the admin profile
    INSERT INTO public.profiles (user_id, name, phone, approved)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'Administrador',
        '(11) 99999-9999',
        true
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        approved = true,
        name = 'Administrador';
END;
$$;

-- Update approve_user function with proper search_path
CREATE OR REPLACE FUNCTION approve_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current user is approved (admin)
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND approved = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only approved users can approve others';
    END IF;
    
    -- Approve the target user
    UPDATE profiles 
    SET approved = true, updated_at = now()
    WHERE user_id = target_user_id;
END;
$$;