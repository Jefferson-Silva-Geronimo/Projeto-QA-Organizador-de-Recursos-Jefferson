# Avaliação arquitetural, ciclo 01: com o código de pé

Compara, cenário a cenário (CEN-01 a CEN-09), o que a arquitetura promete em [ciclo-00.md](ciclo-00.md) e
[arquitetura.md](../arquitetura.md) com o que o código faz. Prompt 4.I do plano mestre. Este passo **não alterou
código**: as divergências viram ações priorizadas. A correção de DV-01 veio depois, em passo próprio com TDD (seção 5). Data da medição: 17/10/2026, branch `fase-4/backend`.

## 1. Como ler

- **Fato**: confirmado em arquivo e linha, ou em execução desta sessão.
- **Não verificado**: nenhuma evidência foi produzida; consta como tal, nunca como aprovado.
- Linhas citadas são do commit da avaliação; podem mudar com edições posteriores.
- Medições desta sessão: `./mvnw -B clean verify` verde, 468 testes (136 de unidade e arquitetura, 332 de
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
| DV-02 | `arquitetura.md` descrevia camadas hexagonais; o código é MVC | Corrigido nesta sessão (`1a5b5bd`) | Resolvida |
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
| 1 | ~~Corrigir DV-01~~ **Feito** nesta sessão: BUG-009, vermelho `0a80fc7`, verde `61ce37d` | DV-01, R-19 | Concluído |
| 2 | ~~Medir CEN-04 e CEN-01 sob carga~~ **Feito nas rodadas 01 a 04** (CEN-01 cumprido, inclusive pelo caminho do impasse; CEN-04 não atende para a criação, com causa no `fsync` do ambiente). Falta validar as hipóteses com o professor e, se possível, repetir em outra máquina | R-24, R-21 | Concluído, com a validação pendente |
| 3 | ~~Testar R-23 com papel distinto do dono da tabela~~ **Feito** (`AuditoriaPapelIT`); o papel dono da aplicação segue como risco aceito | CEN-06 | Concluído |
| 4 | Obter o valor de D3 e de D17 e trocar o valor de teste | PS-04, PS-06 | Depende do professor |
| 5 | Rodar o Quality Gate do SonarCloud e tratar os apontamentos | Porta de saída da Fase 4 | Depende do Bloco F |
