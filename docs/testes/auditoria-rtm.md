# Auditoria da RTM

Auditoria de qualidade da [RTM.md](../../RTM.md), feita em 24/10/2026 na `main` em `6d49292`. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). **Nada foi corrigido nesta auditoria:** cada achado virou defeito (BUG-020 a BUG-027, seção 7), com issue, e foi corrigido depois, em PR próprio. As seções 1 a 9 descrevem o **estado inicial** de 24/10/2026 (`main` em `6d49292`); o resultado das correções está na seção 10. Nenhuma linha foi marcada "testada" sem execução.

## 1. Resumo

| Item | Resultado |
| --- | --- |
| Linhas auditadas | **55** (49 de RF e RN, 6 de RNF); 54 `testado` e 1 `medido: não atende à hipótese` (RNF-08) |
| Linhas críticas | **22** (12 RF, 8 RN e 2 RNF) |
| Link quebrado na RTM | **0** |
| CT citado que não existe em `casos-de-teste.md` | **0** |
| Classe de teste citada que não existe | **0** |
| Classe de teste citada que falhou na CI atual | **0** (run [`40103681320`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40103681320): back end 659 testes, 0 falhas) |
| Requisito crítico sem cobertura | **0** (as 22 linhas críticas têm CT, teste e execução verde) |
| Requisito sem risco | **0** |
| Teste sem asserção | **0** nos métodos `ctNNN` e `intNN` (3 classes usam auxiliar que afirma, seção 3) |
| Linhas "aprovadas" sem ressalva | **1** |
| Linhas aprovadas com ressalva | **54** (flags I, V, E e M, seção 4) |
| Defeitos abertos | **8** (BUG-020 a BUG-027) |
| "Apague a regra" | **3 de 3 regras** ficaram vermelhas por asserção (RN-01, RN-03 e RN-06); no RN-06 só o caso do Administrador, ver BUG-026 |

**Leitura:** a RTM não tem linha vazia, link quebrado, teste ausente ou teste vermelho. Os problemas são de **precisão do vínculo** (a RN aponta para blocos de CT, não para os CT da regra), de **rastreabilidade do front** (27 CT sem identificador no código), de **execução citada** (38 linhas só com a execução local E-1) e **uma lacuna de teste em regra crítica** (RN-06, Solicitante). Nenhuma meta do [plano de projeto](../plano-de-projeto.md) foi dada como atingida sem ressalva por esta auditoria; a decisão de qualidade é de Jefferson.

## 2. Escopo e método

| Item | Valor |
| --- | --- |
| Entrada | `RTM.md` (matriz de RF e RN e quadro de RNF), `docs/testes/casos-de-teste.md`, `docs/plano-de-teste.md` (riscos), `src/test` e `frontend` |
| Execução de referência | Run da CI [`40103681320`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40103681320) (PR 62, commit final `23bfdea`): job `test` com 226 testes de unidade e arquitetura e 433 de integração e BDD, job `frontend` com 910 testes em 56 arquivos e job `e2e` com 5 de 5, todos sem falha |
| Verificação mecânica | Script de apoio (Python, só leitura, **fora do repositório**) que lê as linhas da RTM, cruza os CT com `casos-de-teste.md`, procura o método `ctNNN` ou `intNN` em `src/test`, confere a existência das classes citadas, confere a asserção no corpo do método e lê o resultado de cada classe no log da CI |
| Verificação manual | Leitura dos auxiliares de asserção, dos CT das regras RN-01 a RN-08 e dos trechos dos três experimentos "apague a regra" |
| Critérios por linha | (1) cada CT citado existe; (2) cada CT de back end tem método `ctNNN`, `intNN` ou `@CT` em feature; (3) o método contém asserção; (4) cada classe citada existe e passou na CI atual; (5) a linha cita uma execução E-n; (6) a linha tem risco definido no plano de teste |

