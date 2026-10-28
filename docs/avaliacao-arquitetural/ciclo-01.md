# Avaliação arquitetural, ciclo 01: com o código de pé

Compara, cenário a cenário (CEN-01 a CEN-09), o que a arquitetura promete em [ciclo-00.md](ciclo-00.md) e
[arquitetura.md](../arquitetura.md) com o que o código faz. Passo 4.I do [plano de projeto](../plano-de-projeto.md). Este passo **não alterou
código**: as divergências viram ações priorizadas. A correção de DV-01 veio depois, em passo próprio com TDD (seção 5). Data da medição: 17/10/2026, branch `fase-4/backend`.

## 1. Como ler

- **Fato**: confirmado em arquivo e linha, ou em execução registrada neste documento.
- **Não verificado**: nenhuma evidência foi produzida; consta como tal, nunca como aprovado.
- Linhas citadas são do commit da avaliação; podem mudar com edições posteriores.
- Medições de 17/10/2026: `./mvnw -B clean verify` verde, 468 testes (136 de unidade e arquitetura, 332 de
  integração e BDD), 0 falhas; cobertura de linhas 96,7% (1551/1604) e de branches 84,6% (438/518); mutação do
  pacote `model` 77% (60/78), 0 sobreviventes ([mutacao.md](../testes/mutacao.md)).
- **Desempenho:** medido na rodada 01 da Fase 5 (ver CEN-04). SonarCloud: Quality Gate aprovado no PR 2.

## 2. Comparação por cenário

| Cenário | A arquitetura promete | O código faz (arquivo e linha) | Teste que prova | Veredito |
| --- | --- | --- | --- | --- |
| CEN-01 Solicitações simultâneas | Exatamente uma reserva aceita; as demais 409; uma tentativa `CONCORRENCIA` por recusa (RN-30) | Constraint `EXCLUDE USING gist` em `V2__esquema.sql:152`. Ocupações inseridas em ordem de recurso: `ReservaService.java:301-312`. Violação 23P01 e impasse 40P01 viram `ConflitoDeAlocacao`: `ReservaService.java:320-327` | `ConcorrenciaApiIT#ct060` (`:105`), `#ct062` (repetição), `#ct065`, `#ct064` (vários recursos, ordens opostas); `#ct063` (`:221`) remove a constraint, mostra a duplicidade e a restaura | **Cumprido.** 20 solicitações: 1 aceita, 19 com 409, 19 tentativas. A hipótese de 20 e 5 repetições segue sem validação (R-24) |
| CEN-02 Aprovação da própria reserva ou sem perfil | 403 sem mudar estado; autorização em duas camadas | Camada 1 na cadeia de segurança: `SegurancaConfig.java:46-50`. Camada 2: `@PreAuthorize` nos controladores. Dono não aprova: `AprovacaoService.java:91-92` | `AutorizacaoApiIT#ct117_matrizPerfilXOperacao` (`:151`, 137 casos); BDD-01 a BDD-04 | **Cumprido, depois de BUG-008.** A camada 1 só existia na anotação; foi implementada na correção `73488e5` |
| CEN-03 Professor já alocado | 409 identificando o recurso; nenhuma reserva nova; 1 tentativa `SOBREPOSICAO` | Verificação prévia: `ReservaService.java:132` e `:184`; a garantia continua sendo a constraint | `ReservasApiIT#ct057` (`:238`) | **Cumprido** |
| CEN-04 Latência com usuários simultâneos | p95 de até 300 ms para 50 usuários (hipótese) | Índice GiST da constraint; relatório paginado; sem cache de sessão | `perf/reservas.jmx`, rodadas 01 a 04 (17/10/2026) | **Medido: não atende à hipótese para a criação.** Consulta p95 de 55 a 152 ms (atende); criação p95 de 568 a 886 ms (não atende); 0 erro real e 0 resposta 500. A rodada 04 (diagnóstico, `fsync` desligado) trouxe o p95 da criação a 87 ms, localizando a causa no disco do Docker desta máquina, e não no código. Ver [resultado-02.md](../performance/resultado-02.md) |
| CEN-05 Provedor com falha | Reserva permanece válida; notificação PENDENTE com próxima tentativa; envio depois do commit | Linha PENDENTE gravada na transação: `NotificacaoService.java:48`. Despacho posterior: `DespachoDeNotificacoesService.java:50-85`. Timeouts configuráveis: `WebhookNotificador.java:36-43` (padrões 0,5 s e 1,5 s no `application.yml`, valores iniciais a validar) | `NotificacaoApiIT#int03` (`:197`), `#int04` (`:210`), `#ct104` (`:252`); `TrocaDeProvedorTest` (3 casos) | **Cumprido com ressalva.** Reenvio sem valor (D3): sem tentativas configuradas, a falha temporária fica PENDENTE e não é reenviada sozinha |
| CEN-06 Auditoria atômica | Um evento por transição, na mesma transação; falha ao auditar desfaz; tabela sem UPDATE nem DELETE | Gatilhos `auditoria_sem_alteracao` e `auditoria_sem_truncamento`: `V2__esquema.sql:213-226`. Transição centralizada em `UsoService.java:153` | `AuditoriaApiIT#ct096`, `#ct097` (falha injetada em `:87`); `EsquemaIT:98-100` (UPDATE e DELETE recusados) | **Cumprido com ressalva.** R-23 (papel com privilégio) **não verificado**: o teste usa o papel da aplicação, que é dono da tabela e poderia remover o gatilho |
| CEN-07 Fronteira do bloqueio | 409 `MANUTENCAO` com sobreposição; aceita quando termina no início ou começa no fim ([início, fim)) | `Periodo.sobrepoe`; motivo: `ReservaService.java:333` | `ReservasApiIT#ct081`; BDD-06 (5 linhas, inclusive um segundo antes e depois); `PeriodoTest` | **Cumprido.** A trinca de CT-080 em nível de API só passou a existir com o BDD-06 desta sessão |
| CEN-08 Troca do provedor | A alteração fica restrita ao adaptador: 1 componente, 0 diferenças no contrato | Interface `NotificadorExterno` em `service`; adaptador `integration/WebhookNotificador.java:27` (visível só no pacote) | `TrocaDeProvedorApiIT` (contrato idêntico e despacho com outro adaptador), `TrocaDeProvedorTest`, `ProvedorIsoladoArquiteturaTest` | **Cumprido**, com a observação de que a regra de arquitetura é redundante com a visibilidade do pacote e vale como documentação executável |
| CEN-09 Segredo do provedor em erro | O corpo não atravessa a API nem entra no log | O corpo da resposta do provedor nunca é lido: comentário e código em `WebhookNotificador.java:22-23`; só o status é classificado | `NotificacaoApiIT#int06` (`:235`) com `CapturedOutput` | **Cumprido** |

