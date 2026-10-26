# Plano de teste

Plano de teste no formato da ISO/IEC/IEEE 29119-3, completado na Fase 4 e atualizado com os números medidos na Fase 5. Os casos de teste ficam em [casos-de-teste.md](testes/casos-de-teste.md). Nenhum número foi inventado: o que não tem origem é hipótese ou proposta, e o que depende de decisão fica como `TODO` com o motivo.

Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

## 1. Identificação

| Campo | Valor |
| --- | --- |
| Projeto | Organização de Recursos |
| Documento | Plano de teste |
| Versão e estado | 0.3, com os números medidos ao fechar a Fase 4 |
| Data | 17/10/2026 |
| Responsável | Equipe: Jefferson Silva (única pessoa do projeto) |
| Aprovação | Equipe: Jefferson Silva, nas decisões de [decisoes-equipe.md](decisoes-equipe.md). Professor: não validou; as lacunas foram decididas pela equipe em 24/10/2026 (F7-16), registradas em [perguntas-professor.md](perguntas-professor.md) |

## 2. Objetivo e referências

**Objetivo:** reunir a estratégia pela qual a equipe vai demonstrar, com evidência objetiva, que o sistema cumpre os requisitos funcionais e as regras de negócio, e que atende às metas de qualidade da especificação.

| Referência | Documento |
| --- | --- |
| Requisitos funcionais | [requisitos-funcionais.md](prd/requisitos-funcionais.md) |
| Regras de negócio | [regras-negocio.md](prd/regras-negocio.md) |
| Decisões e lacunas | [perguntas-abertas.md](prd/perguntas-abertas.md) |
| Modelo de dados | [modelo-dados.dbml](prd/modelo-dados.dbml) |
| Fluxos de sequência | [fluxos-sequencia.md](prd/fluxos-sequencia.md) |
| Rastreabilidade | [RTM.md](../RTM.md) |
| Produto | [prd.md](prd.md) |

## 3. Escopo

**Itens de teste (versão ou build):** o commit de cada pull request, verificado pelo workflow `qualidade` da integração contínua; a última medição completa está na seção 5.2.

### 3.1 Itens a testar

| Grupo | Itens | Observação |
| --- | --- | --- |
| Requisitos funcionais | RF-01 a RF-16 | RF-15 e RF-16 são acréscimos da equipe |
| Regras críticas da especificação | RN-01 a RN-08 | Marcadas como críticas na RTM |
| Regras decorrentes de decisões da equipe | RN-09 a RN-33 | Cada regra tem decisão de origem |
| Segurança funcional | Autorização por perfil e posse, validação de entrada, tratamento seguro de erros | Exigência da especificação, seção "Estratégia obrigatória de qualidade" |
| Concorrência | Dupla reserva em solicitações simultâneas | Teste automatizado exigido (RN-03, RF-06) |
| Integração externa | Notificação por webhook | Com WireMock (A5, C6) |

### 3.2 Itens que não serão testados

| Item | Motivo | Origem |
| --- | --- | --- |
| Controle de material por quantidade em estoque e consumíveis | Fora de escopo | A3 |
| Reserva que cruza a meia-noite local | Fora de escopo nesta versão | A6, S3 |
| Reservas próprias do Administrador | Fora de escopo nesta versão | B2 |
| Cobrança de atraso na devolução | Fora de escopo | C3 |
| Feriados no cálculo de utilização | Fora de escopo | C5 |
| Provedor de notificação real | A integração é simulada por endpoint de teste e por WireMock | A5, S5 |
| Comportamento com valor da tolerância, do reenvio ou do tamanho de página | Valores sem decisão: D1, D3 e D4. Testa-se que o valor é configurável, não o valor | Lacunas |
| Retenção e anonimização de auditoria e notificações | Lacuna D9 | Lacuna |
| Marcação automática de não compareceu por job | Fora desta versão: o Responsável marca manualmente (A8, D2) | Decisão D2 |
| Desempenho com metas numéricas | A especificação não define critérios. As metas são hipótese ([rnf.md](performance/rnf.md)), medidas na rodada 01 da Fase 5 | Lacuna |

## 4. Estratégia e níveis de teste

Níveis exigidos pela especificação (seção "Estratégia obrigatória de qualidade"). Ferramentas e versões são decisões da Fase 2 e da Fase 3.

