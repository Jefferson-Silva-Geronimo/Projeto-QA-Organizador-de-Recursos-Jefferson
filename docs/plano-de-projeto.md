# Plano de Projeto — Organização de Recursos (SDD + Qualidade)

Oct 12, 2026

## 1. Visão geral e decisões já tomadas

Este plano leva o projeto **Organização de Recursos** do zero até a entrega da semana 46, na ordem da lousa (SDD) e do cronograma da disciplina, de forma que a arquitetura fechada na Fase 2 não precise de mudança estrutural na implementação.

O sistema aloca **salas, professores e materiais** sem conflito de horário. A nota pesa evidência objetiva de qualidade, segurança, rastreabilidade e desempenho, não apenas o sistema funcionar ([especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html)).

### Decisões já tomadas

| Decisão | Escolha | Origem |
| --- | --- | --- |
| Tema | Organização de Recursos (salas, professores, materiais) | Especificação do projeto |
| Ponto de partida | Do zero, começando na instalação do aiox-core | Decisão da equipe |
| Back end | Java 21, Spring Boot 3.x estável, Maven, PostgreSQL | Especificação e Aula 03 |
| Front end | React + Vite, SPA que consome a API REST | Decisão da equipe (a especificação só exige interface responsiva) |
| Método | SDD em quatro etapas; tutorial do CineSenac como modelo de método | Lousa e tutorial |
| Formato | Este documento, com prompts prontos para colar no agente | Decisão da equipe |

### Princípios do plano

1. **Documento antes de código, arquitetura antes de teste, teste antes de implementação.** É a ordem da lousa e evita reescrita no final.
2. **Toda decisão aponta para um requisito, cenário ou restrição.** Sem origem, a decisão fica marcada como tal, nunca com origem inventada.
3. **Fato, lacuna, suposição e decisão são coisas distintas** (Aula 04). Nenhum número entra no texto sem origem; sem ela, vira suposição com validação pendente.
4. **Evidência o tempo todo.** Cada requisito crítico termina na RTM ligado a risco, teste e execução.
5. **Agentes analisam e propõem; a equipe decide.** Todo diff é lido antes de aceitar.
6. **Gate de documentação ao fim de cada fase:** a skill `analyze-docs` do CineSenac continua valendo (links, Mermaid sem `;`, IDs coerentes).

### Como ler cada fase

Toda fase traz: objetivo, origem (aula e passo do tutorial), passos com prompts, entregáveis e **porta de saída**. Só se avança quando a porta de saída está cumprida.

### Convenção de identificadores

`RN-xx` regra de negócio · `RF-xx` requisito funcional (RF-01 a RF-14 são os 14 da especificação; extras começam em RF-15) · `RNF-xx` não funcional · `CEN-xx` cenário de qualidade · `ADR-xxx` decisão de arquitetura · `CT-xxx` caso de teste · `INT-xx` integração externa · `BUG-xxx` defeito · `R-xx` risco. O tutorial usava `RF01`; aqui o hífen é padrão, como nas aulas.

### Prazo

Hoje é segunda-feira, 12/10/2026 (semana 42) e a entrega é na semana 46, então restam cerca de quatro semanas. O plano é organizado por dependência, não por semana. O Anexo C propõe um cronograma comprimido e diz o que cortar primeiro se faltar tempo.

## 2. Mapa de correlação: lousa, especificação, aulas e tutorial

As quatro colunas da lousa casam com o cronograma da especificação; a única lacuna é o front end, que a disciplina não ensina e que entra como Etapa 4. O tutorial do CineSenac cobre só a Etapa 1.

&#91;embedded content: roteiro por fases · 8 fases, 8 portas de saída\]

O roteiro percorre as quatro colunas da lousa em oito fases, cada uma terminando em uma porta de saída que libera a seguinte.

| Etapa da lousa | Semana na spec | Material (aula) | Tutorial CineSenac | Fase deste plano |
| --- | --- | --- | --- | --- |
| Preparação (aiox-core, Java, repositório) | 34 | [Aula 03, passos 1 a 4](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_caixa-branca-preta.html) | Passos 11 e 12 (skills, AGENTS.md) | Fase 0 |
| 1. Requisitos funcionais: contexto, personas, objetivos e jornada, RF, modelo de dados | 33 e 34 | [Aula 02, cenários e casos de teste](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_planejamento-casos-teste.html); Aula 03 (técnicas de caixa preta e branca) | Passos 1 a 10 | Fase 1 |
| 2. RNF, ARQ e ATAM | 35 | [Aula 04, arquitetura e ATAM](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_introducao-testes-automatizados.html) | Só nos próximos passos | Fase 2 |
| Gestão de defeitos | 36 | [Aula 05](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_gestao-erros-bugs.html) | Não coberto | Fase 3 |
| CI com GitHub Actions | 37 | [Aula 06](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_ci-github-actions.html) | Não coberto | Fase 3 |
| 3. Implementação: JUnit 5, JaCoCo, SonarCloud | 38 | [Aula 07](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_junit-jacoco-sonarcloud.html) | Não coberto | Fase 4 |
| 3. Implementação: Testcontainers e WireMock | 39 | [Aula 08](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_wiremock-api-seguras.html) | Não coberto | Fase 4 |
| 3. Implementação: TDD e BDD | 41 | [Aula 09](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_tdd-bdd.html) | Não coberto | Fase 4 |
| Carga e concorrência (JMeter) | 42 | [Aula 10](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_testes-carga-jmeter.html) | Não coberto | Fases 4 e 5 |
| 4. Código do front end | sem aula; a spec exige interface responsiva | Nenhum | Passo 8 (jornadas) alimenta as telas | Fase 6 |
| Fechamento, relatório e prova oral | 43 a 50 | Especificação (entregáveis e avaliação) | Não coberto | Fase 7 |

**Atenção aos nomes dos arquivos.** O endereço `material_planejamento-casos-teste` traz a Aula 02 (ATAM e casos de teste), `material_caixa-branca-preta` traz a Aula 03 e `material_introducao-testes-automatizados` traz a Aula 04 (arquitetura e ATAM). Os nomes não correspondem ao conteúdo.

### Onde este plano se afasta do cronograma das aulas, e por quê

1. **Casca e CI vêm antes do TDD em lote.** Nas aulas, todos os testes ficam vermelhos (Aula 05) e só depois a casca e o CI aparecem (Aula 06). Aqui a casca e o pipeline nascem primeiro e o TDD corre por fatias verticais, como pede a própria especificação (semana 37: casca Maven com teste mínimo e pipeline). A main fica verde o tempo todo.
2. **Modelo de dados depois dos requisitos funcionais.** O tutorial fez o modelo antes das jornadas e dos RFs; a lousa pede RF antes de dados, e esse é o sentido que o plano segue.
3. **O batch de treinamento de modelo da Aula 04 não se aplica.** O método é reaproveitado (drivers, cenários de seis partes, utility tree, táticas, ADRs); o cron de ML é descartado. Resta um possível job agendado para marcar reservas como não compareceu, que herda os cuidados de idempotência e lock.

## 3. Arquitetura à prova de retrabalho

Doze decisões precisam estar tomadas, registradas em ADR e refletidas no modelo antes da primeira linha de regra de negócio. Cada uma custa pouco agora e forçaria reescrita se entrasse só no final, quando a especificação cobra concorrência, autorização e testes em ambiente real.

| # | Decisão | O que evita | Requisito ou regra |
| --- | --- | --- | --- |
| 1 | **Recurso como supertipo** (sala, professor e material em uma tabela `recursos`, com tabelas de especialização) e reserva por item com `recurso_id` e período | Três regras de sobreposição duplicadas e remodelagem quando professor e material entrarem | RN-02, RF-05 |
| 2 | **Dupla reserva barrada no banco:** constraint de exclusão do PostgreSQL (`EXCLUDE USING gist` sobre `tstzrange`, com `btree_gist`), restrita às reservas ativas; lock pessimista fica como alternativa documentada | Corrida que só aparece sob carga e checagem feita apenas em código | RN-03, RF-06 |
| 3 | **Relógio injetável** (`Clock`) em toda regra que depende de tempo | `Instant.now()` espalhado e testes com `Thread.sleep` | RN-01, RN-04, RN-05 |
| 4 | **Máquina de estados explícita no domínio**, com transições e responsáveis definidos, e auditoria gravada na mesma transação | Regras de estado espalhadas em `if` e mudanças sem registro | RN-05 a RN-08, RF-10 |
| 5 | **Autorização em duas camadas:** perfil por endpoint e verificação de posse no caso de uso, com matriz perfil × operação testada | Retrofit de segurança no fim; falha de autorização é limitador de nota | RF-01, RF-07 |
| 6 | **Integrações externas por porta e adapter**, URL e token por configuração, timeouts explícitos | WireMock impossível sem mexer em produção; credencial no código | RF-11 |
| 7 | **Erros com códigos estáveis** (formato ProblemDetail) | Front end e testes presos a texto de mensagem | RF-13 |
| 8 | **Migrações versionadas (Flyway) e PostgreSQL real nos testes** (Testcontainers, sem H2) | Constraint de exclusão que só existe no PostgreSQL passando despercebida em teste | RF-06 |
| 9 | **Contrato OpenAPI desde o primeiro endpoint** | Front end desalinhado e documentação feita às pressas | RF-14 |
| 10 | **Camadas que espelham o C4:** `dominio` sem dependência de Spring, `aplicacao`, `api` e `infra` | Domínio só testável com contexto Spring inteiro, lento e com cobertura difícil | RNF de testabilidade |
| 11 | **Tempo em UTC (`timestamptz`)**, conversão de fuso apenas na borda | Fronteiras de horário erradas na virada de horário ou entre ambientes | RN-01, RN-02 |
| 12 | **Busca com consultas parametrizadas e paginação** | Injeção de SQL e listagens que degradam sob carga | RF-03 |

A decisão 1 tem uma dependência aberta: se material for controlado por quantidade em estoque e não por unidade identificada, a constraint de exclusão não basta e o desenho muda. A pergunta está no Anexo E e deve ser respondida antes da Fase 1 terminar.

## 4. Fase 0 — Preparação do ambiente

Ao fim da Fase 0, o repositório existe, o aiox-core está instalado e as regras do projeto estão escritas em `AGENTS.md`, com as duas skills do CineSenac recriadas. Não há código de produção ainda.

**Origem:** Aula 03 (instalar AIOX, Java e Spring) e passos 11 e 12 do tutorial (skills e AGENTS.md).

### Ferramentas necessárias

| Ferramenta | Como verificar | Onde entra |
| --- | --- | --- |
| Node.js | `node --version` | aiox-core e front end |
| Git e GitHub CLI | `git --version`, `gh auth status` | repositório, pull requests e CI |
| Java 21 (Temurin, via SDKMAN) | `java -version` | back end |
| Docker | `docker ps` | Testcontainers e banco local |
| Apache JMeter 5.6 | `jmeter -v` | Fase 5 |
| Conta no SonarCloud | login no site | Fases 3 e 4 (`SONAR_TOKEN`) |
| Agente de código com acesso ao terminal | abrir na raiz do repositório | todas as fases |