## 3. Divergências

| ID | Divergência | Evidência | Gravidade |
| --- | --- | --- | --- |
| DV-01 (**corrigida em `61ce37d`, BUG-009**) | A decisão de 15/10/2026 (ADR-003; [arquitetura.md](../arquitetura.md), seção 13.2) diz que, se a gravação da tentativa de conflito falhar, "o 409 é mantido e a perda vai para o log". O código **não captura** a falha: `registrarEConverter` chama `tentativas.registrar(...)` sem `try/catch` e `ReservaService` não tem `Logger`. Uma falha na gravação vira erro 500 em vez de 409 | `ReservaService.java:97-98`, `:105-106` e `:329-335`; `JdbcTentativaConflitoRepository.java:20-37` | Alta: a resposta de RF-06 e de RN-03 muda; R-19 foi "aceito por decisão" **com** o 409 mantido |
| DV-02 | `arquitetura.md` descrevia camadas hexagonais; o código é MVC | Corrigido (`1a5b5bd`) | Resolvida |
| DV-03 | O relatório anterior citava 313 testes; o total é a soma de duas fases do `verify` (unidade e integração) | Este documento, seção 1 | Baixa, só documentação |

## 4. Riscos, não riscos, pontos de sensibilidade e trade-offs, com as medidas

### Riscos

