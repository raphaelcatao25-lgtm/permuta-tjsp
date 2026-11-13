
REVOKE ALL PRIVILEGES ON TABLE public.notificacoes FROM anon;
REVOKE INSERT, REFERENCES, TRIGGER, TRUNCATE ON TABLE public.notificacoes FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.notificacoes TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.propostas_ocultas_usuario FROM anon;
REVOKE UPDATE, REFERENCES, TRIGGER, TRUNCATE ON TABLE public.propostas_ocultas_usuario FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.propostas_ocultas_usuario TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.ciclos_manuais_ocultos_usuario FROM anon;
REVOKE UPDATE, REFERENCES, TRIGGER, TRUNCATE ON TABLE public.ciclos_manuais_ocultos_usuario FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.ciclos_manuais_ocultos_usuario TO authenticated;