| Nível | Foco | Ferramenta prevista | Observação |
| --- | --- | --- | --- |
| Unitário | Regras de domínio, fronteiras, transições | JUnit 5, inclusive testes parametrizados | Mocks só em teste unitário isolado |
| Integração | Persistência, constraint de exclusão, auditoria, atomicidade | Banco containerizado com Testcontainers | Exigência da especificação (seção "Estratégia obrigatória de qualidade"): persistência verificada em ambiente real, não com mock |
| API em caixa-preta | Contrato, autorização por perfil, códigos de erro | MockMvc sobre o contexto completo, com PostgreSQL real | Matriz perfil × operação. Escolha sem requisito da especificação: a exigência é "API em caixa-preta" |
| Ponta a ponta | Jornadas das personas | TODO: ferramenta, decidida na Fase 6 | Depende do front end (Fase 6) |
| Concorrência | RF-06 e RN-03 | Teste automatizado com banco real | Repetição do cenário para evidenciar estabilidade (TODO: número de repetições) |
| Integração externa | RF-11 | WireMock | Matriz de respostas do provedor |
| Carga | Reservas simultâneas do mesmo recurso | JMeter | Metas numéricas: hipótese em [rnf.md](performance/rnf.md); rodada 01 feita |
| TDD ou BDD | Ao menos uma funcionalidade nova com evidência da técnica | TDD por fatia com commits `test(red)`, `feat(green)` e `refactor`; BDD com Cucumber para aprovação e bloqueio (15 cenários) | Evidência em [evidencia-tdd.md](testes/evidencia-tdd.md) e [bdd-aprovacao-bloqueio.md](testes/bdd-aprovacao-bloqueio.md). A granularidade do TDD é por fatia, não por caso |

### 4.1 Técnicas de projeto de teste

| Técnica | Onde se aplica |
| --- | --- |
| Valor limite | RN-01, RN-02, RN-04, RN-11, RN-14, RN-21 e janelas de funcionamento |
| Partição de equivalência | Tipo de recurso, estado da reserva, perfil, material retirado ou não |
| Tabela de decisão | RN-06, RN-09, RN-10, RN-16, RN-17, RN-18, RN-23, RN-26, RN-33 |
| Transição de estados | RN-05, RN-19, RN-20, RN-21, RN-23, RN-25, incluindo as proibidas |
| Teste de concorrência | RN-03 |
| Teste de contrato | RF-14 |

A técnica prevista de cada regra está em [regras-negocio.md](prd/regras-negocio.md).

### 4.2 Dados de teste

- Dados sempre fictícios. Nenhum dado pessoal real e nenhum segredo no repositório.
- Cada caso de teste cria o estado de que precisa e as tabelas são esvaziadas antes de cada teste (`limparBanco`); o contêiner do PostgreSQL é compartilhado entre as classes.

## 5. Critérios de entrada, saída e suspensão

### 5.1 Critérios de entrada

| Critério | Estado |
| --- | --- |
| Requisitos, regras, modelo de dados e fluxos versionados e verificados pela skill analyze-docs | Atendido ao fim da Etapa 1 |
| Cenários de qualidade e arquitetura definidos | Atendido: CEN-01 a CEN-11 em [ciclo-00.md](avaliacao-arquitetural/ciclo-00.md) |
| Casca do projeto, integração contínua e processo de defeitos | Atendido na Fase 3 (PR 1): `./mvnw -B verify` e workflow `qualidade`; defeitos em [docs/defeitos](defeitos/README.md) |
| Decisões A1 a A8 | Decididas pela equipe em 24/10/2026, não validadas com o professor ([perguntas-professor.md](perguntas-professor.md)) |
| Lacunas D2 e D10 a D16 decididas em 15/10/2026 | Atendido |

### 5.2 Critérios de saída

Metas da especificação (seção "Metas mensuráveis"):

| Meta | Valor |
| --- | --- |
| Cobertura de linhas | 80% |
| Cobertura de branches | 70% |
| Requisitos críticos na RTM | 100% |
| Bugs ou vulnerabilidades críticos | 0 |

Resultado medido na Fase 4 (execução local de 17/10/2026, `./mvnw -B clean verify`; evidência de CI E-2: run `39055557492`, check `test` verde):

