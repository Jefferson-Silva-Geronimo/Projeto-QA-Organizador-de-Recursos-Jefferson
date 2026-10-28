# Evidência de TDD — Fase 4

Este documento liga cada fatia de comportamento aos commits do ciclo red → green → refactor, para que a
afirmação "desenvolvido com TDD" possa ser conferida no histórico (`git log fase-4/backend`).

## Como ler

- **Red**: commit `test(red)` que adiciona os testes de uma fatia e que, ao ser aplicado sozinho, falha.
  - **Esqueletos de produção no commit red:** em 46 dos 98 commits `test(red)` até a tag `v1.0.0-rc2` (`d2b6af1`), o commit também traz arquivos de produção mínimos para o teste compilar: assinaturas que retornam valor neutro (`return false`, `return 0`, corpo vazio, comentário "esqueleto da fatia"), tipos e enumerações que o teste referencia e, em dois casos, a dependência de teste no `pom.xml` ou no `package.json`. Nenhum deles traz o comportamento testado: o vermelho continua sendo de **asserção**, nunca de compilação. Contagem de 28/10/2026 com `git log` e `git show --name-only` nos 98 commits `test(red)` (36 com arquivos em `frontend/`, 10 com arquivos em `src/main` e 1 com `pom.xml`; os dois últimos podem coincidir com o primeiro no mesmo commit).
- **Green**: commit `feat(green)` ou `fix(green)` com a menor implementação que passa a fatia.
- **Refactor**: commit `refactor` com a suíte verde antes e depois.
- Os commits `test:` sem `(red)` corrigem o **cenário do teste**, nunca a regra. Cada um está listado como
  erro de cenário na seção de limites.

## Granularidade

O ciclo foi aplicado por **fatia de comportamento** (um grupo de casos de teste relacionados por regra), não
por caso individual. Isso é uma escolha de custo: um commit red por caso multiplicaria o histórico sem
aumentar a evidência. A rastreabilidade por caso está na RTM (`RTM.md`) e em `casos-de-teste.md`.

## Fatias

| Fatia | Casos | Red | Green | Refactor |
|---|---|---|---|---|
| Esquema, exclusão e auditoria | CT-007 a CT-011 | `9d4d6d9` | `dadb272` | — |
| Autenticação e erros padronizados | CT-001 a CT-006 | `6a9f4d9` | `030aa5e` | — |
| Usuários e perfis | CT-005, CT-012 a CT-016 | `c49f13c` | `de67a8a` | — |
| Primeiro Administrador | CT-122 | `00127d1` | `0d27444` | — |
| Cadastro e pesquisa de recursos | CT-017 a CT-029, CT-031, CT-032 | `24c7364` | `18c614b` | `bec334d` |
| Domínio: período, janela, passado, políticas | CT-033 a CT-037, CT-039, CT-051 a CT-053 | `af25ff4` | `bcfc704` | — |
| Reservas: conflito, alteração, cancelamento | CT-030, CT-038 a CT-050, CT-054 a CT-058 | `4a54c35` | `d1b4099` | — |
| Concorrência (sala, professor, vários recursos) | CT-060 a CT-065 | `5d570f8` | `eb7f5b1` (BUG-007) | — |
| Máquina de estados, aprovação, SEM_DECISAO, bloqueio | CT-066 a CT-083 | `7b4219d` | `d1f0245` | `3aa1f77`, `217e99f` (MVC) |
| Uso, retirada, devolução, conclusão | CT-084 a CT-095 | `9fb060a` | `61b5c71` | — |
| Auditoria consultável | CT-096 a CT-101 | `4b5551f` | `866d323` | — |
| Notificação por webhook | CT-102 a CT-105, INT-01 a INT-06 | `5462457` | `5d19b07` | — |
| Relatório | CT-107 a CT-113 | `4b3a176` | `ea43349` | — |
| Documentação da API | CT-114 a CT-116 | `54c1ddf` | `eea2581` | — |
| Matriz de autorização e entrada inválida | CT-117 a CT-121 | `d793879` | `73488e5` (BUG-008) | — |
| Falha ao gravar a tentativa de conflito (BUG-009) | `FalhaNaTentativaApiIT` | `0a80fc7` | `61ce37d` | — |
| Lacunas de risco da cobertura | LacunasDeRiscoApiIT | — | — | — |
| Limite de tentativas de login (SEC-01): contagem de falhas | `LimiteDeLoginTest` | `9369848` | `2fee736` | — |
| Limite de login: janela deslizante em trinca (599999, 600000, 600001 ms) | `LimiteDeLoginTest` | `8068d35` | `c809f11` | — |
| Limite de login: configuração inválida recusada | `LimiteDeLoginTest` | `0899457` | `2a51d65` | — |
| Limite de login: bloqueio por API com a senha correta | `LimiteDeLoginApiIT` | `01b46c3` (esperado 401, obtido 200) | `08e26f0` | — |
| Limite de login: 10 casos de API (tempo em trinca, zera no sucesso, resposta idêntica, não estende, conta inexistente, normalização, limpeza) | `LimiteDeLoginApiIT` | — (nasceram verdes) | — | — |
| Lacunas de risco do PIT (horas de funcionamento, eventos de auditoria, período da reserva) | `HorasDeFuncionamentoTest`, `EventoAuditoriaTest`, `ReservaTest` | — | — | `721180b` (código morto removido) |
| Cenários BDD de aprovação e bloqueio (BDD-01 a BDD-08, 15 cenários) | `aprovacao-bloqueio.feature`, `CucumberIT` | — | — | — |
| Troca do provedor (CT-106) | `TrocaDeProvedorTest`, `TrocaDeProvedorApiIT`, `ProvedorIsoladoArquiteturaTest` | — (5 casos, `40834ed`, `638687d`, `ee0df5e`, `aa7cf1f`, `8632606`) | — | `da77cb6` |