### Passo 1: criar o repositório e instalar o aiox-core

```bash
mkdir organizacao-recursos && cd organizacao-recursos && git init
npx aiox-core@latest install
```

No instalador, o squad **development** basta. O resultado é a pasta `.aiox-core/` com as personas `pm`, `po`, `architect`, `dev`, `qa` e `devops`.

### Passo 2: estrutura de pastas

O projeto Maven fica na **raiz**, para que `./mvnw -B verify` valha igual no terminal, no CI e nos prompts das aulas. O front end entra depois em `frontend/`.

```text
organizacao-recursos/
├── AGENTS.md
├── README.md
├── RTM.md
├── tutorial.md
├── pom.xml                  (Fase 3)
├── src/                     (Fases 3 e 4)
├── frontend/                (Fase 6)
├── perf/                    (Fase 5)
├── docs/
│   ├── prd.md
│   ├── prd/personas/
│   ├── prd/regras-negocio.md
│   ├── prd/requisitos-funcionais.md
│   ├── prd/modelo-dados.dbml
│   ├── prd/fluxos-sequencia.md
│   ├── arquitetura.md
│   ├── adr/
│   ├── avaliacao-arquitetural/
│   ├── plano-de-teste.md
│   ├── testes/
│   ├── defeitos/
│   ├── performance/
│   └── relatorio-qualidade.md
├── .github/
└── .aiox-core/
```

### Passo 3: regras do projeto, skills e templates

**Prompt 0.1** — cole na persona `devops` ou `architect`:

```text
Atue como engenheiro de plataforma do projeto Organização de Recursos (Java 21, Spring Boot 3.x, React). Leia .aiox-core/ e liste as personas e skills disponíveis. Não escreva código de produção.

1. Crie AGENTS.md com estas regras: (a) consultar .aiox-core/ antes de qualquer tarefa; (b) executar a skill analyze-docs ao finalizar qualquer criação ou edição de documentação; (c) executar a skill update-tutorial a cada passo concluído, registrando o prompt do usuário literalmente; (d) nunca inventar número, SLA, volume ou regra: classificar cada afirmação como fato (com caminho do arquivo), lacuna, suposição (com impacto) ou decisão (com origem); (e) nunca gravar token, senha ou dado pessoal real; (f) trabalhar em branch, com commits test(red), feat(green), refactor, docs e ci; (g) nunca alterar, desativar ou enfraquecer um teste para fazê-lo passar.
2. Crie em .aiox-core/development/skills/ as skills analyze-docs e update-tutorial. analyze-docs valida links relativos, fences balanceados, Mermaid sem ponto e vírgula nas mensagens, DBML, consistência dos IDs (RN-xx, RF-xx, RNF-xx, CEN-xx, ADR-xxx) entre documentos e RTM.md, estrutura do README e ortografia, e entrega um relatório. update-tutorial registra cada passo em tutorial.md com o prompt literal, atualiza a árvore de estrutura e os próximos passos e roda analyze-docs antes de terminar.
3. Crie .github/ISSUE_TEMPLATE/defeito.md com as seções: resumo observável, ambiente e versão, pré-condições, passos mínimos, resultado obtido, resultado esperado e requisito, evidências sem dados sensíveis, frequência e impacto, severidade sugerida com justificativa, critério de verificação. Crie .github/pull_request_template.md pedindo requisito atendido, testes adicionados, evidência e itens da RTM atualizados.
4. Crie README.md mínimo (objetivo, como subir, como testar: ainda TODO) e RTM.md com o cabeçalho: Requisito | Regra | Risco | Cenário | Caso de teste | Evidência | Status.
```

### Passo 4: repositório remoto e primeiro commit

1. Criar o repositório no GitHub e fazer o primeiro commit com o que existe.
2. Convenção de commits: `test(red): ...`, `feat(green): ...`, `refactor: ...`, `docs: ...`, `ci: ...`.
3. A proteção da `main` com check obrigatório vem na Fase 3, quando o pipeline existir.

### Entregáveis e porta de saída

- `.aiox-core/` instalado, `AGENTS.md`, as duas skills, templates de issue e de pull request, README e RTM em esqueleto.
- `node`, `java -version` (21), `docker ps`, `jmeter -v` e `gh auth status` funcionando.
- Repositório remoto com commit inicial e `analyze-docs` executada sem pendências.

## 5. Fase 1 — Etapa 1 (SDD): requisitos funcionais

A Etapa 1 produz tudo o que se decide sem escolher tecnologia: contexto, personas com objetivos e jornada, regras de negócio, os 14 requisitos funcionais, o modelo de dados, os fluxos de sequência e o esqueleto da RTM e do plano de teste. A ordem é a da lousa: personas, objetivos e jornada, requisitos funcionais, modelo de dados.

**Origem:** passos 1 a 10 do tutorial; Aula 02 (cenário e caso de teste); Aula 03 (PRD em esqueleto e personas); escopo e regras críticas da especificação.

### 5.1 Fonte de verdade

Antes de qualquer prompt, leia a [especificação oficial](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html); uma cópia local, se existir, fica fora do Git. Todo fato dos documentos seguintes cita esse arquivo ou outro artefato do repositório.

### 5.2 Personas

| Persona | Papel segundo a especificação | Objetivos a declarar |
| --- | --- | --- |
| Solicitante | Professor ou coordenador que consulta disponibilidade e cria, altera ou cancela as próprias reservas | Reservar sala, professor e material sem conflito; saber o motivo de uma recusa |
| Responsável | Aprova solicitações especiais, valida alocação de docentes e acompanha retiradas e devoluções | Decidir aprovações com contexto; garantir devolução do material |
| Administrador | Gerencia salas, professores, materiais, usuários, bloqueios e períodos de manutenção | Manter o catálogo correto e impedir uso de recurso indisponível |

Uma lacuna já visível: **professor é recurso alocável**, mas a especificação não diz se também é usuário do sistema. Registre como pergunta aberta.

### 5.3 Regras de negócio

Cada regra crítica da especificação vira um `RN-xx`, como no tutorial (passo 2), já com a técnica de teste prevista.

| ID | Regra | Técnica de teste prevista |
| --- | --- | --- |
| RN-01 | O término deve ser posterior ao início | Valor limite (término antes, igual e depois do início) |
| RN-02 | Reservas do mesmo recurso (sala, material ou professor) não podem se sobrepor | Valor limite nas fronteiras, partição por tipo de recurso |
| RN-03 | Duas solicitações simultâneas produzem uma única reserva aceita | Teste de concorrência com banco real |
| RN-04 | Recurso em manutenção não pode ser reservado | Valor limite do período de bloqueio |
| RN-05 | Estados `SOLICITADA → APROVADA → EM_USO → CONCLUÍDA`, mais rejeitada, cancelada e não compareceu | Tabela de transição, cobrindo as proibidas |
| RN-06 | Somente responsáveis aprovam recursos restritos | Tabela de decisão perfil × tipo de recurso |
| RN-07 | Reservas iniciadas não podem ser apagadas | Partição por estado |
| RN-08 | Toda mudança de estado gera auditoria | Integração com banco real |

**Lacunas que a especificação deixa em aberto** (nenhuma pode ser decidida pelo agente):

1. O que torna um recurso restrito.
2. Se uma reserva que termina às 10h conflita com outra que começa às 10h.
3. Quem pode cancelar em cada estado e com que antecedência.
4. Janela de tolerância e responsável por marcar não compareceu.
5. O que acontece com reservas existentes quando um bloqueio de manutenção é criado sobre elas.
6. Se material é controlado por unidade identificada ou por quantidade.
7. Fuso horário do campus.
8. Se a notificação será simulada ou integrada a uma API externa.

### 5.4 Requisitos funcionais

Os 14 requisitos obrigatórios mantêm a numeração da especificação. Acréscimos da equipe começam em RF-15.

| ID | Requisito | Persona principal | Regras ligadas |
| --- | --- | --- | --- |
| RF-01 | Autenticação e autorização por perfil | Todas | RN-06 |
| RF-02 | Cadastro e consulta de salas, professores e materiais | Administrador | RN-04 |
| RF-03 | Pesquisa por tipo, capacidade, localização, competência e disponibilidade | Solicitante | RN-02, RN-04 |
| RF-04 | Criação, alteração e cancelamento de reservas | Solicitante | RN-01, RN-02, RN-05, RN-07 |
| RF-05 | Detecção de sobreposição de horários, inclusive na agenda do professor | Solicitante | RN-02 |
| RF-06 | Proteção contra dupla reserva em solicitações simultâneas | Solicitante | RN-03 |
| RF-07 | Aprovação obrigatória para recursos restritos | Responsável | RN-05, RN-06 |
| RF-08 | Bloqueio de recursos em manutenção | Administrador | RN-04 |
| RF-09 | Registro de retirada e devolução de materiais e equipamentos | Responsável | RN-05 |
| RF-10 | Histórico auditável de mudanças | Responsável e Administrador | RN-08 |
| RF-11 | Notificação simulada ou integração com API externa | Sistema | RN-05 |
| RF-12 | Relatório de utilização por recurso, carga horária alocada e conflitos evitados | Responsável e Administrador | RN-02, RN-03 |
| RF-13 | Interface responsiva e mensagens de erro compreensíveis | Todas | Todas |
| RF-14 | Documentação de API ou dos fluxos públicos | Equipe | Todas |

**Consequência de modelo:** o relatório de RF-12 pede *conflitos evitados*, então toda tentativa recusada por conflito precisa ser registrada. Isso entra no modelo de dados agora, não depois.

### 5.5 Modelo de dados

Proposta inicial em DBML, coerente com as decisões 1, 2 e 4 da seção 3. A tabela `ocupacoes` concentra reservas e bloqueios, de modo que RN-02 e RN-04 sejam a mesma garantia no banco.

| Entidade | Campos principais | Observação |
| --- | --- | --- |
| `usuarios` | nome, email (único), senha\_hash, perfil | Perfil: solicitante, responsável, administrador |
| `recursos` | tipo (sala, professor, material), nome, restrito, ativo | Supertipo; evita três regras de sobreposição |
| `salas` | recurso\_id, capacidade, localizacao, tipo\_sala | Especialização |
| `professores` e `competencias` | recurso\_id; tabela de ligação professor × competência | Alimenta a pesquisa por competência |
| `materiais` | recurso\_id, tipo, identificação patrimonial | Muda se for por quantidade (lacuna 6) |
| `reservas` | solicitante\_id, titulo, inicio, fim, estado, criada\_em | Estado como enumeração |
| `ocupacoes` | recurso\_id, periodo (`tstzrange`), origem (reserva ou bloqueio), origem\_id, ativa | Leva a constraint de exclusão |
| `aprovacoes` | reserva\_id, responsavel\_id, decisao, motivo, em | Só responsável aprova |
| `movimentacoes_material` | ocupacao\_id, tipo (retirada ou devolução), registrado\_por, em | RF-09 |
| `auditoria_eventos` | entidade, entidade\_id, estado\_anterior, estado\_novo, ator\_id, em, correlacao\_id | Somente inserção |
| `tentativas_conflito` | recurso\_id, periodo, solicitante\_id, em, motivo | Fonte de *conflitos evitados* |
| `notificacoes` | reserva\_id, canal, status, tentativas, em | RF-11 |

