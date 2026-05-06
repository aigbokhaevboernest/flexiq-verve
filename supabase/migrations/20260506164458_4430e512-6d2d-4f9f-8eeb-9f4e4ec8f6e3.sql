ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Allow looking up email from username for username-based login (anon read of email/username only via RPC)
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE lower(username) = lower(_username) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;