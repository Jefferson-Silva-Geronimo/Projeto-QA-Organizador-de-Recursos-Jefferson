# Status dos requisitos obrigatórios

Comparação dos 14 requisitos funcionais obrigatórios (RF-01 a RF-14) e das regras críticas (RN-01 a RN-08) da [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seções "Requisitos funcionais obrigatórios" e "Regras críticas", com o código, os testes e a [RTM.md](../RTM.md). Posição de 26/10/2026, sobre a `main` em `7aabc26`; os resultados de teste são os da execução E-24 (run [`40116523445`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40116523445), `c9240cd`: back end 665 testes, front 910, E2E 5 de 5, 0 falhas; [execucao-e24.md](testes/execucao-e24.md)).

## 1. Critério

| Situação | Quando se usa |
| --- | --- |
| **feito** | Existe teste automatizado cuja **asserção** verifica o comportamento da regra e que passou na CI. A coluna *Prova* diz se há também um experimento de mutação em que a regra quebrada deixou o teste vermelho ([mutacao-manual.md](testes/mutacao-manual.md)) |
| **parcial** | Parte do requisito tem teste que falharia se a regra quebrasse e parte não tem, ou só tem verificação manual |
| **ausente** | Sem teste ou sem implementação |

"Verde na CI" **não** é "prova de que o teste pega a regra quebrada": essa prova é a coluna *Prova*. Onde a coluna diz "só asserção", o teste existe e passou, mas ninguém quebrou a regra para ver o vermelho. RF-11 e RF-14 não têm tela, por interpretação declarada (F6-20, [decisoes-equipe.md](decisoes-equipe.md)).

## 2. Limitadores de nota

As quatro condições da seção "Avaliação" da especificação, na ordem em que pesam. Detalhe e comandos em [limitadores-de-nota.md](testes/limitadores-de-nota.md).

| Limitador | Situação | Evidência | Prova | Risco se ficar de fora |
| --- | --- | --- | --- | --- |
| Aplicação que não executa | **feito** | README "Como subir"; clone limpo da `v1.0.0-rc1` subiu (528 s do clone ao front; [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 2.5); `./mvnw -B verify` com 5 execuções consecutivas verdes em clone novo (F7-19) | Defeito real achado e corrigido (BUG-019: o README original não subia) | Nota limitada; o avaliador não consegue rodar |
| Pipeline ausente | **feito** | [ci.yml](../.github/workflows/ci.yml) com `test`, `frontend`, `e2e` e `segredos`, mais SonarCloud; `main` protegida e válida para administrador; vermelho intencional que barrou o merge (PR descartável 59) | Vermelho intencional visto | Nota limitada; sem prova de qualidade contínua |
| Falha de autorização | **feito** | `AutorizacaoApiIT.ct117_matrizPerfilXOperacao` (141 casos, a matriz [matriz-autorizacao.md](testes/matriz-autorizacao.md) confere com a API); `AutenticacaoApiIT` e `UsuariosApiIT` para sessão | Experimentos 11 e 12 de [mutacao-manual.md](testes/mutacao-manual.md): a matriz fica vermelha | Nota limitada; perfil acessa o que não deve |
| Possibilidade de dupla reserva | **feito** | `ConcorrenciaApiIT.ct060` a `ct065` (20 solicitações simultâneas, repetição, vários recursos em ordens opostas), `EsquemaIT.ct007` (constraint de exclusão) | Experimento 2: sem a constraint, 7 de 7 testes de `ConcorrenciaApiIT` falham | Nota limitada; reserva duplicada |

## 3. Requisitos funcionais RF-01 a RF-14

| Requisito | Situação | Evidência (arquivo e teste) | Prova | Risco se ficar de fora |
| --- | --- | --- | --- | --- |
| RF-01 Autenticação e autorização por perfil | **feito** | `AutenticacaoApiIT.ct001` a `ct006`; `AutorizacaoApiIT.ct117` (matriz), `ct118` a `ct121`; `UsuariosApiIT.ct005` | Mutação (11, 12) | Escalada de perfil; vazamento entre perfis (R-03, R-12) |
| RF-02 Cadastro e consulta de salas, professores e materiais | **feito** | `CatalogoApiIT.ct017` a `ct026`; front: Catálogo (CT-156, `PaginaDoCatalogo.*.test.tsx`) | Só asserção | Cadastro inconsistente de recurso (R-14) |
| RF-03 Pesquisa por tipo, capacidade, localização, competência e disponibilidade | **feito** | `CatalogoApiIT.ct027` a `ct032`; `ReservasApiIT.ct030`; E2E `jornadas.spec.ts` (CT-161) | Mutação (15, 16) | Reserva em recurso indisponível; erro de fronteira na busca (R-02, R-09) |
| RF-04 Criação, alteração e cancelamento de reservas | **feito** | `ReservasApiIT.ct040` a `ct056`; `PoliticasDeReservaTest.ct051` a `ct053`; `PermissoesDaReservaTest.ct144`; `PermissoesDaReservaApiIT.ct145` | Mutação (RN-01, RN-07 e 10) | Perda de integridade; aprovação contornada (R-04, R-05) |
| RF-05 Detecção de sobreposição de horários, inclusive na agenda do professor | **feito** | `ReservasApiIT.ct035`, `ct057`, `ct058`, `ct059ECt065`. `PeriodoTest.ct034` é teste do modelo: `Periodo.sobrepoe` não é chamado pela produção | Mutação (5 e 6, no caminho de produção; 7 e 8 só do modelo) | Sobreposição não detectada (R-02); limitador de nota |
| RF-06 Proteção contra dupla reserva em solicitações simultâneas | **feito** | `ConcorrenciaApiIT.ct060` a `ct065`; `EsquemaIT.ct007` a `ct009` | Mutação (2) | Dupla reserva (R-01); limitador de nota |
| RF-07 Aprovação obrigatória para recursos restritos | **feito** | `AprovacaoBloqueioApiIT.ct066` a `ct070`; `FilaComSolicitanteApiIT.ct125`, `ct126`; `PermissoesDeDecisaoTest.ct146`; E2E CT-163 e CT-164 | Mutação (RN-06); o caso do Solicitante foi lacuna até o BUG-026 | Aprovação contornada (R-04, R-03) |
| RF-08 Bloqueio de recursos em manutenção | **feito** | `AprovacaoBloqueioApiIT.ct076` a `ct083`; `ReservasApiIT.ct081`; `ListagemDeBloqueiosApiIT.ct123`, `ct124` | Mutação (2, 5, 6) | Reserva em recurso em manutenção (R-08) |
| RF-09 Registro de retirada e devolução de materiais e equipamentos | **feito** | `UsoMaterialApiIT.ct084` a `ct095`; `MovimentacoesAtuaisTest.ct151` | Mutação (17, 18) | Controle incorreto de unidade e devolução (R-13) |
| RF-10 Histórico auditável de mudanças | **feito** | `AuditoriaApiIT.ct096` a `ct101`; `EsquemaIT.ct011` (somente inserção) | Mutação (13, 14) | Auditoria incompleta ou alterável (R-07, R-23) |
| RF-11 Notificação simulada ou integração com API externa | **feito**, com ressalva | `NotificacaoApiIT.int01ECt103`, `int02`, `int03`, `int05`, `int06`, `ct102`, `ct104`, `ct105`; `NotificacaoTempoLimiteApiIT.int04`; `TrocaDeProvedorApiIT.ct106`. Sem tela (F6-20) | Só asserção. **Ressalva:** `int01ECt103` falhou 3 vezes de forma intermitente, causa desconhecida (R-25), mitigado por limite próprio (R-26) | Falha do provedor derruba a reserva (R-10) |
| RF-12 Relatório de utilização por recurso, carga horária alocada e conflitos evitados | **feito** | `RelatorioApiIT.ct107` a `ct113`; front: Relatórios (CT-157) | Mutação (19, 20) | Números incorretos no relatório (R-11) |
| RF-13 Interface responsiva e mensagens de erro compreensíveis | **parcial** | Mensagens: `AutenticacaoApiIT.ct006`, `AutorizacaoApiIT.ct120`, `ct121`; mapa de 34 códigos (CT-127, `erros/mensagens.test.ts`). Responsivo: um E2E em 360 por 640 (CT-165, `jornadas.spec.ts`) e roteiros manuais em navegador real | Mutação (21, 22). Responsividade provada por **uma** jornada E2E, só no Chromium; axe com `color-contrast` incompleto em diálogos; as demais telas em celular só por roteiro manual ([limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md)) | Vazamento de detalhe interno em erro (R-12); tela inutilizável no celular |
| RF-14 Documentação de API ou dos fluxos públicos do sistema | **feito** | `DocumentacaoApiIT.ct114` a `ct116`; `ContratoObrigatoriosApiIT.ct134`, `ct135`; `ContratoDeRequisicoesApiIT.ct166`, `ct167`; `docs/api/openapi.json`. Sem tela (F6-20) | Só asserção | Documentação diverge do comportamento (R-15) |

**Resumo:** 13 de 14 **feito** (um deles, RF-11, com ressalva) e 1 **parcial** (RF-13); nenhum **ausente**. Todos os RF críticos (RF-01, RF-03 a RF-10, RF-12, RF-13 e RF-16) têm prova de mutação.

## 4. Regras críticas RN-01 a RN-08

| Regra | Situação | Evidência (arquivo e teste) | Prova | Risco se ficar de fora |
| --- | --- | --- | --- | --- |
| RN-01 O término deve ser posterior ao início | **feito** | `PeriodoTest.ct033`; `ReservasApiIT.ct033`; `EsquemaIT.ct010`; `PoliticasDeReservaTest.ct039` | Mutação (auditoria da RTM, seção 6) | Reserva de duração zero ou negativa |
| RN-02 Reservas do mesmo recurso não podem se sobrepor | **feito** | `ReservasApiIT.ct035`, `ct057`; `ConcorrenciaApiIT.ct061`; `EsquemaIT.ct007`, `ct008`. `PeriodoTest.ct034` é teste do modelo, fora do caminho de produção | Mutação (5 e 6, no caminho de produção; 7 e 8 só do modelo) | Sobreposição de reservas |
| RN-03 Duas solicitações simultâneas produzem uma única reserva aceita | **feito** | `ConcorrenciaApiIT.ct060` a `ct065`; `EsquemaIT.ct007`, `ct009` | Mutação (2) | Dupla reserva sob concorrência |
| RN-04 Recursos em manutenção não podem ser reservados | **feito** | `ReservasApiIT.ct081`; `AprovacaoBloqueioApiIT.ct076`, `ct080`; `CatalogoApiIT.ct029` | Mutação (1, 5, 6) | Reserva em recurso em manutenção |
| RN-05 Estados da reserva | **feito** | `MaquinaDeEstadosTest.ct075`; `AuditoriaApiIT.ct096` | Mutação (9) | Transição de estado indevida |
| RN-06 Somente responsáveis aprovam recursos restritos | **feito** | `AprovacaoBloqueioApiIT.ct066`, `ct067`; `AutorizacaoApiIT.ct117`; teste do BUG-026 (Solicitante que não é dono) | Mutação (4); mutante do Solicitante vivo até o BUG-026, corrigido; experimento não repetido depois | Aprovação por quem não pode |
| RN-07 Reservas iniciadas não podem ser apagadas | **feito** | `ReservasApiIT.ct052_emUsoNaoEhCancelada`, `ct056`; `PermissoesDaReservaApiIT.ct145`; `PoliticasDeReservaTest.ct052` | Mutação (10) | Perda de reserva em uso |
| RN-08 Toda mudança de estado gera auditoria | **feito** | `AuditoriaApiIT.ct096` a `ct098`; `EsquemaIT.ct011` | Mutação (13, 14) | Transição sem rastro |

**Prova de mutação nos críticos:** 22 de 22 linhas críticas da RTM (100%); ver [mutacao-manual.md](testes/mutacao-manual.md), seções 9 e 10.

## 5. Pendências, em ordem

1. **Limitadores de nota (aplicação que não executa, pipeline ausente, falha de autorização e dupla reserva):** nenhuma pendência aberta; os quatro têm evidência e prova. O que continua é a **repetição da prova de clone limpo no commit de cada release candidate**: na `v1.0.0-rc1` foi feita; na `v1.0.0-rc2` foi feita (seção 2.6 de [limitadores-de-nota.md](testes/limitadores-de-nota.md)); na `v1.0.0-rc3` será refeita depois da tag, que só sai com autorização expressa.
2. **RF-13 parcial:** responsividade provada por uma jornada E2E em Chromium; as demais telas em celular e outros navegadores só por roteiro manual. Pendência: ampliar o E2E ou aceitar a limitação.
4. **RNF-08b não atendido** (p95 de criação de 568 a 886 ms contra 300 ms), hipótese de 300 ms sem validação ([resultado-02.md](performance/resultado-02.md)).
5. **R-25 aberto** (`NotificacaoApiIT.int01ECt103`, causa desconhecida; RF-11).
6. **D14:** a troca de perfil não é recusada pelo mínimo de dois Responsáveis (decisão declarada).
7. **Front sem cobertura medida** (JaCoCo e SonarCloud medem só o Java).
8. **`Periodo.sobrepoe` sem uso na produção** (dívida técnica).
9. Demais itens de [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md).

## 6. Divisão das pendências

A equipe é **uma pessoa**: Jefferson Silva Geronimo é o autor, o responsável pelas decisões e o único revisor humano. Por isso não há divisão de pendências entre pessoas: todas as acima são dele. O agente de código (Claude Code; o GitHub Copilot não foi usado) executa e propõe sob a revisão dele, e a "revisão por pares" do processo é **revisão assistida**, limitação declarada do entregável ([limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md)). A ordem acima é a de execução sugerida: o que mexe em limitador de nota vem antes do que mexe em meta, e o que mexe em meta vem antes da dívida técnica.