### 5.6 Fluxos de sequência (Mermaid)

Nove diagramas, cada um com caminho de sucesso e de erro: autenticação; pesquisa de disponibilidade; criação de reserva (sucesso, sobreposição, manutenção, professor ocupado); **duas solicitações simultâneas** (uma aceita, uma recusada com 409); aprovação de recurso restrito; retirada e devolução; alteração e cancelamento; bloqueio de manutenção; relatório. Lição do passo 11 do tutorial: ponto e vírgula dentro de uma mensagem quebra a renderização do Mermaid.

### 5.7 Prompts da Fase 1

Execute na ordem, revisando o resultado de cada um antes de seguir.

**Prompt 1.1: contexto, README e personas**

```text
Atue como analista de requisitos. Fonte de verdade: a especificação oficial (https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Não invente fatos, números ou regras; o que faltar vira lacuna ou pergunta aberta.
Crie README.md (visão do produto, perfis, estrutura de pastas e roadmap por fases), docs/prd.md (visão, problema, escopo, fora de escopo, métricas de sucesso tiradas das metas da especificação) e uma persona por arquivo em docs/prd/personas/: solicitante.md, responsavel.md e administrador.md, cada uma com contexto, objetivos, frustrações e permissões. Registre à parte as perguntas abertas, incluindo se professor também é usuário. Execute a skill analyze-docs ao final.
```

**Prompt 1.2: jornadas e regras de negócio**

```text
Atue como analista de requisitos. Leia a especificação oficial (https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html) e as personas. Adicione a cada persona a seção Jornada na Aplicação, passo a passo, como telas do front end. Crie docs/prd/regras-negocio.md com RN-01 a RN-08 a partir das Regras críticas da especificação, cada uma com origem citada, exemplos de aceite e rejeição e a técnica de teste prevista (valor limite, partição, tabela de decisão, transição de estados). Não decida as lacunas: liste-as com a pergunta que a equipe precisa responder. Execute analyze-docs ao final.
```

**Prompt 1.3: requisitos funcionais e matriz**

```text
Atue como analista de requisitos. Crie docs/prd/requisitos-funcionais.md somente com requisitos funcionais, mantendo RF-01 a RF-14 exatamente como na especificação, cada um com persona, jornada que atende, regras RN ligadas e critério de aceite observável. Acrescente RF-15 em diante apenas se uma jornada ficar sem requisito, justificando. Termine com a matriz de rastreabilidade RN → RF e aponte RN sem RF ou RF sem RN. Execute analyze-docs ao final.
```

**Prompt 1.4: modelo de dados**

```text
Atue como arquiteto de dados. Leia docs/prd/requisitos-funcionais.md e regras-negocio.md. Crie docs/prd/modelo-dados.dbml (importável no dbdiagram.io) com: recursos como supertipo de sala, professor e material; competencias; usuarios; reservas; ocupacoes com período como intervalo de tempo e indicação de ativa, destinada a receber uma constraint de exclusão por recurso e período; aprovacoes; movimentacoes_material; auditoria_eventos somente de inserção; tentativas_conflito; notificacoes. Comente cada decisão além do pedido, e cada tabela com o RF ou RN que a justifica. Não decida a lacuna de material por quantidade: modele por unidade identificada e marque como suposição.
```

**Prompt 1.5: fluxos de sequência**

```text
Atue como analista de sistemas. Crie docs/prd/fluxos-sequencia.md com diagramas de sequência Mermaid (ator, Frontend, API, Banco) para: autenticação; pesquisa de disponibilidade; criação de reserva com os quatro desfechos (sucesso, sobreposição, manutenção, professor ocupado); duas solicitações simultâneas; aprovação de recurso restrito; retirada e devolução; alteração e cancelamento; bloqueio de manutenção; relatório. Cada diagrama cita os RF e RN que cobre e mostra erro e sucesso. Não use ponto e vírgula em mensagens. Feche com tabela de cobertura RF → diagrama. Execute analyze-docs e confirme que todos os diagramas renderizam.
```

**Prompt 1.6: RTM e plano de teste em esqueleto**

```text
Atue como engenheiro de qualidade. Preencha RTM.md com uma linha por RF e RN (requisito, regra, risco inicial, cenário e caso de teste ainda vazios, evidência vazia, status nao iniciado), marcando como crítico tudo o que a especificação chama de regra crítica. Crie docs/plano-de-teste.md seguindo a estrutura da ISO/IEC/IEEE 29119-3: escopo (incluindo itens que não serão testados), níveis, critérios de entrada, saída e suspensão, riscos e recursos. Deixe TODO onde faltar decisão. Não escreva testes. Execute analyze-docs ao final.
```

### Porta de saída da Fase 1

- Os 14 itens obrigatórios e as oito regras críticas da especificação aparecem em RF e RN, sem item órfão.
- As lacunas da seção 5.3 estão listadas com responsável e prazo para resposta, ou assumidas como suposição com impacto declarado.
- O modelo de dados cobre todas as entidades dos RFs e registra tentativas de conflito.
- Os nove diagramas renderizam e `analyze-docs` não aponta pendências.

## 6. Fase 2 — Etapa 2 (SDD): RNF, arquitetura e ATAM

A Etapa 2 transforma os requisitos em uma arquitetura defendida por cenários mensuráveis e registrada em ADRs. É a fase que impede o retrabalho final: as 12 decisões da seção 3 nascem aqui e viram o contrato que a implementação segue.

**Origem:** Aula 02 (utility tree e cenário de seis partes) e Aula 04 (C4, táticas de Len Bass, ATAM, ADRs e os quatro prompts), adaptados ao projeto de recursos.

### 6.1 Requisitos não funcionais

| ID | Requisito não funcional | Atributo (ISO 25010) | Origem | Como medir |
| --- | --- | --- | --- | --- |
| RNF-01 | Cobertura de linhas de pelo menos 80% | Manutenibilidade | Metas da especificação | JaCoCo |
| RNF-02 | Cobertura de branches de pelo menos 70% | Manutenibilidade | Metas da especificação | JaCoCo |
| RNF-03 | Nenhum bug ou vulnerabilidade crítica | Segurança | Metas da especificação | SonarCloud |
| RNF-04 | 100% dos requisitos críticos na RTM | Rastreabilidade | Metas da especificação | RTM.md |
| RNF-05 | Duas solicitações simultâneas para o mesmo recurso e horário geram exatamente uma reserva aceita | Confiabilidade | RN-03 | Teste de concorrência com banco real |
| RNF-06 | Nenhuma operação acessível a perfil sem permissão | Segurança | RF-01 | Matriz perfil × operação testada |
| RNF-07 | Validação de entrada e erros sem vazamento de detalhe interno | Segurança | Estratégia obrigatória da especificação | Testes negativos |
| RNF-08 | Consulta de disponibilidade e criação de reserva com p95 de até 300 ms para 50 usuários simultâneos e erros abaixo de 1% (409 esperado não conta) | Desempenho | **Suposição**, valor de exemplo da Aula 10; validação pendente | JMeter |
| RNF-09 | Toda mudança de estado gera registro de auditoria | Auditabilidade | RN-08 | Teste de integração |
| RNF-10 | Interface responsiva com mensagens de erro compreensíveis | Usabilidade | RF-13 | E2E em viewport de celular |
| RNF-11 | Regras de tempo e integrações substituíveis em teste | Testabilidade | Decisões 3 e 6 | Revisão do ADR |
| RNF-12 | Logs com correlação e sem segredo | Operabilidade | Proposta da equipe | Teste de log |

### 6.2 Arquitetura proposta

Monólito modular em Spring Boot com camadas hexagonais, banco PostgreSQL, front end React consumindo a API REST e uma porta para o provedor de notificação. O desenho C4 completo (contexto, contêineres, componentes e a sequência crítica da reserva simultânea) é produzido em `docs/arquitetura.md` pelo Prompt 2.2.

### 6.3 Utility tree com cenários mensuráveis

Cada cenário vira caso de teste na Fase 4. As medidas marcadas como hipótese precisam de validação com o professor.

| ID | Atributo | Cenário e medida | (I, D) | Origem da medida |
| --- | --- | --- | --- | --- |
| CEN-01 | Confiabilidade | 20 solicitações simultâneas para a mesma sala e horário: uma aceita, 19 recusadas com 409, uma única linha no banco, em 5 execuções seguidas | (A, A) | Aula 10 e RN-03 |
| CEN-02 | Segurança | Solicitante tenta aprovar a própria reserva de recurso restrito: resposta 403 e nenhuma mudança de estado; 0 aprovações indevidas na matriz perfil × operação | (A, M) | RN-06 |
| CEN-03 | Integridade | Reserva de sala em horário em que o professor já está alocado: 409 com código estável e nada gravado | (A, M) | RN-02 |
| CEN-04 | Desempenho | 50 usuários simultâneos: p95 de até 300 ms na consulta e na criação | (A, A) | Hipótese, validação pendente |
| CEN-05 | Confiabilidade | Provedor de notificação com 5xx ou lentidão: a reserva permanece válida, a notificação fica pendente para reenvio e a resposta vem dentro do timeout configurado | (A, M) | Hipótese; decisão no ADR-007 |
| CEN-06 | Auditabilidade | Toda transição de estado grava exatamente um evento na mesma transação; falha ao auditar desfaz a transição | (A, M) | RN-08 |
| CEN-07 | Integridade | Reserva que cruza um segundo do bloqueio é rejeitada; fronteira exata depende da lacuna 2 | (A, B) | RN-04, hipótese na fronteira |
| CEN-08 | Modificabilidade | Trocar o provedor de notificação altera um componente e nenhum contrato da API | (M, B) | Hipótese |
| CEN-09 | Segurança | Provedor devolve o próprio token no corpo de erro e esse conteúdo não atravessa a API | (A, B) | Aula 08 |

Descobertas que a análise deve procurar de forma explícita:

- **Trade-off:** constraint de exclusão dá integridade forte, mas pode elevar a latência sob contenção (CEN-01 × CEN-04).
- **Trade-off:** notificar dentro da transação garante consistência e derruba a disponibilidade quando o provedor falha; notificar após o commit inverte a troca (CEN-05).
- **Ponto de sensibilidade:** tamanho do pool de conexões sobre o tempo de resposta no pico.
- **Risco a verificar:** ausência do índice usado pela constraint de exclusão.

### 6.4 ADRs que esta fase precisa produzir