| Meta | Meta da especificação | Medido | Situação |
| --- | --- | --- | --- |
| Cobertura de linhas | 80% | 96,7% (1551/1604) | Atingida, com gate no `verify` |
| Cobertura de branches | 70% | 84,6% (438/518) | Atingida, com gate no `verify` |
| Requisitos críticos na RTM | 100% | 12 de 12 RF críticos e 8 de 8 RN críticas com linha; 11 dos 12 RF críticos como "testado" e RF-13 como "parcial" | **Parcial:** a interface responsiva de RF-13 é da Fase 6 |
| Bugs ou vulnerabilidades críticos | 0 | Não verificado | SonarCloud ainda sem segredos configurados (Bloco F) |
| Testes | — | 468 (136 de unidade e arquitetura, 332 de integração e BDD), 0 falhas | — |
| Mutação do pacote `model` (sem meta) | — | 77% (60/78), 0 sobreviventes | Referência, ver [mutacao.md](testes/mutacao.md) |

Desempenho medido na Fase 5 (rodadas 01 a 04, 17/10/2026, em [resultado-01.md](performance/resultado-01.md) e [resultado-02.md](performance/resultado-02.md)): consulta com p95 entre 55 e 152 ms, criação de reserva com p95 entre 568 e 886 ms, 0 erro real, 0 resposta 500 e nenhuma dupla reserva. A criação **não atende** à hipótese de 300 ms nesta máquina; a causa foi localizada no `fsync` do PostgreSQL em Docker (a rodada de diagnóstico, sem `fsync`, deu p95 de 87 ms). Itens não testados: interface e ponta a ponta (Fase 6) e valores das lacunas D1, D3, D4, D9 e D17.

Proposta da equipe, a validar:

- Todo requisito e regra crítica com ao menos um caso de teste executado, com evidência registrada na RTM.
- Nenhuma falha de autorização e nenhuma possibilidade de dupla reserva, que são limitadores de nota na especificação (seção "Avaliação").

### 5.3 Critérios de suspensão e retomada

| Suspender quando | Retomar quando |
| --- | --- |
| A integração contínua está quebrada na linha principal | A integração contínua volta a passar |
| O ambiente de teste containerizado não sobe | O ambiente volta a subir |
| Defeito bloqueante impede a execução de um conjunto de casos | A correção é verificada |
| Decisão pendente de D1, D3, D4, D9 ou D17 impede definir o resultado esperado | A decisão é registrada |

Critério numérico de defeito bloqueante: não definido, porque nenhum requisito o exige.

## 6. Entregáveis de teste

| Entregável | Origem | Estado |
| --- | --- | --- |
| Este plano de teste | Especificação, seção "Entregáveis" | Esqueleto |
| Casos de teste identificados por CT-xxx | [casos-de-teste.md](testes/casos-de-teste.md) | Feito na fatia 4.0; execução por fatia |
| RTM com cenário, caso de teste e evidência | Especificação, seção "Entregáveis" | Feito na Fase 4 (E-1) |
| Suíte automatizada e relatório de testes | Especificação, seção "Entregáveis" | Feito: 468 testes no `verify` e na CI |
| Relatórios de cobertura (JaCoCo) e de análise estática (SonarCloud) | Especificação, seção "Entregáveis" | JaCoCo feito; SonarCloud pendente (Bloco F) |
| Plano e resultado do teste de carga | Especificação, seção "Entregáveis" | Feito: [rnf.md](performance/rnf.md), [perf/reservas.jmx](../perf/reservas.jmx) e [resultado-01.md](performance/resultado-01.md) |
| Registro de defeitos | Especificação, seção "Entregáveis" | Feito: BUG-001 a BUG-009 em [defeitos](defeitos/README.md) |
| Relatório final de qualidade | Especificação, seção "Entregáveis" | TODO: Fase 7 |
| Evidência de TDD ou BDD | Especificação, seção "Estratégia obrigatória de qualidade" | Feito: [evidencia-tdd.md](testes/evidencia-tdd.md) |

## 7. Ambiente

| Item | Descrição | Estado |
| --- | --- | --- |
| Linguagem e framework | Java 21 e Spring Boot 3.x | Exigido pela especificação |
| Banco | PostgreSQL em container (decisão da equipe) | Decidido, ADR na Fase 2 |
| Integração externa simulada | WireMock | Exigido pela especificação |
| Integração contínua | GitHub Actions em pull requests | Exigido pela especificação |
| Análise estática | SonarCloud | Exigido pela especificação |
| Cobertura | JaCoCo | Exigido pela especificação |
| Carga | JMeter | Exigido pela especificação |
| Fuso | Configurável, padrão America/Sao_Paulo | Decisão A6 |
| Versões | Java 21, Spring Boot 3.5.16, PostgreSQL 17 em container, JaCoCo 0.8.15, ArchUnit 1.5.1, springdoc 2.8.17, runner ubuntu-24.04 | Fixadas no `pom.xml` e no workflow |
| Segredos | Em variáveis de ambiente e no repositório de segredos da CI, nunca no repositório | Regra do projeto |

