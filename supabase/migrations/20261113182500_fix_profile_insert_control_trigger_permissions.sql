CREATE OR REPLACE FUNCTION public.criar_controle_troca_direta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.controle_trocas_diretas (
    perfil_id,
    possui_troca_direta
  )
  VALUES (
    NEW.id,
    false
  )
  ON CONFLICT (perfil_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.criar_controle_troca_direta() FROM PUBLIC, anon, authenticated;