| ADR | Decisão | Alternativas mínimas a comparar | Cenários |
| --- | --- | --- | --- |
| ADR-001 | Monólito modular hexagonal em Spring Boot 3.x e Java 21 | Camadas simples; microsserviços | CEN-08 |
| ADR-002 | Recursos como supertipo e tabela `ocupacoes` | Tabelas separadas por tipo | CEN-01, CEN-03, CEN-07 |
| ADR-003 | Dupla reserva barrada por constraint de exclusão | Lock pessimista; versão otimista; fila | CEN-01 |
| ADR-004 | Autenticação (token de curta duração ou opaco com revogação) e autorização por perfil e posse | Sessão com cookie | CEN-02 |
| ADR-005 | Relógio injetável e tempo em UTC | `Instant.now()` direto | CEN-07 |
| ADR-006 | Auditoria na mesma transação, tabela somente de inserção | Evento assíncrono; biblioteca de versionamento | CEN-06 |
| ADR-007 | Notificação por porta e adapter, síncrona ou após o commit | Chamada dentro da transação | CEN-05, CEN-08, CEN-09 |
| ADR-008 | Erros padronizados com códigos estáveis | Mensagens livres | RNF-07, RF-13 |
| ADR-009 | Flyway e PostgreSQL real nos testes | H2; geração automática de esquema | CEN-01 |
| ADR-010 | Contrato OpenAPI e front end React + Vite | Thymeleaf; Angular | RF-13, RF-14 |
| ADR-011 | Estratégia de testes e metas de cobertura | Apenas unitários com mocks | RNF-01 a RNF-04 |
| ADR-012 | Job agendado para não compareceu, idempotente e com lock, se adotado | Marcação manual pelo responsável | RN-05 |

### 6.5 Prompts da Fase 2

Baixe antes o [catálogo de táticas de Len Bass](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/assets/taticas-arquiteturais-len-bass.md) e guarde em `docs/`. Em cada prompt, cole as tabelas das seções 6.1, 6.3 e 6.4 deste documento quando o prompt pedir.

**Prompt 2.1: descoberta e drivers**

```text
Atue como analista de requisitos e arquiteto de software. Trabalhe somente com os artefatos do repositório e a especificação oficial (https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html): docs/prd.md, docs/prd/ e RTM.md. Cite o caminho de cada fonte consultada e preserve os identificadores existentes. Não invente persona, volume, SLA, tecnologia ou regra: o que faltar vira lacuna, suposição (com impacto se estiver errada) ou pergunta aberta. A stack já decidida é Java 21, Spring Boot 3.x, PostgreSQL e React.
Crie docs/arquitetura.md com: contexto e objetivo; personas; fonte de verdade; requisitos arquiteturalmente significativos; os RNF-01 a RNF-12 abaixo, cada um com origem (cole a tabela 6.1) e o p95 de 300 ms marcado como hipótese; atributos de qualidade; drivers priorizados; fatos, lacunas, suposições e perguntas; riscos iniciais. Não implemente código nem altere personas ou requisitos. Execute analyze-docs ao final.
```

**Prompt 2.2: arquitetura C4 e decisões**

```text
Atue como arquiteto de solução. Leia docs/arquitetura.md, os requisitos e o modelo de dados. As doze decisões a seguir são o ponto de partida (cole a tabela da seção 3) e cada uma deve ser confirmada, contestada ou refinada com justificativa, nunca ignorada.
Acrescente a docs/arquitetura.md diagramas Mermaid de contexto, contêineres e componentes (C4), um diagrama de sequência do fluxo de reserva simultânea e outro da aprovação de recurso restrito. Relacione cada escolha tecnológica a um requisito, cenário ou restrição, e marque escolhas sem requisito correspondente. Trate de forma explícita: concorrência e constraint de exclusão; auditoria transacional; autorização por perfil e posse; integração externa por porta; tempo e fuso; observabilidade sem segredo; job de não compareceu (idempotência e lock) se for adotado. Para decisões sem dados, compare ao menos duas alternativas. Diagramas e texto usam os mesmos nomes. Não escreva código.
```

**Prompt 2.3: análise ATAM**

```text
Atue como equipe avaliadora ATAM independente. Leia docs/arquitetura.md, os requisitos e o catálogo de táticas em docs/. Construa a utility tree atributo → refinamento → cenário a partir dos cenários CEN-01 a CEN-09 (cole a tabela 6.3), completando as seis partes de cada um (fonte, estímulo, ambiente, artefato, resposta e medida) e mantendo as medidas sem origem como hipótese com validação pendente. Para cada cenário, cite a decisão relacionada, a tática de Len Bass que a sustenta e a evidência que provará o resultado. Registre pontos de sensibilidade, de trade-off, riscos, não riscos e temas de risco, diferenciando risco confirmado de dúvida não investigada. Anexe a docs/arquitetura.md e salve o ciclo em docs/avaliacao-arquitetural/ciclo-00.md, sem apagar origem, suposições ou alternativas.
```

**Prompt 2.4: revisão cruzada, ADRs e rastreabilidade**

```text
Atue como painel com seis papéis: arquiteto, dados, segurança, operações, qualidade e facilitador ATAM. Leia todos os artefatos e docs/arquitetura.md. Cada papel apresenta objeções fundamentadas em requisito ou cenário, e as divergências ficam registradas com a forma como foram resolvidas ou por que seguem abertas. Verifique a consistência entre texto, diagramas, utility tree e matriz ATAM. Crie os ADR-001 a ADR-012 em docs/adr/ (cole a tabela 6.4), cada um com status, contexto, requisitos e cenários, alternativas, decisão, consequências positivas e negativas, riscos, evidência necessária e condição de revisão. Finalize docs/arquitetura.md com a matriz requisito → decisão → componente → evidência e as listas separadas de requisitos sem cobertura, decisões sem requisito, suposições, perguntas abertas, riscos aceitos e próximos experimentos. Não invente fatos nem escreva código. Execute analyze-docs.
```

**Governança.** Os agentes analisam, propõem e confrontam; a equipe decide, aceita risco e encerra divergência, com nome e motivo registrados. Falhas típicas a procurar na revisão: número inventado, tecnologia escolhida por popularidade, revisor que só elogia, suposição que vira fato entre um prompt e outro, diagrama que diverge do texto e cenário sem medida.

### Porta de saída da Fase 2

- Existe ADR para cada uma das 12 decisões, com alternativa descartada e motivo.
- Todo cenário tem as seis partes e medida; as medidas sem origem estão marcadas como hipótese com validação pendente.
- Há ao menos um trade-off nomeado e a matriz requisito → decisão → componente → evidência tem linha para todo requisito crítico.
- Outra equipe consegue entender, rastrear e contestar a arquitetura sem explicação oral (definição de pronto da Aula 04).
- `analyze-docs` sem pendências e as lacunas do Anexo E respondidas ou assumidas.

## 7. Fase 3 — Casca do projeto, CI e processo de defeitos

Ao fim da Fase 3 existe um projeto Maven que sobe, uma suíte mínima verde, um pipeline obrigatório em todo pull request, a análise do SonarCloud ligada e um processo de defeitos. Toda fatia da Fase 4 entra, então, com a `main` protegida.

**Origem:** Aula 03 (passo 2, Spring Initializr), Aula 05 (defeitos), Aula 06 (CI) e Aula 07 (JaCoCo e SonarCloud); semanas 36 a 38 da especificação.

### 7.1 Casca Maven

| Item | Valor |
| --- | --- |
| Projeto | Maven, Java 21 (Temurin) |
| Spring Boot | Versão 3.x estável sugerida pelo Initializr, nunca SNAPSHOT, M ou RC |
| Coordenadas | Group `br.senac`, artifact `organizacao-recursos` |
| Dependências do Initializr | Spring Web, Spring Security, Spring Data JPA, Validation, PostgreSQL Driver, Testcontainers, Flyway Migration, Actuator |
| Acrescentar | springdoc-openapi (RF-14); ArchUnit em escopo de teste |
| Pacotes | `br.senac.recursos` com `dominio`, `aplicacao`, `api` e `infra` |

A regra de que `dominio` não depende de Spring nem de JPA (decisão 10) vira um teste de arquitetura com ArchUnit desde o primeiro dia, para que a violação quebre o build em vez de passar em revisão.

**Prompt 3.1: casca do projeto**

```text
Atue como desenvolvedor. Leia docs/arquitetura.md e os ADR-001, ADR-005, ADR-009 e ADR-010. Crie na raiz um projeto Maven Java 21 com Spring Boot 3.x estável, group br.senac e artifact organizacao-recursos, com as dependências: Web, Security, Data JPA, Validation, PostgreSQL Driver, Testcontainers, Flyway, Actuator e springdoc-openapi, e ArchUnit em escopo de teste. Estruture os pacotes dominio, aplicacao, api e infra conforme o C4 de componentes. Configure Flyway com V1__baseline.sql vazia, um bean Clock (UTC) injetável, compose.yaml com PostgreSQL local e toda configuração sensível por variável de ambiente, sem segredo no repositório. Escreva um único teste de contexto com Testcontainers e PostgreSQL real (sem H2) e um teste ArchUnit proibindo dominio de depender de Spring e JPA. Não implemente regra de negócio. Atualize o README com como subir e como testar. Rode ./mvnw -B verify e confirme verde.
```

### 7.2 Pipeline de integração contínua

O workflow roda em `pull_request` e em push na `main`, com permissões mínimas (`contents: read`), cancelamento de execuções obsoletas, `timeout-minutes`, Java 21 Temurin com cache Maven e o mesmo `./mvnw -B verify` do terminal. Os relatórios do Surefire e do Failsafe sobem como artifact com `if: always()`. Nada de `continue-on-error`, `pull_request_target` ou `-DskipTests`.

**Prompt 3.2: CI no GitHub Actions**

```text
Atue como engenheiro de DevOps. Você pode usar o terminal, o git e o gh. Crie .github/workflows/ci.yml com nome qualidade e job test, disparado em pull_request e em push na main, com permissions: contents: read, checkout, Java 21 (temurin) com cache Maven, concurrency que cancela execuções obsoletas, timeout-minutes e ./mvnw -B verify. Publique target/surefire-reports e target/failsafe-reports como artifact com if: always() e retenção de 7 dias. Não use segredos, continue-on-error nem pull_request_target. Trabalhe numa branch, abra um pull request e confirme o check verde. Quebre de propósito uma asserção, registre o run vermelho, reverta e confirme o verde. Liste os passos para exigir o check qualidade / test e uma revisão por par na proteção da main, e anote no README os IDs dos runs.
```

A proteção da `main` é feita por quem administra o repositório: check obrigatório, revisão por par e sem merge administrativo como rotina.

### 7.3 JaCoCo e SonarCloud

O relatório do JaCoCo entra agora, sem barrar o build. O gate de 80% de linhas e 70% de branches liga na primeira fatia de domínio da Fase 4 (fatia 4.3), quando já existe código de regra para medir; essa escolha vai no ADR-011. O SonarCloud analisa todo pull request desde o primeiro, com Quality Gate sobre o código novo.

Antes do prompt, a equipe importa o repositório no SonarCloud e cadastra o secret `SONAR_TOKEN` no GitHub. **O agente não vê nem grava esse token.**

**Prompt 3.3: JaCoCo em modo relatório e SonarCloud**

