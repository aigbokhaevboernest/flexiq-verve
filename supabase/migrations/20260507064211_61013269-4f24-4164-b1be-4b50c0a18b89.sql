CREATE OR REPLACE FUNCTION public.set_pin_hash(_user_id uuid, _hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.profiles SET pin_hash = _hash, updated_at = now() WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pin_hash(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT pin_hash INTO v FROM public.profiles WHERE id = _user_id;
  RETURN v;
END;
$$;