Flags de ressalva por linha: **I** CT de front ou E2E sem identificador no código (BUG-024); **V** RN com CT rotulado ausente da linha (BUG-020); **E** só execução local E-1 citada (BUG-025); **M** mutante sobrevivente no "apague a regra" (BUG-026).

## 3. Resultado por critério

| Critério | Resultado |
| --- | --- |
| CT existente | Os 167 CT de `casos-de-teste.md` estão definidos; todo CT citado na RTM está entre eles (o `CT-004` tem nível "U e A") |
| Teste de back end identificável | Todos os CT de back end citados têm método `ctNNN` ou feature. O `CT-103` é o método `int01ECt103` (`NotificacaoApiIT`). `INT-01` a `INT-06` têm um método cada |
| Teste de front/E2E identificável | **27 dos 35** CT de nível F ou E citados na RTM **não têm identificador** em nenhum dos 57 arquivos de teste do front e do E2E; só `CT-161` cita um arquivo (`frontend/e2e/jornadas.spec.ts`). Os que têm método Java (`CT-144` a `CT-147`, `CT-150` a `CT-153`) estão fora desse total |
| Asserção | Todo método `ctNNN`/`intNN` tem asserção. Três classes afirmam por auxiliar (`permissoes(...)`, `item(...)`): `PermissoesDaReservaApiIT` (CT-145), `PermissoesDaFilaApiIT` (CT-147) e `PermissoesDeUsoApiIT` (CT-152). O auxiliar de `PermissoesDaReservaApiIT` e o de `PermissoesDeUsoApiIT` fazem `andExpect(jsonPath(...))`; o `item(...)` de `PermissoesDaFilaApiIT` **não foi lido** (lacuna) |
| Execução na CI atual | As 35 classes citadas rodaram no run `40103681320` com 0 falhas e 0 erros |
| Execução citada na linha | **17 de 55** linhas citam uma execução com run de CI (E-2, E-5 em diante); **38** citam só a E-1 (local, 17/10/2026, 468 testes) |
| Risco | Toda linha tem risco, e todo `R-xx` citado existe no plano de teste |

## 4. Resultado por linha

Linhas aprovadas sem ressalva: 1. Aprovadas com ressalva: 54. Reprovadas: 0. "Crítica" segue o critério da RTM (regras RN-01 a RN-08 e RF ligados a elas).

