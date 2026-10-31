# Relatório final de qualidade

Relatório de qualidade do projeto **Organização de Recursos**, escrito em 24/10/2026 e atualizado em 26/10/2026 com os números da execução E-25 e em 28/10/2026 com os da E-26, e revisado para a `v1.0.0-rc4`. Fonte dos requisitos e das metas: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). **Todo número cita um arquivo, um run ou uma consulta; o que não tem origem está como lacuna.** Este relatório descreve o estado do código e dos testes da revisão avaliada, a tag `v1.0.0-rc4` (commit em `git rev-list -n 1 v1.0.0-rc4`), que corrige o BUG-028 e traz a documentação verificada. Os números são os da execução E-27, medida no commit `b5e9bbd` (só `.md` depois dele: `git diff --stat b5e9bbd v1.0.0-rc4`); as execuções E-25 e E-26 são históricas ([execucao-e25.md](testes/execucao-e25.md), [execucao-e26.md](testes/execucao-e26.md)). Cada afirmação é um **fato** (com arquivo), uma **lacuna**, uma **suposição** (com impacto) ou uma **decisão** (com origem).

## 1. Resumo e decisão de qualidade

A decisão de qualidade (**liberar com ressalvas**), os critérios, a evidência de cada critério e os riscos aceitos, com impacto, justificativa e responsável, estão em [decisao-qualidade.md](decisao-qualidade.md). Este relatório traz os dados e não repete a decisão.

**Fatos que sustentam a decisão:**

| Fato | Origem |
| --- | --- |
| Os **quatro limitadores de nota** estão demonstrados, cada um com evidência de execução: aplicação sobe em clone limpo (depois de corrigir o defeito do README, BUG-019), pipeline com checks obrigatórios e um vermelho intencional que bloqueou o merge, matriz de autorização verde (141 testes) e dupla reserva barrada, com o teste vermelho sem a constraint; a prova de clone limpo foi repetida na execução E-25 | [limitadores-de-nota.md](testes/limitadores-de-nota.md) |
| **Metas da especificação atingidas:** linhas 97,84% (meta 80%) e branches 87,21% (meta 70%) na E-27, 0 bugs, 0 vulnerabilidades e 0 issues abertas no SonarCloud com Quality Gate OK, 100% das linhas críticas da RTM com teste e execução verde (execução E-24, mantida) | [leitura-final-cobertura.md](testes/leitura-final-cobertura.md); [auditoria-rtm.md](testes/auditoria-rtm.md) |
| CI verde na `main` no commit `b5e9bbd` (E-27): back end 670 testes, front 910 em 56 arquivos, E2E 5 de 5, 0 falhas | Run `41238067466` |
| **27 defeitos** registrados: 26 fechados e 1 mitigado (BUG-017), nenhum reaberto, nenhum aberto de severidade crítica ou alta | [defeitos/README.md](defeitos/README.md) |

**As ressalvas (detalhe e riscos aceitos em [decisao-qualidade.md](decisao-qualidade.md)):**

1. **RNF-08b não atendido:** a criação de reserva tem p95 de 568 a 886 ms contra a hipótese de 300 ms (causa atribuída ao `fsync` do PostgreSQL em Docker; hipótese de 300 ms **não validada** pelo professor) ([resultado-02.md](performance/resultado-02.md)).
2. **R-25 aberto, causa desconhecida:** `NotificacaoApiIT.int01ECt103` falhou 3 vezes de forma intermitente; BUG-017 está **mitigado, não corrigido** ([decisoes-equipe.md](decisoes-equipe.md), R-25 e R-26).
3. **O front não tem cobertura medida** e o SonarCloud não analisa o TypeScript ([leitura-final-cobertura.md](testes/leitura-final-cobertura.md), seção 6).
4. **Lacunas da especificação resolvidas por decisão da equipe, sem validação externa** (A1 a A8, D1, D3, D4, D9, D17 e outras): decididas por Jefferson em 24/10/2026, com impacto e teste declarados; a maior em retrabalho é a A3 ([decisoes-equipe.md](decisoes-equipe.md), F7-16 e F7-17; seção 9 deste relatório).
5. **"Revisão por pares" é revisão assistida:** a equipe é uma pessoa; é uma decisão não validada e uma limitação do entregável (F7-16, item 14).
6. **Entregável fora do repositório:** a apresentação e a demonstração são feitas pelo autor, fora do repositório (seção 11).

## 2. Escopo e itens não testados

**Escopo (fato):** 14 requisitos funcionais da especificação mais RF-15 e RF-16 (da equipe), 33 regras de negócio (RN-01 a RN-08 críticas), 11 telas (T01 a T11), requisitos não funcionais RNF-05 a RNF-12 ([RTM.md](../RTM.md), 55 linhas).