As linhas sem red (lacunas de risco, PIT, BDD e CT-106) têm comportamento que **já existia**: os testes foram escritos depois do código, por indicação
do relatório de cobertura (Prompt 4.C). Passaram na primeira execução e não substituem o ciclo TDD. Estão
marcados à parte para não inflar a evidência.

## Limites e correções honestas

- **Testes que passaram de primeira.** CT-107 a CT-113 e parte de CT-084 a CT-095 não falharam por defeito de
  regra no red, e sim por faltar a classe. O red demonstra ausência, não regressão de comportamento.
- **Erros de cenário corrigidos sem mudar a regra:** CT-016 (`5e86204`), CT-049 (`7b09e2a`), CT-071 e CT-080
  (`aea94dd`), CT-110 (`c64e8f9`), `DocumentacaoApiIT` (`ffba98e`) e a limpeza do CT-063 (`7ba9894`).
- **Defeitos achados pelos testes:** BUG-007 (impasse 40P01 tratado como conflito) e BUG-008 (autorização
  depois da validação do corpo). Ambos têm commit red anterior ao green e estão em `docs/defeitos/README.md`.
- **Refactors estruturais** (`e1b737e` JDBC, `3aa1f77` e `217e99f` MVC) rodaram com a suíte verde antes e
  depois (220 testes), sem alterar comportamento.

## Cobertura e gate

O gate do JaCoCo roda em `verify`: mínimo de 80% de linhas e 70% de branches no conjunto (ADR-011). A
suíte completa é executada com `./mvnw clean verify`; o relatório fica em `target/site/jacoco/`.

Medição (17/10/2026, `./mvnw -B clean verify`, após BUG-009): **468 testes**, sendo 136 de unidade e
arquitetura (surefire) e 332 de integração e BDD (failsafe), 0 falhas; **96,7% de linhas** (1551/1604) e **84,6% de
branches** (438/518). O relatório anterior citava "313 testes": esse número era só a fase de integração.

## Sessão de fechamento (17/10/2026): o que cada nova evidência prova

### BUG-009: vermelho antes de verde, com trecho da saída