| Linha | Crítica | CT | Classes de teste na CI atual | Execução citada | Resultado |
| --- | --- | --- | --- | --- | --- |
| RF-01 Autenticação e autorização por perfil | sim | 14 CT | 4 classes, verdes | E-1 | Aprovada com ressalva (I, E) |
| RF-02 Cadastro e consulta de salas, professores  | não | 9 CT | 1 classe, verde | E-1, E-17 | Aprovada com ressalva (I) |
| RF-03 Pesquisa por tipo, capacidade, localização | sim | 7 CT | 2 classes, verdes | E-1, E-22 | Aprovada com ressalva (I) |
| RF-04 Criação, alteração e cancelamento de reser | sim | 13 CT | 5 classes, verdes | E-1, E-10, E-22, E-8, E-9 | Aprovada com ressalva (I) |
| RF-05 Detecção de sobreposição de horários, incl | sim | 5 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (E) |
| RF-06 Proteção contra dupla reserva em solicitaç | sim | 4 CT | 1 classe, verde | E-1 | Aprovada com ressalva (E) |
| RF-07 Aprovação obrigatória para recursos restri | sim | 10 CT | 4 classes, verdes | E-1, E-11, E-13, E-22 | Aprovada com ressalva (I) |
| RF-08 Bloqueio de recursos em manutenção | sim | 9 CT | 3 classes, verdes | E-1, E-21, E-23 | Aprovada com ressalva (I) |
| RF-09 Registro de retirada e devolução de materi | sim | 7 CT | 3 classes, verdes | E-1, E-14, E-15 | Aprovada com ressalva (I) |
| RF-10 Histórico auditável de mudanças | sim | 7 CT | 4 classes, verdes | E-1, E-16, E-20 | Aprovada com ressalva (I) |
| RF-11 Notificação simulada ou integração com API | não | 2 CT e 6 INT | 2 classes, verdes | E-1 | Aprovada com ressalva (E) |
| RF-12 Relatório de utilização por recurso, carga | sim | 3 CT | 1 classe, verde | E-1, E-18 | Aprovada com ressalva (I) |
| RF-13 Interface responsiva e mensagens de erro c | sim | 23 CT | 4 classes, verdes | E-1, E-22, E-4, E-9 | Aprovada com ressalva (I) |
| RF-14 Documentação de API ou dos fluxos públicos | não | 7 CT | 3 classes, verdes | E-1, E-23, E-5 | Aprovada |
| RF-15 Gestão de usuários e perfis | não | 6 CT | 2 classes, verdes | E-1, E-19 | Aprovada com ressalva (I) |
| RF-16 Ciclo de vida de uso da reserva | sim | 7 CT | 4 classes, verdes | E-1, E-14, E-15 | Aprovada com ressalva (I) |
| RN-01 Término posterior ao início | sim | 7 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-02 Sem sobreposição do mesmo recurso | sim | 6 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-03 Simultâneas geram uma reserva aceita | sim | 4 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-04 Recurso em manutenção não é reservável | sim | 6 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-05 Estados da reserva | sim | 7 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-06 Só responsáveis aprovam restritos | sim | 9 CT | 4 classes, verdes | E-1 | Aprovada com ressalva (V, E, M) |
| RN-07 Reserva iniciada não é apagada | sim | 10 CT | 5 classes, verdes | E-1, E-10, E-8, E-9 | Aprovada com ressalva (I, V) |
| RN-08 Mudança de estado gera auditoria | sim | 6 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-09 Aprovação automática sem restrito | não | 7 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-10 Aprovação exigida, gravada na criação | não | 8 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-11 Intervalos [início, fim) | não | 6 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-12 Material é unidade identificada | não | 8 CT | 1 classe, verde | E-1 | Aprovada com ressalva (E) |
| RN-13 Professor é recurso, vínculo opcional | não | 8 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-14 Janela e dias de funcionamento da sala | não | 8 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-15 UTC e fuso configurável | não | 6 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-16 Segregação de funções | não | 3 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-17 Administrador não reserva nem aprova | não | 9 CT | 4 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-18 Cancelamento por estado e perfil | não | 10 CT | 5 classes, verdes | E-1, E-10, E-8, E-9 | Aprovada com ressalva (I, V) |
| RN-19 Alteração atômica e reaprovação | não | 10 CT | 5 classes, verdes | E-1, E-8, E-9 | Aprovada com ressalva (I, V) |
| RN-20 Início de uso | não | 4 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-21 Não compareceu | não | 4 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-22 Bloqueio sobre reservas existentes | não | 5 CT | 1 classe, verde | E-1, E-21 | Aprovada com ressalva (I, V) |
| RN-23 Conclusão condicionada à devolução | não | 4 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-24 Motivo na decisão do Responsável | não | 3 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-25 Cancelamento SEM_DECISAO | não | 3 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-26 Visibilidade por perfil | não | 9 CT | 4 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-27 Nenhuma exclusão física | não | 7 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-28 Notificação | não | 2 CT e 6 INT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-29 Auditoria ampliada | não | 8 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-30 Conflitos evitados registrados | não | 5 CT | 2 classes, verdes | E-1 | Aprovada com ressalva (V, E) |
| RN-31 Cálculos do relatório | não | 3 CT | 1 classe, verde | E-1, E-18 | Aprovada com ressalva (I, V) |
| RN-32 Desativação de recurso | não | 8 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RN-33 Quem rejeita | não | 3 CT | 1 classe, verde | E-1 | Aprovada com ressalva (V, E) |
| RNF-05 Uma reserva aceita por solicitações simul | sim | 6 CT | 1 classe, verde | E-1 | Aprovada com ressalva (E) |
| RNF-06 Nenhuma operação acessível a perfil sem p | sim | 3 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (E) |
| RNF-07 Validação de entrada e erros sem vazament | não | 3 CT e 1 INT | 3 classes, verdes | E-1 | Aprovada com ressalva (E) |
| RNF-08 Desempenho: p95 de 300 ms, 50 usuários, e | não | 0 CT | sem classe IT/Test citada | — | Aprovada com ressalva (E) |
| RNF-09 Toda mudança de estado gera auditoria | não | 6 CT | 3 classes, verdes | E-1 | Aprovada com ressalva (E) |
| RNF-12 Logs com correlação e sem segredo | não | 0 CT | 1 classe, verde | E-1 | Aprovada com ressalva (E) |