| Item não testado ou não medido | Tipo | Origem |
| --- | --- | --- |
| Cobertura de código do front end; análise do SonarCloud sobre o TypeScript | Lacuna | [leitura-final-cobertura.md](testes/leitura-final-cobertura.md) |
| E2E em outros navegadores além do Chromium; E2E não é repetível no mesmo banco | Limite | [e2e/README.md](testes/e2e/README.md) |
| `BLOQUEIO_COM_RESERVA_EM_USO` e a paginação do relatório, no navegador real (só em teste de componente e de integração) | Limite | RTM, execuções E-18 e E-21 |
| RF-11 (notificação simulada) e RF-14 (documentação) **sem tela**, por interpretação declarada (F6-20) | Interpretação | Seção 9 |
| Acessibilidade: o axe deixa `color-contrast` incompleto em diálogos, aviso e barra inferior; o anel do ícone do calendário é o do navegador | Limite | [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md), seção 5 |
| Carga repetida em outra máquina ou em disco rápido; cada rodada foi executada uma vez | Limite | [resultado-02.md](performance/resultado-02.md), seção 6 |
| Custo por reserva em uso (consulta de movimentações por reserva); listas sem paginação | Lacuna | [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md) |
| TLS, `Strict-Transport-Security`, `Content-Security-Policy`, limitação de taxa, teste de XSS e teste do tempo constante do login | Lacuna | [modelo-de-ameacas.md](testes/modelo-de-ameacas.md) |
| SBOM, verificação de licenças e assinatura do artefato | Dívida técnica | F7-06 |
| Mutação: só o pacote `model`, em 17/10/2026, **não repetida** | Limite | [mutacao.md](testes/mutacao.md) |
| README verificado só em Git Bash no Windows (Linux, macOS e PowerShell não); login pela tela não refeito no clone limpo | Limite | [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 6 |

## 3. Metas contra resultado

| Meta (especificação, seção "Metas mensuráveis") | Resultado | Situação | Origem |
| --- | --- | --- | --- |
| **80%** de cobertura de linhas | **97,84%** (1767 de 1806) | **Atingida** | JaCoCo, run `41238067466` (E-27) |
| **70%** de cobertura de branches | **87,21%** (525 de 602) na E-27; a cobertura de branches varia entre execuções de código idêntico (de 519 a 523 de 602 antes da rc4, [leitura-final-cobertura.md](testes/leitura-final-cobertura.md), seção 9) | **Atingida** | JaCoCo, run `41238067466` (E-27) |
| **0** bugs ou vulnerabilidades críticos | **0 bugs, 0 vulnerabilidades**, 0 issues abertas (CRITICAL e BLOCKER inclusive); Quality Gate **OK** | **Atingida** | SonarCloud, análise do commit `b5e9bbd` (E-27, consulta de 31/10/2026) |
| **100%** dos requisitos críticos na RTM | **22 de 22** linhas críticas (12 RF, 8 RN, 2 RNF) com CT existente, teste identificável (Java) ou arquivo em tabela (front), asserção e execução verde no E-24 | **Atingida**, com o limite abaixo | [auditoria-rtm.md](testes/auditoria-rtm.md), seções 8 e 10; [execucao-e24.md](testes/execucao-e24.md) |

**Limites da quarta meta:** (a) "100% na RTM" foi interpretado como presença, status e execução verde; (b) a relevância de cada CT em cada linha de RN foi julgada à mão, por título ([auditoria-rtm.md](testes/auditoria-rtm.md), seção 10.1); (c) os CT de front não trazem `CT-nnn` dentro do teste, e a tabela CT-arquivo prova o arquivo, não o trecho coberto (BUG-024, decisão F7-05). A especificação avisa que cobertura alta, sozinha, não garante qualidade; os experimentos "apague a regra" estão no bloco 4.

## 4. Resultado dos testes por nível

Execução de referência: E-27, run [`41238067466`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/41238067466) (commit `b5e9bbd`), com o detalhe por classe em [execucao-e27.md](testes/execucao-e27.md). **0 falhas em todos os níveis.** Históricas: E-25 (run `40373624577`, [execucao-e25.md](testes/execucao-e25.md)) e E-26 (run `40790098761`, [execucao-e26.md](testes/execucao-e26.md)).

| Nível | Testes | Onde | Origem |
| --- | --- | --- | --- |
| Unidade e arquitetura (Surefire) | **231** | `src/test`, inclui `ArquiteturaTest` (6 regras MVC, ADR-014) | E-27 |
| Integração com banco real (Failsafe, Testcontainers) | **14** | `AuditoriaPapelIT`, `ContextoIT`, `EsquemaIT`, `PrimeiroAdministradorIT`, `AgendamentoDeNotificacoesIT`, `AgendamentoDeSemDecisaoIT`, `AgendamentoDesligadoIT` | E-27 |
| API em caixa-preta (Failsafe, MockMvc sobre o contexto completo e PostgreSQL real) | **410** | 30 classes `*ApiIT`, inclusive `AutorizacaoApiIT` (141) e `ConcorrenciaApiIT` (7) | E-27 |
| BDD (Cucumber, Failsafe) | **15** | `CucumberIT`, feature `aprovacao-bloqueio.feature` | E-27 |
| **Back end, total** | **670** | 231 + 439 | E-27 |
| Front end (Vitest e Testing Library) | **910**, em 56 arquivos | `frontend/src` | E-27 |
| E2E (Playwright, Chromium, contra API, PostgreSQL e front reais) | **5** | `frontend/e2e/jornadas.spec.ts` | E-27 |

**Ambiente realista (fato):** o banco é PostgreSQL 17 em Testcontainers; a notificação usa WireMock (`NotificacaoApiIT`: 9 testes; `NotificacaoTempoLimiteApiIT`: 1). Mocks ficam nos testes de unidade isolados.

**TDD e BDD (fato):** o histórico da `main` no commit `b5e9bbd` tem **99** commits cujo assunto começa com `test(red)`, **99** com `feat(green)` ou `fix(green)` e **12** com `refactor` (`git log`, 31/10/2026); em 46 dos 99 commits `test(red)` o commit também traz esqueletos de produção (ver [evidencia-tdd.md](testes/evidencia-tdd.md)). As contagens de commits e de pull requests mesclados estão em [checklist.md](entrega/checklist.md), medidas no commit avaliado. O ciclo da Fase 4 está ligado fatia a fatia em [evidencia-tdd.md](testes/evidencia-tdd.md), e o BDD em [bdd-aprovacao-bloqueio.md](testes/bdd-aprovacao-bloqueio.md). Nesta fase, o `MavenWrapperTest` (F7-06 e F7-14) foi feito em `test(red)` visto vermelho por asserção e depois `feat(green)`.

**Os testes protegem a regra? Experimentos "apague a regra" (24/10/2026, worktree descartável, nada na `main`):** RN-01 (`PeriodoTest`: 2 falhas por asserção; na API o `400` virou `500`), RN-03 (`ConcorrenciaApiIT`: 6 falhas por asserção) e RN-06 (só o caso do Administrador ficou vermelho; isso revelou o BUG-026, corrigido com um teste novo que falha por asserção sem o portão de perfil: `Status expected:<403> but was:<200>`) ([auditoria-rtm.md](testes/auditoria-rtm.md), seção 6; [defeitos/README.md](defeitos/README.md), BUG-026). **Mutação (Fase 4, 17/10/2026, só `model`):** 78 mutantes, 60 mortos, 0 sobreviventes entre os cobertos, pontuação de 77% ([mutacao.md](testes/mutacao.md)).

## 5. Concorrência

| Item | Resultado | Origem |
| --- | --- | --- |
| Garantia | Constraint de exclusão `EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)` em `ocupacoes` (a garantia está no banco, para reserva e bloqueio) | [ADR-003](adr/ADR-003-dupla-reserva-constraint-de-exclusao.md); `V2__esquema.sql` |
| Teste | `ConcorrenciaApiIT`: **7 testes, 0 falhas** no E-25 (20 solicitações simultâneas para a mesma sala, para o mesmo professor, 5 repetições, vários recursos em ordens opostas, tentativa de conflito persistida) | Run `40373624577` (E-25) |
| **Prova de que a dupla reserva é impossível e de que o teste protege** | **Com a constraint:** 7 de 7 verdes. **Sem a constraint** (worktree descartável): 7 testes, **6 falhas por asserção** (`expected: 1L`, mais de uma reserva aceita) e 1 erro (o `ct063`, que tentava remover uma constraint que não existia; **corrigido no BUG-023**: agora falha por asserção) | [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 5; BUG-023 |
| Sob carga | 100 reservas aceitas em 100 pares disputados, **0 sobreposição no banco, 0 par duplicado** e cada 409 gerou exatamente uma linha em `tentativas_conflito`; o caminho do impasse (`40P01`, BUG-007) foi exercido e respondeu 409 | [resultado-02.md](performance/resultado-02.md), seções 3 |
| Suposição | As 20 solicitações e as 5 repetições são hipóteses da Aula 10, **sem validação do professor**; impacto: se o professor pedir outro número, repete-se o teste com outro valor, sem mudar a garantia | [casos-de-teste.md](testes/casos-de-teste.md), seção 5 |

## 6. Carga

Plano e requisito em [rnf.md](performance/rnf.md): 50 usuários simultâneos; RNF-08a (consulta p95 de até 300 ms), RNF-08b (criação p95 de até 300 ms), RNF-08c (erro real abaixo de 1%, sendo o 409 esperado **não contado como erro**), RNF-08d (criação nunca responde 500) e RNF-05 (no máximo uma reserva aceita por recurso e intervalo). Todos os valores de 300 ms e 50 usuários são **hipóteses da Aula 10, sem validação do professor**.

| Rodada | Usuários | Consulta p95 | Criação p95 | Observação |
| --- | --- | --- | --- | --- |
| 01 | 50 | 72 ms | **622 ms** | Linha de base |
| 02 | 50, alvos sorteados | 152 ms | **886 ms** | Corrige a cobertura dos alvos; mede CPU e pool |
| 03 | 25 | 55 ms | **568 ms** | Separa saturação de custo por requisição |
| 04 | 25, `fsync` desligado | 76 ms | 87 ms | **Só diagnóstico, não vale como resultado** (configuração insegura) |

(Fonte: [resultado-02.md](performance/resultado-02.md), seção 3, regime sem os primeiros 35 s; resultados brutos `.jtl` em `perf/resultados/`.)

| Requisito | Decisão |
| --- | --- |
| RNF-08a (consulta) | **Atendido:** p95 de 55 a 152 ms |
| **RNF-08b (criação)** | **NÃO ATENDIDO nesta máquina:** p95 de 568 a 886 ms contra 300 ms. Causa atribuída ao `fsync` do PostgreSQL em Docker (sem `fsync`, p95 de 87 ms, só diagnóstico) |
| RNF-08c e RNF-08d | Atendidos: 0 erro real e 0 resposta 500 em todas as rodadas |
| RNF-05 (carga) | Atendido: 0 sobreposição no banco |

**Limite da conclusão (fato):** cada rodada foi executada **uma vez** (a variação é desconhecida); JMeter, API, PostgreSQL e Docker dividem uma máquina de 2 núcleos; a atribuição ao `fsync` vem de **uma** comparação (rodada 03 contra 04), sem medir o disco diretamente; a conclusão vale para esta máquina e este commit. A hipótese de 300 ms não foi validada pelo professor. **Lacuna:** o custo por reserva em uso (uma consulta de movimentações por reserva) não foi medido.

## 7. Segurança e robustez

**Revisão OWASP Top 10:2025** ([revisao-seguranca.md](testes/revisao-seguranca.md), com as atualizações da Fase 7):

| Categoria | Situação |
| --- | --- |
| A01 Broken Access Control | Atendida: matriz de 34 operações em 3 perfis (`AutorizacaoApiIT`, 141 testes na classe) e regras de posse |
| A02 Security Misconfiguration | Parcial: sem TLS e sem `Content-Security-Policy` |
| A03 Software Supply Chain Failures | Parcial: **soma SHA-256 do Maven fixada** e barrando soma errada na CI (F7-06); SBOM, licenças e assinatura ficam como dívida |
| A04 Cryptographic Failures | Parcial: BCrypt e token opaco com hash; sem TLS na aplicação |
| A05 Injection | Atendida: SQL parametrizado; `ct120` nos filtros de pesquisa |
| A06 Insecure Design | Parcial: **modelo de ameaças curto feito** (18 ameaças: 8 cobertas, 6 parciais, 2 de risco aceito, 2 lacunas), com as lacunas abertas |
| A07 Authentication Failures | Atendida: limite de login por conta (5 tentativas em 10 minutos), com limites conhecidos |
| A08 Software or Data Integrity Failures | Parcial: auditoria somente inserção; a aplicação roda como dono das tabelas (R-23) |
| A09 Security Logging and Alerting Failures | Parcial: correlação e log seguro; **sem alerta** (SEC-04, dívida) |
| A10 Mishandling of Exceptional Conditions | Atendida: erros sem pilha, falha de auditoria desfaz a transição, falha do provedor não desfaz a reserva |

**Outros fatos:** validação de entrada e erros sem vazamento têm teste (`ct006`, `ct120`, `LogSeguroApiIT`, `NotificacaoApiIT.int06`); CORS só por variável e sem curinga (`CorsComOrigemApiIT`, `CorsSemOrigemApiIT`); varredura de segredos (gitleaks) em todo PR e agora **check obrigatório** (F7-10); defeitos de segurança achados e corrigidos pela suíte: BUG-008 (validação antes da autorização) e BUG-009 (409 virava 500 sob falha); BUG-026 foi lacuna de **teste**, não de código. **Dependabot:** alertas abertos só no framework `.aiox-core/`, 0 no Maven e 0 no front ([alertas-dependabot.md](testes/alertas-dependabot.md)). **Não houve teste de intrusão**; a cobertura vem dos testes do projeto ([modelo-de-ameacas.md](testes/modelo-de-ameacas.md), seção 5).

## 8. Defeitos encontrados, priorizados e corrigidos

Fonte: [defeitos/README.md](defeitos/README.md), com o processo, as severidades e o índice BUG-001 a BUG-027. **As métricas abaixo são as permitidas; defeitos por pessoa não são medidos.**

| Severidade | Defeitos | Fechados | Mitigados |
| --- | --- | --- | --- |
| Crítica | 2 (BUG-004, BUG-019) | 2 | 0 |
| Alta | 6 (BUG-001, 006, 007, 008, 009, 026) | 6 | 0 |
| Média | 9 (BUG-002, 010, 012, 013, 015, 017, 020, 024, 027) | 8 | 1 (BUG-017) |
| Baixa | 10 (BUG-003, 005, 011, 014, 016, 018, 021, 022, 023, 025) | 10 | 0 |
| **Total** | **27** | **26** | **1** |

**Tempo de ciclo por severidade** (da abertura ao fechamento da issue, em UTC). Só entram os defeitos cuja issue foi aberta **na descoberta**: as issues retroativas (BUG-001 a BUG-006 e BUG-010 a BUG-014) foram abertas depois da correção e não medem ciclo; BUG-007, 008 e 009 não têm issue; BUG-017 está aberto (mitigado).

| Severidade | Defeitos medidos | Tempos de ciclo | Mediana | Máximo |
| --- | --- | --- | --- | --- |
| Crítica | 1 | BUG-019 25 min | 25 min | 25 min |
| Alta | 1 | BUG-026 1 h 47 min | 1 h 47 min | 1 h 47 min |
| Média | 4 | BUG-015 21 min, BUG-020 2 h 36 min, BUG-024 2 h 36 min, BUG-027 2 h 47 min | 2 h 36 min | 2 h 47 min |
| Baixa | 6 | BUG-016 26 min, BUG-018 2 d 0 h 53 min, BUG-021 2 h 36 min, BUG-022 2 h 48 min, BUG-023 2 h 19 min, BUG-025 2 h 36 min | 2 h 36 min | 2 d 0 h 53 min |

**Limites desta métrica:** poucos defeitos por severidade (n pequeno, sem conclusão estatística); BUG-018 aparece com mais de 2 dias porque a issue ficou aberta depois da correção mesclada em 22/10/2026 (PR 43) e só foi fechada em 24/10/2026; os tempos de BUG-019 a BUG-027 são de um mesmo dia de trabalho.

**Taxa de reabertura:** **0 de 23** issues de bug fechadas tiveram evento de reabertura (API de eventos do GitHub, 24/10/2026): as 21 com o rótulo `bug` e as issues 33 e 35, de BUG-015 e BUG-016, que não têm o rótulo. Limite: 3 defeitos (BUG-007, 008 e 009) não têm issue e BUG-017 não foi fechado.

**Defeitos escapados por etapa** (etapa em que foi achado; a etapa em que nasceu só está registrada quando a fonte diz):

| Achado por | Defeitos | Origem (onde nasceu, quando a fonte registra) |
| --- | --- | --- |
| Revisão de documentação ou aplicação do esquema | BUG-001 a BUG-005 (5) | Documentação das Fases 1 e 2 ([defeitos/README.md](defeitos/README.md), observações) |
| CI | BUG-006 (1) | Casca do projeto (Fase 3) |
| Testes automatizados da Fase 4 | BUG-007, 008, 009 (3) | Código da Fase 4 |
| Roteiro em navegador real (Fase 6) | BUG-010 a BUG-016 e BUG-018 (8) | Front end (Fases 6.B e 6.C): **não foram achados pelos 391 a 638 testes de componente da época** |
| Suíte completa local | BUG-017 (1) | Causa desconhecida |
| Prova de clone limpo (Fase 7) | BUG-019 (1) | O passo de subir a aplicação entrou no README em 15/10/2026 às 15:28 (Fase 3) e ficou defeituoso às 16:08 do mesmo dia, quando a Fase 4 passou a exigir `SESSAO_DURACAO` (`git log`); **escapou das Fases 4, 5 e 6** |
| Auditoria da RTM (Fase 7) | BUG-020 a BUG-027 (8) | BUG-023 e BUG-026: testes da Fase 4 (15/10/2026), **escaparam por três fases**; para os outros seis a etapa de origem **não foi analisada** (lacuna) |

**Leitura:** a camada que mais deixou defeito escapar foi a **rastreabilidade e a documentação** (BUG-019 a BUG-027, achados só na Fase 7) e o **front em navegador real** (testes de componente com API simulada não acham foco, pseudo-elemento nem refazer de consulta).

## 9. Riscos residuais e riscos aceitos

"Quem aceitou" é sempre a equipe, que é uma pessoa: **Jefferson Silva Geronimo**.

| Risco | Situação | Quem e quando | Por quê | Origem |
| --- | --- | --- | --- | --- |
| **R-23:** a aplicação usa o papel dono das tabelas, que pode desligar o gatilho da auditoria | Risco aceito | Jefferson, 17/10/2026 | Separar o papel de migração do de aplicação é endurecimento de implantação, fora do que a especificação pede, e o projeto não tem produção; o gatilho já protege contra os caminhos do código. A opção B (papéis separados) vai à dívida técnica | [decisoes-equipe.md](decisoes-equipe.md), R-23 |
| **Limites do login (D18, SEC-01):** pode bloquear a conta de outra pessoa de propósito; tentativas simultâneas podem passar de N por pouco; o e-mail da falha fica guardado na janela | Limitações conhecidas | Equipe, 17/10/2026 (valores 5 em 10 minutos) | O controle é decisão da equipe (a especificação não o pede); os limites são do desenho | [revisao-seguranca.md](testes/revisao-seguranca.md), A07; [decisoes-equipe.md](decisoes-equipe.md), seção 6 |
| **RNF-08b não atendido** (p95 de 568 a 886 ms contra 300 ms) | Meta não atingida, declarada | Risco aceito por Jefferson Silva Geronimo na decisão de qualidade ([decisao-qualidade.md](decisao-qualidade.md), seção 4) | Causa atribuída ao `fsync` do PostgreSQL em Docker; a hipótese de 300 ms não foi validada pelo professor; não há outro ambiente | [resultado-02.md](performance/resultado-02.md) |
| **R-25 e R-26:** `NotificacaoApiIT.int01ECt103` intermitente, causa desconhecida; BUG-017 **mitigado, não corrigido** (limite de leitura de 10 s só no `int01`; o `int04` testa o limite de produção em classe própria) | Risco aceito | Jefferson, 19/10/2026 (R-25) e 22/10/2026 (R-26) | Sem defeito de produto provado e com contorno (repetir o job uma vez); a mitigação não corrige a causa e pode mascará-la | [decisoes-equipe.md](decisoes-equipe.md); issue 39 fechada como "not planned" em 26/10/2026 (F7-20) |
| **XSS lê o token do `sessionStorage`** | Risco residual aceito | Jefferson, 18/10/2026 | Equilíbrio entre guardar só em memória (novo login a cada recarga) e as mitigações do ADR-015 | [ADR-015](adr/ADR-015-stack-do-front-end.md) |
| **Interpretação F6-20:** RF-11 e RF-14 sem tela | Interpretação declarada | Jefferson, 22/10/2026 | O Anexo A do [plano de projeto](plano-de-projeto.md) diz "sem tela própria" para os dois; a frase da porta de saída vale para os RF com interação humana. **Não é cumprimento literal da frase.** Prova abaixo | [decisoes-equipe.md](decisoes-equipe.md), F6-20 |
| **Janela de 14 dias da Busca** (`PaginaDeBusca.tsx:24`) | Suposição sem origem | Jefferson, 24/10/2026 (F7-02 e F7-13) | Só a janela inicial; a pessoa pode alterá-la | [revisao-assistida-front.md](testes/revisao-assistida-front.md) |
| **Limitações de acessibilidade:** axe com `color-contrast` incompleto em diálogos, aviso e barra inferior (0 violações); anel do ícone do calendário é o do navegador; diálogo próprio no lugar do `<dialog>` nativo; campo de data nativo com 6 paradas de Tab | Limitações declaradas | Jefferson (F6-12, campo de data) | Contraste medido à mão (de 6,69 a 16,86 no claro e de 8,19 a 14,56 no escuro, mínimo 4,5); o jsdom 29 não implementa `showModal()` | [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md), seção 5 |
| **Listas sem paginação** (reservas, fila, catálogo, auditoria; L-03) e custo por reserva em uso não medido | Declarado, sem decisão de aceitar | — | Pode pesar se as listas crescerem | [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md) |
| **Alertas do Dependabot em `.aiox-core/`** | Risco declarado | Jefferson, 24/10/2026 (F7-08) | Não se aplicam ao produto: 0 no Maven e 0 no front; o framework fica fora da imagem | [alertas-dependabot.md](testes/alertas-dependabot.md) |
| **Pacote `unzip` do `apt` sem versão fixada** no estágio de build do Dockerfile | Declarado | Jefferson, 24/10/2026 (F7-14) | Necessário para a soma do Maven valer; a imagem-base segue por digest e o `unzip` não vai à imagem de execução | [decisoes-equipe.md](decisoes-equipe.md), F7-14 |
| **Atualizações adiadas:** `jsdom` 29 para 30 (F7-11), TypeScript 5.9 e ESLint 9 fixados por incompatibilidade. Os PRs 81 a 83 do Dependabot, que a F7-15 adiava, foram **mesclados antes da tag** (F7-20) | Deliberadamente adiadas (as três restantes) | Jefferson, 24/10/2026 e 26/10/2026 | `jsdom` 30 não tem alerta; os outros dois dependem de pacotes que ainda não aceitam as versões novas | [decisoes-equipe.md](decisoes-equipe.md) |
| **TLS, HSTS, CSP, limitação de taxa** | Lacuna | — | O projeto não tem ambiente de implantação | [modelo-de-ameacas.md](testes/modelo-de-ameacas.md) |

### Prova da interpretação F6-20

| RF | Prova | Execução (E-24) |
| --- | --- | --- |
| RF-11 (notificação simulada) | `INT-01` a `INT-06` em `NotificacaoApiIT` (9 testes) e `NotificacaoTempoLimiteApiIT` (1 teste, `INT-04`) | 0 falhas |
| RF-14 (documentação da API) | `DocumentacaoApiIT` (5), `ContratoObrigatoriosApiIT` (2) e `ContratoDeRequisicoesApiIT` (2): contrato OpenAPI publicado, campos obrigatórios e motivo obrigatório (CT-114 a CT-116, CT-134, CT-135, CT-166, CT-167) | 0 falhas |

### Lacunas da especificação resolvidas por decisão da equipe, sem validação externa

As lacunas A1 a A8 são análise da equipe (plano de projeto, seção 5.3, que diz que nenhuma pode ser decidida pelo agente); a especificação oficial não as lista nem exige validação delas. Em **24/10/2026** Jefferson decidiu as 18 perguntas que seriam enviadas ao professor como **decisões da equipe, não validadas com o professor** ([decisoes-equipe.md](decisoes-equipe.md), F7-16 com o impacto e o teste de cada item; F7-17 com a correção de origem das lacunas). **Isto não é validação externa. Nada foi enviado a ninguém.** O registro está em [perguntas-professor.md](perguntas-professor.md).

| Destaque | Por que importa | Declaração |
| --- | --- | --- |
| **A3: material por unidade identificada** | **A decisão de maior retrabalho se estiver errada:** o controle por quantidade muda o modelo de dados e a proteção contra dupla reserva dos materiais | CT-019 isola a regra; não há como migrar para estoque sem remodelar |
| **D14: troca de perfil não é recusada pelo mínimo de Responsáveis** | **Brecha funcional conhecida:** o Administrador pode deixar um só Responsável, e a reserva de Responsável em recurso restrito nunca é aprovada | Nenhum teste afirma que a troca não é recusada; só a rodada manual E-19 viu. CT-015 isola só a desativação |
| **Revisão por pares** | Equipe de uma pessoa: vale a revisão assistida registrada em cada pull request | **Limitação do entregável** e decisão não validada (F7-16, item 14) |
| **D9: nada é apagado nem anonimizado** | **Risco de privacidade:** dado pessoal da auditoria e das notificações fica guardado além do necessário, sem expurgo | Não há teste de expurgo porque não há expurgo (F7-16, item 12) |

As demais decisões (A1, A2, A4 a A8, D1, D3, D4, D17, precisão de segundos, rejeição depois do início e início do uso antes do horário) estão em F7-16 com o teste que isola cada uma. Onde não havia valor, nenhum foi inventado: segue sem valor padrão no código.

## 10. Dívida técnica e plano de evolução

O plano abaixo é **proposta do autor, sem prazo e sem decisão**; ordena do que mais reduz risco ao que mais custa.

| Ordem | Dívida | Origem | Primeiro passo proposto |
| --- | --- | --- | --- |
| 1 | RNF-08b: repetir a carga em outro ambiente e validar a hipótese de 300 ms com o professor | [resultado-02.md](performance/resultado-02.md) | Perguntar ao professor; medir em disco rápido |
| 2 | R-25: achar a causa do `int01ECt103` | R-25 | Registrar o tempo de cada chamada ao WireMock na primeira da classe |
| 3 | Lacunas do modelo de ameaças: TLS e HSTS, CSP, limitação de taxa, tentativas negadas auditadas, teste de tempo do login e de XSS | [modelo-de-ameacas.md](testes/modelo-de-ameacas.md) | Definir a implantação alvo antes (TLS e CSP dependem dela) |
| 4 | R-23, opção B: papéis separados de migração e de aplicação | R-23 | Duas contas no `compose.yaml` e no `application.yml` |
| 5 | SEC-03 (SBOM, licenças) e SEC-04 (alerta) | F7-06 | SBOM CycloneDX na CI; decidir o destino de alertas |
| 6 | Cobertura e análise estática do front no SonarCloud | [leitura-final-cobertura.md](testes/leitura-final-cobertura.md) | Ligar `coverage` no Vitest e o TypeScript no escopo do Sonar |
| 7 | Paginação e filtros (reservas, fila, catálogo, auditoria) e medir o custo por reserva em uso | L-03 | Medir antes de paginar |
| 8 | Atualizações adiadas: `jsdom` 30, TypeScript 5.9 e ESLint 9 fixados por incompatibilidade, alertas do `.aiox-core/` (PRs 81 a 83 já mesclados, F7-20) | F7-11, F7-20, F7-08 | Fazer depois da tag, com a suíte completa do front |
| 9 | Diálogo nativo `<dialog>` quando o jsdom permitir; E2E em outros navegadores e repetível no mesmo banco | [Dialogo.tsx](../frontend/src/ui/Dialogo.tsx); [e2e/README.md](testes/e2e/README.md) | Reavaliar a cada versão do `jsdom` |
| 10 | Reativar usuário e recurso, trocar senha (o contrato não tem as operações) | [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md) | Decidir se é requisito |
| 11 | `CT-nnn` dentro do teste do front (hoje só a tabela CT-arquivo) | BUG-024 | Decidir se vale renomear os testes |

## 11. Entregáveis da especificação (seção "Entregáveis")

Fonte: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Entregáveis".

| # | Entregável | Onde está | Estado |
| --- | --- | --- | --- |
| 1 | Repositório com histórico de trabalho e revisão por pares | Este repositório (contagens de commits e PRs mesclados em [checklist.md](entrega/checklist.md)); [perguntas-professor.md](perguntas-professor.md) | **Parcial:** histórico completo e revisão **assistida** registrada; "revisão por pares" com equipe de uma pessoa é **limitação declarada** (decisão da equipe não validada, F7-16, item 14) |
| 2 | Aplicação executável e instruções de instalação | [README.md](../README.md), "Como subir"; [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 2 | **Atendido** (clone limpo sobe, depois da correção do BUG-019); as provas estão nas seções 2.5 e 2.6 de [limitadores-de-nota.md](testes/limitadores-de-nota.md) (clone limpo até o front em 366 s; `verify` em 539 s) |
| 3 | `README.md` e documentação dos fluxos ou da API | [README.md](../README.md); `docs/api/openapi.json`; [fluxos-sequencia.md](prd/fluxos-sequencia.md); [navegacao-telas.md](prd/navegacao-telas.md) | **Atendido**; o README traz o pacote de evidências com os links |
| 4 | `RTM.md` ligando requisito, risco, teste e evidência | [RTM.md](../RTM.md); [auditoria-rtm.md](testes/auditoria-rtm.md) | **Atendido** (55 linhas; defeitos da auditoria corrigidos) |
| 5 | Diagramas de contexto, componentes e sequências críticas | [arquitetura.md](arquitetura.md) (C4) e [fluxos-sequencia.md](prd/fluxos-sequencia.md) (14 diagramas) | **Atendido** (renderização não refeita nesta fase) |
| 6 | Plano, suíte automatizada e relatório de testes | [plano-de-teste.md](plano-de-teste.md); `src/test` e `frontend`; [casos-de-teste.md](testes/casos-de-teste.md); [execucao-e24.md](testes/execucao-e24.md); este relatório | **Atendido** |
| 7 | Pipeline de integração contínua | [ci.yml](../.github/workflows/ci.yml); proteção da `main` com `test`, `frontend`, `e2e` e `segredos`; [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 3 | **Atendido** |
| 8 | Relatórios de SonarCloud e cobertura (JaCoCo) | [leitura-final-cobertura.md](testes/leitura-final-cobertura.md); artefato `relatorio-jacoco` do run `40373624577` | **Atendido**; os links estão no pacote de evidências do README |
| 9 | Plano e resultado do teste de carga | [rnf.md](performance/rnf.md); [resultado-01.md](performance/resultado-01.md); [resultado-02.md](performance/resultado-02.md); `perf/` | **Atendido**, com **RNF-08b não atendido** declarado |
| 10 | Registro de defeitos encontrados, priorizados e corrigidos | [defeitos/README.md](defeitos/README.md); [analise-causa-raiz.md](defeitos/analise-causa-raiz.md) | **Atendido** (27 defeitos) |
| 11 | Relatório final de qualidade | Este documento | **Escrito**; a decisão de qualidade está em [decisao-qualidade.md](decisao-qualidade.md) |
| 12 | Apresentação e demonstração do sistema | — | Feita pelo autor, fora do repositório |

## 12. Lacunas e limites deste relatório

- **Decisão de qualidade:** liberar com ressalvas (Jefferson Silva Geronimo, 24/10/2026), em [decisao-qualidade.md](decisao-qualidade.md).
- **Números:** os de teste e cobertura são do run `40373624577`; os de carga são das rodadas de 17/10/2026 em uma máquina; os de mutação são de 17/10/2026 e só do pacote `model`. Nenhum vem de execução antiga da RTM.
- **Etapa de origem dos BUG-020 a BUG-027:** só BUG-023 e BUG-026 foram datados; os outros seis ficam como lacuna.
- **Relevância semântica:** a ligação de cada CT a cada regra foi julgada por título; a auditoria leu à mão só as regras RN-01 a RN-08 e os três experimentos.
- **Esta é uma revisão assistida**, escrita por um agente a partir dos documentos e das execuções do repositório; não substitui a leitura de Jefferson nem a revisão por outra pessoa.