```text
Atue como engenheiro de qualidade. Configure o JaCoCo 0.8.15 no pom.xml com prepare-agent e relatório HTML e XML na fase verify, sem regra de falha por ora (a regra de 80% de linhas e 70% de branches será ligada na fatia 4.3). Acrescente ao ci.yml o upload do relatório do JaCoCo como artifact e a análise do SonarCloud pelo plugin Maven, com fetch-depth: 0, lendo o XML do JaCoCo e o token do secret SONAR_TOKEN. Configure sonar.organization e sonar.projectKey no pom.xml. Nunca escreva token em arquivo, log ou commit. Não configure Surefire com forkCount=0. Abra um pull request e leia o Quality Gate; para cada issue, corrija, aceite com justificativa ou marque falso positivo com evidência, nunca só para ficar verde.
```

### 7.4 Processo de defeitos

| Elemento | Regra |
| --- | --- |
| Vocabulário | Erro humano, defeito, falha e incidente são coisas distintas; a correção mira o defeito, não o relato |
| Relato | Usa o template `defeito.md`: passos mínimos, esperado e obtido, evidência sem dado sensível, requisito ligado |
| Severidade e prioridade | Severidade mede o dano; prioridade é decisão de planejamento; as duas levam justificativa |
| Ciclo de vida | Novo, triado, em correção, em verificação, fechado; duplicado, não reproduzível e não será corrigido exigem registro |
| Fechamento | Issue ligada ao PR, teste de regressão identificável e resultado verde reproduzível |
| Métricas permitidas | Tempo de ciclo por severidade, taxa de reabertura, defeitos escapados por etapa |
| Métrica proibida | Quantidade de defeitos por pessoa |

**Prompt 3.4: estrutura de defeitos**

```text
Atue como engenheiro de qualidade. Crie docs/defeitos/README.md com o processo acima, um índice BUG-xxx → issue → severidade → prioridade → estado → commit da correção → teste de regressão, e as labels bug, needs-triage, severidade-critica, severidade-alta, severidade-media, severidade-baixa e regressao (com comandos gh label create). Não invente defeitos: registre apenas os reais encontrados até aqui, por exemplo inconsistências entre documentos achadas por analyze-docs ou pela revisão da Fase 2. Execute analyze-docs ao final.
```

### Porta de saída da Fase 3

- `./mvnw -B verify` passa local e na CI, com a suíte mínima e o teste ArchUnit.
- O check `qualidade / test` é obrigatório na `main`, junto com revisão por par.
- Uma execução vermelha intencional e sua recuperação verde estão registradas no README.
- O SonarCloud decora o pull request e nenhum segredo aparece em log ou commit.
- `docs/defeitos/` existe com o processo e o índice; `analyze-docs` sem pendências.

## 8. Fase 4 — Etapa 3 (SDD): back end guiado por testes

O back end é construído em onze fatias verticais, cada uma com o mesmo ciclo: cenário, teste vermelho, código mínimo verde, refatoração, cobertura e linha da RTM. Como a arquitetura já está fechada na Fase 2, cada fatia só preenche estrutura que existe; nenhuma redesenha.

**Origem:** Aula 03 (técnicas de projeto de teste), Aula 05 (TDD no vermelho), Aula 07 (JUnit 5, JaCoCo e Sonar), Aula 08 (WireMock e Testcontainers), Aula 09 (TDD e BDD) e Aula 10 (concorrência).

### 8.1 Regras do ciclo, válidas para toda fatia

1. **Vermelho antes do verde, com commit separado:** `test(red)`, `feat(green)`, `refactor`. O histórico é a evidência exigida pela especificação para TDD ou BDD.
2. **Nenhum teste é alterado, desativado ou enfraquecido para passar.** Teste que parece errado é confrontado com a regra na fonte.
3. **Tempo só pelo `Clock` injetado.** Nunca `Instant.now()` escondido nem `Thread.sleep`.
4. **Limites em trinca** (imediatamente antes, no limite, imediatamente depois) com `@ParameterizedTest`.
5. **Mock só em teste unitário isolado.** Persistência e integrações críticas usam PostgreSQL real em Testcontainers e WireMock.
6. **Teste que protege:** apague a regra, rode a suíte; se não ficar vermelha, o teste não vale. Teste sem asserção que só sobe cobertura não pontua.
7. **Cobertura é piso, não meta.** O gate de 80% de linhas e 70% de branches liga na fatia 4.3.

### 8.2 As onze fatias

| Fatia | Escopo | RF e RN | Técnica e nível de teste | Evidência de saída |
| --- | --- | --- | --- | --- |
| 4.0 | Plano de teste e casos de teste por regra | Todos | Partição, valor limite e tabela de decisão | CT-xxx na RTM |
| 4.1 | Fundações: migração do esquema completo com `btree_gist` e a constraint, base de testes com Testcontainers, erros padronizados, login e perfis | RF-01, RF-13 | Integração e API | Matriz perfil × endpoint inicial |
| 4.2 | Cadastro e pesquisa de salas, professores, materiais e competências | RF-02, RF-03 | Unitário, integração e API | Pesquisa por todos os filtros testada |
| 4.3 | Domínio de reservas: período, sobreposição, criar, alterar e cancelar. **Liga o gate do JaCoCo** | RF-04, RF-05, RN-01, RN-02, RN-07 | Unitário parametrizado com limites | Cobertura de ramo nas regras de sobreposição |
| 4.4 | Concorrência em sala e em professor | RF-06, RN-03 | Integração com banco real | Vermelho sem a constraint, verde com ela, cinco execuções seguidas |
| 4.5 | Estados, aprovação e manutenção. **Fatia obrigatória de TDD e BDD** | RF-07, RF-08, RN-04 a RN-07 | Cenários Dado/Quando/Então e Cucumber | `evidencia-tdd.md` e features no CI |
| 4.6 | Retirada e devolução de materiais | RF-09 | Integração e API | Estados proibidos rejeitados |
| 4.7 | Auditoria de toda transição | RF-10, RN-08 | Integração; falha ao auditar desfaz a transição | Um evento por transição, na mesma transação |
| 4.8 | Notificação e integração externa | RF-11 | WireMock | Matriz INT-01 a INT-06 |
| 4.9 | Relatórios de utilização, carga horária e conflitos evitados | RF-12 | Integração com dados semeados | Números conferidos contra o banco |
| 4.10 | Documentação da API | RF-14 | Geração OpenAPI e teste de contrato | Contrato publicado e validado |
| 4.11 | Autorização completa | RF-01, RNF-06 | Matriz perfil × operação, acesso a recurso de outro usuário | Zero falhas de autorização |

A ordem respeita a dependência: o esquema e a base de testes vêm antes dos cadastros; o domínio puro vem antes da concorrência; a auditoria entra antes dos relatórios, que consomem seus dados.

### 8.3 Matriz de integração externa (fatia 4.8)

| ID | Dado | Quando | Então |
| --- | --- | --- | --- |
| INT-01 | Resposta 200 válida | Notificar | Mapear para o modelo interno e registrar envio |
| INT-02 | Resposta 404 | Notificar | Erro próprio do domínio, sem repetir a chamada |
| INT-03 | Resposta 500 | Notificar | Reserva permanece válida e notificação fica pendente |
| INT-04 | Resposta mais lenta que o timeout | Notificar | Interromper dentro do limite e marcar pendente |
| INT-05 | JSON inválido ou campo ausente | Mapear | Rejeitar o conteúdo e registrar correlação |
| INT-06 | Provedor devolve o próprio token no corpo do erro | Responder ao cliente | O conteúdo não atravessa a API e não aparece em log |

O comportamento esperado de INT-03 e INT-04 depende do ADR-007; se a equipe decidir de outra forma, a matriz muda junto com o ADR.

### 8.4 Prompts da Fase 4

**Prompt 4.A: plano e casos de teste (fatia 4.0)**

```text
Atue como engenheiro de qualidade. Use o terminal apenas para ler. Leia RTM.md, docs/prd/regras-negocio.md, requisitos-funcionais.md, docs/arquitetura.md, os ADRs e os cenários CEN-01 a CEN-09. Complete docs/plano-de-teste.md (escopo e itens que não serão testados, níveis, critérios de entrada, saída e suspensão, ambiente, metas de 80% e 70%, riscos) e crie docs/testes/casos-de-teste.md com casos CT-xxx por regra e cenário. Cada caso tem ID, título, pré-condições, dados concretos de entrada, passos numerados, resultado esperado mensurável e rastreabilidade (RF, RN, CEN). Aplique partição de equivalência, valor limite (antes, no limite, depois) e tabela de decisão (perfil × tipo de recurso × estado). Marque o nível de cada caso: unitário, integração, API ou E2E. Atualize a RTM com os CT. Registre ambiguidades como perguntas. Não escreva código.
```

**Prompt 4.B: ciclo vermelho, verde e refatoração por fatia (modelo)**

Substitua o trecho entre colchetes pela fatia da vez.

```text
Atue como desenvolvedor em par praticando TDD estrito. Fatia: [NOME, RFs e RNs da fatia]. Leia docs/testes/casos-de-teste.md, docs/arquitetura.md e os ADRs, e respeite os pacotes e as decisões. Para cada caso da fatia, um por vez: (1) escreva um teste JUnit 5 com nome que descreva condição e resultado, em Arrange-Act-Assert; rode ./mvnw -B test e mostre que falha pela razão esperada (asserção, não erro de compilação ou configuração); commit test(red): <caso>. (2) Implemente o mínimo para a suíte inteira ficar verde; commit feat(green): <caso>. (3) Refatore sem mudar comportamento, com tudo verde; commit refactor: <motivo>. Regras: tempo só pelo Clock injetado; limites em trinca com @ParameterizedTest; mock apenas em unitário isolado e persistência com Testcontainers; é proibido escrever vários testes de uma vez, alterar teste para passar, usar @Disabled ou pular o vermelho. Se um teste parecer errado, confronte com a regra na fonte e pergunte antes de mudar. Ao final: ./mvnw -B verify verde, linha da fatia na RTM.md atualizada (caso, teste, commit, execução) e docs/testes/evidencia-tdd.md com a tabela caso, commit red, commit green, commit refactor e trecho da saída. Abra um pull request pequeno.
```

**Prompt 4.C: ligar o gate de cobertura (ao fim da fatia 4.3)**

```text
Atue como engenheiro de qualidade. Ligue no pom.xml a regra de falha do JaCoCo na fase verify: 80% de linhas e 70% de branches no BUNDLE. Rode ./mvnw -B verify, leia o relatório por classe e liste cada linha ou branch não coberto das regras de negócio, classificando como lacuna de risco ou cosmética. Escreva testes apenas para as lacunas de risco, com asserções sobre comportamento, limites em trinca e tempo via Clock; nunca teste sem asserção para subir número e nunca exclua classe relevante do cálculo. Confirme que o build falha abaixo da meta e volta a passar ao restaurá-la. Registre a decisão no ADR-011 e atualize a matriz do plano.
```

**Prompt 4.D: dupla reserva provada por teste (fatia 4.4)**

