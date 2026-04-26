-- Create subscription trigger to auto-create free subscription on user sign-up

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    id,
    user_id,
    plan,
    status,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '100 years',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger (runs after the profile trigger)
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();