## 8. Riscos

Riscos iniciais, identificados a partir dos requisitos e das regras. Eles alimentam a coluna Risco da [RTM](../RTM.md). R-17 a R-24 vieram da avaliação arquitetural de 15/10/2026 ([ciclo-00.md](avaliacao-arquitetural/ciclo-00.md)). Probabilidade e impacto quantitativos: não foram estimados, porque o projeto não tem dado de origem para isso.

| ID | Risco | RF | RN | Técnica ou nível previsto |
| --- | --- | --- | --- | --- |
| R-01 | Dupla reserva sob concorrência | RF-06 | RN-03 | Concorrência com banco real |
| R-02 | Sobreposição não detectada nas fronteiras ou por tipo de recurso | RF-03, RF-04, RF-05, RF-08 | RN-02, RN-11 | Valor limite em trinca e partição por tipo |
| R-03 | Falha de autorização ou escalada de perfil | RF-01, RF-07, RF-15 | RN-06, RN-16, RN-17, RN-33 | Tabela de decisão perfil × operação, API em caixa-preta |
| R-04 | Aprovação contornada | RF-04, RF-07 | RN-09, RN-10 | Tabela de decisão e integração |
| R-05 | Perda de integridade em alteração ou cancelamento | RF-04 | RN-18, RN-19, RN-27 | Integração com banco real e transição de estados |
| R-06 | Transição de estado indevida | RF-09, RF-16 | RN-05, RN-07, RN-20, RN-24 | Tabela de transição de estados |
| R-07 | Auditoria incompleta ou alterável | RF-10 | RN-08, RN-29 | Integração com banco real |
| R-08 | Bloqueio ou desativação inconsistente | RF-02, RF-08 | RN-04, RN-22, RN-32 | Integração e partição por estado |
| R-09 | Erro de fuso, janela ou fronteira de horário | RF-03, RF-04, RF-12 | RN-01, RN-14, RN-15 | Valor limite e partição por fuso, com controle do tempo no teste |
| R-10 | Falha do provedor afeta a reserva | RF-11 | RN-28 | WireMock, matriz de respostas |
| R-11 | Números incorretos no relatório | RF-12 | RN-30, RN-31 | Integração com dados semeados |
| R-12 | Vazamento de dados entre perfis ou de segredo em erro | RF-01, RF-03, RF-11, RF-13 | RN-26 | API em caixa-preta e testes negativos |
| R-13 | Controle incorreto de unidade e devolução de material | RF-09 | RN-12, RN-23 | Integração e tabela de decisão |
| R-14 | Cadastro inconsistente de recurso ou usuário | RF-02, RF-15 | RN-13 | Partição e integração |
| R-15 | Documentação diverge do comportamento | RF-14 | — | Teste de contrato |
| R-16 | Decisão pendente ou suposição altera o comportamento | RF-02, RF-04, RF-07, RF-08, RF-09, RF-10, RF-11, RF-12, RF-15, RF-16 | RN-01, RN-10, RN-16, RN-18, RN-19, RN-20, RN-21, RN-22, RN-23, RN-25, RN-28, RN-29, RN-31, RN-32 | Revisão da suposição antes de escrever o caso |
| R-17 | Impasse ou espera longa em reserva com vários recursos | RF-04, RF-06 | RN-02, RN-03 | Concorrência com banco real, ordens opostas de recursos |
| R-18 | Coluna `ativa` diverge do estado da reserva e a constraint barra ou libera indevidamente | RF-04, RF-08, RF-12 | RN-02, RN-04, RN-31 | Integração com banco real em cada transição de estado |
| R-19 | Tentativa de conflito perdida quando a gravação separada falha, e o relatório subconta | RF-12 | RN-30 | Integração com falha injetada na gravação |
| R-20 | Notificação perdida ou duplicada entre o commit e o envio, ou reenvio que não executa | RF-11 | RN-28 | WireMock e falha injetada entre commit e envio |
| R-21 | Consulta de sessão a cada requisição degrada o p95, ou cache mantém token válido após revogação | RF-01, RF-15 | RN-17, RN-29 | Teste de revogação e carga com JMeter |
| R-22 | Job de SEM_DECISAO em mais de uma instância sem trava eficaz gera evento duplicado | RF-07, RF-16 | RN-25 | Execução repetida e simultânea com relógio controlado |
| R-23 | Auditoria alterada por papel com privilégio | RF-10 | RN-08, RN-29 | Tentativa de UPDATE e DELETE com cada papel |
| R-24 | Medidas hipotéticas tornam cenários sem critério de aceite fechado | RF-06 | RN-03 | Validação das hipóteses com o professor |