## 5. Vínculo das RN com os CT

`casos-de-teste.md` rotula cada CT com as regras que ele cobre (coluna Rastreio). A tabela compara, para cada RN, os CT **rotulados com a regra** e os CT **citados na linha da RTM**. Em nenhuma das 33 RN os dois conjuntos coincidem; nas oito críticas (RN-01 a RN-08) faltam CT rotulados e sobram CT sem o rótulo. 46 dos 167 CT definidos não aparecem em nenhuma linha da RTM. Defeito: [BUG-020](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/63).

| Regra | CT rotulados com a regra | CT na linha da RTM | Rotulados e ausentes da linha | Na linha sem o rótulo |
| --- | --- | --- | --- | --- |
| RN-01 | 3 | 7 | CT-010, CT-039 | 6 |
| RN-02 | 4 | 6 | CT-034, CT-035, CT-057, CT-061 | 6 |
| RN-03 | 3 | 4 | CT-007, CT-009 | 3 |
| RN-04 | 4 | 6 | CT-076, CT-080, CT-081 | 5 |
| RN-05 | 1 | 7 | CT-075 | 7 |
| RN-06 | 4 | 9 | CT-066, CT-067, CT-146, CT-148 | 9 |
| RN-07 | 4 | 10 | CT-056, CT-079 | 8 |
| RN-08 | 4 | 6 | CT-097, CT-155 | 4 |
| RN-09 | 5 | 7 | CT-041, CT-049, CT-070, CT-098 | 6 |
| RN-10 | 4 | 8 | CT-041, CT-042, CT-048 | 7 |
| RN-11 | 5 | 6 | CT-007, CT-008, CT-034, CT-080 | 5 |
| RN-12 | 1 | 8 | — | 7 |
| RN-13 | 3 | 8 | CT-058 | 6 |
| RN-14 | 4 | 8 | CT-030, CT-036, CT-037 | 7 |
| RN-15 | 1 | 6 | CT-038 | 6 |
| RN-16 | 9 | 3 | CT-014, CT-015, CT-044, CT-067, CT-092, CT-146, CT-147, CT-148, CT-163 | 3 |
| RN-17 | 10 | 9 | CT-012, CT-013, CT-067, CT-083, CT-122, CT-132, CT-143, CT-144 | 7 |
| RN-18 | 7 | 10 | CT-053, CT-054, CT-069 | 6 |
| RN-19 | 8 | 10 | CT-046, CT-050, CT-051 | 5 |
| RN-20 | 8 | 4 | CT-085, CT-086, CT-087, CT-144, CT-150, CT-152, CT-154 | 3 |
| RN-21 | 5 | 4 | CT-094, CT-150, CT-152, CT-154 | 3 |
| RN-22 | 7 | 5 | CT-079, CT-082, CT-124, CT-167 | 2 |
| RN-23 | 7 | 4 | CT-090, CT-091, CT-150, CT-152, CT-154 | 2 |
| RN-24 | 2 | 3 | CT-148 | 2 |
| RN-25 | 5 | 3 | CT-071, CT-072, CT-073, CT-074, CT-098 | 3 |
| RN-26 | 8 | 9 | CT-031, CT-100, CT-113, CT-125, CT-142, CT-145, CT-153 | 8 |
| RN-27 | 4 | 7 | CT-056, CT-101, CT-142 | 6 |
| RN-28 | 4 | 2 | CT-104, CT-105 | 0 |
| RN-29 | 5 | 8 | CT-005, CT-016, CT-099, CT-122 | 7 |
| RN-30 | 4 | 5 | CT-065, CT-081, CT-111 | 4 |
| RN-31 | 6 | 3 | CT-108, CT-109, CT-110, CT-111 | 1 |
| RN-32 | 4 | 8 | CT-023, CT-024, CT-156 | 7 |
| RN-33 | 4 | 3 | CT-069, CT-146, CT-147, CT-148 | 3 |