```text
[ERROR] FalhaNaTentativaApiIT.bug009_seAGravacaoDaTentativaFalharOConflitoContinuaSendo409:66
        Status expected:<409> but was:<500>
```

Commit `test(red)` `0a80fc7`; `fix(green)` `61ce37d`, com a suíte inteira verde (468 testes). O segundo caso (log) nasceu
verde porque o log foi implementado junto: não conta como vermelho.

### Testes que passaram de primeira, e a prova de que protegem

Não há vermelho possível para código que já existia; em vez dele, uma falha foi injetada na regra, a suíte rodou e a
fonte foi restaurada (nada disso foi commitado).

| Teste | Falha injetada | Resultado |
| --- | --- | --- |
| BDD-02 (dono Responsável), BDD-04 e BDD-08 | Aprovação do dono desligada em `AprovacaoService` e `CONCLUIDA` permitida a partir de APROVADA em `MaquinaDeEstados` | 3 cenários vermelhos: `expected: 403` (2) e `expected: 409` (1); 12 verdes |
| `TrocaDeProvedorTest` (3 casos) | `ENVIADA`, `RECUSADA` e `FALHA_TEMPORARIA` mapeados para o status errado em `DespachoDeNotificacoesService` | 3 vermelhos: `expected: PENDENTE but was: FALHA`, `expected: FALHA but was: PENDENTE`, `expected: ENVIADA but was: PENDENTE` |
| `HorasDeFuncionamentoTest`, `EventoAuditoriaTest` | PIT (mutantes gerados pela ferramenta) | 0 sobreviventes entre os mutantes cobertos ([mutacao.md](mutacao.md)) |

### Limites da avaliação

- BDD e CT-106 não são TDD: o código existia. Valem como evidência de comportamento especificado e verificado.
- `ProvedorIsoladoArquiteturaTest` é redundante com a visibilidade do pacote (`WebhookNotificador` não é público) e
  vale como documentação executável.

## Fase 6: mudanças de back end para o front end (F6-06)

Mesmo critério das fatias acima, aplicado um teste por vez. Os testes que **nasceram verdes**, porque o código do
`green` anterior já os satisfazia, estão declarados abaixo: CT-124, a linha "Listar bloqueios" da matriz de
autorização e CT-126. CT-114 e CT-115 falharam de propósito ao mudar o contrato e voltaram a passar com o
`openapi.json` regenerado, sem alteração dos testes.

| Fatia | Casos | Red | Green |
|---|---|---|---|
| Listagem de bloqueios (F6-06a) | CT-123 (vermelho); CT-124 (nasceu verde) | `29a9c44` | `02ca708`, contrato em `aa90861` |
| Nome do solicitante na fila (F6-06b) | CT-125 (vermelho); CT-126 (nasceu verde) | `83e7a24` | `d8240c9`, contrato em `6bacc3b` |
| Campos obrigatórios das respostas no contrato (F6-10) | CT-134 (vermelho); CT-135 (nasceu verde) | `5286c1b` | `206f9a3`, contrato em `7d88930`, cliente do front em `e18f7e8` (refactor) |

## Fase 6: front end (etapas 6.B e 6.C)

Mesmo critério das fatias anteriores, um teste por vez no front. Cada linha liga o commit `test(red)` ao `feat(green)` (ou
`fix(green)`) que o seguiu; a tabela foi gerada do histórico do Git (`git log -- frontend`). O vermelho vem de asserção
ou de consulta por papel que não encontra o elemento (comportamento ausente), nunca de erro de compilação ou de
configuração. Os testes que **nasceram verdes** estão declarados na mensagem do commit do próprio ciclo. Dois ajustes de
cenário em testes já existentes também estão declarados nos commits: a ordem das chamadas em `Rotas.test.tsx` e o
escopo da regra do token em `regra-do-token.test.ts`.