### 8.1 Riscos de projeto

| Risco | Observação |
| --- | --- |
| Decisões A1 a A8 não foram validadas com o professor e podem estar erradas | A3 é a de maior impacto no modelo de dados |
| Prazo até a semana 46 | Cronograma na seção 9 |
| Lacunas D1, D3, D4, D9 e D17 sem valor | Registradas em [perguntas-abertas.md](prd/perguntas-abertas.md) |

## 9. Papéis, recursos e cronograma

### 9.1 Papéis

| Papel | Responsabilidade | Responsável |
| --- | --- | --- |
| Equipe de desenvolvimento e qualidade | Escrever e executar os testes, manter a RTM | Jefferson Silva (única pessoa do projeto) |
| Revisão por pares | Revisar pull requests (exigência da especificação, seção "Entregáveis") | **Limitação:** equipe de uma pessoa, sem par humano. Substituída por revisão crítica assistida registrada em cada pull request; decisão da equipe de 24/10/2026 (F7-16, item 14) em [perguntas-professor.md](perguntas-professor.md) |
| Professor | Validar as decisões da equipe | Não validadas: decididas pela equipe em 24/10/2026, sem mensagem a enviar ([perguntas-professor.md](perguntas-professor.md)) |
| Treinamento da equipe nas ferramentas de teste | Aprender JUnit 5, Testcontainers, WireMock e JMeter conforme as aulas | TODO: quem e quando |

### 9.2 Cronograma (especificação, seção "Evolução durante o semestre")

| Semana | Tema | O que avança |
| --- | --- | --- |
| 34 | Caixa branca vs caixa preta | Repositório, ambiente, escopo e perfis definidos |
| 35 | Arquitetura e análise ATAM com IA agêntica | C4, utility tree, riscos, trade-offs e ADRs |
| 36 | Gestão de erros e bugs | Registro e triagem dos primeiros defeitos |
| 37 | Testes automatizados em CI | Casca Maven com teste mínimo e pipeline no GitHub Actions |
| 38 | JUnit 5, JaCoCo e SonarCloud | Cobertura de ramo nas regras de sobreposição de horário |
| 39 | WireMock, Testcontainers e chamadas de API seguras | Banco em container e integração externa isolada em teste |
| 40 | Prova escrita | Sem avanço no projeto |
| 41 | TDD e BDD | Regras de aprovação e bloqueio guiadas por teste |
| 42 | Testes de carga com JMeter | Reservas simultâneas do mesmo recurso sob carga |
| 43 e 44 | Desenvolvimento do projeto final | Relatórios, auditoria e fechamento dos requisitos |
| 45 | Preparação para a prova oral | RTM fechada e relatório de qualidade |
| 46 | Finalização e entrega | Release candidate, pacote de evidências e decisão de qualidade |

Semanas 47 a 50: prova oral, feedback e correções, revisão integrada e encerramento.

## 10. Rastreabilidade

- Toda regra e todo requisito têm linha na [RTM](../RTM.md), com risco, caso de teste, evidência e status (48 testados e 1 parcial em 17/10/2026).
- Casos de teste usam o prefixo CT-xxx e estão ligados na RTM desde a Fase 4.
- Defeitos usam o prefixo BUG-xxx e são registrados em `docs/defeitos/` desde a Fase 3.
- Identificadores: RN-xx, RF-xx, RNF-xx, CEN-xx, ADR-xxx, CT-xxx, INT-xx, BUG-xxx e R-xx.

## 11. Pendências

| Pendência | Destino |
| --- | --- |
| Requisitos não funcionais e metas numéricas de desempenho | Fase 2 |
| Cenários de qualidade (CEN-xx) e ADRs | Fase 2 |
| Ferramentas de API em caixa-preta e de ponta a ponta | Fase 2 e Fase 3 |
| Política de dados e de limpeza dos testes | Fase 3 |
| Valores de D1, D3, D4 e D17 e decisão de D9 | Equipe (decididos em 24/10/2026, F7-16) |
| Validação de A1 a A8 | Não feita: decididas pela equipe em 24/10/2026 (F7-16) |
| ~~Escolha da funcionalidade de TDD ou BDD~~ | Feito na Fase 4 |
| Nomes e prazos dos responsáveis | Equipe |