```text
Atue como engenheiro de qualidade. Escreva um teste de integração com JUnit 5 e Testcontainers (PostgreSQL real, sem H2) que dispara 20 solicitações simultâneas de reserva para a mesma sala e o mesmo horário, com ExecutorService e CountDownLatch para que partam juntas. O esperado é exatamente uma reserva aceita, 19 recusadas com 409 e uma única linha em ocupacoes para o recurso e o intervalo, verificada por consulta ao banco e não só pela resposta. Repita para a agenda do professor. Rode cinco vezes seguidas. Primeiro mostre o teste vermelho sem a constraint de exclusão (ADR-003) e depois verde com ela. Se algum caso falhar, não ajuste o teste: registre o defeito em docs/defeitos/ com passos e evidência e corrija no banco. Cada tentativa recusada grava uma linha em tentativas_conflito. Atualize a RTM e o ADR-003 com a evidência.
```

**Prompt 4.E: cenários BDD de aprovação e bloqueio (início da fatia 4.5)**

```text
Atue como analista de qualidade. Use o terminal para ler docs/prd/regras-negocio.md, RTM.md e o código das reservas; não altere código. Escreva em docs/testes/bdd-aprovacao-bloqueio.md cenários Dado/Quando/Então para: recurso restrito exige aprovação de um Responsável; Solicitante não aprova a própria reserva; recurso em manutenção não pode ser reservado; reserva só muda de estado pelas transições SOLICITADA → APROVADA → EM_USO → CONCLUÍDA e pelas alternativas rejeitada, cancelada e não compareceu, com as transições proibidas. Para manutenção, monte tabela de exemplos com as fronteiras: reserva que termina exatamente no início do bloqueio, que começa exatamente no fim e que cruza um segundo. Onde as regras não decidirem uma fronteira, registre pergunta em aberto em vez de inventar a política. Cada cenário tem um único Quando e um Então observável. Liste quais viram teste de unidade e quais viram teste de API.
```

**Prompt 4.F: cenários executáveis ligados à RTM (fim da fatia 4.5)**

```text
Atue como engenheiro de qualidade. Transforme os cenários de API de docs/testes/bdd-aprovacao-bloqueio.md em especificação executável com Cucumber-JVM (cucumber-java e cucumber-junit-platform-engine), em src/test/resources/features/aprovacao-bloqueio.feature, com steps que chamam a API por MockMvc usando tokens de cada perfil. Use as mesmas palavras do cenário, sem reescrever a regra. Garanta que ./mvnw -B verify executa as features na CI e que o gate do JaCoCo continua passando. Atualize RTM.md ligando cada requisito ao cenário, ao arquivo e nome do teste e ao commit. Abra pull request e confira o Quality Gate do SonarCloud; trate cada apontamento corrigindo ou justificando, nunca baixando meta.
```

**Prompt 4.G: integração externa isolada (fatia 4.8)**

```text
Atue como engenheiro de qualidade. Leia o ADR-007 e RF-11. Crie a porta NotificadorPort e um adapter HTTP com URL, token e timeouts (conexão 500 ms, leitura 1500 ms, valores iniciais a validar) vindos de configuração por variável de ambiente. Adicione WireMock apenas em escopo de teste, em versão compatível com o Java 21 e o Spring Boot do projeto. Cubra a matriz INT-01 a INT-06 desta fase: em cada teste, assevere o objeto mapeado e o request emitido (verify). O comportamento em falha segue o ADR-007. No teste negativo, o provedor devolve o próprio token no corpo do erro e o conteúdo não pode atravessar a API nem aparecer em log. A suíte deve rodar offline e dar o mesmo resultado a cada execução, sem credencial real em código, fixture, relatório ou log. Atualize RTM.md com requisito, risco, teste e execução.
```

**Prompt 4.H: autorização completa (fatia 4.11)**

```text
Atue como engenheiro de segurança de aplicação. Crie docs/testes/matriz-autorizacao.md com todas as operações da API × os três perfis, com o resultado esperado (200, 201, 401 ou 403), e um teste parametrizado que a executa com token de cada perfil. Inclua: Solicitante acessando ou alterando reserva de outro usuário, Solicitante aprovando, Responsável gerindo catálogo, token ausente, inválido, revogado e expirado (trinca antes, no instante e depois, com Clock fixo). Inclua entrada inválida (campo ausente, tamanho, tipo, injeção em filtros de pesquisa) e confirme que nenhum erro devolve stack trace ou detalhe interno. Toda falha vira defeito em docs/defeitos/ e é corrigida com teste de regressão. Não enfraqueça teste nem baixe meta.
```

**Prompt 4.I: primeiro ciclo de avaliação com o código de pé**

```text
Atue como avaliador de arquitetura. Use o terminal para ler código, testes, relatórios do JaCoCo e do SonarCloud e os runs da CI. Não altere código. Crie docs/avaliacao-arquitetural/ciclo-01.md comparando, cenário a cenário (CEN-01 a CEN-09), o que docs/arquitetura.md promete com o que o código faz, com arquivo e linha como evidência. Atualize riscos, não riscos, pontos de sensibilidade e trade-offs com as medidas reais e liste divergências e ações priorizadas para o próximo ciclo.
```

### Porta de saída da Fase 4

- Os RF-01 a RF-14 do back end estão implementados e `./mvnw -B verify` passa local e na CI.
- O gate do JaCoCo está ligado e cumpre 80% de linhas e 70% de branches; o Quality Gate do SonarCloud passa, sem bug ou vulnerabilidade crítica.
- O teste de concorrência passa cinco vezes seguidas e foi visto vermelho sem a proteção.
- A matriz de autorização não tem falha e `evidencia-tdd.md` mostra vermelho antes de verde.
- Toda linha de RF e RN crítica na RTM aponta para um teste que existe e para uma execução.

## 9. Fase 5 — Não funcionais: carga, segurança e robustez

Esta fase prova com medição o que a especificação chama de requisitos não funcionais: desempenho sob carga com JMeter, autorização, validação de entrada e tratamento seguro de erros. O requisito de desempenho é escrito antes da ferramenta e a conclusão fica limitada ao ambiente onde foi medida.

**Origem:** Aula 10 (JMeter e concorrência sob carga), Aula 08 (chamadas seguras) e a seção Não funcionais da especificação.

### 9.1 Teste de carga com JMeter

| Artefato | Caminho | Conteúdo |
| --- | --- | --- |
| Requisito e modelo de carga | `docs/performance/rnf.md` | Proposta de meta marcada para validação, com usuários, ramp-up, duração e mistura de operações |
| Plano | `perf/reservas.jmx` | Thread Group, login com JSON Extractor, CSV Data Set, consulta de disponibilidade e criação de reserva disputando o mesmo recurso |
| Dados | `perf/usuarios.csv` | Usuários fictícios, nunca dados reais |
| Resultado bruto | `perf/resultados/rodada-01.jtl` | Versionado; o relatório HTML gerado não |
| Análise | `docs/performance/resultado-01.md` | Ambiente, carga, tabela de resultados, decisão, hipótese de gargalo e próximo experimento |

Regras de execução: rodar apenas em modo CLI contra a aplicação local, nunca contra ambiente compartilhado; a criação de reserva só pode responder 201 ou 409, nunca 500; o 409 esperado é contado à parte do erro real; depois da rodada, consultar o banco e confirmar no máximo uma reserva aceita por recurso e intervalo disputado.

```bash
jmeter -n -t perf/reservas.jmx -l perf/resultados/rodada-01.jtl -e -o perf/relatorio-01
```

**Prompt 5.A: requisito de desempenho e plano JMeter**

```text
Atue como engenheiro de desempenho. Antes da ferramenta, escreva em docs/performance/rnf.md uma proposta de requisito mensurável para a consulta de disponibilidade e para a criação de reserva, partindo do RNF-08 e do CEN-04 de docs/arquitetura.md, marcada como proposta para o grupo validar, com o modelo de carga: usuários, ramp-up, duração e mistura de operações. Depois crie perf/reservas.jmx com Thread Group, login extraindo o token por JSON Extractor, CSV Data Set com usuários fictícios em perf/usuarios.csv, consulta de disponibilidade e criação de reserva disputando o mesmo recurso, com asserção de que a criação responde apenas 201 ou 409. Rode somente em modo CLI contra a aplicação local, nunca contra ambiente compartilhado, com jmeter -n -t perf/reservas.jmx -l perf/resultados/rodada-01.jtl -e -o perf/relatorio-01. Versione o plano e o CSV; não versione o relatório HTML. Nada de token fixo no plano.
```

**Prompt 5.B: análise e decisão**

```text
Atue como analista de desempenho. Use o terminal para ler perf/resultados/rodada-01.jtl e o relatório gerado. Calcule p50, p95 e p99 por operação, vazão e taxa de erro, separando 409 esperado de erro real. Consulte o banco e confirme no máximo uma reserva aceita por recurso e intervalo disputado. Compare com docs/performance/rnf.md e escreva docs/performance/resultado-01.md com ambiente (máquina, versão da aplicação, commit), carga aplicada, tabela de resultados, decisão (atende, não atende ou inconclusivo), uma hipótese de gargalo com o dado que a sustenta e o próximo experimento. Não arredonde a favor do grupo e não afirme nada sobre produção a partir de uma máquina local. Ligue o RNF, o plano e o resultado na RTM.md e atualize o CEN-04 em docs/avaliacao-arquitetural.
```

### 9.2 Segurança e robustez

| Controle | Como se prova | Evidência |
| --- | --- | --- |
| Autorização por perfil e posse | Matriz perfil × operação da fatia 4.11 | Zero falhas; limitador de nota |
| Validação de entrada | Testes negativos: campo ausente, tamanho, tipo, período inválido, injeção em filtros | Códigos de erro estáveis |
| Tratamento seguro de erros | Respostas sem stack trace, sem detalhe interno, sem conteúdo do provedor | INT-06 |
| Segredos | Tudo por variável de ambiente e secrets do GitHub; varredura do repositório e do histórico | Verificação na CI |
| Dependências | Análise do SonarCloud e verificação de dependências vulneráveis | Zero crítica |
| Logs | Correlação por requisição, nunca `Authorization` nem corpo sensível | Teste de log |
| Token e sessão | Expiração e revogação nos limites, com `Clock` fixo | Trinca antes, no instante, depois |
| CORS e cabeçalhos | Origem permitida restrita ao front end; cabeçalhos de segurança | Teste de API |
| Job de não compareceu, se adotado | Duas execuções simultâneas e reexecução do mesmo intervalo | Lock e idempotência demonstrados |

**Prompt 5.C: revisão de segurança**

```text
Atue como engenheiro de segurança de aplicação. Use o terminal para ler código, configuração, relatório do SonarCloud e workflows. Crie docs/testes/revisao-seguranca.md percorrendo as categorias do OWASP Top 10 que se aplicam a esta API, cada uma com status (atendida, parcial, não aplicável ou falha), evidência com arquivo e linha ou teste, e ação. Configure .github/dependabot.yml para as dependências Maven e npm e acrescente à CI uma varredura de segredos. Revise CORS, cabeçalhos de segurança, mascaramento de Authorization nos logs e mensagens de erro. Toda falha vira defeito em docs/defeitos/ com teste de regressão. Não escreva nem execute exploração além de testes automatizados do próprio projeto.
```

