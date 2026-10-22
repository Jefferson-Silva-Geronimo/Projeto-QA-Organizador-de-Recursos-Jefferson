# Pendências para o fechamento (Fase 7)

Lista viva de tudo o que precisa entrar no fechamento da Fase 7. A Fase 7 **ainda não foi executada**. Quando Jefferson pedir,
este arquivo vira a base do prompt dela.

## Como manter

- Cada item tem **origem** e **arquivo**. Item sem origem rastreável não entra.
- Atualizar a cada pull request, na seção "Histórico de atualizações".
- Quando um item for resolvido, a situação muda para "resolvido", com o PR; o item não é apagado.

| Origem | Significado |
| --- | --- |
| Fato | Está no repositório, no arquivo indicado |
| Decisão | Escolha da equipe, com o ID em [decisoes-equipe.md](decisoes-equipe.md) |
| Lacuna | Ponto sem resposta, a validar com o professor |
| Suposição | Premissa adotada sem resposta, com o impacto registrado |

## 1. Segurança e dívida técnica

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| SEC-03: SBOM e soma de verificação do Maven no wrapper (A03) | Fato | [revisao-seguranca.md](testes/revisao-seguranca.md), tabela de achados; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Aberto, previsto para a Fase 7 |
| SEC-04: alerta de segurança além do log (A09) | Fato | [revisao-seguranca.md](testes/revisao-seguranca.md), tabela de achados; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Aberto, previsto para a Fase 7 |
| Modelo de ameaças formal (OWASP A06, Insecure Design) | Fato | [revisao-seguranca.md](testes/revisao-seguranca.md), seção A06 ("escrever um modelo de ameaças curto na Fase 7, se o grupo achar necessário") | Opcional, a critério de Jefferson |
| R-23: a aplicação usa o papel dono das tabelas, que pode desligar o gatilho da auditoria; separar papéis de migração e de aplicação vai à dívida técnica | Decisão (risco aceito por Jefferson) | [decisoes-equipe.md](decisoes-equipe.md), seção "Resultado da execução de P5-08 e risco aceito R-23"; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 5 | Aberto: declarar no relatório final como dívida técnica |
| Limite de login: pode bloquear a conta de outra pessoa de propósito; tentativas simultâneas podem passar de N por pouco; o e-mail da falha fica guardado durante a janela | Decisão (D18, SEC-01) com limitações conhecidas | [decisoes-equipe.md](decisoes-equipe.md), seção 6; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 5 | Aberto: declarar as limitações no relatório final |
| 22 alertas abertos do Dependabot (npm), todos em manifestos do **framework AIOX** (`.aiox-core/package-lock.json` e `.aiox-core/scripts/diagnostics/health-dashboard/package-lock.json`); nenhum em `frontend/` nem no Maven. Conferido em 18/10/2026 pela API do GitHub. O framework é camada protegida (L1) e não deve ser editado | Fato | GitHub, aba de segurança (Dependabot); [relatório de sessão](relatorio-sessao-fase-6-andamento.md) | Aberto: Jefferson decide se dispensa os alertas como "não se aplica ao produto" ou atualiza o framework pelo canal dele |
| Versões fixadas por incompatibilidade: TypeScript 5.9 (a 7.x conflita com `openapi-typescript` e `typescript-eslint`) e ESLint 9 (`eslint-plugin-jsx-a11y` não aceita a 10) | Fato (verificado na instalação) | [ADR-015](adr/ADR-015-stack-do-front-end.md), seção "Ajustes de versão na etapa 6.B"; `.github/dependabot.yml` | Reavaliar quando os pacotes aceitarem as versões novas |