Exemplos nas críticas: RN-06 não cita CT-066 (Responsável aprova reserva de outro) nem CT-067 (quem não pode aprovar) e cita CT-001 a CT-005 (login e sessão); RN-05 não cita CT-075 (transições proibidas) e cita sete CT de criação e cancelamento; RN-02 não cita CT-034, CT-035 e CT-057 (conflito em trinca, por tipo de recurso e de professor); RN-04 não cita CT-076, CT-080 e CT-081; RN-01 não cita CT-010 nem CT-039.

CT definidos e não citados na RTM (46): CT-007, CT-008, CT-009, CT-010, CT-015, CT-023, CT-024, CT-036, CT-037, CT-038, CT-039, CT-041, CT-044, CT-046, CT-048, CT-049, CT-050, CT-051, CT-053, CT-054, CT-056, CT-067, CT-069, CT-071, CT-072, CT-073, CT-074, CT-079, CT-080, CT-081, CT-082, CT-087, CT-090, CT-091, CT-092, CT-094, CT-104, CT-105, CT-106, CT-108, CT-109, CT-110, CT-111, CT-113, CT-149, CT-155.

Observação: "ausente" não quer dizer "regra sem teste". Os CT existem, têm método e passaram na CI; o que falta é o vínculo na RTM.

## 6. Verificação "apague a regra" por amostragem

Em worktree descartável da `main` (`6d49292`), fora do projeto, sem commit; os worktrees foram removidos e a `main` ficou sem diferença (`git status` só com `mvnw.cmd`). Regras escolhidas por Jefferson (RN-03, RN-06 e uma de tempo) e pelo agente de código (RN-01).

| Regra | O que foi apagado | Teste que ficou vermelho | Resultado |
| --- | --- | --- | --- |
| **RN-01** Término posterior ao início | O `if (!fim.isAfter(inicio)) throw ...` do construtor de `Periodo` (3 linhas) | `PeriodoTest.ct033_terminoDeveSerPosteriorAoInicio`, casos `[2]` e `[3]` (14:00 a 14:00 e 16:00 a 14:00), asserção na linha 26: 9 testes, 2 falhas | **Vermelho por asserção.** Rodado à parte, `ReservasApiIT.ct033_terminoIgualAoInicioEhRecusadoESemGravacao` também ficou vermelho: `Status expected:<400> but was:<500>` (o CHECK do banco ainda barra a gravação, mas o erro vaza como 500) |
| **RN-03** Dupla reserva | A constraint `ocupacoes_sem_sobreposicao` na migração `V2__esquema.sql` | `ConcorrenciaApiIT`: 7 testes, 6 falhas por asserção (`expected: 1L`) e 1 erro (`ct063`, ver BUG-023) | **Vermelho por asserção.** Experimento da etapa 2.2d, com o detalhe em [limitadores-de-nota.md](limitadores-de-nota.md), seção 5 (não repetido nesta auditoria) |
| **RN-06** Só Responsável aprova | O portão de perfil da aprovação: `/api/reservas/*/aprovacao` fora do matcher de `SegurancaConfig.java` e sem `@PreAuthorize` em `ReservaController.aprovar` | `AprovacaoBloqueioApiIT.ct067` (linha 134, `Status expected:<403> but was:<200>`) e `AutorizacaoApiIT.ct117[60]` ("Aprovar reserva por ADMINISTRADOR"): 159 testes, 2 falhas | **Vermelho por asserção, mas só para o Administrador.** O caso do Solicitante (linha 133 do `ct067`) continuou em 403 porque o teste usa a **própria** reserva dele e o 403 vem da regra do dono (RN-16, `PoliticaDeDecisao.avaliarAprovacao`); no `ct117` o caso do Solicitante também não falhou (causa não investigada). Lacuna de teste: [BUG-026](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/69) |