### Porta de saída da Fase 5

- O requisito de desempenho foi escrito e marcado como proposta antes da primeira rodada.
- Existe `rodada-01` com resultado, decisão e limite da conclusão escritos, e a criação de reserva não respondeu 500.
- O banco confirma no máximo uma reserva aceita por recurso e intervalo depois da carga.
- `revisao-seguranca.md` não tem falha aberta e o SonarCloud não aponta vulnerabilidade crítica.
- As linhas de RNF-05 a RNF-09 da RTM apontam para teste e execução.

## 10. Fase 6 — Etapa 4 (SDD): front end React + Vite

O front end é a última camada e depende só do contrato OpenAPI e dos códigos de erro estáveis, por isso não obriga nenhuma mudança no back end. Cada tela nasce de uma jornada de persona, e o teste E2E cobre a jornada crítica, incluindo o conflito de horário.

**Origem:** passo 8 do tutorial (jornadas), RF-13, RF-14, RNF-10 e a exigência de teste E2E da especificação. Nenhuma das nove aulas ensina o front end, então as decisões desta fase são da equipe e vão para o ADR-010 e ADRs novos.

### 10.1 Quando o front end pode começar

O contrato OpenAPI estável (fatia 4.10), os códigos de erro padronizados (ADR-008), o CORS configurado e a autorização testada (fatia 4.11) são as pré-condições. Para ganhar tempo, as telas de leitura podem começar em paralelo assim que a fatia 4.2 publicar o contrato dos cadastros; o Anexo C mostra onde isso entra.

### 10.2 Mapa de telas

| Tela | Persona | RF | Estados a tratar |
| --- | --- | --- | --- |
| Login | Todas | RF-01 | Credencial inválida, token expirado |
| Busca de disponibilidade | Solicitante | RF-03 | Carregando, vazio, erro |
| Nova reserva e alteração | Solicitante | RF-04, RF-05 | Sobreposição (409), manutenção, professor ocupado, campo inválido |
| Minhas reservas e cancelamento | Solicitante | RF-04 | Estados da reserva; não cancelável depois de iniciada |
| Fila de aprovações | Responsável | RF-07 | Aprovar ou rejeitar com motivo |
| Retirada e devolução | Responsável | RF-09 | Transição proibida |
| Catálogo de salas, professores e materiais | Administrador | RF-02 | Cadastro, edição e validação |
| Bloqueios de manutenção | Administrador | RF-08 | Conflito com reservas existentes (lacuna 5 da seção 5.3) |
| Histórico de auditoria | Responsável e Administrador | RF-10 | Filtro por reserva e período |
| Relatórios | Responsável e Administrador | RF-12 | Período, recurso, vazio |
| Usuários e perfis | Administrador | RF-01 | Troca de perfil e desativação |

### 10.3 Decisões de front end a registrar

1. Tipos e cliente da API **gerados a partir do OpenAPI**, nunca digitados à mão.
2. Uma tabela de **código de erro estável → mensagem compreensível com ação sugerida**; o texto cru do back end nunca aparece na tela.
3. Rotas protegidas por perfil são conveniência de interface; a segurança continua no back end e o front nunca decide sobreposição nem aprovação.
4. Armazenamento do token conforme o ADR-004, evitando `localStorage` quando a decisão permitir.
5. Layout *mobile-first*, validado em 360 px e 1280 px, com rótulos, foco e contraste acessíveis.
6. Datas exibidas no fuso do campus e enviadas em ISO-8601 com offset, coerente com o ADR-005.

### 10.4 Testes do front end

| Nível | Ferramenta | O que cobre |
| --- | --- | --- |
| Componente | Vitest e Testing Library | Formulários, estados de tela e mapeamento de cada código de erro |
| E2E | Playwright contra API, PostgreSQL e front reais em `docker compose` | Solicitante busca e reserva; conflito com mensagem compreensível; Responsável aprova recurso restrito; Solicitante não vê a ação de aprovar; viewport de celular |
| Pipeline | Jobs `frontend` (lint, teste e build) e `e2e` na CI | Relatório e traces como artifact |

No fluxo crítico do E2E não se usa mock: o objetivo é provar o sistema inteiro, com dados fictícios.

### 10.5 Prompts da Fase 6

**Prompt 6.A: navegação e telas (opcional, mas barato)**

```text
Atue como designer de produto. Leia as personas, as jornadas, os RF-01 a RF-14 e docs/arquitetura.md. Crie docs/prd/navegacao-telas.md com o mapa de navegação por perfil em Mermaid (flowchart, sem ponto e vírgula nas mensagens) e, para cada tela, objetivo, dados exibidos, ações, estados (carregando, vazio, erro e sucesso) e os erros possíveis com o código estável correspondente e a mensagem compreensível proposta. Inclua wireframes simples em texto. Não escreva código. Execute analyze-docs ao final.
```

**Prompt 6.B: projeto e contrato**

```text
Atue como desenvolvedor front end. Crie em frontend/ um projeto React com TypeScript e Vite, com ESLint, Vitest com Testing Library e Playwright. Gere tipos e cliente da API a partir do OpenAPI publicado pelo back end, sem digitar o contrato à mão. Implemente a camada de erros com o mapa código estável → mensagem de docs/prd/navegacao-telas.md, a autenticação conforme o ADR-004 e as rotas protegidas por perfil. Nenhuma regra de negócio duplicada: o front nunca decide sobreposição nem aprovação. A URL da API vem de variável de ambiente e não há segredo no repositório. Rode lint, testes e build.
```

**Prompt 6.C: tela por jornada (modelo)**

Substitua a tela entre colchetes e repita para cada linha do mapa de telas.

```text
Atue como desenvolvedor front end em TDD. Tela: [NOME DA TELA, persona e RF]. Leia docs/prd/navegacao-telas.md e o OpenAPI. Escreva primeiro os testes de componente com Testing Library para os estados carregando, vazio, sucesso e cada erro mapeado; mostre-os vermelhos e faça commit test(red). Depois implemente o mínimo para passar e faça commit feat(green). Layout mobile-first validado em 360 px e 1280 px, com rótulos e foco acessíveis, e cada erro com mensagem e ação sugerida. Atualize RTM.md na linha de RF-13 com o arquivo de teste e o commit.
```

**Prompt 6.D: E2E e CI do front end**

```text
Atue como engenheiro de qualidade. Crie compose.e2e.yaml que sobe PostgreSQL, a API e o front end. Escreva com Playwright os testes E2E: Solicitante busca e reserva uma sala; segunda reserva no mesmo horário mostra mensagem compreensível de conflito; Responsável aprova recurso restrito; Solicitante não vê a ação de aprovar; fluxo principal em viewport 360 por 640. Sem mocks no fluxo crítico e só com dados fictícios. Acrescente à CI os jobs frontend (npm ci, lint, teste e build) e e2e (compose e Playwright), publicando relatório e traces como artifact com if: always(). Liste os passos para tornar os dois checks obrigatórios na main. Atualize a RTM com requisito, teste e execução.
```

### Porta de saída da Fase 6

- Todo RF de 01 a 14 é acessível pela interface por pelo menos um perfil, e cada código de erro estável tem mensagem compreensível testada.
- Os testes E2E passam na CI, incluindo o fluxo de conflito e o viewport de celular.
- Nenhuma regra de negócio foi duplicada no front end.
- A linha de RF-13 na RTM aponta para testes de componente e E2E com execução.

## 11. Fase 7 — Fechamento: RTM, relatório, entrega e prova oral

A fase final converte o trabalho em evidência verificável: RTM sem buraco, relatório de qualidade escrito só com números que têm origem, release candidate instalável do zero e preparação para a prova oral. Nada novo é construído aqui; qualquer defeito achado volta como defeito, com regressão.

**Origem:** entregáveis, avaliação e semanas 43 a 50 da especificação; Aula 02 (rastreabilidade) e Aula 05 (causa raiz e regressão).

### 11.1 Entregáveis da especificação e onde cada um está

| Entregável da especificação | Onde fica | Fase de origem |
| --- | --- | --- |
| Repositório com histórico de trabalho e revisão por pares | GitHub: pull requests e commits red, green e refactor | 0 a 6 |
| Aplicação executável e instruções de instalação | `README.md` e `compose.yaml` | 3 e 6 |
| README e documentação dos fluxos ou da API | `README.md`, OpenAPI e `docs/prd/fluxos-sequencia.md` | 1 e 4 |
| RTM ligando requisito, risco, teste e evidência | `RTM.md` | 1 a 6 |
| Diagramas de contexto, componentes e sequências críticas | `docs/arquitetura.md` | 2 |
| Plano, suíte automatizada e relatório de testes | `docs/plano-de-teste.md`, `src/test` e relatórios do Surefire e do Failsafe | 4 |
| Pipeline de integração contínua | `.github/workflows/` | 3 e 6 |
| Relatórios de SonarCloud e de cobertura (JaCoCo) | Links dos runs e artifacts da CI | 3 e 4 |
| Plano e resultado do teste de carga | `perf/` e `docs/performance/` | 5 |
| Registro de defeitos encontrados, priorizados e corrigidos | `docs/defeitos/` e issues | 3 a 5 |
| Relatório final de qualidade | `docs/relatorio-qualidade.md` | 7 |
| Apresentação e demonstração | Slides e roteiro de demonstração | 7 |

### 11.2 RTM fechada

Cada linha liga requisito, regra, risco, cenário, caso de teste (caminho e nome), execução (run da CI) e status. A palavra testado só vale com apontamento para uma execução. Toda regra crítica (RN-01 a RN-08) e os RFs que dependem delas estão na meta de 100%.

**Prompt 7.A: auditoria da RTM**

```text
Atue como auditor de qualidade. Use o terminal para ler RTM.md, os testes, as features, os relatórios e os runs da CI. Para cada linha, abra o arquivo e o teste citados e confirme que existem, que contêm asserção sobre a regra e que há uma execução verde ligada. Gere docs/testes/auditoria-rtm.md com: linhas aprovadas, linhas com link quebrado, teste sem asserção relevante, requisito crítico sem cobertura e requisito sem risco. Não corrija nada: cada achado vira defeito em docs/defeitos/. Nunca marque testado sem execução.
```

### 11.3 Relatório final de qualidade

Estrutura em dez blocos, todos alimentados por evidência já existente no repositório:

1. Resumo e decisão de qualidade (liberar, liberar com ressalvas ou não liberar), com a justificativa.
2. Escopo e itens não testados, com a decisão registrada.
3. Metas contra resultado: 80% de linhas, 70% de branches, zero crítico no SonarCloud e 100% das regras críticas na RTM.
4. Resultado dos testes por nível (unitário, integração, API, E2E).
5. Concorrência: o teste e a evidência de que a dupla reserva é impossível.
6. Carga: rodada, decisão e limite da conclusão.
7. Segurança e robustez.
8. Defeitos encontrados, priorizados e corrigidos, com as métricas permitidas.
9. Riscos residuais e riscos aceitos, com quem aceitou e por quê.
10. Dívida técnica e plano de evolução.

