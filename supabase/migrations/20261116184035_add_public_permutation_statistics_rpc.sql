CREATE OR REPLACE FUNCTION public.estatisticas_publicas_permutas()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
WITH perfis_base AS (
 SELECT p.id,p.cargo,p.comarca_atual_id FROM public.perfis p WHERE p.grupo_teste IS NULL
),
preferencias_base AS (
 SELECT pm.perfil_id,pm.comarca_destino_id,pm.prioridade,c.nome AS comarca,
        cj.id AS circunscricao_id,cj.nome AS circunscricao,r.id AS raj_id,r.nome AS raj
 FROM public.preferencias_movimentacao pm
 JOIN perfis_base p ON p.id=pm.perfil_id
 JOIN public.comarcas_tjsp c ON c.id=pm.comarca_destino_id
 JOIN public.circunscricoes_tjsp cj ON cj.id=c.circunscricao_id
 JOIN public.rajs_tjsp r ON r.id=cj.raj_id
 WHERE pm.ativo IS DISTINCT FROM false
),
resumo AS (
 SELECT (SELECT count(*)::integer FROM perfis_base) AS servidores_cadastrados,
 (SELECT count(DISTINCT perfil_id)::integer FROM preferencias_base) AS servidores_com_preferencias,
 (SELECT count(*)::integer FROM preferencias_base) AS preferencias_ativas,
 (SELECT count(DISTINCT perfil_id)::integer FROM preferencias_base WHERE prioridade=1) AS servidores_com_destino_prioritario
),
por_raj AS (
 SELECT raj_id AS id,raj AS nome,count(DISTINCT perfil_id)::integer AS usuarios,count(*)::integer AS preferencias,
 count(DISTINCT perfil_id) FILTER(WHERE prioridade=1)::integer AS prioridade_1
 FROM preferencias_base GROUP BY raj_id,raj
),
por_circunscricao AS (
 SELECT circunscricao_id AS id,circunscricao AS nome,count(DISTINCT perfil_id)::integer AS usuarios,count(*)::integer AS preferencias,
 count(DISTINCT perfil_id) FILTER(WHERE prioridade=1)::integer AS prioridade_1
 FROM preferencias_base GROUP BY circunscricao_id,circunscricao HAVING count(DISTINCT perfil_id)>=3
),
destinos AS (
 SELECT comarca AS nome,count(DISTINCT perfil_id)::integer AS usuarios,count(*)::integer AS preferencias,
 count(DISTINCT perfil_id) FILTER(WHERE prioridade=1)::integer AS prioridade_1
 FROM preferencias_base GROUP BY comarca HAVING count(DISTINCT perfil_id)>=3
 ORDER BY count(DISTINCT perfil_id) DESC,comarca LIMIT 15
),
origens AS (
 SELECT c.nome AS nome,count(DISTINCT p.id)::integer AS usuarios
 FROM perfis_base p JOIN public.comarcas_tjsp c ON c.id=p.comarca_atual_id
 GROUP BY c.nome HAVING count(DISTINCT p.id)>=3
 ORDER BY count(DISTINCT p.id) DESC,c.nome LIMIT 12
),
cargos AS (
 SELECT btrim(cargo) AS nome,count(*)::integer AS usuarios FROM perfis_base
 WHERE cargo IS NOT NULL AND btrim(cargo)<>''
 GROUP BY btrim(cargo) HAVING count(*)>=3
 ORDER BY count(*) DESC,btrim(cargo) LIMIT 10
),
prioridades AS (
 SELECT prioridade AS ordem,count(*)::integer AS preferencias FROM preferencias_base
 WHERE prioridade IS NOT NULL GROUP BY prioridade ORDER BY prioridade
)
SELECT jsonb_build_object(
 'resumo',(SELECT to_jsonb(resumo) FROM resumo),
 'por_raj',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.usuarios DESC,x.nome) FROM por_raj x),'[]'::jsonb),
 'por_circunscricao',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.usuarios DESC,x.nome) FROM por_circunscricao x),'[]'::jsonb),
 'destinos_mais_procurados',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.usuarios DESC,x.nome) FROM destinos x),'[]'::jsonb),
 'comarcas_de_origem',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.usuarios DESC,x.nome) FROM origens x),'[]'::jsonb),
 'cargos',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.usuarios DESC,x.nome) FROM cargos x),'[]'::jsonb),
 'distribuicao_prioridades',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.ordem) FROM prioridades x),'[]'::jsonb),
 'atualizado_em',now()
);
$$;
REVOKE ALL ON FUNCTION public.estatisticas_publicas_permutas() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.estatisticas_publicas_permutas() FROM anon,authenticated;
GRANT EXECUTE ON FUNCTION public.estatisticas_publicas_permutas() TO anon,authenticated,service_role;