| Fatia | Red | Green |
|---|---|---|
| `interpretarProblema` lê status, `code`, itens e campos sem guardar o texto cru | `658f26e` | `6bbedbb` |
| `mensagemPara` devolve a mensagem e a ação documentadas para cada um dos 34 códigos | `9aef47c` | `57c740f` |
| Mensagens para código desconhecido, resposta sem código e falha de rede (seção 5.2) | `e683790` | `120abd3` |
| Sessão guardada e lida de volta | `067e407` | `54c16f7` |
| Sessão corrompida, de formato inesperado, expirada (inclusive no limite) e limpar | `7e9ab49` | `b2ea3c4` |
| Armazenamento indisponível não derruba a sessão; só o módulo de sessão toca o `sessionStorage` | `64aa127` | `3aed66a` |
| `razaoDeContraste` WCAG (21:1, 1:1, simetria, 4,54:1 e formas hexadecimais) | `0060deb` | `bf0dabf` |
| Contraste de 22 pares nos três blocos de tokens (claro, escuro pela preferência, escuro pela escolha), com 4,5:1 para texto e 3:1 para foco, bordas e indicador | `d9ee542` | `3d43197` |
| Escolher o tema escuro marca o documento e é lembrado | `7f94b1f` | `3e265d8` |
| Tema do sistema, escolha ausente ou inválida, aplicar ao abrir e armazenamento indisponível | `84e9983` | `8596285` |
| Cliente envia `Authorization` e trata 401 como sessão expirada | `9483052` | `d44ae8c` |
| `executar` converte recusa, falha de rede e resposta fora do formato em `ErroDeApi` | `aa5f859` | `9e6dec7` |
| Telas e perfis iguais à matriz de acesso da documentação | `ac835fa` | `f96f9a9` |
| Barra do celular com no máximo 4 itens e Mais; rota inicial por perfil | `1777fd3` | `453662c` |
| Entrar com credenciais válidas guarda a sessão e atualiza o contexto | `abc05c3` | `d967bdb` |
| Sair (com e sem resposta do servidor) e 401 que zera o contexto | `5d38733` | `ca6f637` |
| Rota protegida por perfil: sem sessão, perfil proibido e volta ao login após 401 | `b788faf` | `17a1133` |
| Navegação lateral e barra do celular com Mais, `aria-current` e teclado | `71c521d` | `18190f2` |
| Seletor de tema Sistema, Claro e Escuro com `aria-pressed` | `643ef71` | `ac6c7d9` |
| Rotas por perfil, estrutura com cabeçalho e menu, 404, redirecionamentos e sair | `4cc1c7d` | `009165c` |
| Datas no fuso do campus (ISO-8601 com offset, ida e volta, intervalo legível) | `897952f` | `3ff61b9` |
| Componente `Aviso` (papel ARIA, rótulo para leitor de tela, título, foco por código, axe) | `31d33e2` | `917bb89` |
| Componente `Campo` (rótulo ligado ao controle, obrigatório em texto, erro e ajuda lidos junto, axe) | `02d1d82` | `d9dc6af` |
| `Botao` (tipo padrão, envio sem clique duplo) e estados Carregando e EstadoVazio | `28b2616` | `0cfaa1e` |
| Busca lista os recursos com contagem anunciada e os atributos de cada tipo | `55eb643` | `2e39a21` |
| Filtros da Busca (envio, período com offset, início sem fim, limpar, estado na URL) | `ccd039f` | `65ce926` |
| Estados da Busca (vazio, recusa, texto cru nunca aparece, rede, código desconhecido, tentar de novo) | `6d877bb` | `23f1782` |
| Ações do cartão da Busca (Reservar com recurso e período, horários ocupados, erro, axe) | `620c1e8` | `28d77b8` |
| Nova reserva: estrutura, período, recursos livres agrupados, pré-seleção e aviso de recurso não livre | `f740e3e` | `80467fe` |
| Nova reserva: envio, confirmação derivada do estado do servidor, sem clique duplo, foco e nova reserva | `8e91e13` | `987931a` |
| Nova reserva: recusas do servidor por código, foco na mensagem, dados preservados, campos inválidos e rede | `5dab42d` | `3329a0d` |
| Rotas Buscar e Nova reserva mostram as telas reais; as demais seguem como marcador | `558465d` | `a94237a` |
| Depois de conflito a lista de recursos livres é refeita | `afd37c4` | `67d3150` |
| Foco vai ao conteúdo ao trocar de tela e título da página por tela | `0f0c8c7` | `8ad762c` |
| Ícone do calendário dos campos de data tem foco visível | `f05435b` | `fbc40e3` |
| Confirmação mostra o nome dos recursos mesmo quando a lista refeita já não os traz | `59ce6f2` | `22ef543` |
| Destino depois do login só para endereço interno de tela que o perfil vê (sem redirecionamento aberto) | `3c99a0b` | `0ff209f` |
| Contexto marca a sessão como expirada no 401 e limpa ao entrar ou sair | `c6ebb36` | `e259171` |
| Tela de Login: estrutura, `autocomplete`, mostrar senha e tema | `106afb9` | `2a2b9e6` |
| Tela de Login: envio, clique duplo, campos em branco, recusa sem dizer qual campo errou, foco e tabela de mensagens | `9c44f04` | `361ef2a` |
| Login nas rotas: tela real, destino por perfil, volta à tela de origem com filtros e aviso de sessão terminada | `54b7d19` | `09d7a88` |
| Depois de entrar o foco vai para o conteúdo (BUG-015, achado no navegador real) | `c009d40` | `4df87e8` |
| Tela de Reservas: lista, estados, nomes dos recursos, motivo e cancelada continua listada | `5e80ddd` | `11d4347` |
| A rota Reservas mostra a lista de verdade | `b95e0c4` | `39fca3d` |
| Reservas: ações conforme o estado, diálogo de confirmação com foco preso e devolvido, cancelamento e recusas do servidor | `b331cd8` | `73437db` |
| Alteração de reserva: dados atuais, recursos da própria reserva, envio, confirmação pelo estado devolvido, recusas e conflito reaproveitado | `240334a` | `398234c` |
| Rota e título da alteração, e acesso negado ao Administrador | `9fce799` | `5e1a821` |
| Administrador não vê Alterar na lista de Reservas (BUG-016, achado nas capturas do navegador real) | `c3ed51b` | `35ddae4` |
| Permissões da reserva por estado, perfil, posse e instante, com o início em trinca (regra pura) | `c8c3532` | `7aae5e1` |
| Resposta de reserva traz `podeAlterar` e `podeCancelar`, e o campo concorda com a recusa do servidor | `0bd9a62` | `d10a5e8` |
| Ações da T04 obedecem a `podeAlterar` e `podeCancelar` do servidor, não ao estado nem ao perfil (F6-14; os testes antigos de estado e perfil foram reescritos porque a premissa mudou por decisão, dito no commit) | `f1e24c8` | `c019532` |
| Reserva em andamento sem ação disponível mostra "Você não pode alterar nem cancelar esta reserva agora.", lida junto com o cartão (texto aprovado por Jefferson) | `3ffbc41` | `955801b` |
| Item da fila traz `podeAprovar` e `podeRejeitar` por posse, perfil, estado e início em trinca (F6-15; regra pura e API; o cálculo e o serviço usam a mesma `PoliticaDeDecisao`) | `497cf95` | `a299357` (refactor `36ba6cc`, contrato `ace5de3`) |
| Fila de aprovações (T05): lista com solicitante pelo nome, período, recursos, contagem, vazio e erros | `fcb7b27` | `79e8d1a` |
| T05: Aprovar e Rejeitar conforme `podeAprovar` e `podeRejeitar`; mensagem quando nenhuma ação está disponível, lida junto com o cartão | `a70ca19` | `7b34d19` |
| T05: decisão por diálogo com foco gerenciado, rejeitar exige motivo, recusas pelo código estável (39 casos) | `14a49f9` | `41f4253` |
| T05: a rota Aprovações mostra a fila; Solicitante e Administrador veem acesso negado sem consultar a fila | `bae362b` | `32877dc` |
| Tela de acesso negado ganha o título "Acesso negado" na página e na aba (BUG-018, achado no navegador real) | `611db6e` | `55b37c7` |
| Reserva traz `podeIniciar`, `podeConcluir` e `podeMarcarNaoComparecimento`; histórico traz `registradoPorNome` e a movimentação `atual` de cada material (F6-16; regra pura e API; cálculo e serviço usam a mesma `PoliticaDeUso` e a mesma `MovimentacoesAtuais`) | `053762a` | `1aa933f` (refactor `5df6676`, contrato `7045c37`) |
| Retirada e devolução (T06): lista de aprovadas e em uso, unidade pela movimentação atual, ações pelos campos do servidor, confirmação do irreversível e recusas pelo mapa (F6-16; 65 testes da tela, `formatarHora` e a rota) | `22eb383`, `fa48bb1` | `4b98d3e` |
| Catálogo de recursos (T07): abas por tipo, lista, restrito, desativar com a lista de reservas afetadas e cadastro por tipo (F6-17; 61 testes da tela, 3 de rota; lint corrigido em `9c10927`) | `e90007c` | `9850afd` |
| Relatórios (T10): filtros no endereço, período obrigatório, tabela do servidor, paginação e recusas pela tabela de erros (28 testes da tela, 3 de rota) | `e97f0fc` | `d762f49` |
| Usuários e perfis (T11): lista, cadastro com perfil único, trocar perfil e desativar com a recusa do servidor e as reservas afetadas (F6-17; 35 testes da tela, 1 de rota) | `9d83d08` | `b1a5343` |
| Histórico de auditoria (T09): Responsável por reserva, Administrador na auditoria completa, período na tela, ator pelo nome e ações na grafia da pessoa (30 testes da tela, 2 de rota; um teste de rota existente mudou de tela, declarado no commit) | `42fe6d0` | `6006b24` |
| Bloqueios de manutenção (T08): lista, levantar e novo bloqueio em duas etapas com as recusas do servidor (31 testes da tela, 1 de rota) | `a5aaf96` | `15739a6` |
| Bloqueios (T08), levantar com motivo: achado do navegador real, o servidor exige o motivo e o contrato o marca como opcional (12 testes de levantar substituem os 6 anteriores, declarado no commit) | `5e6c7d3` | `bfefdfb` |
| Histórico de auditoria traz `atorNome`, só o nome e nunca o e-mail, e o usuário desativado mantém o nome (F6-17) | `cb31a0c` | `1c7fc09` (contrato `5b861e3`) |