Todas as falhas foram **por asserção**, exceto o erro do `ct063`. As três rodadas aconteceram uma vez, em uma máquina; não se mediu variação.

## 7. Achados e defeitos

Severidade proposta pela triagem; a prioridade fica para a equipe, no planejamento ([defeitos/README.md](../defeitos/README.md), seção 3). Estado: **Triado**. Nada foi corrigido.

| BUG | Achado | Severidade proposta | Issue |
| --- | --- | --- | --- |
| BUG-020 | RTM liga cada RN a um bloco de CT, nao aos CT rotulados com a regra | media | [Issue 63](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/63) |
| BUG-021 | Resumo da RTM desatualizado: 48 testadas e 1 parcial, a matriz tem 49 e 0 | baixa | [Issue 64](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/64) |
| BUG-022 | Documentos dizem "137 casos" para AutorizacaoApiIT, que hoje tem 141 testes | baixa | [Issue 65](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/65) |
| BUG-023 | ct063 da erro em vez de falhar por asserção quando a constraint nao existe | baixa | [Issue 66](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/66) |
| BUG-024 | 27 CT de front e E2E citados na RTM nao tem identificador no codigo do teste | media | [Issue 67](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/67) |
| BUG-025 | RTM cita so a execucao local E-1 para 38 de 55 linhas, sem run da CI atual | baixa | [Issue 68](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/68) |
| BUG-026 | Nenhum teste isola a regra RN-06 para o Solicitante: remover o portao de perfil so e detectado para o Administrador | alta | [Issue 69](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/69) |
| BUG-027 | README desatualizado alem do Como subir: roadmap, protecao da main e pastas previstas | media | [Issue 70](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/70) |

Outras observações, que **não** viraram defeito:

- **RNF-08 e RNF-12 sem CT-xxx.** O RNF-08 cita as rodadas de carga (`perf/reservas.jmx`, [resultado-02.md](../performance/resultado-02.md)) e o RNF-12, a classe `LogSeguroApiIT` na coluna de caso de teste. A evidência existe; a coluna não segue o padrão CT-xxx.
- **Experimento do RN-01:** sem a regra no código, o banco ainda recusa o período (CHECK), mas a API responde 500 em vez de 400. É a defesa em profundidade funcionando, e o teste de API acusa a diferença.

## 8. Meta de 100% das regras críticas na RTM

| Pergunta | Resposta |
| --- | --- |
| RN-01 a RN-08 têm linha na RTM, status `testado`, CT existentes, métodos com asserção e execução verde na CI atual? | **Sim, 8 de 8.** Todas com ressalva V (vínculo) e a RN-06 também com M |
| Os RF dependentes (RF-01, 03 a 10, 12, 13 e 16) estão na mesma condição? | **Sim, 12 de 12** críticos, com as ressalvas I (front/E2E sem identificador) e E (execução local) onde indicadas |
| Os 2 RNF críticos (RNF-05 e RNF-06) idem? | **Sim.** Ressalva E |
| A meta de "100% na RTM" da especificação (seção "Metas mensuráveis") está atingida? | **Atingida quanto à presença, ao status e à execução verde.** **Não** atingida quanto à precisão do vínculo regra-teste (BUG-020) nem quanto ao isolamento da RN-06 por teste (BUG-026). A interpretação da meta como "presença" é uma **suposição** (a especificação não define "100% na RTM" além de "requisitos críticos na RTM"); se for "cada regra provada por seus próprios testes", a meta fica **parcial** até corrigir os BUG-020 e BUG-026 |

## 9. Lacunas e limites

