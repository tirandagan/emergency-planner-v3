-- Custom SQL migration file, put your code below! --

-- Create trigger function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
   INSERT INTO public.profiles (id, email, full_name, first_name, last_name, birth_year, subscription_tier, created_at, updated_at)
   VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      COALESCE(new.raw_user_meta_data->>'last_name', ''),
      COALESCE((new.raw_user_meta_data->>'birth_year')::integer, NULL),
      'FREE',
      now(),
      now()
   );
   RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();




























