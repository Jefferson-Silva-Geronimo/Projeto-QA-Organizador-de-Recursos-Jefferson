# Relatório consolidado da Fase 6 (front end React + Vite): 18 a 22/10/2026

Visão da Fase 6 inteira, de 6.A a 6.D. **Cada número tem arquivo ou run de origem; o que não tem origem está listado como lacuna na seção 10.** Meta não atingida consta como não atingida. Complementa o [relatório de fechamento](relatorio-sessao-fase-6-fechamento.md) (porta de saída) e o [andamento](relatorio-sessao-fase-6-andamento.md). O que ficou para a Fase 7 está em [fase-7-pendencias.md](fase-7-pendencias.md).

## 1. Resumo

| Item | Estado |
| --- | --- |
| Etapas | 6.A, 6.B, 6.C e 6.D concluídas |
| Telas | **As 11 do mapa de telas** (T01 a T11), cada uma em TDD, verificada em navegador real contra a API e documentada |
| E2E | 5 testes Playwright contra PostgreSQL, API e front reais, sem mocks, na CI |
| Proteção da `main` | `test`, `frontend` e `e2e` obrigatórios (F6-21), com o resto da proteção inalterado |
| Repositório | `main` limpa, sem PR aberto e sem branch além da `main` |
| Porta de saída | Atingida; RF-11 e RF-14 por **interpretação declarada** (F6-20) e "nenhuma regra duplicada" **sem auditoria independente** (item da Fase 7) |
| Risco aceito | R-25 (teste intermitente de notificação, causa desconhecida) segue aberto |

## 2. O que foi entregue

| Etapa | Entrega | Origem |
| --- | --- | --- |
| 6.A | Mapa de telas, mapa de erros (34 códigos) e decisões F6-01 a F6-06 | PRs #19 e #20; [navegacao-telas.md](prd/navegacao-telas.md) |
| 6.B | Projeto React + TypeScript + Vite, contrato gerado do OpenAPI, camada de erros, sessão, tema e rotas por perfil | PRs #22, #23 e #25; RTM E-3 a E-5 |
| 6.C | As 11 telas (tabela abaixo) | PRs #32 a #51 |
| 6.D | `compose.e2e.yaml`, Dockerfiles da API e do front (imagens por digest, sem segredo), 5 testes Playwright e o job `e2e` | PR #52; RTM E-22; [testes/e2e/README.md](testes/e2e/README.md) |
| Contrato | `motivo` obrigatório ao criar e ao levantar bloqueio (F6-19) | PR #54; RTM E-23 |

### 2.1 As onze telas

| Tela | PR (merge) | RTM | Casos |
| --- | --- | --- | --- |
| T02 Busca e T03 Nova reserva (protótipo e padrão F6-11) | #32 (`c5379c8`) | E-6 | ver [casos-de-teste.md](testes/casos-de-teste.md) |
| T01 Login | #34 (`bda5b04`) | E-7 | idem |
| T04 Reservas (alteração e cancelamento) | #36 (`2b465a8`) e #38 (`a35e6f1`, usa `podeAlterar` e `podeCancelar`) | E-8 e E-10 | CT-142, CT-143 |
| T05 Aprovações | #43 (`b0284c6`) | E-13 | CT-148 |
| T06 Retiradas | #45 (`b718e9b`) | E-15 | CT-154 |
| T07 Catálogo | #47 (`682275b`) | E-17 | CT-156 |
| T10 Relatórios | #48 (`c566df0`) | E-18 | CT-157 |
| T11 Usuários e perfis | #49 (`cb37c50`) | E-19 | CT-158 |
| T09 Histórico | #50 (`0266ff5`) | E-20 | CT-159 |
| T08 Bloqueios | #51 (`1260ce5`) | E-21 | CT-160 |

Os E2E são CT-161 a CT-165 (RTM E-22), e o contrato do motivo é CT-166 e CT-167 (E-23).

### 2.2 Pull requests mesclados da fase (merge commit, checks verdes no commit final)

| Tipo | PRs (merge) |
| --- | --- |
| Documentação e decisões | #19 (`68a1686`), #20 (`e7baa22`), #22 (`d366671`), #26 (`540a483`), #53 (`30541b2`), #55 (`f4267b0`), #56 (`79667d2`) |
| Back end de apoio ao front | #21 (`c61ef3f`, F6-06), #25 (`8ceff68`, F6-10), #37 (`4617492`, F6-14), #40 (`8ce9edf`, F6-15), #41 (`95cddda`, R-26), #44 (`7a3ca9c`, F6-16), #46 (`333de64`, F6-17), #54 (`dd462dc`, F6-19) |
| Front end | #23 (`32b88a0`), #32, #34, #36, #38, #43, #45, #47, #48, #49, #50, #51 |
| E2E e CI | #52 (`8814873`) |