| Item | Tipo | Detalhe |
| --- | --- | --- |
| Relevância semântica da asserção | Limite | O script confere que há asserção; a relevância para a regra foi lida à mão só para RN-01 a RN-08 (títulos de CT) e para os três experimentos. As outras 25 RN não foram lidas CT a CT |
| Auxiliar `item(...)` de `PermissoesDaFilaApiIT` | Lacuna | Não foi lido; os dois outros auxiliares foram |
| CT de front/E2E | Limite | Sem identificador no código, a ligação com o arquivo de teste é por pasta e nome da tela (por exemplo, `frontend/src/paginas/aprovacoes`), **não provada por identificador**. A execução dos 910 testes e dos 5 E2E está provada pela CI; qual teste cobre qual CT não |
| Cobertura por linha de código | Lacuna | Não lida aqui; é o item 2.4 (JaCoCo e SonarCloud) |
| Script de apoio | Limite | Fora do repositório; a repetição exige reescrevê-lo a partir dos critérios da seção 2 |
| Amostragem | Limite | Três regras, uma rodada cada, uma máquina. A sobrevivência de mutantes nas demais regras críticas **não** foi medida |
| Mutação automática | Lacuna | Existe [mutacao.md](mutacao.md) da Fase 4; não foi relido nem repetido nesta auditoria |

## 10. Reexecução depois das correções (24/10/2026)

Mesmos critérios e mesmo script de apoio das seções 1 a 9, rodados sobre a `main` depois dos PRs 77 e 78 e das mudanças da RTM e de `casos-de-teste.md` (BUG-020, BUG-021, BUG-024 e BUG-025). Execução de referência: E-24, run [`40116523445`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40116523445) (back end 665 testes, front 910 em 56 arquivos, E2E 5 de 5, 0 falhas; [execucao-e24.md](execucao-e24.md)).

| Medida | Antes | Depois | Defeito |
| --- | --- | --- | --- |
| RN com CT rotulado ausente da linha ou CT sem rótulo na linha (de 33) | 33 | **0** | BUG-020 |
| CT definidos que não aparecem em nenhuma linha da RTM | 46 | **0** | BUG-020 |
| Resumo da RTM (testadas, parciais) contra a matriz | 48 e 1 contra 49 e 0 | **49 e 0** | BUG-021 |
| Linhas sem execução com run de CI citado (de 55) | 38 | **1** (RNF-08, medido por carga) | BUG-025 |
| Classes citadas sem execução verde na CI atual | 0 | **0** | |
| CT de front e E2E sem arquivo de teste identificado em tabela | 27 | **0** (tabela CT-arquivo, 28 CT, seção 4.1 de `casos-de-teste.md`) | BUG-024 |
| CT de front e E2E com `CT-nnn` dentro do teste | 0 | 0 (por decisão F7-05: sem renomear teste) | BUG-024 |

**O que a reexecução não resolve:** a tabela CT-arquivo prova o **arquivo** de cada CT de front, não o teste que cobre cada trecho; a relevância semântica de cada CT em cada linha de RN foi julgada à mão por título (seção 10.1); e o BUG-022 (o "137 casos") e o BUG-027 (README) ficam para o PR 4. BUG-026 e BUG-023 foram corrigidos nos PRs 77 e 78.

### 10.1 CT retirados e acrescentados em cada linha de RN

Julgamento por par: o título do CT contra o nome da regra. O CT que sai da linha de uma RN continua na linha do RF que o motiva e em `casos-de-teste.md`; só deixa de ser apresentado como prova daquela regra. Os CT acrescentados ganharam o rótulo da regra na coluna Rastreio.

