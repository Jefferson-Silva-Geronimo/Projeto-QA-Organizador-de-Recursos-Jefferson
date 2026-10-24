# Processo de defeitos

Processo de registro, triagem e fechamento de defeitos do projeto Organização de Recursos. Base: Aula 05 e exigência de "registro de defeitos encontrados, priorizados e corrigidos" na [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção 7.

## 1. Vocabulário

Os quatro termos são coisas distintas. A correção mira o **defeito**, não o relato.

| Termo | Significado |
| --- | --- |
| Erro humano | Equívoco de uma pessoa ao especificar, projetar ou codificar |
| Defeito | Falha no artefato (documento, modelo, código ou configuração) causada por um erro humano |
| Falha | Comportamento incorreto observado quando o defeito é exercitado |
| Incidente | Ocorrência que afeta a operação e exige resposta, mesmo sem defeito identificado |

## 2. Como relatar

Abra uma issue com o modelo [defeito.md](../../.github/ISSUE_TEMPLATE/defeito.md). Todo relato traz:

- passos mínimos para reproduzir;
- resultado esperado e obtido;
- requisito, regra ou cenário ligado (RF-xx, RN-xx, RNF-xx, CEN-xx);
- evidência sem segredo, token ou dado pessoal real. Use dados fictícios.

## 3. Severidade e prioridade

| Eixo | O que mede | Quem decide | Justificativa |
| --- | --- | --- | --- |
| Severidade | O dano que o defeito causa | Quem triou | Obrigatória |
| Prioridade | A ordem de correção | Equipe, no planejamento | Obrigatória |

| Severidade | Critério |
| --- | --- |
| Crítica | Viola limitador de nota da especificação (aplicação que não executa, pipeline ausente, falha de autorização, possibilidade de dupla reserva) ou expõe segredo |
| Alta | Quebra uma regra crítica (RN-01 a RN-08) ou impede entrega de um requisito crítico |
| Média | Quebra comportamento sem violar regra crítica, com contorno |
| Baixa | Cosmético, texto ou documentação sem efeito no comportamento |

Severidade e prioridade são independentes: um defeito de severidade baixa pode ter prioridade alta se bloqueia uma entrega.

## 4. Ciclo de vida

```text
Novo → Triado → Em correção → Em verificação → Fechado
```

| Estado | Entra quando | Sai quando |
| --- | --- | --- |
| Novo | A issue é aberta com a label `needs-triage` | Severidade, prioridade e requisito são registrados |
| Triado | Há severidade e prioridade justificadas | Alguém assume a correção em branch |
| Em correção | Existe branch ou pull request | O pull request está pronto para verificação |
| Em verificação | O teste de regressão passa na CI | Outra pessoa confirma |
| Fechado | A issue está ligada ao PR, o teste de regressão é identificável e o resultado verde é reproduzível | — |

Três desfechos exigem registro: **duplicado** (aponta a issue original), **não reproduzível** (registra o que foi tentado) e **não será corrigido** (registra o motivo e quem decidiu).

## 5. Fechamento

Um defeito só fecha com:

1. issue ligada ao pull request da correção;
2. teste de regressão identificável (CT-xxx ou classe de teste), escrito antes da correção quando a técnica for TDD;
3. resultado verde reproduzível na CI, com o ID do run.

Teste que falha **não** é alterado, desativado nem enfraquecido para passar: ele é confrontado com a regra na fonte.

## 6. Métricas

| Permitida | Observação |
| --- | --- |
| Tempo de ciclo por severidade | Da abertura ao fechamento |
| Taxa de reabertura | Defeitos reabertos sobre fechados |
| Defeitos escapados por etapa | Etapa em que nasceu contra etapa em que foi encontrado |

**Proibida:** quantidade de defeitos por pessoa. Ela incentiva esconder defeito e não mede qualidade.

## 7. Labels

Criadas no repositório com `gh label create` (o `--force` atualiza a label se já existir):

```bash
gh label create bug --color d73a4a --description "Defeito confirmado" --force
gh label create needs-triage --color fbca04 --description "Aguardando severidade, prioridade e requisito" --force
gh label create severidade-critica --color b60205 --description "Viola limitador de nota ou expõe segredo" --force
gh label create severidade-alta --color d93f0b --description "Quebra regra ou requisito crítico" --force
gh label create severidade-media --color fbca04 --description "Quebra comportamento com contorno" --force
gh label create severidade-baixa --color 0e8a16 --description "Cosmético, texto ou documentação" --force
gh label create regressao --color 5319e7 --description "Defeito que voltou depois de corrigido" --force
```

## 8. Índice

Registra apenas defeitos **reais** encontrados até aqui. BUG-001 a BUG-006 foram achados e corrigidos antes de existir este processo; suas issues (3 a 8) são **retroativas**, abertas e fechadas em 17/10/2026. A partir de agora todo defeito nasce numa issue; BUG-007 a BUG-009 ainda estão sem issue (travessão). BUG-010 a BUG-014 foram achados no front em 18/10/2026 e têm issues **retroativas** (27 a 31), abertas depois de achados e corrigidos. BUG-015 e BUG-016 foram achados em 19/10/2026 e já nasceram com issue (33 e 35). BUG-017 foi aberto em 22/10/2026 (issue 39), a terceira ocorrência do risco aceito R-25. BUG-018 foi achado em 22/10/2026 pelo roteiro de navegador real e já nasceu com issue (42). BUG-019 foi achado em 24/10/2026 pela prova de clone limpo da Fase 7 e já nasceu com issue (60). BUG-020 a BUG-027 foram achados em 24/10/2026 pela auditoria da RTM (7.A) e já nasceram com issue (63 a 70); estão **Triados** e nenhum foi corrigido, por determinação da própria auditoria.

| BUG | Defeito | Issue ou PR | Severidade | Prioridade | Estado | Correção | Teste de regressão |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | Relações um-para-um do DBML geravam a chave estrangeira no sentido invertido (`recursos.id` referenciando `salas`). Achado ao aplicar o esquema em PostgreSQL | [Issue 3 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/3) | Alta: modelo inviável para RN-02 | Alta: bloqueava o modelo | Fechado | `8bf9d40` | Parser `@dbml/cli` e esquema aplicado, com as 23 chaves estrangeiras conferidas |
| BUG-002 | Diagrama de cancelamento permitia ao Responsável cancelar SOLICITADA de outro usuário, contra RN-18 | [Issue 4 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/4) | Média: diagrama contradiz regra | Média | Fechado | `4a78280` | Cobertura RF → diagrama e conferência de [fluxos-sequencia.md](../prd/fluxos-sequencia.md) contra RN-18 |
| BUG-003 | Dado fictício contraditório: Professor 1 era "sem vínculo" na tabela de dados e aparecia vinculado a um Solicitante no exemplo de RN-13 | [Issue 5 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/5) | Baixa: exemplo de documentação | Baixa | Fechado | `5034b76` | Conferência dos exemplos de [regras-negocio.md](../prd/regras-negocio.md) |
| BUG-004 | Brecha em C1: alteração que incluía recurso restrito numa reserva aprovada automaticamente contornava RN-06 | [Issue 6 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/6) | Crítica: contorna aprovação obrigatória | Alta | Fechado | `d843f34` (decisão D12) | CT-048 e CT-049 (`ReservasApiIT`), cenário CEN-11, verdes na execução de 17/10/2026 |
| BUG-005 | Diagrama de componentes sem aresta do agendador para a auditoria e a persistência, divergindo do texto da seção 13.7 | [Issue 7 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/7) | Baixa: diagrama incompleto | Baixa | Fechado | `beb9fa1` | Diagrama renderizado de novo e revisão pelo facilitador ATAM |
| BUG-006 | `mvnw` commitado sem permissão de execução no Windows. A CI falhou com exit 126 | [PR 1](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/pull/1) e [issue 8 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/8) | Alta: pipeline não executa o build | Alta: bloqueia toda a CI | Fechado | `af89f13` | Run da CI `38786037634` verde, que executa `./mvnw -B verify` |
| BUG-007 | Impasse do PostgreSQL (`deadlock detected`, SQLState 40P01) quando duas transações inserem ocupações sobrepostas ao mesmo tempo. A aplicação respondia com erro interno em vez de 409. Achado pelo teste de concorrência CT-064 (risco R-17 materializado) | — | Alta: viola o tratamento seguro de erros e a resposta de RF-06 | Alta | Fechado | `eb7f5b1` | CT-064 em `ConcorrenciaApiIT`, vermelho em `test(red)` e verde em `fix(green)` |
| BUG-008 | A validação do corpo da requisição rodava antes da autorização por perfil: um perfil sem permissão recebia 400 em vez de 403 e via as regras de validação. Achado pela matriz perfil × operação (CT-117, 18 casos) | — | Alta: falha de autorização é limitador de nota (especificação, seção 8) | Alta | Fechado | `73488e5` | CT-117 em `AutorizacaoApiIT`, 137 casos, vermelho em `test(red)` e verde em `fix(green)` |
| BUG-009 | Falha ao gravar a tentativa de conflito (RN-30) derrubava a resposta: o solicitante recebia 500 em vez do 409 decidido em 15/10/2026 (ADR-003). Achado na avaliação arquitetural [ciclo-01.md](../avaliacao-arquitetural/ciclo-01.md) (DV-01), confirmado por teste com falha injetada | — | Alta: a resposta de RF-06 e de RN-03 muda sob falha | Alta | Fechado | `61ce37d` | `FalhaNaTentativaApiIT` (2 casos), vermelho em `0a80fc7` (esperado 409, obtido 500) e verde em `61ce37d` |
| BUG-010 | Foco do teclado se perde ao trocar de tela. Depois de ativar o link "Reservar" da Busca só com o teclado, o foco ficava no corpo da página e o Tab seguinte recomeçava do topo. Achado por: Roteiro em navegador real (Playwright), fluxo só com teclado. | [Issue 27 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/27) | Média: barreira de teclado com contorno (Tab desde o topo) | Alta: bloqueia o uso só com teclado | Fechado | `8ad762c` | `Rotas.test.tsx`: "ao trocar de tela pelo menu o foco vai para o conteúdo" (vermelho), mais dois testes que nasceram verdes: o foco não é roubado na abertura nem ao mudar só os filtros. Run da CI `39165239588` verde (job `frontend`: 30 arquivos, 391 testes, 0 falhas). |
| BUG-011 | Todas as telas tinham o mesmo título de página. O título da aba era sempre "Organização de Recursos", sem indicar a tela. Achado por: Roteiro em navegador real, ao conferir o que o leitor de tela anuncia. | [Issue 28 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/28) | Baixa: o título da tela (h1) já identifica a tela; o título da aba era genérico | Baixa | Fechado | `8ad762c` | `Rotas.test.tsx`: 5 casos de título (Buscar, Nova reserva, Aprovações, página não encontrada e Entrar), vermelhos antes da correção. Run da CI `39165239588` verde (job `frontend`: 30 arquivos, 391 testes, 0 falhas). |
| BUG-012 | Ícone do calendário dos campos de data sem foco visível. Cada campo de data e hora tem 6 paradas de Tab; na sexta, o ícone do calendário, não aparecia nenhum anel de foco. Achado por: Roteiro em navegador real, fluxo só com teclado, confirmado por captura ampliada. | [Issue 29 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/29) | Média: o foco some numa parada de Tab | Alta: o campo é usado nos dois fluxos | Fechado | `fbc40e3` | `foco-do-calendario.test.ts` confere que a regra existe e usa a cor de foco do tema. O jsdom não calcula o pseudo-elemento interno, então a prova visual é o roteiro em navegador real, com captura nos dois temas. Run da CI `39165239588` verde (job `frontend`: 30 arquivos, 391 testes, 0 falhas). |
| BUG-013 | Confirmação da reserva mostrava "Recurso 2" no lugar do nome da sala. Depois de reservar a Sala 203, a confirmação listava "Recurso 2" em vez do nome. Achado por: Roteiro em navegador real contra a API real. | [Issue 30 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/30) | Média: a confirmação fica incompreensível, a reserva está correta | Média | Fechado | `22ef543` | `PaginaDeNovaReserva.envio.test.tsx`: "a confirmação mostra os nomes dos recursos mesmo que o servidor já não os liste como livres", com a segunda consulta sem a sala. Run da CI `39165239588` verde (job `frontend`: 30 arquivos, 391 testes, 0 falhas). |
| BUG-014 | Sala já ocupada continuava listada como livre depois de um conflito. Depois da recusa por CONFLITO_DE_ALOCACAO, a sala continuava na lista de recursos livres e marcada. Achado por: Roteiro em navegador real, com reserva concorrente de verdade. | [Issue 31 retroativa](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/31) | Baixa: o servidor impede a dupla reserva; só induz uma segunda tentativa inútil | Baixa | Fechado | `67d3150` | `PaginaDeNovaReserva.erros.test.tsx`: "refaz a lista de recursos livres e avisa que o recurso escolhido deixou de estar livre" (vermelho); "outras recusas não refazem a lista" nasceu verde. Run da CI `39165239588` verde (job `frontend`: 30 arquivos, 391 testes, 0 falhas). |
| BUG-015 | Foco do teclado fica no corpo da página depois de entrar. Ao fazer login, a casca das telas monta já na tela de destino e só movia o foco quando o caminho mudava dentro dela; o Tab seguinte recomeçava do topo. Achado por: Roteiro em navegador real, modo login, nos perfis Solicitante e Responsável, em 360 e 1280 px, nos dois temas (mesma classe do BUG-010). | [Issue 33](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/33) | Média: barreira de teclado com contorno (Tab desde o topo) | Alta: acontece em todo login | Fechado | `4df87e8` | `Rotas.test.tsx`: "depois de entrar o foco vai para o conteúdo, para o teclado não ficar no corpo da página (BUG-015)", vermelho por asserção (`toHaveFocus`) em `c009d40` e verde em `4df87e8`. Run da CI `39322461829` verde (job `frontend`: 33 arquivos, 450 testes, 0 falhas). |
| BUG-016 | Administrador via o botão Alterar na lista de Reservas, e ele levava a "Seu perfil não permite esta ação". A alteração é parte da T03, que o Administrador não vê (RN-17). Achado por: capturas do roteiro em navegador real (T04), sessão de Administrador. | [Issue 35](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/35) | Baixa: o servidor e a rota já recusavam; a pessoa só via uma ação que nunca funciona | Baixa | Fechado | `35ddae4` | `PaginaDeReservas.perfis.test.tsx`: "o Administrador cancela com motivo, mas não vê Alterar", vermelho por asserção em `c3ed51b` e verde em `35ddae4`; os testes do Solicitante e do Responsável nasceram verdes. Run da CI `39333087251` verde (job `frontend`: 37 arquivos, 548 testes, 0 falhas). |
| BUG-017 | Teste de integração intermitente em suíte completa: `NotificacaoApiIT.int01ECt103` espera 2 notificações despachadas e recebe 0 (`expected: 2 but was: 0`); passa sozinho. Terceira ocorrência do risco aceito R-25 (18/10, 19/10 e 22/10/2026). Mecanismo provado: as duas chamadas ao WireMock estouram o limite de leitura de 1,5 s no início da classe; causa da parada **não encontrada**. Achado por: suíte completa local. | [Issue 39](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/39) | Média: teste instável, sem defeito de produto provado e com contorno (repetir) | Média (decisão de Jefferson, 22/10/2026) | **Mitigado** (não corrigido; causa desconhecida; R-25 aberto) | `24095c4`: `NotificacaoApiIT` com limite de leitura de 10 s e `int04` em `NotificacaoTempoLimiteApiIT` com o limite de produção ([R-26](../decisoes-equipe.md)). `src/main` sem diff | Sem teste de regressão possível (a falha não se reproduz). Prova de que os testes protegem: quebras de propósito do contrato do corpo (`int01` vermelho) e do `setReadTimeout` (`int04` vermelho), ambas revertidas |
| BUG-018 | A tela de acesso negado não tinha título de página (`h1`) e a aba mostrava o nome da tela negada (por exemplo "Aprovações"). O axe acusava `page-has-heading-one` em 8 de 8 estados de acesso negado (Solicitante e Administrador abrindo `/aprovacoes`, 360 e 1280 px, claro e escuro). Defeito do componente `RotaProtegida`, anterior à T05. Achado por: roteiro em navegador real, modo `aprovacoes`. | [Issue 42](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/42) | Baixa: a mensagem já era anunciada como alerta e o servidor recusa o acesso; faltava o título | Média: afeta toda tela protegida por perfil | Fechado | `55b37c7` | `RotaProtegida.test.tsx` ("a tela de acesso negado tem o título de página...") e `Rotas.test.tsx` (4 casos de título na página e na aba), vermelhos por asserção em `611db6e` e verdes em `55b37c7`. Roteiro refeito com a correção: 32 estados no axe, 0 violações. |
| BUG-019 | O README não sobe a aplicação num clone limpo. O passo 3 manda exportar só `DB_URL`, `DB_USER` e `DB_PASSWORD`, mas `SESSAO_DURACAO`, `LOGIN_TENTATIVAS` e `LOGIN_JANELA` não têm valor padrão e a aplicação termina com `APPLICATION FAILED TO START` (`app.sessao.duracao`); o primeiro Administrador (`BOOTSTRAP_ADMIN_*`) também não era mencionado. Achado por: prova de clone limpo (limitador de nota), item 2.2a da Fase 7. | [Issue 60](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/60) | Crítica: viola limitador de nota "aplicação que não executa" (critério da seção 3); o dano é de documentação e tem contorno (ler `application.yml`) | Alta: bloqueia a prova do limitador antes da tag | Fechado em 24/10/2026 (aberto e fechado no mesmo dia) | `e01da39` (README, seção "Como subir"; PR #61, merge `84c58eb`) | Sem teste automatizado possível para o README. Regressão: refazer o clone limpo seguindo só o README corrigido. Feita no branch da correção: aplicação no ar (`Started ... in 23,356 s`), saúde `UP`, login 200 e `GET /api/auth/eu` 200; registro em [limitadores-de-nota.md](../testes/limitadores-de-nota.md). Run da CI `40102847090` verde na `main` (commit `84c58eb`). Refazer no commit da tag (2.7) |
| BUG-020 | RTM liga cada RN a um bloco de CT, não aos CT rotulados com a regra. Nas 33 RN o conjunto de CT da linha difere do conjunto rotulado no Rastreio de `casos-de-teste.md`; nas críticas RN-01 a RN-08 faltam CT rotulados (por exemplo, RN-06 sem CT-066 e CT-067) e sobram CT sem o rótulo; 46 dos 167 CT não aparecem na RTM. Achado por: auditoria da RTM (7.A) | [Issue 63](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/63) | Média: a regra tem testes, o vínculo é impreciso | A definir pela equipe | Triado | — | RTM: cada RN cita os CT rotulados com a regra. Documentação; sem teste automatizado |
| BUG-021 | Resumo da RTM desatualizado: diz 48 testadas e 1 parcial, a matriz tem 49 `testado` e 0 `parcial` (RF-13 passou a `testado` na E-22). Achado por: auditoria da RTM (7.A) | [Issue 64](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/64) | Baixa: número errado em documento | A definir pela equipe | Triado | — | Resumo igual à contagem da matriz. Documentação |
| BUG-022 | "137 casos" desatualizado: `AutorizacaoApiIT` tem 141 testes (CI `40102847090`), mas `RTM.md:122` e `revisao-seguranca.md:32` dizem 137 (também em ciclo-01, analise-causa-raiz e relatórios das Fases 4 e 5, que são fotografias datadas). Achado por: auditoria da RTM (7.A) | [Issue 65](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/65) | Baixa: número desatualizado; a matriz confere e passa | A definir pela equipe | Triado | — | RTM e revisão de segurança citam 141 com o run. Documentação |
| BUG-023 | `ConcorrenciaApiIT.ct063` dá erro de SQL (`ConcorrenciaApiIT.java:223`) e não falha por asserção quando a constraint não existe; os outros seis testes falham por asserção. Achado por: experimento da etapa 2.2d, registrado na auditoria 7.A | [Issue 66](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/66) | Baixa: nenhum efeito no produto; mensagem do vermelho menos clara | A definir pela equipe | Triado | — | Teste que, sem a constraint, falha por asserção de precondição e continua verde com ela; em TDD, sem enfraquecer o teste |
| BUG-024 | 27 dos 35 CT de front e E2E citados na RTM não têm identificador `CT-nnn` no código dos 57 arquivos de teste do front e do E2E; a ligação é só por descrição em prosa. Achado por: auditoria da RTM (7.A) | [Issue 67](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/67) | Média: rastreabilidade manual para as 11 telas e o E2E | A definir pela equipe | Triado | — | Cada CT de front e E2E aponta para arquivo e teste. Forma (identificador no nome ou tabela) a decidir por Jefferson |
| BUG-025 | RTM cita só a execução local E-1 para 38 de 55 linhas; as classes passaram na CI atual (run `40103681320`), mas a RTM não aponta para esse run. Achado por: auditoria da RTM (7.A) | [Issue 68](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/68) | Baixa: a evidência existe, o vínculo é antigo e local | A definir pela equipe | Triado | — | Nova execução (E-24) com run da CI da `main` e linhas apontando para ela. Documentação |
| BUG-026 | Nenhum teste isola a RN-06 para o Solicitante. Ao apagar o portão de perfil da aprovação (`SegurancaConfig.java` e `@PreAuthorize` de `ReservaController.aprovar`), só os casos do Administrador ficaram vermelhos (`ct067` linha 134 e `ct117[60]`); o caso do Solicitante seguiu em 403 porque o teste usa a própria reserva e o 403 vem da RN-16. Achado por: "apague a regra" da auditoria 7.A | [Issue 69](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/69) | Alta: lacuna de teste em regra crítica (RN-06, risco R-03); o portão existe no código | A definir pela equipe | Triado | — | Teste novo: Solicitante aprova a reserva de outra pessoa e espera 403 `ACESSO_NEGADO`; visto vermelho com o portão removido (worktree) e verde com o código atual. Em TDD |
| BUG-027 | README desatualizado além do Como subir: roadmap com Fases 6 e 7 "Prevista", proteção da `main` com "ao menos uma aprovação" (a real exige 0 e os checks `test`, `frontend` e `e2e`), "status não iniciado" da RTM, pastas "previstas" e sem links de JaCoCo, SonarCloud e evidências. Achado por: leitura do README na prova de clone limpo (2.2) e pedido de Jefferson | [Issue 70](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/70) | Média: o README contradiz o estado real | A definir pela equipe | Triado | — | README conferido contra a API de proteção e os relatórios; analyze-docs sem erros; clone limpo refeito no commit da tag |

Observações:

- BUG-006 é o único defeito achado pela CI. Run vermelho `38785819928`, run verde `38786037634`.
- BUG-007 é o primeiro defeito achado por teste de concorrência na Fase 4. A causa está no comportamento da constraint de exclusão: cada transação insere a entrada do índice antes de verificar o conflito e, se cada uma encontra a outra em andamento, o banco derruba uma por impasse. ADR-003 já previa o tratamento; faltava implementá-lo.
- Um número sem origem em ADR-008 (contagem de regras ligadas a RF-13) foi apontado na revisão e corrigido **antes** do commit, por isso não entra no índice.
- Defeitos escapados por etapa: BUG-001 a BUG-005 nasceram em documentação e foram achados em revisão; BUG-006 nasceu na casca do projeto e foi achado na CI.
- BUG-019 nasceu na casca do projeto (README da Fase 3, nunca atualizado quando a aplicação passou a exigir `SESSAO_DURACAO` e `LOGIN_*`) e foi achado só na prova de clone limpo da Fase 7: escapou da Fase 3 à Fase 6.
- BUG-020 a BUG-027 foram achados pela auditoria da RTM (Fase 7, 7.A): BUG-020 a BUG-022, BUG-024, BUG-025 e BUG-027 nasceram em documentação (RTM, revisão de segurança e README) e BUG-023 e BUG-026 em teste; todos foram achados na Fase 7, os de documentação e o de teste do RN-06 já existiam desde as Fases 3 a 6. Detalhes em [auditoria-rtm.md](../testes/auditoria-rtm.md).
- BUG-010 a BUG-014 nasceram no front (etapas 6.B e 6.C) e foram achados pelo **roteiro em navegador real**
  ([roteiro-navegador-real](../testes/roteiro-navegador-real/README.md)), não pelos 391 testes de componente. Os testes de
  componente usam uma API simulada e o jsdom, que não reproduzem a troca de foco entre telas, o foco em pseudo-elemento
  interno do navegador nem o refazer da consulta depois de uma reserva. Etapa em que nasceram: implementação do front;
  etapa em que foram achados: verificação em navegador real. Os cinco fecharam com o run da CI `39165239588`, verde.