| ID | Situação em 17/10/2026 | Medida real |
| --- | --- | --- |
| R-17 | **Materializado e corrigido** (BUG-007). Ordem de inserção por `recurso_id` mais tratamento do 40P01 | `#ct064` verde |
| R-18 | Sem divergência observada: nenhum teste de estado ou de bloqueio mostrou `ativa` fora de sincronia com o estado | Testes de estado e de bloqueio verdes; não há teste dedicado a essa coerência |
| R-19 | Era aberto por DV-01 (a decisão aceitava a perda da contagem, mas não a perda do 409). **Fechado** pela correção BUG-009 | `FalhaNaTentativaApiIT` (2 casos) verde |
| R-20 | Coberto: nenhuma notificação sem commit (`#ct104`); chave de idempotência igual no reenvio (`#ct105`) | Verde |
| R-21 | **Parcialmente medido**: a consulta (que valida a sessão a cada requisição) teve p95 de 76 ms sob 50 usuários; cache de sessão não existe | Rodada 01 |
| R-22 | Coberto: job idempotente em execuções seguidas e simultâneas (`AprovacaoBloqueioApiIT#ct073`) | Verde |
| R-23 | **Parcialmente verificado**: gatilho bloqueia UPDATE e DELETE; papel privilegiado não testado | `EsquemaIT:98-100` |
| R-24 | **Confirmado**: 20 solicitações, 5 repetições, 300 ms, 50 usuários, 0,5 s e 1,5 s seguem sem origem | — |

### Não riscos

| ID | Situação |
| --- | --- |
| NR-01 | **Confirmado** por `#ct060` e `#ct063` (sem a constraint, duplica) |
| NR-02 | **Confirmado** por `int03` e `int04` |
| NR-03 | **Confirmado** por `#ct117` (137 casos), com a ressalva de BUG-008 |
| NR-04 | **Confirmado**: `RelogioDeTeste` em todos os testes de tempo (`CT-051`, `CT-053`, `CT-093`) |

### Pontos de sensibilidade e trade-offs

| ID | Observação medida |
| --- | --- |
| PS-05 (ordem de inserção) | Confirmado como sensível: sem ela, o impasse ocorre (BUG-007) |
| PS-02, PS-04, PS-06 | Seguem sem valor (D3, D17); os testes usam valor de teste marcado como tal |
| TO-01 (constraint × latência) | Sem medição de latência |
| TO-03 (tentativa fora da transação) | O custo é maior que o previsto: DV-01 mostra que a separação tirou também a proteção do 409 |
| TO-05 (camadas × custo de mapeamento) | O custo foi pago uma vez, na mudança para MVC (ADR-014), sem alteração de asserção |

## 5. Ações priorizadas para o próximo ciclo

| Prioridade | Ação | Origem | Esforço |
| --- | --- | --- | --- |
| 1 | ~~Corrigir DV-01~~ **Feito**: BUG-009, vermelho `0a80fc7`, verde `61ce37d` | DV-01, R-19 | Concluído |
| 2 | ~~Medir CEN-04 e CEN-01 sob carga~~ **Feito nas rodadas 01 a 04** (CEN-01 cumprido, inclusive pelo caminho do impasse; CEN-04 não atende para a criação, com causa no `fsync` do ambiente). Falta validar as hipóteses com o professor e, se possível, repetir em outra máquina | R-24, R-21 | Concluído, com a validação pendente |
| 3 | ~~Testar R-23 com papel distinto do dono da tabela~~ **Feito** (`AuditoriaPapelIT`); o papel dono da aplicação segue como risco aceito | CEN-06 | Concluído |
| 4 | Obter o valor de D3 e de D17 e trocar o valor de teste | PS-04, PS-06 | Depende do professor |
| 5 | Rodar o Quality Gate do SonarCloud e tratar os apontamentos | Porta de saída da Fase 4 | Depende do Bloco F |

## 6. Revisão no fechamento (26/10/2026): JaCoCo, SonarCloud e riscos

As medições da seção 1 são de 17/10/2026 (Fase 4). Esta seção atualiza a evidência com a leitura final de [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) e revisa os riscos.

