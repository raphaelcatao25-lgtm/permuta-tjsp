export default function TermosPage() {
  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">

        {/* CABEÇALHO */}

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-900">
            Permuta TJSP
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Termos de Uso
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Estes Termos de Uso estabelecem as condições para utilização
            da plataforma Permuta TJSP.
          </p>
        </div>


        <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">

          {/* 1 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              1. Sobre a plataforma
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                A Permuta TJSP é uma plataforma independente criada para
                auxiliar servidores interessados em encontrar possíveis
                oportunidades de permuta.
              </p>

              <p>
                A plataforma não é um serviço oficial do Tribunal de Justiça
                do Estado de São Paulo (TJSP), não possui vínculo institucional
                com o TJSP e não representa o Tribunal.
              </p>

              <p>
                Sua finalidade é facilitar a localização e o contato entre
                servidores com interesses de movimentação potencialmente
                compatíveis.
              </p>
            </div>
          </section>


          {/* 2 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              2. Cadastro
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                Para utilizar determinadas funcionalidades, o usuário deverá
                criar uma conta e fornecer as informações solicitadas pela
                plataforma.
              </p>

              <p>
                O usuário é responsável pela veracidade, exatidão e atualização
                das informações cadastradas, especialmente sua comarca atual,
                preferências de movimentação e dados de contato.
              </p>

              <p>
                Cada usuário é responsável pela segurança de sua conta e de
                suas credenciais de acesso.
              </p>
            </div>
          </section>


          {/* 3 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              3. Oportunidades de permuta
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                A plataforma poderá identificar oportunidades de permuta
                direta ou combinações envolvendo mais de um servidor,
                conforme as preferências cadastradas pelos usuários.
              </p>

              <p>
                Os resultados apresentados representam apenas possíveis
                compatibilidades entre os interesses informados pelos
                próprios usuários.
              </p>

              <p>
                A existência de uma oportunidade, proposta ou confirmação
                dentro da plataforma não significa que a permuta será
                necessariamente autorizada ou efetivada.
              </p>
            </div>
          </section>


          {/* 4 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              4. Efetivação da permuta
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                A Permuta TJSP atua exclusivamente como ferramenta de
                aproximação entre servidores.
              </p>

              <p>
                Qualquer movimentação funcional permanece sujeita às normas,
                procedimentos administrativos, requisitos e aprovações dos
                órgãos competentes.
              </p>

              <p>
                Uma permuta marcada como confirmada ou concluída dentro da
                plataforma representa apenas o registro informado pelos
                participantes e não constitui ato administrativo ou
                autorização oficial.
              </p>
            </div>
          </section>


          {/* 5 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              5. Propostas e contatos
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                Os dados de contato dos usuários não são exibidos
                publicamente na busca de servidores ou nas oportunidades
                apresentadas pela plataforma.
              </p>

              <p>
                Quando aplicável, determinados dados de contato poderão ser
                disponibilizados aos participantes de uma permuta após a
                confirmação da proposta, de acordo com as configurações e
                autorizações existentes na plataforma.
              </p>

              <p>
                Os dados obtidos por meio da Permuta TJSP devem ser utilizados
                exclusivamente para assuntos relacionados à possível permuta
                entre os participantes.
              </p>
            </div>
          </section>


          {/* 6 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              6. Conduta do usuário
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Ao utilizar a plataforma, o usuário compromete-se a não:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-600">
              <li>
                fornecer informações deliberadamente falsas;
              </li>

              <li>
                utilizar dados de outros usuários para finalidade diferente
                da busca ou negociação de permuta;
              </li>

              <li>
                utilizar a plataforma para assédio, fraude, spam ou qualquer
                atividade ilícita;
              </li>

              <li>
                tentar acessar informações, contas ou funcionalidades para
                as quais não possua autorização;
              </li>

              <li>
                tentar comprometer a segurança, disponibilidade ou
                funcionamento da plataforma.
              </li>
            </ul>
          </section>


          {/* 7 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              7. Pausa na busca
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              O usuário poderá pausar sua participação na busca por permutas
              sem necessariamente excluir sua conta. Enquanto a busca estiver
              pausada, o perfil deixará de participar da geração de novas
              oportunidades, conforme as regras da plataforma.
            </p>
          </section>


          {/* 8 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              8. Exclusão da conta
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                O usuário poderá solicitar a exclusão de sua conta por meio
                da funcionalidade disponibilizada na própria plataforma,
                observadas eventuais restrições necessárias para preservar
                a integridade de uma permuta em andamento.
              </p>

              <p>
                A exclusão poderá resultar na remoção ou anonimização dos
                dados pessoais associados à conta, observadas as hipóteses
                em que determinadas informações precisem ser mantidas para
                segurança, cumprimento de obrigação legal, exercício regular
                de direitos ou preservação de estatísticas anônimas.
              </p>
            </div>
          </section>


          {/* 9 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              9. Avaliações e depoimentos
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                Após determinadas experiências de permuta, a plataforma
                poderá solicitar uma avaliação sobre a experiência do
                usuário.
              </p>

              <p>
                Comentários somente poderão ser utilizados como depoimentos
                públicos quando houver autorização específica do usuário.
              </p>

              <p>
                Quando publicados pela plataforma, esses depoimentos poderão
                ser apresentados sem identificação pessoal.
              </p>
            </div>
          </section>


          {/* 10 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              10. Disponibilidade da plataforma
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              A Permuta TJSP poderá passar por atualizações, manutenções,
              interrupções temporárias ou modificações de funcionalidades.
              Não é garantida disponibilidade ininterrupta do serviço.
            </p>
          </section>


          {/* 11 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              11. Limitação de responsabilidade
            </h2>

            <div className="mt-3 space-y-3 leading-7 text-slate-600">
              <p>
                A plataforma não garante a existência de oportunidades
                compatíveis, a aceitação de propostas ou a efetivação de
                qualquer permuta.
              </p>

              <p>
                A Permuta TJSP também não se responsabiliza por decisões
                administrativas dos órgãos competentes nem por informações
                incorretas fornecidas pelos próprios usuários.
              </p>

              <p>
                Os usuários são responsáveis pelas comunicações, tratativas
                e decisões realizadas após o contato entre os participantes.
              </p>
            </div>
          </section>


          {/* 12 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              12. Privacidade e proteção de dados
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              O tratamento de dados pessoais realizado pela plataforma será
              detalhado na Política de Privacidade, que deverá ser lida em
              conjunto com estes Termos de Uso.
            </p>
          </section>


          {/* 13 */}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              13. Alterações destes Termos
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Estes Termos poderão ser atualizados para refletir alterações
              na plataforma, em suas funcionalidades, nas regras aplicáveis
              ou em requisitos legais. A versão vigente será disponibilizada
              nesta página.
            </p>
          </section>


          {/* DATA */}

          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              Última atualização: agosto de 2026.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}