## 2. Desempenho

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| **RNF-08b não atendido nesta máquina** (criação de reserva com p95 de até 300 ms com 50 usuários). Causa localizada: `fsync` do PostgreSQL em Docker (sem `fsync`, p95 de 87 ms, rodada de diagnóstico que não vale como resultado). Entra no relatório final como **meta não atingida**, com a frase de [resultado-02.md](performance/resultado-02.md): "RNF-08b não atendido nesta máquina; causa atribuída ao `fsync` do PostgreSQL em Docker" | Fato | [resultado-02.md](performance/resultado-02.md), seções de decisão e consequência; [rnf.md](performance/rnf.md), linha RNF-08b | Aberto: escrever no relatório final |
| A hipótese de 300 ms é da Aula 10 e **não foi validada** pelo professor | Lacuna | [resultado-02.md](performance/resultado-02.md); [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Depende do professor |
| Repetir a carga em outra máquina ou em disco rápido, e repetir cada rodada (cada uma foi executada uma vez; a variação é desconhecida) | Fato | [resultado-02.md](performance/resultado-02.md), parágrafo final; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Opcional: o projeto não tem outro ambiente |

## 3. Testes e evidência

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| Ocorrência a vigiar: `NotificacaoApiIT.int01ECt103` falhou uma vez em 18/10/2026, sem causa determinada; nenhum teste alterado | Fato | [ocorrencias-a-vigiar.md](testes/ocorrencias-a-vigiar.md) | Aberto: vigiar; se falhar de novo, avisar Jefferson com os logs |
| RF-13 está **parcial** na RTM. A etapa 6.B entregou o mapa de erros, a sessão, o contraste e a navegação; fecham com as telas (6.C) e o teste E2E em viewport de celular (6.D) | Fato | [RTM.md](../RTM.md), linha de RF-13; [navegacao-telas.md](prd/navegacao-telas.md) | Aberto: depende de 6.C e 6.D |
| Tornar o job `e2e` obrigatório na `main` só depois de visto verde em um PR real | Decisão | Combinado com Jefferson em 18/10/2026; o job `frontend` já é obrigatório | Aberto: 6.D |

## 4. Dependem do professor

Nenhuma bloqueia o trabalho: cada uma tem suposição e impacto registrados.

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| Lacunas A1 a A8 da especificação, resolvidas por suposição (S-A1 a S-A8) | Lacuna | [perguntas-professor.md](perguntas-professor.md); [decisoes-equipe.md](decisoes-equipe.md), seção 4 | Sem resposta |
| D1 (tolerância de não comparecimento), D3 (reenvio de notificação), D4 (tamanho da página do relatório), D9 (retenção da auditoria e das notificações), D17 (duração da sessão) | Lacuna | [perguntas-professor.md](perguntas-professor.md); [decisoes-equipe.md](decisoes-equipe.md), seção 4 | Sem resposta |
| Uma equipe de uma pessoa atende à "revisão por pares" da especificação? Hoje: autorrevisão e revisão assistida registrada, sempre chamada de "revisão assistida" | Lacuna, com suposição S-PAR e decisão P5-09 | [perguntas-professor.md](perguntas-professor.md), seção "Revisão por pares"; [decisoes-equipe.md](decisoes-equipe.md) | Sem resposta |

## 5. Ações de Jefferson

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| Revogar o token do SonarCloud que foi colado em uma conversa (já foi substituído no GitHub), se ainda não foi feito | Fato | [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 6 | Confirmar com Jefferson |

## 6. Achados da Fase 6 ainda não corrigidos

Achados das etapas 6.C e 6.D que não forem corrigidos na hora entram aqui, com origem e arquivo.

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| **Limitação declarada:** anel de foco do ícone do calendário nos campos de data e hora é o do navegador (preto no claro, branco no escuro); a cor do sistema não é aplicada pelo Chromium nesse botão interno | Fato (observado no teste em navegador real) | [Campo.module.css](../frontend/src/ui/Campo.module.css), [foco-do-calendario.test.ts](../frontend/src/ui/foco-do-calendario.test.ts) | Aceito pela visibilidade; declarar no relatório de acessibilidade |
| **Limitação declarada:** axe com 24 verificações `color-contrast` incompletas, todas no glifo decorativo do aviso (`aria-hidden`); o par de cores está coberto pelo teste de tokens | Fato | [Aviso.tsx](../frontend/src/ui/Aviso.tsx), [navegacao-telas.md](prd/navegacao-telas.md), seção 9 | Declarar a limitação no relatório de acessibilidade |
| **Limitação declarada:** com o diálogo de cancelamento aberto, o axe deixa `color-contrast` incompleto no campo Motivo, na ajuda e na ação sugerida do erro ("o fundo não pôde ser determinado porque se sobrepõe a outros elementos"). Não é violação. Contraste medido à mão no navegador: de 6,69 a 16,86 no tema claro e de 8,19 a 14,56 no escuro (mínimo 4,5) | Fato (medição em navegador real, 19/10/2026) | [Dialogo.tsx](../frontend/src/ui/Dialogo.tsx); [RTM.md](../RTM.md), execução E-8 | Declarar a limitação no relatório de acessibilidade |
| **Dúvida para Jefferson (T04):** o Responsável vê Alterar e Cancelar em reservas de outras pessoas, e o servidor recusa com `ACESSO_NEGADO` (a alteração é só do dono, RN-19; o cancelamento de SOLICITADA é do dono ou do Administrador, RN-18). Esconder a ação por dono exigiria o front saber o id do usuário, que hoje a sessão não guarda (F6-02). Opções: guardar o id vindo de `GET /api/auth/eu`, ou manter como está e mostrar a recusa. Nada foi inventado: a tela segue o que o back end e RN-18 e RN-19 já fazem | Lacuna | [PoliticaDeAlteracao.java](../src/main/java/br/senac/recursos/model/regra/PoliticaDeAlteracao.java); [PoliticaDeCancelamento.java](../src/main/java/br/senac/recursos/model/regra/PoliticaDeCancelamento.java); [navegacao-telas.md](prd/navegacao-telas.md), seção 4 | Resolvida pela F6-14 (alternativa C): o back end informa `podeAlterar` e `podeCancelar` por reserva (PR 37); a tela passa a usá-los no PR seguinte |
| **Dúvida para Jefferson (T04):** reserva APROVADA continua "Aprovada" na lista depois do horário de início, até o Responsável registrar o início (RN-20). O servidor recusa o cancelamento e a alteração pelo dono com `RESERVA_JA_INICIADA` (D10), e a tela mostra essa recusa. Avisar "já começou" na própria lista exigiria o front olhar o relógio, o que contraria o princípio de que ele não decide (ADR-004). Hoje a tela não avisa | Lacuna | [navegacao-telas.md](prd/navegacao-telas.md), seção 1; [regras-negocio.md](prd/regras-negocio.md), RN-07, RN-18 e RN-20 | Resolvida pela F6-14 (alternativa C): depois do início `podeAlterar` e `podeCancelar` do dono vêm falsos (PR 37); a mensagem para a ação ausente entra no PR da T04 |
| `GET /api/reservas` devolve todas as reservas visíveis ao perfil, sem paginação, sem filtro por estado ou período e em ordem crescente de início (inclui as passadas e as canceladas). Para o Responsável e o Administrador a lista cresce sem limite, o mesmo risco registrado para a auditoria (L-03). A especificação não define ordem nem filtros da lista | Fato (`JdbcReservaRepository.java`, sem `limit`) e lacuna (ordem e filtros) | [JdbcReservaRepository.java](../src/main/java/br/senac/recursos/repository/JdbcReservaRepository.java); [navegacao-telas.md](prd/navegacao-telas.md), seção 7 | Aberto: avaliar paginação e filtros se a lista passar a pesar |
| O diálogo de confirmação é próprio (`role="dialog"`, foco preso, Escape e foco devolvido) porque o jsdom 29 não implementa `<dialog>.showModal()`; trocar pelo `<dialog>` nativo quando os testes de componente puderem exercitá-lo | Fato | [Dialogo.tsx](../frontend/src/ui/Dialogo.tsx) | Dívida técnica, sem prazo |
| `docs/adr/ADR-015-stack-do-front-end.md` (linha 7) liga ao `plano_mestre.md`, material de apoio que o Git ignora. O `analyze-docs` avisa a cada execução. Citar o plano mestre sem link (por exemplo, "plano mestre, seção 10.3") resolve, mas é texto de uma decisão registrada e não foi alterado sem a sua decisão | Fato | [ADR-015](adr/ADR-015-stack-do-front-end.md); [AGENTS.md](../AGENTS.md), regra 7 | Aberto: decisão de Jefferson |
| **Incidente (19/10/2026): o hook de autoridade de publicação (push, criação e merge de PR) falhava aberto.** O comando do hook em `.claude/settings.local.json` era relativo (`node .aiox-core/...`) e rodava no diretório persistente do shell; quando esse diretório era `frontend/`, o `node` não achava o script e saía com código 1, que o Claude Code trata como erro **sem bloqueio**. Reproduzido: um `echo` com o texto do comando de push passou nesse estado. **Correção:** o comando passou a usar `node "$CLAUDE_PROJECT_DIR/.aiox-core/..."` (arquivo local, ignorado pelo Git, fora das áreas protegidas), e o bloqueio foi comprovado de dentro de `frontend/`. **Não houve publicação sem autorização:** o GitHub mostra, desde 17/10, só pushes aos branches `fase-6/tela-login` e `fase-6/tela-minhas-reservas` e os merges dos PRs 34 e 36, todos pedidos por Jefferson e todos com o prefixo `AIOX_ACTIVE_AGENT=devops`, que o hook aceitaria mesmo funcionando. **Falha aberta por desenho, corrigida em 19/10/2026 (aprovado por Jefferson):** o script do AIOX falha fechado nos erros que prevê (stdin vazio e JSON inválido, saída 2), mas qualquer falha que impeça o `node` de executá-lo saía com código diferente de 2 e não bloqueava. O script está em `.aiox-core/infrastructure` (camada protegida, não editado). Foi criado o invólucro [fail-closed.cjs](../.claude/hooks/fail-closed.cjs), que roda o script e só deixa o hook terminar em 0 (permite) ou 2 (barra), com uma guarda de shell no comando para node ausente, `NODE_OPTIONS` inválido e invólucro ausente. Em TDD, 15 casos em [fail-closed.test.cjs](../.claude/hooks/fail-closed.test.cjs) (`node --test .claude/hooks/`): comando comum, prefixo `AIOX_ACTIVE_AGENT=devops`, stdin vazio, JSON inválido, caminho errado, exceção, saída 1 e 7, tempo esgotado, `NODE_OPTIONS` inválido, node ausente, invólucro ausente e mensagem do bloqueio. **Limites que ficam:** o comando está em `.claude/settings.local.json`, que o Git ignora (outra máquina ou clone precisa repetir a configuração, com o comando de `comandoDoHook()`); o prefixo `AIOX_ACTIVE_AGENT=devops` é autodeclarado, como o próprio script avisa ("guardrail, não fronteira de segurança"); um hook que sempre nega, por defeito, bloqueia todos os comandos de Bash até ser corrigido (é o preço da falha fechada) | Fato (reproduzido) | `.claude/settings.local.json` (local); [enforce-git-push-authority.cjs](../.aiox-core/infrastructure/templates/grok-hooks/enforce-git-push-authority.cjs) (somente leitura) | Corrigido (caminho e falha aberta); limites acima declarados |
| **Risco aceito R-25:** `NotificacaoApiIT.int01ECt103` falhou 2 vezes em suítes completas (18/10 e 19/10), passa sozinho; causa **não encontrada**; hipótese sem prova de parada de mais de 3 s do WireMock ou do cliente HTTP na primeira chamada da classe; limite de leitura de 1,5 s é valor inicial a validar (ADR-007). Entra no relatório final como risco aceito | Fato (2 ocorrências) e decisão (risco aceito por Jefferson, 19/10/2026) | [decisoes-equipe.md](decisoes-equipe.md), R-25; [ocorrencias-a-vigiar.md](testes/ocorrencias-a-vigiar.md) | Vigiado; regra de repetição única na CI |
| Campo de data e hora nativo: 6 paradas de Tab por campo no teclado (limitação declarada) | Decisão (F6-12) | [decisoes-equipe.md](decisoes-equipe.md); [navegacao-telas.md](prd/navegacao-telas.md), seção 9 | Aceito; declarar no relatório de acessibilidade |
| O roteiro de verificação em navegador real (axe, teclado, capturas) é manual; precisa virar teste E2E na CI | Fato | [roteiro-navegador-real](testes/roteiro-navegador-real/README.md); [RTM.md](../RTM.md), execução E-6 | Aberto: 6.D |
| Salto do `jsdom` 29 para 30: PR #24 do Dependabot fechado sem mesclar e o `jsdom` passou a ser ignorado; avaliar o salto em PR nosso, com a suíte completa do front. O Dependabot não recebe segredos, então o SonarCloud não roda nos PRs dele | Decisão (F6-13) | [decisoes-equipe.md](decisoes-equipe.md); `.github/dependabot.yml` | Aberto: avaliar o salto |

## Histórico de atualizações

| Data | Pull request | O que mudou |
| --- | --- | --- |
| 22/10/2026 | Back end da fila: `podeAprovar` e `podeRejeitar` (F6-15) | Campos por item da fila, no molde da F6-14; suposição de que a rejeição não tem limite de horário; BUG-017 (terceira ocorrência do R-25, issue 39) |
| 22/10/2026 | T04 usa as permissões do servidor (F6-14) | As duas dúvidas da T04 (ações por dono e reserva já iniciada) resolvidas no front pelos campos `podeAlterar` e `podeCancelar`; mensagem de ação ausente aprovada por Jefferson; roteiro de navegador real reescrito (execução E-10) |
| 19/10/2026 | Investigação do hook e do teste intermitente | Incidente do hook de publicação (falha aberta) e ocorrência 2 do `NotificacaoApiIT` |
| 19/10/2026 | T04 Minhas reservas e alteração | Limitação do axe no diálogo (contraste medido à mão), duas dúvidas para Jefferson (ações por dono e reserva já iniciada), lista sem paginação e diálogo próprio; BUG-015 e BUG-016 |
| 18/10/2026 | Login em andamento | Alertas do Dependabot (22, todos no framework AIOX) |
| 18/10/2026 | Aprovação do protótipo da 6.C | F6-11 a F6-13 e BUG-010 a BUG-014 (defeitos achados em navegador real); limitações declaradas; jsdom e Dependabot |
| 18/10/2026 | Protótipo da 6.C | Achados da Fase 6 acrescentados: anel do ícone do calendário, verificações incompletas do axe, campo de data e hora, roteiro manual e PR #24 do Dependabot |
| 18/10/2026 | Criação | Arquivo criado com os itens já registrados: SEC-03, SEC-04, A06, R-23, limites do login, versões fixadas, RNF-08b, ocorrência do `NotificacaoApiIT`, RF-13 parcial, pendências do professor e a revogação do token do SonarCloud |