| Regra | Retirados da linha (eram cópia de bloco) | Acrescentados à linha |
| --- | --- | --- |
| RN-01 | CT-040, CT-042, CT-045, CT-047, CT-052, CT-055 | CT-010, CT-039 |
| RN-02 | CT-027, CT-028, CT-029, CT-030, CT-031, CT-032 | CT-034, CT-035, CT-057, CT-061 |
| RN-03 | — | CT-007, CT-009 |
| RN-04 | CT-027, CT-028, CT-030, CT-031, CT-032 | CT-076, CT-080, CT-081 |
| RN-05 | CT-033, CT-040, CT-042, CT-045, CT-047, CT-052, CT-055 | CT-075, CT-096 |
| RN-06 | CT-001, CT-002, CT-003, CT-004, CT-005, CT-043, CT-118, CT-119 | CT-066, CT-067, CT-146, CT-148 |
| RN-07 | CT-033, CT-040, CT-042, CT-045, CT-047, CT-052, CT-055 | CT-056, CT-079 |
| RN-08 | CT-095, CT-099, CT-100, CT-101 | CT-097, CT-155 |
| RN-09 | CT-033, CT-042, CT-045, CT-047, CT-052, CT-055 | CT-041, CT-049, CT-070, CT-098 |
| RN-10 | CT-017, CT-018, CT-019, CT-020, CT-021, CT-025, CT-026 | CT-041, CT-042, CT-048 |
| RN-11 | CT-027, CT-029, CT-030, CT-031, CT-032 | CT-007, CT-008, CT-034, CT-080 |
| RN-12 | CT-017, CT-018, CT-020, CT-021, CT-022, CT-025, CT-026 | — |
| RN-13 | CT-017, CT-018, CT-019, CT-022, CT-025, CT-026 | CT-058 |
| RN-14 | CT-018, CT-019, CT-020, CT-021, CT-022, CT-025, CT-026 | CT-030, CT-036, CT-037 |
| RN-15 | CT-027, CT-028, CT-029, CT-030, CT-031, CT-032 | CT-038 |
| RN-16 | CT-068, CT-070 | CT-014, CT-015, CT-044, CT-067, CT-092, CT-117, CT-146, CT-147, CT-148, CT-163 |
| RN-17 | CT-002, CT-003, CT-004, CT-005, CT-118, CT-119 | CT-012, CT-013, CT-067, CT-083, CT-122, CT-132, CT-143, CT-144 |
| RN-18 | CT-033, CT-040, CT-042, CT-045, CT-047, CT-055 | CT-053, CT-054, CT-069 |
| RN-19 | CT-033, CT-040, CT-042, CT-052, CT-055 | CT-046, CT-050, CT-051 |
| RN-20 | CT-088, CT-089, CT-095 | CT-085, CT-086, CT-087, CT-144, CT-150, CT-152, CT-154 |
| RN-21 | CT-075, CT-085, CT-086 | CT-094, CT-150, CT-152, CT-154 |
| RN-22 | CT-076, CT-083 | CT-079, CT-082, CT-124, CT-167 |
| RN-23 | CT-084, CT-095 | CT-090, CT-091, CT-150, CT-152, CT-154 |
| RN-24 | CT-066, CT-070 | CT-148 |
| RN-25 | CT-066, CT-068, CT-070 | CT-071, CT-072, CT-073, CT-074, CT-098 |
| RN-26 | CT-001, CT-002, CT-003, CT-004, CT-005, CT-043, CT-119 | CT-031, CT-100, CT-113, CT-125, CT-142, CT-145, CT-153 |
| RN-27 | CT-033, CT-040, CT-042, CT-045, CT-047, CT-052 | CT-056, CT-101, CT-142 |
| RN-28 | — | CT-104, CT-105 |
| RN-29 | CT-017, CT-018, CT-019, CT-020, CT-021, CT-022, CT-025 | CT-005, CT-016, CT-099, CT-122 |
| RN-30 | CT-034, CT-035, CT-057, CT-058 | CT-065, CT-081, CT-111 |
| RN-31 | CT-112 | CT-108, CT-109, CT-110, CT-111 |
| RN-32 | CT-017, CT-018, CT-019, CT-020, CT-021, CT-022, CT-026 | CT-023, CT-024, CT-156 |
| RN-33 | CT-066, CT-068, CT-070 | CT-069, CT-146, CT-147, CT-148 |

