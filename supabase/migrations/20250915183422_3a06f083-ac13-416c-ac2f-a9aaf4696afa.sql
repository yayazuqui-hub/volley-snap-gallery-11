-- Insert admin user data
-- First, we'll create a function to handle admin user creation
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Create the admin user in auth.users if it doesn't exist
    -- Note: This will need to be done manually in Supabase dashboard
    -- For now, we'll prepare the profile for the admin user
    
    -- Insert or update the admin profile
    INSERT INTO public.profiles (user_id, name, phone, approved)
    VALUES (
        -- This will be the user_id from auth.users for ptairone95@gmail.com
        -- We'll set it to a placeholder for now, it will be updated when the user signs up
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

-- Create a function to approve users (admin functionality)
CREATE OR REPLACE FUNCTION approve_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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