**Prompt 7.B: relatório final**

```text
Atue como engenheiro de qualidade. Use o terminal para ler RTM.md, docs/testes/, docs/defeitos/, docs/performance/, docs/avaliacao-arquitetural/ e os relatórios do JaCoCo e do SonarCloud. Escreva docs/relatorio-qualidade.md com os dez blocos acima. Todo número cita o arquivo ou run de origem; o que não tiver origem fica como lacuna, nunca como estimativa. Meta não atingida é dito como não atingida. Inclua a decisão de qualidade e os riscos aceitos com nome e motivo. Execute analyze-docs ao final.
```

### 11.4 Release candidate e limitadores de nota

As quatro condições que a especificação usa como limitador de nota precisam estar demonstradas antes da tag.

| Limitador | Como provar | Evidência |
| --- | --- | --- |
| Aplicação que não executa | Clone limpo sobe seguindo só o README | Registro da instalação do zero |
| Pipeline ausente | Check obrigatório na `main`, com runs verdes e um vermelho intencional | Links dos runs |
| Falha de autorização | Matriz perfil × operação sem falha | `matriz-autorizacao.md` e teste |
| Possibilidade de dupla reserva | Teste de concorrência vermelho sem a constraint e verde com ela | ADR-003 e execuções |

**Prompt 7.C: release candidate**

```text
Atue como engenheiro de release. Valide que um clone limpo do repositório sobe seguindo apenas o README, com compose e comandos documentados, e registre o resultado. Atualize o README com instalação, execução, testes, CI, links dos relatórios do JaCoCo e do SonarCloud e o pacote de evidências com os links dos runs. Depois de ./mvnw -B verify e os testes E2E verdes na main, crie a tag v1.0.0-rc1. Não altere código nem testes.
```

### 11.5 Prova oral e demonstração

As aulas mostram o que o professor confere na mesa. Treine cada item com o projeto aberto:

- Abrir o histórico e achar o commit vermelho de um cenário escolhido na hora.
- Quebrar a regra de manutenção e dizer qual teste falha.
- Escolher uma linha da RTM e seguir até o teste e a execução.
- Remover a proteção de dupla reserva e rodar o teste de concorrência.
- Explicar de onde saiu o p95 e abrir o arquivo `.jtl` junto.
- Mostrar que o 409 esperado não foi contado como erro.

A demonstração de dez minutos percorre: login por perfil, busca, reserva, conflito de horário, aprovação, retirada e devolução, histórico de auditoria, relatório, e por fim a CI, o SonarCloud e o JaCoCo. Cada membro apresenta uma parte e sabe explicar as outras, porque autoria e organização valem 10% da nota.

### 11.6 Depois da entrega (semanas 48 a 50)

1. Feedback vira defeito, com causa raiz pelos 5 porquês, correção na menor mudança, teste de regressão e RTM atualizada.
2. Revisão integrada: cada requisito percorre risco, técnica, automação, evidência e decisão.
3. Retrospectiva por métricas, dívida remanescente e plano de evolução, registrados com `update-tutorial` para que o histórico do projeto não fique para trás.

## 12. Anexos

### A. Cobertura dos 14 requisitos funcionais

| RF | Fatia de implementação | Teste principal | Tela (Fase 6) |
| --- | --- | --- | --- |
| RF-01 | 4.1 e 4.11 | Matriz perfil × operação | Login e usuários |
| RF-02 | 4.2 | Testes de cadastro com banco real | Catálogo |
| RF-03 | 4.2 | Pesquisa por cada filtro | Busca de disponibilidade |
| RF-04 | 4.3 | Unitário parametrizado | Nova reserva e minhas reservas |
| RF-05 | 4.3 | Valor limite e agenda do professor (CEN-03) | Nova reserva |
| RF-06 | 4.4 | 20 solicitações simultâneas (CEN-01) | Mensagem de conflito |
| RF-07 | 4.5 | Cenários BDD de aprovação | Fila de aprovações |
| RF-08 | 4.5 | Cenários BDD de bloqueio (CEN-07) | Bloqueios de manutenção |
| RF-09 | 4.6 | Integração com estados proibidos | Retirada e devolução |
| RF-10 | 4.7 | Um evento por transição (CEN-06) | Histórico de auditoria |
| RF-11 | 4.8 | INT-01 a INT-06 | Sem tela própria |
| RF-12 | 4.9 | Números conferidos contra o banco | Relatórios |
| RF-13 | 4.1 e Fase 6 | Componente e E2E | Todas |
| RF-14 | 4.10 | Contrato OpenAPI | Sem tela própria |

### B. Metas e avaliação contra as fases

| Meta ou dimensão | Peso | Como se prova | Fases que alimentam |
| --- | --- | --- | --- |
| Requisitos e regras de negócio | 15% | RTM e testes por regra | 1 e 4 |
| Estratégia e documentação de testes | 15% | Plano e casos de teste | 4 (fatia 4.0) |
| **Qualidade dos testes automatizados** | **25%** | Teste que falha quando a regra some, não cobertura vazia | 4 |
| CI, cobertura e análise estática | 15% | 80% de linhas, 70% de branches, Quality Gate | 3 e 4 |
| Performance, segurança e robustez | 10% | Rodada JMeter, matriz de autorização, revisão de segurança | 5 |
| Rastreabilidade e gestão de defeitos | 10% | RTM sem buraco, registro de defeitos | 1 a 7 |
| Organização, apresentação e autoria | 10% | Histórico de PRs, demonstração, prova oral | 7 |

A dimensão mais pesada é a qualidade dos testes, então a Fase 4 merece mais tempo que qualquer outra. A meta de zero bug ou vulnerabilidade crítica é medida pelo SonarCloud, e testes triviais escritos só para subir a porcentagem não garantem pontuação máxima.

### C. Cronograma comprimido (semanas 42 a 46)

Hoje é a semana 42 e a entrega é na 46. A sequência abaixo é a mais curta que respeita as portas de saída; depois da Fase 2, divida a equipe em back end, qualidade e front end.

1. **Semana 42 (12 a 18/10):** Fases 0 e 1 completas; começar a Fase 2 pelo requisito não funcional e pelo Prompt 2.1; responder o Anexo E.
2. **Semana 43 (19 a 25/10):** terminar a Fase 2 (ATAM e ADRs) e cumprir a Fase 3 inteira; `main` protegida e SonarCloud ligado no fim da semana.
3. **Semana 44 (26/10 a 01/11):** Fase 4, fatias 4.0 a 4.5. Em paralelo, um membro inicia as telas de leitura do front end com o OpenAPI da fatia 4.2.
4. **Semana 45 (02 a 08/11):** Fase 4, fatias 4.6 a 4.11; Fase 5; telas restantes; RTM em fechamento. Confira se 2/11 (Finados) tem aula.
5. **Semana 46 (09 a 15/11):** E2E, auditoria da RTM, relatório final, release candidate e ensaio da apresentação.

**O que cortar primeiro se faltar tempo:** os wireframes do Prompt 6.A, o job de não compareceu (ADR-012), a amplitude do E2E (manter os dois fluxos principais) e a integração com API externa real em favor de notificação simulada. **Nunca cortar:** aplicação executável, pipeline obrigatório, autorização sem falha, proteção contra dupla reserva e a evidência de TDD ou BDD.

### D. Riscos do plano

| ID | Risco | Sinal de alerta | Resposta |
| --- | --- | --- | --- |
| R-P1 | Quatro semanas não bastam para as sete fases | Fase 2 passa do fim da semana 43 | Cortes do Anexo C e trabalho em paralelo |
| R-P2 | Agente inventa número ou ADR sem origem | Métrica sem fonte no documento | Regra de fato, lacuna, suposição e decisão; ler todo diff |
| R-P3 | Teste de concorrência intermitente | Falha em uma das cinco execuções | Corrigir a causa no banco; nunca ajustar o teste; registrar defeito |
| R-P4 | Lacunas de regra decididas sem validação | Divergência de entendimento na prova oral | Responder o Anexo E na semana 42 |
| R-P5 | `SONAR_TOKEN` indisponível ou exposto | Check do Sonar não roda; token em log | Branches do mesmo repositório; token fora de prompts e arquivos |
| R-P6 | Cobertura obtida com teste trivial | Regra apagada e suíte continua verde | Verificação de apagar a regra e rodar a suíte |
| R-P7 | Front end sem contrato estável | Retrabalho de telas | Começar pelo OpenAPI e usar tipos gerados |
| R-P8 | Material por quantidade muda o modelo | Decisão tardia depois da migração | Responder a pergunta 3 durante a Fase 1 |

### E. Perguntas em aberto

As respostas definem lacunas das Fases 1 e 2. Sem resposta, cada uma vira suposição com impacto declarado.

1. O que torna um recurso restrito: lista fixa, atributo do cadastro ou tipo?
2. Uma reserva que termina às 10h conflita com outra que começa às 10h?
3. Material é controlado por unidade identificada ou por quantidade em estoque?
4. Professor também é usuário do sistema, ou só recurso alocável?
5. A notificação será simulada ou integrada a uma API externa? Qual?
6. Qual o fuso do campus e existe horário de funcionamento que limite as reservas?
7. Um bloqueio de manutenção sobre reservas existentes cancela as reservas, é recusado ou apenas alerta?
8. Quem pode cancelar em cada estado, até quando, e qual a janela para marcar não compareceu?
9. `RTM.md` fica na raiz, como diz a especificação, ou em `docs/rtm.md`, como nos prompts das aulas? Este plano usa a raiz.
10. Quantas pessoas formam a equipe e quem administra o repositório e a organização do SonarCloud?
11. A meta de 300 ms de p95 para 50 usuários vem só da Aula 10; quem valida o número real?
12. A autenticação usa token de curta duração ou token opaco com revogação (ADR-004)?

### Fontes

Páginas lidas em 12/10/2026:

- [Especificação do Projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html)
- [Aula 02: ATAM e planejamento de casos de teste](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_planejamento-casos-teste.html)
- [Aula 03: caixa branca e caixa preta](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_caixa-branca-preta.html)
- [Aula 04: arquitetura e ATAM com IA agêntica](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_introducao-testes-automatizados.html)
- [Aula 05: gestão de erros e bugs](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_gestao-erros-bugs.html)
- [Aula 06: testes automatizados em CI](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_ci-github-actions.html)
- [Aula 07: JUnit 5, JaCoCo e SonarCloud](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_junit-jacoco-sonarcloud.html)
- [Aula 08: WireMock e chamadas de API seguras](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_wiremock-api-seguras.html)
- [Aula 09: TDD e BDD no projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_tdd-bdd.html)
- [Aula 10: carga e concorrência com JMeter](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_testes-carga-jmeter.html)

Também foi usado o tutorial do CineSenac.