| Evidência | Fase 4 (17/10/2026) | Fechamento | Origem |
| --- | --- | --- | --- |
| JaCoCo, linhas | 96,7% (1551 de 1604) | **97,01%** (1751 de 1805), meta de 80% atingida | Run [`40120487376`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40120487376), artefato `relatorio-jacoco` |
| JaCoCo, branches | 84,6% (438 de 518) | **86,88%** (523 de 602), meta de 70% atingida | Mesmo run |
| SonarCloud | Quality Gate aprovado no PR 2 | Quality Gate **aprovado**, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 issues abertas (branch `main`) | [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) |
| Testes | 468 | 665 no back end (231 de unidade e arquitetura, 434 de integração e BDD), 910 no front, 5 E2E, 0 falhas | [execucao-e24.md](../testes/execucao-e24.md) |
| Limite | O JaCoCo e o SonarCloud medem só o Java | Idem: **o front não tem cobertura medida** | [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md), seção 6 |

| Risco | Situação no fechamento | Origem |
| --- | --- | --- |
| R-17 (impasse com vários recursos) | Corrigido (BUG-007); `ct064` verde | Seção 4 |
| R-19 (tentativa de conflito perdida) | Fechado (BUG-009); `FalhaNaTentativaApiIT` verde | Seção 4 |
| R-21 (consulta de sessão a cada requisição) | Medido na rodada 01 (consulta com p95 de 76 ms); sem cache de sessão | [resultado-01.md](../performance/resultado-01.md) |
| R-22 (job SEM_DECISAO em mais de uma instância) | Coberto por `ct073` | Seção 4 |
| R-23 (papel dono do esquema pode desligar o gatilho) | **Risco aceito**; separar os papéis de migração e de aplicação é dívida técnica | [limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md) |
| R-24 (medidas hipotéticas) | **RNF-08b não atendido** (p95 de 568 a 886 ms contra 300 ms); as hipóteses não foram validadas pelo professor | [resultado-02.md](../performance/resultado-02.md) |
| R-25 e R-26 (teste de notificação intermitente) | R-25 **aberto**, causa desconhecida; BUG-017 mitigado pelo R-26, não corrigido | [limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md) |

## 7. Complemento de 28/10/2026: CEN-10 e CEN-11

Os cenários CEN-10 e CEN-11 ([ciclo-00.md](ciclo-00.md), seção 3) ficaram fora da comparação da seção 2, que cobre CEN-01 a CEN-09. Este complemento faz a mesma comparação, sobre o commit da tag `v1.0.0-rc2` (`d2b6af1`). Este passo **não alterou código**. Linhas citadas são desse commit e podem mudar com edições posteriores. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

