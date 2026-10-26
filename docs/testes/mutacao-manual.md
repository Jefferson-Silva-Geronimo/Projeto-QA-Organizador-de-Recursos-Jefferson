# Mutação manual: quebrar a regra e ver qual teste falha

Teste que continua verde com a regra quebrada não protege a regra. Cada experimento abaixo quebra uma regra de negócio de propósito, numa cópia descartável do repositório, e registra qual teste falhou. Nunca se altera a `main`, e nenhum teste existente é alterado, desativado ou enfraquecido.

**Como se faz:**

```bash
git worktree add --detach ../ensaio main     # cópia descartável a partir da main
# ... quebrar a regra e rodar as classes de teste afetadas dentro de ../ensaio ...
git worktree remove --force ../ensaio        # descarta
```

Fonte das regras: [regras-negocio.md](../prd/regras-negocio.md) e a seção "Regras críticas" da [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

**Método dos experimentos de 26/10/2026:** `git worktree` descartável da `main` em `a027e91`, uma troca exata de texto por experimento (o diff exato está na coluna "Quebra feita"), as classes afetadas rodadas com `./mvnw -B verify -Djacoco.skip=true -Dmaven.test.failure.ignore=true -Dtest=<unidade> -Dit.test=<integração>` (a opção de ignorar falha faz a fase de integração rodar mesmo com a de unidade vermelha), Docker ligado e PostgreSQL real em Testcontainers. Sem a quebra, as mesmas classes passam na CI (execução E-24, [execucao-e24.md](execucao-e24.md)). Cada experimento rodou **uma vez**, numa máquina; a variação não foi medida.

## 1. Resumo

| # | Regra | Quebra feita | Testes que falharam | Veredito | Data e commit | Seção |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | RN-04 (manutenção) | `verificarConflitos` deixa de distinguir a manutenção | `ReservasApiIT.ct081_...` (1 de 53) | Morto por asserção | 24/10/2026, `53b502b` | 2 |
| 2 | RN-03 (dupla reserva) | Sem a constraint `ocupacoes_sem_sobreposicao` | `ConcorrenciaApiIT` (7 de 7) | Morto por asserção | 24/10/2026, `53b502b` | 3 |
| 3 | RN-01 (término depois do início) | Sem o `if` do construtor de `Periodo` | `PeriodoTest.ct033` (2) e `ReservasApiIT.ct033` | Morto por asserção | 24/10/2026, `6d49292` | 4 |
| 4 | RN-06 (só Responsável aprova) | Sem o portão de perfil da aprovação | `AprovacaoBloqueioApiIT.ct067` e `AutorizacaoApiIT.ct117` (2 de 159); o caso do Solicitante sobrevivia (BUG-026, corrigido) | Morto só para o Administrador na época | 24/10/2026, `6d49292` | 4 |
| 5 | RN-02 (sobreposição), fronteira | SQL de `buscarConflito` com `'[]'` no lugar de `'[)'` | `AprovacaoBloqueioApiIT.ct080` e `ReservasApiIT.ct035` (3 casos): 4 de 74 | Morto por asserção | 26/10/2026, `a027e91` | 5 |
| 6 | RN-02 (sobreposição), verificação prévia | SQL de `buscarConflito` com `and false` | `ReservasApiIT.ct057`, `ct059ECt065` e `ct081`: 3 de 55 | Morto por asserção | 26/10/2026, `a027e91` | 5 |
| 7 | RN-02 no domínio | `Periodo.sobrepoe` com fronteira inclusiva | `PeriodoTest.ct034` (2 de 9); `ReservasApiIT` 34 de 34 verdes | Morto só pelo teste de unidade (código sem uso na produção) | 26/10/2026, `a027e91` | 5 |
| 8 | RN-02 no domínio | `Periodo.sobrepoe` sempre falso | `PeriodoTest.ct034` (4 de 9); `ReservasApiIT` 34 de 34 verdes | Idem | 26/10/2026, `a027e91` | 5 |
| 9 | RN-05 (estados) | `SOLICITADA` passa a poder ir direto a `CONCLUIDA` | `MaquinaDeEstadosTest.ct075` (1 de 56); as classes de API (53 testes) verdes | Morto por asserção, só no teste de unidade | 26/10/2026, `a027e91` | 6 |
| 10 | RN-07 (reserva iniciada não se cancela) | `PoliticaDeCancelamento` deixa de recusar `EM_USO` | 6 falhas nos testes de unidade, `PermissoesDaReservaApiIT.ct145` e `ReservasApiIT.ct052_emUsoNaoEhCancelada` | Morto por asserção | 26/10/2026, `a027e91` | 6 |
| 11 | Autorização (matriz) | `/api/bloqueios/**` passa de `hasRole("ADMINISTRADOR")` a `authenticated()` | `AutorizacaoApiIT.ct117_matrizPerfilXOperacao` (2 de 141: Solicitante e Responsável em "Criar bloqueio"); `AprovacaoBloqueioApiIT` 19 de 19 verdes | Morto por asserção pela matriz | 26/10/2026, `a027e91` | 7 |
| 12 | Autorização (matriz), RN-17 | `POST /api/reservas` passa a aceitar `ADMINISTRADOR` | `AutorizacaoApiIT.ct117_matrizPerfilXOperacao` (1 de 141: Administrador em "Criar reserva"); `ReservasApiIT` 34 de 34 verdes | Morto por asserção pela matriz | 26/10/2026, `a027e91` | 7 |
| 13 | RN-08 (auditoria) | A aprovação deixa de gravar o evento `RESERVA_APROVADA` | `AuditoriaApiIT.ct096` e `AprovacaoBloqueioApiIT.ct066` (2 de 60) | Morto por asserção | 26/10/2026, `a027e91` | 8 |
| 14 | RN-08 (auditoria) | `JdbcAuditoriaRepository.registrar` não grava nada | 20 de 83: `AprovacaoBloqueioApiIT` 7, `AuditoriaApiIT` 6, `ReservasApiIT` 4, `UsoMaterialApiIT` 3 | Morto por asserção | 26/10/2026, `a027e91` | 8 |
| 15 | RF-03 (pesquisa), capacidade | SQL de `pesquisar`: `s.capacidade >= :capacidade` vira `<=` | `CatalogoApiIT.ct027` (1 de 21) | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 16 | RF-03 (pesquisa), disponibilidade | SQL de `pesquisar`: `not exists` vira `exists` | `CatalogoApiIT.ct028` e `ct029`, `ReservasApiIT.ct030` (3 de 55) | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 17 | RF-09 e RN-23 (conclusão exige devolução) | `PoliticaDeUso.avaliarConclusao` deixa de recusar com material pendente | `PermissoesDeUsoTest.ct150` (2 de 20), `PermissoesDeUsoApiIT.ct152` e `UsoMaterialApiIT.ct089` (2 de 42) | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 18 | RF-09 (devolução) | `PoliticaDeUso.avaliarDevolucao` aceita devolver unidade não retirada | `MovimentacoesAtuaisTest.ct151` (2 de 9) e `UsoMaterialApiIT.ct088` (1 de 23) | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 19 | RF-12 e RN-31 (estados que contam) | O relatório passa a contar reserva `SOLICITADA` | `RelatorioApiIT.ct108` (1 de 9) | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 20 | RF-12 e RN-31 (parte interna do período) | O relatório deixa de recortar a ocupação pelo período | `RelatorioApiIT.ct109` (1 de 9) | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 21 | RF-13 (mensagem de erro compreensível) | A mensagem de `CONFLITO_DE_ALOCACAO` no front vira `CONFLITO_DE_ALOCACAO 409` | `mensagens.test.ts` (CT-127): 1 de 80 em `src/erros` | Morto por asserção | 26/10/2026, `9624160` | 9 |
| 22 | RF-13 (interface responsiva) | `.coluna` de `Estrutura.module.css` com `min-width: 700px` em vez de `0` | E2E CT-165 (`jornadas.spec.ts`, celular 360 por 640): `scrollWidth <= innerWidth` fica falso | Morto por asserção | 26/10/2026, `9624160` | 9 |

**Resultado:** dos 22 experimentos, **nenhuma regra quebrada ficou com todos os testes verdes**. Nenhum teste foi escrito, alterado ou desativado nas duas rodadas. Há dois achados, nas seções 5 e 7: o código `Periodo.sobrepoe` não é chamado pela produção, e duas camadas de autorização se escondem uma à outra em alguns casos.

## 2. RN-04: reserva de recurso em manutenção

**A regra:** reserva de recurso em manutenção é recusada com o motivo `MANUTENCAO` (RN-04, CT-081). A decisão do motivo está em `src/main/java/br/senac/recursos/service/ReservaService.java`, no método `verificarConflitos`.

**A quebra:** trocar

```java
throw new ConflitoDeAlocacao(d.id(), c.manutencao() ? MotivoConflito.MANUTENCAO : MotivoConflito.SOBREPOSICAO,
```

por `throw new ConflitoDeAlocacao(d.id(), MotivoConflito.SOBREPOSICAO,`, e rodar:

```bash
./mvnw -B verify -Dtest=NenhumTeste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test='ReservasApiIT,AprovacaoBloqueioApiIT' -Dfailsafe.failIfNoSpecifiedTests=false -Djacoco.skip=true
```

**Resultado observado em 24/10/2026** (sobre a `main` em `53b502b`, só com essa alteração): 53 testes nas duas classes e **1 falha**: `ReservasApiIT.ct081_reservaEmRecursoEmManutencaoEhRecusadaComMotivoMANUTENCAO`, na linha 278, por asserção: `JSON path "$.code" expected:<RECURSO_EM_MANUTENCAO> but was:<CONFLITO_DE_ALOCACAO>`. Nenhum outro teste dessas duas classes falhou.

**Limite:** só essas duas classes de integração foram executadas; a suíte inteira não foi executada com a regra quebrada, então não se afirma que nenhum outro teste de fora delas falharia.

## 3. RN-03: proteção de dupla reserva

**A proteção:** `EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)`, a constraint `ocupacoes_sem_sobreposicao` em `src/main/resources/db/migration/V2__esquema.sql` ([ADR-003](../adr/ADR-003-dupla-reserva-constraint-de-exclusao.md)).

**A quebra:** apagar de `V2__esquema.sql` as três linhas da constraint (o comentário `-- Dupla reserva barrada...`, `CONSTRAINT ocupacoes_sem_sobreposicao` e o `EXCLUDE USING gist ...`) e tirar a vírgula que sobra na linha anterior. Depois:

```bash
./mvnw -B verify -Dtest=NenhumTeste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=ConcorrenciaApiIT -Dfailsafe.failIfNoSpecifiedTests=false -Djacoco.skip=true
```

**Resultado observado em 24/10/2026** (sobre a `main` em `53b502b`): `ConcorrenciaApiIT` com **7 testes e 7 falhas, todas por asserção**, nas linhas 115 (`ct060`, 20 solicitações para a mesma sala), 135 (`ct061`, mesmo professor), 156 (`ct062`, rodada 1), 179 e 197 (`ct064`), 210 (`ct065`) e 226 (`ct063`, que falha na pré-condição "a constraint de exclusão existe"). **Com a constraint**, a mesma classe tem 7 testes e 0 falhas (runs `40102847090` e `40099032564`, e a execução E-24).

**Registro anterior:** em [limitadores-de-nota.md](limitadores-de-nota.md), seção 5, o mesmo experimento sobre `e6dbc51` deu 6 falhas e 1 erro; o erro era do `ct063`, corrigido depois pelo BUG-023. A diferença para os 7 de agora é essa correção.

## 4. RN-01 e RN-06: experimentos da auditoria da RTM

Registrados com detalhe em [auditoria-rtm.md](auditoria-rtm.md), seção 6 (24/10/2026, `main` em `6d49292`).

- **RN-01:** apagado o `if (!fim.isAfter(inicio)) throw ...` do construtor de `Periodo`. `PeriodoTest.ct033_terminoDeveSerPosteriorAoInicio` (casos `[2]` e `[3]`, 2 falhas em 9) ficou vermelho por asserção; `ReservasApiIT.ct033` também (`Status expected:<400> but was:<500>`, porque o CHECK do banco ainda barra a gravação).
- **RN-06:** removido o portão de perfil da aprovação. Só o caso do Administrador ficou vermelho (`AprovacaoBloqueioApiIT.ct067` e `AutorizacaoApiIT.ct117[60]`, 2 falhas em 159). O caso do Solicitante **sobreviveu**: era uma lacuna de teste (BUG-026), corrigida no PR 77 com um teste novo que isola a regra, visto vermelho por asserção antes da correção.

## 5. RN-02 e RN-11: sobreposição e fronteira semiaberta

**Onde a regra está de verdade.** A decisão de sobreposição da produção não passa por `Periodo.sobrepoe`: a busca de conflito é SQL (`o.periodo && tstzrange(:inicio, :fim, '[)')` em `JdbcReservaRepository.buscarConflito`) e a garantia final é a constraint de exclusão. `Periodo.sobrepoe` só é chamado por `PeriodoTest` (`git grep sobrepoe -- src`: a definição em `Periodo.java` e as duas chamadas em `PeriodoTest.java`). Por isso foram feitos dois pares de experimentos.

| Experimento | Quebra | Classes rodadas | Resultado |
| --- | --- | --- | --- |
| 5 | `'[)'` passa a `'[]'` na consulta de `buscarConflito` (fronteira inclusiva no SQL) | `ReservasApiIT`, `CatalogoApiIT`, `AprovacaoBloqueioApiIT` (74 testes) | **4 falhas**: `AprovacaoBloqueioApiIT.ct080_bordasDoBloqueioNaoEntramNaLista` e `ReservasApiIT.ct035_conflitoEFronteiraValemParaOsTresTipos` nos 3 tipos de recurso. `CatalogoApiIT` verde (21 de 21) |
| 6 | Condição de sobreposição da mesma consulta trocada por `and false` (verificação prévia desligada; a constraint continua) | `ReservasApiIT`, `CatalogoApiIT` (55 testes) | **3 falhas**: `ct057_professorOcupado...`, `ct059ECt065_cadaRecusaPorConflitoGravaUmaTentativa...` e `ct081_reservaEmRecursoEmManutencao...` |
| 7 | `Periodo.sobrepoe` com fronteira inclusiva (`!inicio.isAfter(outro.fim) && !outro.inicio.isAfter(fim)`) | `PeriodoTest`, `ReservasApiIT` | `PeriodoTest.ct034_conflitoEmTrincaNasFronteiras` com **2 falhas** em 9 (casos `[1]` e `[4]`); `ReservasApiIT` 34 de 34 verdes |
| 8 | `Periodo.sobrepoe` sempre falso | `PeriodoTest`, `ReservasApiIT` | `PeriodoTest.ct034` com **4 falhas** em 9 (casos `[2]`, `[3]`, `[5]` e `[6]`); `ReservasApiIT` 34 de 34 verdes |

**Leitura:** a regra de sobreposição real (SQL e constraint) é protegida por testes de API que falham quando ela é quebrada (experimentos 5 e 6). Os experimentos 7 e 8 só são mortos pelo teste de unidade, porque o método mutado não está no caminho da produção: o `PeriodoTest` protege um método que o sistema não usa. Isto **não** é regra desprotegida; é código sem uso (dívida técnica registrada em [limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md)).

## 6. RN-05 e RN-07: estados e reserva iniciada

| Experimento | Quebra | Classes rodadas | Resultado |
| --- | --- | --- | --- |
| 9 | Em `MaquinaDeEstados`, `SOLICITADA` ganha o destino `CONCLUIDA` | `MaquinaDeEstadosTest`, `ReservasApiIT`, `AprovacaoBloqueioApiIT` (109 testes) | **1 falha**: `MaquinaDeEstadosTest.ct075_transicoesProibidas...` (1 de 56). As duas classes de API (53 testes) ficaram verdes: nenhum endpoint tenta a transição proibida, então só a tabela de transições do teste de unidade a pega |
| 10 | Em `PoliticaDeCancelamento.avaliar`, `EM_USO` deixa de ser recusado (`if (estado.terminal())`) | `PoliticasDeReservaTest`, `PermissoesDaReservaTest`, `ReservasApiIT`, `PermissoesDaReservaApiIT` | **8 falhas por asserção**: `PermissoesDaReservaTest.ct144` (3 casos, de 26), `PoliticasDeReservaTest.ct052` (3 casos, de 29), `PermissoesDaReservaApiIT.ct145_emUsoEEstadosTerminaisNaoTemAcoes` (1 de 22) e `ReservasApiIT.ct052_emUsoNaoEhCancelada` (1 de 34) |

## 7. Autorização: matriz perfil por operação

A autorização tem duas camadas (ADR-004): a cadeia de segurança (`SegurancaConfig`) e `@PreAuthorize` nos controladores. A matriz [matriz-autorizacao.md](matriz-autorizacao.md) é conferida contra a API por `AutorizacaoApiIT.ct117_matrizPerfilXOperacao` (141 casos).

| Experimento | Quebra | Classes rodadas | Resultado |
| --- | --- | --- | --- |
| 11 | `.requestMatchers("/api/bloqueios", "/api/bloqueios/**")` de `hasRole("ADMINISTRADOR")` para `authenticated()` | `AutorizacaoApiIT`, `AprovacaoBloqueioApiIT` (160 testes) | **2 falhas** em `ct117_matrizPerfilXOperacao` (casos `[67]` e `[68]`, Solicitante e Responsável em "Criar bloqueio", que passaram a receber 2xx no lugar de 403). `AprovacaoBloqueioApiIT.ct083_soOAdministradorGereBloqueios` ficou verde |
| 12 | `POST /api/reservas` passa a aceitar também `ADMINISTRADOR` | `AutorizacaoApiIT`, `ReservasApiIT` (175 testes) | **1 falha** em `ct117_matrizPerfilXOperacao` (caso `[45]`, Administrador em "Criar reserva"). `ReservasApiIT.ct043_administradorNaoCriaReserva` ficou verde |

**Leitura:** nos dois casos a camada 2 (`@PreAuthorize` e as políticas de serviço) continua recusando o perfil quebrado, então os testes específicos (`ct083`, `ct043`) não detectam a quebra da camada 1. Quem detecta é a matriz (`ct117`), por isso ela é o teste que protege a cadeia de segurança. Cada camada tem um teste que a pega isoladamente em outro nível; não foi feito um experimento que quebre as duas camadas ao mesmo tempo.

## 8. RN-08: auditoria

| Experimento | Quebra | Classes rodadas | Resultado |
| --- | --- | --- | --- |
| 13 | Em `AprovacaoService`, o registro do evento `RESERVA_APROVADA` fica sob `if (false)` | `AuditoriaApiIT`, `AprovacaoBloqueioApiIT`, `ReservasApiIT` (60 testes) | **2 falhas**: `AuditoriaApiIT.ct096_cadaTransicaoGeraExatamenteUmEventoComAnteriorNovoAtorEInstante` e `AprovacaoBloqueioApiIT.ct066_responsavelAprovaReservaDeOutroUsuario` |
| 14 | `JdbcAuditoriaRepository.registrar` retorna sem gravar | `AuditoriaApiIT`, `AprovacaoBloqueioApiIT`, `ReservasApiIT`, `UsoMaterialApiIT` (83 testes) | **20 falhas**: `AprovacaoBloqueioApiIT` 7 de 19, `AuditoriaApiIT` 6 de 7, `ReservasApiIT` 4 de 34 e `UsoMaterialApiIT` 3 de 23 |

## 9. RF-03, RF-09, RF-12 e RF-13: os quatro críticos que não tinham prova

Experimentos de 26/10/2026 sobre a `main` em `9624160` (depois dos PRs 81 e 82 do Dependabot), no mesmo método da abertura deste documento, em `git worktree` descartável. Cada um estava sem prova de mutação na primeira rodada.

| Experimento | Quebra | Classes rodadas | Resultado |
| --- | --- | --- | --- |
| 15 (RF-03) | Em `JdbcRecursoRepository.pesquisar`, o filtro de capacidade `>=` passa a `<=` | `CatalogoApiIT` (21) | **1 falha**: `ct027_filtroPorTipoCapacidadeLocalizacaoECompetencia` |
| 16 (RF-03) | No mesmo método, a condição de disponibilidade `not exists` passa a `exists` | `CatalogoApiIT`, `ReservasApiIT` (55) | **3 falhas**: `CatalogoApiIT.ct028`, `CatalogoApiIT.ct029` e `ReservasApiIT.ct030` |
| 17 (RF-09, RN-23) | `PoliticaDeUso.avaliarConclusao` devolve sempre vazio no fim (nunca recusa por material pendente) | `PermissoesDeUsoTest`, `UsoMaterialApiIT`, `PermissoesDeUsoApiIT` | **4 falhas**: `PermissoesDeUsoTest.ct150` (2 casos de 20), `PermissoesDeUsoApiIT.ct152_emUsoComMaterialRetiradoNaoPodeConcluirAteDevolver` e `UsoMaterialApiIT.ct089_conclusaoComMaterialRetiradoENaoDevolvidoListaAsPendencias` |
| 18 (RF-09) | `PoliticaDeUso.avaliarDevolucao` devolve sempre vazio (aceita devolver o que não foi retirado) | `MovimentacoesAtuaisTest`, `UsoMaterialApiIT` | **3 falhas**: `MovimentacoesAtuaisTest.ct151` (2 casos de 9) e `UsoMaterialApiIT.ct088_devolverUnidadeNaoRetiradaEhRecusado` |
| 19 (RF-12, RN-31) | `JdbcRelatorioRepository.linhas` passa a incluir `SOLICITADA` nos estados que contam | `RelatorioApiIT` (9) | **1 falha**: `ct108_soAprovadaEmUsoEConcluidaContam` |
| 20 (RF-12, RN-31) | O mesmo método soma `upper - lower` da ocupação inteira, sem recortar pelo período | `RelatorioApiIT` (9) | **1 falha**: `ct109_contaSoAParteInternaDoPeriodo` |
| 21 (RF-13) | Em `frontend/src/erros/mensagens.ts`, a mensagem de `CONFLITO_DE_ALOCACAO` vira o código técnico | `npx vitest run src/erros` (80) | **1 falha**: `mensagemPara > CONFLITO_DE_ALOCACAO devolve a mensagem e a ação documentadas` |
| 22 (RF-13) | Em `frontend/src/layout/Estrutura.module.css`, `.coluna { min-width: 0 }` vira `min-width: 700px` | E2E `npx playwright test -g "celular"` contra PostgreSQL, API e front reais em `compose.e2e.yaml` | **1 falha** em `em celular (360 por 640) › fluxo principal: buscar e reservar uma sala, sem rolagem horizontal`: `expect(received).toBe(expected)`, esperado `true`, recebido `false`, na linha 146 (`scrollWidth <= innerWidth`) |

**O que isto prova e o que não prova.** Cada um dos quatro requisitos críticos tem agora um teste que fica vermelho por asserção quando a regra quebra. O RF-13 continua **parcial** em outro sentido: a responsividade é provada por **uma** jornada E2E, só no Chromium; as outras telas em celular dependem de roteiro manual. Nenhum mutante sobreviveu, então nenhum teste novo foi escrito.

## 10. Requisitos críticos com prova de que o teste falha

"Crítico" segue a [RTM.md](../../RTM.md): 22 linhas, sendo 12 de RF, 8 de RN e 2 de RNF.

| Grupo | Com experimento de mutação | Sem experimento |
| --- | --- | --- |
| RN críticas (RN-01 a RN-08) | **8 de 8**: RN-01 (4), RN-02 (5 e 6 no caminho de produção; 7 e 8 só do modelo), RN-03 (3), RN-04 (2), RN-05 (9), RN-06 (4), RN-07 (10), RN-08 (13 e 14) | — |
| RNF críticos (RNF-05, RNF-06) | **2 de 2**: RNF-05 pela RN-03 (3) e RNF-06 pela matriz (11 e 12) | — |
| RF críticos | **12 de 12**: RF-01 (11, 12), RF-03 (15, 16), RF-04 (RN-01, RN-07), RF-05 (5 e 6), RF-06 (3), RF-07 (RN-06), RF-08 (2), RF-09 (17, 18), RF-10 (13, 14), RF-12 (19, 20), RF-13 (21, 22), RF-16 (9, 10) | — |
| **Total** | **22 de 22 (100%)** | 0 de 22 |

**Nenhuma linha é chamada de "coberta" sem execução:** as 22 têm o experimento registrado acima, com a classe, o resultado e o commit. O RN-06 (4) tem a ressalva de que o resultado original deixou um mutante vivo para o Solicitante, corrigido pelo BUG-026 (PR 77) com teste novo visto vermelho; o experimento não foi repetido depois da correção.