Fonte: `gh pr list --state merged` em 22/10/2026. Os números que faltam na sequência (por exemplo #24, #27 a #31, #33, #35, #39 e #42) são issues ou PRs fechados sem mesclar (#24 é o Dependabot, F6-13).

## 3. Decisões (F6-xx) e riscos (R-xx)

Texto completo em [decisoes-equipe.md](decisoes-equipe.md). Todas são decisões da equipe (Jefferson).

| ID | Data | Resumo |
| --- | --- | --- |
| F6-01 a F6-05 | 18/10/2026 | Cliente gerado (openapi-typescript e openapi-fetch); token em `sessionStorage` com mitigações (ADR-015); React Router e TanStack Query; CSS Modules; corpo de erro tipado só no front |
| F6-06 | 18/10/2026 | Mudanças mínimas no back end para o front (`GET /api/bloqueios`, nome do solicitante na fila e outras) |
| F6-07 | 18/10/2026 | Direção visual e paleta A (violeta e rosa) com tokens e contraste |
| F6-08 e F6-09 | 18/10/2026 | Menu lateral no desktop e barra inferior no celular; tema claro e escuro |
| F6-10 | 18/10/2026 | Campos obrigatórios das respostas no contrato (só documentação) |
| F6-11 a F6-13 | 18/10/2026 | Padrão das telas; campo de data e hora nativo mantido; PR do Dependabot (jsdom) fechado |
| F6-14 | 19/10/2026 | O back end diz `podeAlterar` e `podeCancelar` por reserva |
| F6-15 | 22/10/2026 | A fila diz `podeAprovar` e `podeRejeitar` |
| F6-16 | 22/10/2026 | A reserva diz o que o Responsável pode fazer no uso; histórico de movimentação com nome e `atual` |
| F6-17 | 22/10/2026 | O histórico de auditoria diz quem agiu pelo nome (`atorNome`); Desativar sem campo "pode" |
| F6-18 | 22/10/2026 | Como acelerar sem perder a rastreabilidade (o que roda local e o que fica para a CI) |
| F6-19 | 22/10/2026 | O contrato declara o motivo do bloqueio como obrigatório |
| F6-20 | 22/10/2026 | A porta de saída vale para os RF com interação humana (Anexo A do plano mestre) |
| F6-21 | 22/10/2026 | O job `e2e` passa a ser check obrigatório na `main` |
| R-25 | 19/10/2026 | Risco aceito: `NotificacaoApiIT.int01ECt103` intermitente, causa desconhecida |
| R-26 | 22/10/2026 | Limite de leitura de 10 s só nos testes de contrato da notificação (mitigação do BUG-017; R-25 segue aberto) |

## 4. Defeitos da fase

Fonte: [defeitos/README.md](defeitos/README.md). Todos os defeitos do front nasceram nas etapas 6.B e 6.C.

| BUG | O que era | Estado | Correção |
| --- | --- | --- | --- |
| BUG-010 | Foco do teclado se perde ao trocar de tela | Fechado | `8ad762c` |
| BUG-011 | Todas as telas tinham o mesmo título de aba | Fechado | `8ad762c` |
| BUG-012 | Ícone do calendário sem foco visível | Fechado | `fbc40e3` |
| BUG-013 | Confirmação da reserva mostrava "Recurso 2" no lugar do nome | Fechado | `22ef543` |
| BUG-014 | Sala ocupada continuava listada como livre depois de um conflito | Fechado | `67d3150` |
| BUG-015 | Foco no corpo da página depois de entrar | Fechado | `4df87e8` |
| BUG-016 | Administrador via o botão Alterar, que não funciona para o perfil | Fechado | `35ddae4` |
| BUG-017 | `NotificacaoApiIT.int01ECt103` intermitente | **Mitigado, não corrigido** (causa desconhecida; R-25 aberto) | `24095c4` (R-26) |
| BUG-018 | Tela de acesso negado sem título (`h1`) | Fechado | `55b37c7` |

Dois achados não viraram BUG porque não eram defeito da regra do servidor: o servidor exige o motivo do bloqueio e o contrato dizia que era opcional (corrigido pela F6-19), e o mínimo de dois Responsáveis só vale na desativação (D14), não na troca de perfil (pergunta ao professor).

## 5. Números de testes (só da CI)

Última execução da CI na `main`: run `39881853920` (commit final do PR #56). Cada linha vem do log do job.

| Item | Valor | Origem |
| --- | --- | --- |
| Back end | **659 testes** (226 de unidade e arquitetura, 433 de integração e BDD), 0 falhas | job `test`, run `39881853920` |
| Front end | **910 testes** em 56 arquivos, 0 falhas | job `frontend`, mesma run |
| E2E | **5 de 5** (7,9 s) | job `e2e`, mesma run |
| Quality Gate do SonarCloud | OK | API pública do SonarCloud, PR #54 (a consulta do PR #56 não foi repetida) |

Evolução (cada valor está na RTM, na execução citada, e veio da CI do PR correspondente): back end 565 (E-9) → 593 (E-11) → 651 (E-14) → 657 (E-16) → 659 (E-23); front 569 (E-10) → 638 (E-13) → 710 (E-15) → 774 (E-17) → 805 (E-18) → 841 (E-19) → 873 (E-20) → 910 (E-21).

## 6. Proteção da `main`

Aplicada em 22/10/2026 (F6-21), depois de três execuções verdes seguidas do `e2e` em PRs reais (#54 `39880389131`, #55 `39881122909`, #56 `39881853920`). Lida antes e depois pela API do GitHub; só `required_status_checks` mudou.

| Item | Antes | Depois |
| --- | --- | --- |
| Checks obrigatórios | `test`, `frontend` | **`test`, `frontend`, `e2e`** |
| Branch atualizada antes de mesclar (`strict`) | sim | sim |
| Aprovações exigidas | 0 (PR obrigatório) | 0 |
| Vale para administrador | sim | sim |
| Force push e exclusão da branch | não | não |

`segredos` e SonarCloud não são checks obrigatórios da proteção (nunca foram); a regra de só mesclar com eles verdes é prática combinada, não proteção.

## 7. Limitações declaradas

| Limitação | Detalhe | Origem |
| --- | --- | --- |
| Verificações do axe incompletas | `color-contrast` fica sem decisão do axe com diálogo aberto, com o aviso na tela e com a barra inferior fixa. Nos modos desta sessão: T07 28 verificações (40 nós), T10 4, T11 27 (43 nós), T09 6, T08 18. O contraste dos pares de cores foi medido à mão e coberto por teste de tokens. Violações: 0 em todos os modos citados | RTM E-17 a E-21; [fase-7-pendencias.md](fase-7-pendencias.md) |
| Anel de foco do ícone do calendário | Nos campos de data e hora (e de data) a parada no ícone usa o anel do próprio navegador; o roteiro a trata à parte e confere por captura (BUG-012, F6-12) | [roteiro](testes/roteiro-navegador-real/README.md); RTM E-18, E-20 e E-21 |
| Diálogo próprio | `frontend/src/ui/Dialogo.tsx` (foco preso, Escape e foco devolvido) é usado pelas telas T04 a T11; é a fonte do fundo sobreposto que o axe não decide | `frontend/src/ui/Dialogo.tsx`; RTM E-17 |
| Listas sem paginação | A consulta da auditoria não filtra por período nem pagina (L-03, período filtrado na tela); a fila e o catálogo também listam tudo; só o relatório pagina (tamanho 20, suposição da D4), e essa paginação só foi exercida em teste de componente | [navegacao-telas.md](prd/navegacao-telas.md); RTM E-18 e E-20 |
| R-25 | `NotificacaoApiIT.int01ECt103` intermitente, causa desconhecida; aceito, entra no relatório final como risco | [decisoes-equipe.md](decisoes-equipe.md), R-25 e R-26 |
| E2E | Só Chromium; não repetível no mesmo banco (a CI sobe um novo); a reserva concorrente do teste de conflito é montada pela API | [testes/e2e/README.md](testes/e2e/README.md) |
| Sem reativar nem trocar senha | O contrato não tem reativar recurso, reativar usuário nem trocar senha; `GET /api/bloqueios` devolve `reservasCanceladas` vazio | RTM E-17, E-19 e E-21 |
| Não exercidos no navegador real | `BLOQUEIO_COM_RESERVA_EM_USO` e a paginação do relatório | RTM E-18 e E-21 |
| RNF-08b | Criação de reserva com p95 de 568 a 886 ms contra a hipótese de 300 ms; não atendido (Fase 5) | [performance/](performance/) |

## 8. O que depende do professor

Lista viva em [perguntas-professor.md](perguntas-professor.md): lacunas A1 a A8, D1, D3, D4, D9 e D17, "revisão por pares" para equipe de uma pessoa, precisão de segundos em reservas e bloqueios, rejeitar reserva depois do início, iniciar o uso antes do horário e, nova, **trocar o perfil de um Responsável deixando menos de dois** (D14). Mais a **interpretação F6-20** (RF-11 e RF-14 sem tela), que deve constar do relatório final como interpretação.

## 9. O que ficou para a Fase 7

Tudo está em [fase-7-pendencias.md](fase-7-pendencias.md). Na ordem de execução proposta: (1) a **revisão assistida independente** de "nenhuma regra de negócio duplicada no front"; (2) os itens da lista (R-25 como risco, RNF-08b, SEC-03 e SEC-04, alertas do Dependabot em `.aiox-core/`, token antigo do SonarCloud, ADR-015 citando o plano mestre sem link, dúvidas ao professor); (3) os prompts 7.A a 7.C do plano mestre. A Fase 7 não começou.

## 10. Lacunas (sem origem nesta sessão)

- **Cobertura:** não rodei nem li o relatório de cobertura (JaCoCo) nem a cobertura do SonarCloud nesta sessão. Não há número de cobertura neste relatório.
- **Roteiros em navegador real de T01 a T06:** os números (estados do axe, conferências, paradas de Tab) estão na RTM, nas execuções E-6 a E-15, e não foram repetidos aqui.
- **Contagem de casos de teste (CT) da fase:** não contei; os casos estão em [casos-de-teste.md](testes/casos-de-teste.md).
- **Quality Gate do PR #56:** a consulta feita foi a do PR #54; o do #56 não foi repetido.
