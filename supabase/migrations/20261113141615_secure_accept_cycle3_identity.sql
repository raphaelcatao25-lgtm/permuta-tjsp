CREATE OR REPLACE FUNCTION public.aceitar_permuta_ciclo_3(p_solicitacao_id uuid, p_usuario_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

    v_p1 uuid;
    v_p2 uuid;
    v_p3 uuid;

    v_status text;

    v_p1_aceite boolean;
    v_p2_aceite boolean;
    v_p3_aceite boolean;

    v_proposta_cancelada record;

BEGIN

    IF auth.uid() IS NULL
       OR auth.uid() IS DISTINCT FROM p_usuario_id
    THEN
        RAISE EXCEPTION 'Usuário não autorizado';
    END IF;


    /*
    ==========================================
    BUSCA SOLICITAÇÃO
    ==========================================
    */

    SELECT
        participante_1,
        participante_2,
        participante_3,

        participante_1_aceite,
        participante_2_aceite,
        participante_3_aceite,

        status

    INTO
        v_p1,
        v_p2,
        v_p3,

        v_p1_aceite,
        v_p2_aceite,
        v_p3_aceite,

        v_status

    FROM solicitacoes_permuta

    WHERE id = p_solicitacao_id
      AND tipo = 'ciclo_3';


    IF v_status IS NULL THEN

        RAISE EXCEPTION
        'Solicitação de ciclo de 3 não encontrada';

    END IF;


    IF v_status = 'confirmado' THEN

        RAISE EXCEPTION
        'Permuta já confirmada';

    END IF;


    IF v_status <> 'aguardando_aceite' THEN

        RAISE EXCEPTION
        'Esta proposta não está disponível para aceite';

    END IF;


    /*
    ==========================================
    VALIDA PARTICIPANTE
    ==========================================
    */

    IF p_usuario_id <> v_p1
       AND p_usuario_id <> v_p2
       AND p_usuario_id <> v_p3
    THEN

        RAISE EXCEPTION
        'Usuário não pertence a esta permuta';

    END IF;


    /*
    ==========================================
    REVALIDA O CARGO DOS 3 PARTICIPANTES
    ==========================================
    */

    IF NOT public.todos_mesmo_cargo_permuta(
        ARRAY[
            v_p1,
            v_p2,
            v_p3
        ]::uuid[]
    )
    THEN

        RAISE EXCEPTION
        'A permuta não pode ser confirmada porque os participantes possuem cargos diferentes';

    END IF;


    /*
    ==========================================
    CONFERE DISPONIBILIDADE
    ==========================================
    */

    IF EXISTS
    (
        SELECT 1

        FROM perfis p

        WHERE p.id IN
        (
            v_p1,
            v_p2,
            v_p3
        )

        AND COALESCE(
            p.em_match,
            false
        ) = true
    )
    THEN

        RAISE EXCEPTION
        'Um dos participantes já está em outra permuta confirmada';

    END IF;


    /*
    ==========================================
    EVITA DUPLICAR ACEITE
    ==========================================
    */

    IF p_usuario_id = v_p1
       AND COALESCE(v_p1_aceite, false) = true
    THEN

        RAISE EXCEPTION
        'Você já aceitou esta proposta';

    END IF;


    IF p_usuario_id = v_p2
       AND COALESCE(v_p2_aceite, false) = true
    THEN

        RAISE EXCEPTION
        'Você já aceitou esta proposta';

    END IF;


    IF p_usuario_id = v_p3
       AND COALESCE(v_p3_aceite, false) = true
    THEN

        RAISE EXCEPTION
        'Você já aceitou esta proposta';

    END IF;


    /*
    ==========================================
    REGISTRA ACEITE
    ==========================================
    */

    IF p_usuario_id = v_p1 THEN

        UPDATE solicitacoes_permuta

        SET
            participante_1_aceite = true,
            updated_at = now()

        WHERE id = p_solicitacao_id;


    ELSIF p_usuario_id = v_p2 THEN

        UPDATE solicitacoes_permuta

        SET
            participante_2_aceite = true,
            updated_at = now()

        WHERE id = p_solicitacao_id;


    ELSIF p_usuario_id = v_p3 THEN

        UPDATE solicitacoes_permuta

        SET
            participante_3_aceite = true,
            updated_at = now()

        WHERE id = p_solicitacao_id;

    END IF;


    /*
    ==========================================
    TENTA CONFIRMAR
    ==========================================
    */

    UPDATE solicitacoes_permuta

    SET
        status = 'confirmado',
        updated_at = now()

    WHERE id = p_solicitacao_id

      AND participante_1_aceite = true

      AND participante_2_aceite = true

      AND participante_3_aceite = true;


    /*
    ==========================================
    ATUALIZA STATUS
    ==========================================
    */

    SELECT status

    INTO v_status

    FROM solicitacoes_permuta

    WHERE id = p_solicitacao_id;


    /*
    ==========================================
    SE AINDA ESTÁ AGUARDANDO
    NOTIFICA OS OUTROS PARTICIPANTES
    ==========================================
    */

    IF v_status <> 'confirmado' THEN

        IF v_p1 <> p_usuario_id THEN

            PERFORM public.criar_notificacao
            (
                v_p1,

                'aceite_ciclo_3',

                'Participante aceitou a permuta em cadeia',

                'Um dos participantes aceitou a proposta. A permuta ainda aguarda os demais aceites.',

                p_solicitacao_id
            );

        END IF;


        IF v_p2 <> p_usuario_id THEN

            PERFORM public.criar_notificacao
            (
                v_p2,

                'aceite_ciclo_3',

                'Participante aceitou a permuta em cadeia',

                'Um dos participantes aceitou a proposta. A permuta ainda aguarda os demais aceites.',

                p_solicitacao_id
            );

        END IF;


        IF v_p3 <> p_usuario_id THEN

            PERFORM public.criar_notificacao
            (
                v_p3,

                'aceite_ciclo_3',

                'Participante aceitou a permuta em cadeia',

                'Um dos participantes aceitou a proposta. A permuta ainda aguarda os demais aceites.',

                p_solicitacao_id
            );

        END IF;


        RETURN v_status;

    END IF;


    /*
    ==========================================
    CONFIRMOU:
    BLOQUEIA OS TRÊS
    ==========================================
    */

    UPDATE perfis

    SET
        em_match = true,
        reservado_em = now()

    WHERE id IN
    (
        v_p1,
        v_p2,
        v_p3
    );


    /*
    ==========================================
    NOTIFICA OS 3 SOBRE A CONFIRMAÇÃO
    ==========================================
    */

    PERFORM public.criar_notificacao
    (
        v_p1,

        'permuta_confirmada',

        'Permuta em cadeia confirmada',

        'Sua permuta em cadeia foi confirmada pelos três participantes. Os dados de contato dos demais participantes já estão disponíveis na plataforma.',

        p_solicitacao_id
    );


    PERFORM public.criar_notificacao
    (
        v_p2,

        'permuta_confirmada',

        'Permuta em cadeia confirmada',

        'Sua permuta em cadeia foi confirmada pelos três participantes. Os dados de contato dos demais participantes já estão disponíveis na plataforma.',

        p_solicitacao_id
    );


    PERFORM public.criar_notificacao
    (
        v_p3,

        'permuta_confirmada',

        'Permuta em cadeia confirmada',

        'Sua permuta em cadeia foi confirmada pelos três participantes. Os dados de contato dos demais participantes já estão disponíveis na plataforma.',

        p_solicitacao_id
    );


    /*
    ==========================================
    CANCELA TODAS AS OUTRAS PROPOSTAS
    QUE ENVOLVEM P1, P2 OU P3
    ==========================================
    */

    FOR v_proposta_cancelada IN

        UPDATE solicitacoes_permuta s

        SET
            status = 'cancelado_indisponibilidade',
            updated_at = now()

        WHERE s.id <> p_solicitacao_id

          AND s.status =
              'aguardando_aceite'

          AND
          (
              s.participante_1 IN
              (
                  v_p1,
                  v_p2,
                  v_p3
              )

              OR

              s.participante_2 IN
              (
                  v_p1,
                  v_p2,
                  v_p3
              )

              OR

              s.participante_3 IN
              (
                  v_p1,
                  v_p2,
                  v_p3
              )
          )

        RETURNING
            s.id,
            s.participante_1,
            s.participante_2,
            s.participante_3

    LOOP

        /*
        ======================================
        NOTIFICA SOMENTE QUEM NÃO FAZ PARTE
        DO CICLO QUE ACABOU DE CONFIRMAR
        ======================================
        */

        IF v_proposta_cancelada.participante_1 IS NOT NULL

           AND v_proposta_cancelada.participante_1 <> v_p1

           AND v_proposta_cancelada.participante_1 <> v_p2

           AND v_proposta_cancelada.participante_1 <> v_p3

        THEN

            PERFORM public.criar_notificacao
            (
                v_proposta_cancelada.participante_1,

                'proposta_indisponivel',

                'Proposta encerrada',

                'Esta proposta foi encerrada automaticamente porque um dos participantes confirmou outra permuta. Quando existem várias propostas, a primeira que for confirmada permanece ativa e as demais são encerradas automaticamente.',

                v_proposta_cancelada.id
            );

        END IF;


        IF v_proposta_cancelada.participante_2 IS NOT NULL

           AND v_proposta_cancelada.participante_2 <> v_p1

           AND v_proposta_cancelada.participante_2 <> v_p2

           AND v_proposta_cancelada.participante_2 <> v_p3

        THEN

            PERFORM public.criar_notificacao
            (
                v_proposta_cancelada.participante_2,

                'proposta_indisponivel',

                'Proposta encerrada',

                'Esta proposta foi encerrada automaticamente porque um dos participantes confirmou outra permuta. Quando existem várias propostas, a primeira que for confirmada permanece ativa e as demais são encerradas automaticamente.',

                v_proposta_cancelada.id
            );

        END IF;


        IF v_proposta_cancelada.participante_3 IS NOT NULL

           AND v_proposta_cancelada.participante_3 <> v_p1

           AND v_proposta_cancelada.participante_3 <> v_p2

           AND v_proposta_cancelada.participante_3 <> v_p3

        THEN

            PERFORM public.criar_notificacao
            (
                v_proposta_cancelada.participante_3,

                'proposta_indisponivel',

                'Proposta encerrada',

                'Esta proposta foi encerrada automaticamente porque um dos participantes confirmou outra permuta. Quando existem várias propostas, a primeira que for confirmada permanece ativa e as demais são encerradas automaticamente.',

                v_proposta_cancelada.id
            );

        END IF;


    END LOOP;


    RETURN 'confirmado';

END;

$function$

