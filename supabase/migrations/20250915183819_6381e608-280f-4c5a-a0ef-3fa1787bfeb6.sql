-- Fix the trigger permission issue by updating RLS policies and trigger function

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a new function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with SECURITY DEFINER privileges
  INSERT INTO public.profiles (user_id, name, phone, approved)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    false -- Default to false, admin will approve later
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the RLS policy to allow the system to insert profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add a policy for the system to insert profiles (during user creation)
CREATE POLICY "System can insert profiles during user creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- But we need to be more specific - let's use a function-based approach instead
DROP POLICY IF EXISTS "System can insert profiles during user creation" ON public.profiles;

-- The SECURITY DEFINER function should handle this without additional policies