## Pull requests mesclados por fase

Registro de quais pull requests entraram em cada fase e com que merge commit. Todos em merge commit, sem rebase. Origem: `gh pr list --state merged` em 22/10/2026 (Fase 6) e os registros das fases 4 e 5.

| Fase | Pull requests |
| --- | --- |
| 3 e 4 | PR 1 (`12310c3`) e PR 2 (`cd04ee6`), mesclados em 17/10/2026 com confirmação de Jefferson |
| 5 | Mesclados: #10, #11, #12, #15 e #17. Fechados sem mesclar: #13, #14 e #16 (dependências) |
| 6, documentação e decisões | #19 (`68a1686`), #20 (`e7baa22`), #22 (`d366671`), #26 (`540a483`), #53 (`30541b2`), #55 (`f4267b0`), #56 (`79667d2`) |
| 6, back end de apoio ao front | #21 (`c61ef3f`, F6-06), #25 (`8ceff68`, F6-10), #37 (`4617492`, F6-14), #40 (`8ce9edf`, F6-15), #41 (`95cddda`, R-26), #44 (`7a3ca9c`, F6-16), #46 (`333de64`, F6-17), #54 (`dd462dc`, F6-19) |
| 6, front end | #23 (`32b88a0`), #32, #34, #36, #38, #43, #45, #47, #48, #49, #50, #51 |
| 6, E2E e CI | #52 (`8814873`) |

Na Fase 6, os números que faltam na sequência (por exemplo #24, #27 a #31, #33, #35, #39 e #42) são issues ou PRs fechados sem mesclar (#24 é o Dependabot, F6-13).