| Cenário | A arquitetura promete | O código faz (arquivo e linha) | Teste que prova | Veredito |
| --- | --- | --- | --- | --- |
| CEN-10 Execução única do cancelamento por SEM_DECISAO | Reserva SOLICITADA cujo início foi alcançado vai a cancelada com motivo SEM_DECISAO uma única vez, com um evento de auditoria e uma notificação PENDENTE; reserva APROVADA não é alterada; trava e idempotência entre execuções (ADR-012, tática Retry idempotente e Transactions) | Agendador: `AgendadorDeTransicoes.java:18` (só liga com `app.jobs.sem-decisao.habilitado=true`) e `:29-35` (`@Scheduled` chama `cancelarSemDecisao`). Trava consultiva: `TransicoesAutomaticasService.java:24` (chave fixa) e `:44` (`tentarTravarJob`, que devolve 0 se outra execução está em andamento), implementada por `pg_try_advisory_xact_lock` em `JdbcReservaRepository.java:216-218`. Seleção só de `SOLICITADA` que exige aprovação e já começou: `JdbcReservaRepository.java:205-209`. Condição de estado na escrita: `cancelarPeloSistema` com `where id = :id and estado = :esperado` (`JdbcReservaRepository.java:190-195`), chamada com `EstadoReserva.SOLICITADA` em `TransicoesAutomaticasService.java:52`. No mesmo bloco transacional (`:43`): notificação ao solicitante (`:53`), inativação das ocupações (`:54`) e auditoria com ator SISTEMA (`:55-56`) | `AprovacaoBloqueioApiIT#ct072_semDecisaoNoInstanteDeInicioCancelaPeloSistema` (`:226-242`: 0 cancelamentos um milissegundo antes do início e 1 no instante do início; motivo, ocupações inativas e 1 evento de auditoria com ator SISTEMA); `#ct073_jobEhIdempotenteEmExecucoesSeguidasESimultaneas` (`:245-270`: 4 execuções simultâneas com `ExecutorService` e `CountDownLatch`, mais uma seguida; total 1 cancelamento e 1 evento `RESERVA_CANCELADA`); `#ct074_jobNaoTocaReservaAprovada` (`:273-280`) | **Confirmado** para estado, motivo, auditoria, idempotência e reserva APROVADA intacta. **Não verificado:** (a) a notificação PENDENTE do cancelamento por SEM_DECISAO: o código a grava (`:53`), mas nenhum dos três testes consulta `notificacoes` (`NotificacaoApiIT:145` cobre só o cancelamento pelo dono); (b) "duas instâncias da aplicação": `ct073` usa 4 threads do mesmo processo contra o mesmo PostgreSQL, o que exercita a trava do banco, mas não dois processos; (c) o `@Scheduled` do `AgendadorDeTransicoes` não é executado por nenhum teste, que chama o serviço direto |
| CEN-11 Alteração que inclui recurso restrito | O servidor recalcula "exige aprovação" e ignora o valor do cliente; a reserva APROVADA volta a SOLICITADA, com as ocupações trocadas na mesma transação e auditoria (D12, RN-19) | O corpo da alteração não tem o campo: `AlteracaoDeReserva` traz só título, descrição, início, fim e `recursoIds` (`model/AlteracaoDeReserva.java:7`). Recálculo quando os recursos mudam: `ReservaService.java:191-193` (`exigeAprovacao = alocados.stream().anyMatch(Recurso::restrito)`, marcado D12). Volta a SOLICITADA: `ReservaService.java:194-195`; caso inverso (SOLICITADA sem restrito vira APROVADA): `:196-197`. Ocupações removidas e reinseridas antes da decisão de estado: `:189-190`. Gravação do estado e do novo valor: `:207`. Auditoria `RESERVA_ALTERADA` com estado anterior e novo: `:226-229`; auditoria `RESERVA_APROVADA` do sistema no caso inverso: `:230-233`. O estado só pode mudar se a política permitir a alteração (dono, SOLICITADA ou APROVADA, antes do início): `PoliticaDeAlteracao.java:15-26` | `ReservasApiIT#ct048_acrescentarRecursoRestritoRecalculaEReaprova` (`:348-360`: reserva APROVADA, alteração acrescenta o projetor com `"exigeAprovacao": false` no corpo; resposta 200, estado SOLICITADA e `exige_aprovacao` verdadeiro no banco); `#ct049_removerOUltimoRecursoRestritoAprovaPeloSistema` (`:362-372`: caso inverso, 1 evento `RESERVA_APROVADA` com ator SISTEMA); `#ct046_alterarPeriodoDeReservaQueExigiaAprovacaoVoltaASolicitada` (`:318-329`: volta a SOLICITADA e 1 evento `RESERVA_ALTERADA` APROVADA→SOLICITADA); `PoliticasDeReservaTest#ct051_*` (política de alteração) | **Confirmado** para o recálculo no servidor, a volta a SOLICITADA e o caso inverso. **Não verificado:** `ct048` não afirma a auditoria nem a troca das ocupações (a auditoria de mudança de estado é afirmada em `ct046`, no caso de mudança de período); a atomicidade das ocupações com o estado depende da transação que envolve a alteração (`ReservaService.java:108`) e não tem teste de falha no meio |

**O que continua hipótese.** As medidas dos dois cenários em [ciclo-00.md](ciclo-00.md) são contagens por teste, não amostras estatísticas: "1 evento e 1 notificação por reserva cancelada" e "100% das alterações que incluem recurso restrito voltam a SOLICITADA" estão provadas apenas para os casos listados acima, e o valor do intervalo do job (`app.jobs.sem-decisao.intervalo`) segue sem valor padrão e sem origem na especificação. O job só liga com `app.jobs.sem-decisao.habilitado=true`, propriedade que não consta em `application.yml` (fato: busca no commit `d2b6af1`), de modo que, sem essa configuração, a aplicação não cancela reservas por SEM_DECISAO sozinha. A limitação está declarada em [limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md).
