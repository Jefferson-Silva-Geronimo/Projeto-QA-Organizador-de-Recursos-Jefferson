# Organização de Recursos

## Objetivo

Aplicação que organiza a alocação de **salas, professores e materiais** sem conflitos de horário.

O foco do projeto é apresentar evidências objetivas de qualidade, segurança, rastreabilidade e desempenho, e não apenas que o sistema funcione. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

Disciplina de Qualidade de Software (TADS, 2026.2). Entrega na semana 46.

## Visão do produto

- **Problema:** evitar que um mesmo recurso seja reservado em horários sobrepostos, inclusive com pedidos simultâneos, e controlar quem aprova, retira e devolve.
- **Stack exigida:** Java 21 e Spring Boot 3.x.
- **Decisões da equipe:** PostgreSQL, Maven e front end React + Vite (a especificação não as exige).
- **Escopo:** os 14 requisitos funcionais (RF-01 a RF-14) e as 8 regras críticas (RN-01 a RN-08) da especificação, mais RF-15 e RF-16 (acréscimos da equipe) e as regras RN-09 a RN-33 (decisões da equipe). Detalhes em [docs/prd.md](docs/prd.md).
- **Decisões e lacunas:** [docs/prd/perguntas-abertas.md](docs/prd/perguntas-abertas.md) registra as decisões da equipe (A1 a A8, B1 a B4, C1 a C8, D2, D5 a D8 e D10 a D16) e as lacunas que seguem abertas (D1, D3, D4, D9 e D17). A1, A3 e A5 aguardam confirmação do professor; S6 e S7 são suposições a validar. As regras estão em [docs/prd/regras-negocio.md](docs/prd/regras-negocio.md).

## Perfis

| Perfil | Papel | Persona |
| --- | --- | --- |
| Solicitante | Professor ou coordenador que consulta a disponibilidade e cria, altera ou cancela suas reservas | [Solicitante](docs/prd/personas/solicitante.md) |
| Responsável | Aprova solicitações especiais, valida a alocação de docentes e acompanha retiradas e devoluções | [Responsável](docs/prd/personas/responsavel.md) |
| Administrador | Gerencia salas, professores, materiais, usuários, bloqueios e períodos de manutenção | [Administrador](docs/prd/personas/administrador.md) |

## Como subir

Pré-requisitos: Java 21 (Temurin ou equivalente) e Docker. O Maven vem pelo wrapper (`./mvnw`).

1. Copie `.env.example` para `.env` e preencha valores **locais**. O arquivo `.env` não é versionado e nenhum segredo entra no repositório.
2. Suba o banco: `docker compose up -d postgres`.
3. Exporte `DB_URL`, `DB_USER` e `DB_PASSWORD` com os mesmos valores do `.env` e rode `./mvnw spring-boot:run`.
4. Verifique a saúde: `GET http://localhost:8080/actuator/health`. Todo o resto exige autenticação, que entra na Fase 4 (ADR-004).

Estado atual: casca do projeto. Não há regra de negócio nem endpoint de negócio ainda.

## Como testar

```bash
./mvnw -B verify
```

Roda os testes de unidade e de arquitetura (`*Test`, Surefire) e os de integração com PostgreSQL real em container (`*IT`, Failsafe e Testcontainers; o Docker precisa estar ativo). Os relatórios ficam em `target/surefire-reports`, `target/failsafe-reports` e `target/site/jacoco`.

| Teste | O que prova |
| --- | --- |
| `ArquiteturaTest` | Seis regras de camada MVC: o model não depende de Spring, persistência nem das outras camadas, o controller não acessa repository, o service não depende de controller nem de DTO (ADR-014) |
| `ContextoIT` | A aplicação sobe com PostgreSQL real, o Flyway aplica a baseline e o relógio é UTC (ADR-005, ADR-009) |

A suíte cresce a partir da Fase 4. O gate de cobertura (80% de linhas e 70% de branches) liga na primeira fatia de domínio (ADR-011).

### Front end

Pré-requisito: Node 22.12 ou mais novo. Tudo roda em `frontend/`.

```bash
cd frontend
npm ci                  # instala as versões exatas do package-lock.json
npm run gerar:api       # regenera src/api/schema.d.ts a partir de ../docs/api/openapi.json
npm run lint            # ESLint, inclusive regras de acessibilidade (jsx-a11y)
npm run typecheck       # tsc --noEmit
npm test                # Vitest e Testing Library: componente, contraste dos tokens e regras do ADR-015
npm run build           # tipos e build de produção
npm run dev             # servidor de desenvolvimento; copie .env.example para .env e ajuste VITE_API_URL
```

O contrato da API é a fonte dos tipos: o CI regenera `schema.d.ts` e falha se o arquivo versionado divergir do contrato.
Os testes de contraste leem `src/estilo/tokens.css` de verdade e exigem WCAG AA nos dois temas.

## Integração contínua

O workflow [ci.yml](.github/workflows/ci.yml), chamado `qualidade`, roda `./mvnw -B verify` em todo pull request e em push na `main`. Permissões mínimas (`contents: read`), ações fixadas por SHA, cancelamento de execuções obsoletas, sem segredos no build, sem `continue-on-error` e sem `pull_request_target`. Publica os relatórios do Surefire, do Failsafe e do JaCoCo como artifact. O job `frontend` instala com `npm ci`, confere que os tipos da API batem com o contrato, e roda lint, tipos, testes e build.

### Execuções registradas

| Run | Resultado | O que mostra |
| --- | --- | --- |
| `38785819928` | Vermelho, defeito real | `mvnw` sem permissão de execução, exit 126 (BUG-006) |
| `38786037634` | Verde | Build verde depois da correção |
| `38786300308` | Vermelho, intencional | Asserção de `ContextoIT` quebrada de propósito (commit `test(red)`) |
| `38786508100` | Verde | Recuperação depois do `revert` |
| `38786781324` | Verde | JaCoCo publicado e SonarCloud ignorado com aviso, por falta do token |

### SonarCloud (passos da equipe)

O agente não vê nem grava o token. Quem administra a organização faz:

1. Importar o repositório em https://sonarcloud.io e anotar o identificador da organização e a chave do projeto.
2. No GitHub, em *Settings → Secrets and variables → Actions*, cadastrar o secret `SONAR_TOKEN` e as variáveis `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY`.
3. Abrir ou atualizar um pull request: o passo "Análise do SonarCloud" passa a executar e a esperar o Quality Gate.

Enquanto isso não for feito, o passo apenas avisa e o build segue.

### Proteção da `main` (passos de quem administra o repositório)

Em *Settings → Branches → Add branch ruleset* (ou regra de proteção) para `main`:

1. Exigir pull request antes do merge, com ao menos uma aprovação (revisão por par, exigência da especificação, seção 7).
2. Exigir o check de status `test` do workflow `qualidade`, com a branch atualizada.
3. Bloquear push direto e force push.
4. Não permitir contornar a regra como rotina (sem merge administrativo).

## Estrutura de pastas

Itens marcados como *vazio* ou *previsto* ainda não têm conteúdo.

```text
README.md              visão do projeto
RTM.md                 matriz de rastreabilidade: uma linha por RF e por RN, status não iniciado
AGENTS.md              regras do projeto para agentes
docs/
  prd.md               visão, escopo, restrições e métricas
  plano-de-teste.md    plano de teste em esqueleto
  prd/
    personas/          Solicitante, Responsável e Administrador
    perguntas-abertas.md   registro de decisões e lacunas
    regras-negocio.md      RN-01 a RN-33 e transições de estado
    requisitos-funcionais.md   RF-01 a RF-16 e matrizes RN-RF
    modelo-dados.dbml      modelo de dados, importável no dbdiagram.io
    fluxos-sequencia.md    14 diagramas de sequência
    navegacao-telas.md     mapa de navegação, 11 telas e mapa dos códigos de erro do front end
  arquitetura.md       drivers, C4, painel, matriz e porta de saída da Fase 2
  taticas-arquiteturais-len-bass.md   catálogo de táticas usado no ATAM
  adr/                 ADR-001 a ADR-015 (decisões de arquitetura)
  avaliacao-arquitetural/   ciclo-00.md (ATAM, CEN-01 a CEN-11) e ciclo-01.md (código de pé)
  testes/              casos de teste, matriz de autorização, BDD, evidência de TDD, mutação e revisão de segurança
  defeitos/            README.md: processo, labels e índice BUG-xxx; analise-causa-raiz.md
  decisoes-equipe.md   decisões e suposições aceitas, com quem e quando
  perguntas-professor.md   mensagem consolidada ao professor
  performance/         rnf.md (requisito e modelo de carga) e resultado-01.md
perf/                  testes de carga com JMeter: plano, usuários fictícios, resultado bruto e README
frontend/              React + Vite + TypeScript (ADR-015): cliente gerado do OpenAPI, sessão, tema, rotas por perfil e navegação; as telas entram na etapa 6.C
pom.xml, mvnw          projeto Maven, Java 21 e Spring Boot 3.5.16, com o wrapper
compose.yaml           PostgreSQL local; credenciais pelo arquivo .env (modelo em .env.example)
src/main/java/br/senac/recursos/   MVC (ADR-014): controller, dto, service, repository, model, exception, config, security
src/main/resources/    application.yml (só variáveis de ambiente) e db/migration (Flyway)
src/test/java/         testes de unidade, de arquitetura, de API (MockMvc + PostgreSQL real) e Cucumber (bdd/)
src/test/resources/features/   cenários BDD de aprovação e bloqueio
.github/               ISSUE_TEMPLATE/defeito.md, pull_request_template.md e workflows/ci.yml (Fase 3)
.aiox-core/            framework de agentes, instalado, com as skills do projeto
.claude/, .codex/, .cursor/, .gemini/, .antigravity/, .grok/, .kimi/   configuração de agentes e IDEs, geradas pelo aiox-core
```

## Roadmap por fases

| Fase | Foco | Estado |
| --- | --- | --- |
| 0 | Preparação do ambiente e regras do projeto | Concluída |
| 1 | Requisitos funcionais: contexto, personas, regras, RF, modelo de dados, fluxos, RTM e plano de teste em esqueleto | Concluída e revisada; lacunas D1, D3, D4, D9 e D17 seguem abertas |
| 2 | Requisitos não funcionais, arquitetura e ATAM | Concluída em 15/10/2026; ADR aceitos. Pendentes: respostas do professor (A1, A3, A5 e hipóteses) |
| 3 | Casca Maven, integração contínua e processo de defeitos | Concluída; PR 1 mesclado na `main` em 17/10/2026 |
| 4 | Back end guiado por testes (TDD e BDD) | Concluída; PR 2 mesclado na `main` em 17/10/2026 (468 testes, 96,7% de linhas, 84,6% de branches, Quality Gate do SonarCloud aprovado). Pendências: respostas do professor |
| 5 | Testes de carga, segurança e robustez (JMeter) | Concluída em 17/10/2026. Carga: rodadas 01 a 04; a criação de reserva **não atende** a hipótese de p95 de 300 ms nesta máquina, com causa localizada no `fsync` do PostgreSQL em Docker; consulta, 0 erro real, 0 resposta 500 e 0 dupla reserva atendem. Segurança: revisão OWASP Top 10:2025, CORS, correlação de logs, varredura de segredos, Dependabot e limite de tentativas de login (5 em 10 minutos) |
| 6 | Front end | Prevista |
| 7 | Fechamento, relatório de qualidade e prova oral | Prevista |

## Metas de qualidade

Fonte: especificação, seção 6.

| Meta | Valor |
| --- | --- |
| Cobertura de linhas | 80% |
| Cobertura de branches | 70% |
| Requisitos críticos na RTM | 100% |
| Bugs ou vulnerabilidades críticos | 0 |

## Limitações conhecidas

- **Revisão por pares:** a equipe é uma pessoa, então não há revisão por par humano. No lugar, cada pull request
  recebe uma revisão crítica assistida, registrada como comentário e identificada como tal, e a `main` deve exigir pull
  request e check obrigatório com zero aprovações (o autor não pode aprovar o próprio PR). **Estado atual:** proteção
  aplicada em 17/10/2026 (check `test` obrigatório, PR obrigatório, 0 aprovações). A pergunta ao professor
  está em [docs/perguntas-professor.md](docs/perguntas-professor.md).
- **Valores sem decisão (D1, D3, D4, D9, D17):** sem valor padrão no código; ver [docs/decisoes-equipe.md](docs/decisoes-equipe.md).
- **SonarCloud:** análise ligada na CI e Quality Gate aprovado no PR 2.

## Convenções

- **Documentação:** português do Brasil com acentuação completa; a especificação é citada sempre pelo endereço público, nunca por caminho local; classificação de cada afirmação como fato, lacuna, suposição ou decisão; identificadores RF, RN, RNF, CEN, ADR, CT, INT, BUG, R e S nunca são renumerados. Convenção de nomes em [docs/prd/regras-negocio.md](docs/prd/regras-negocio.md).
- **Verificação:** a skill `analyze-docs` (em `.aiox-core/development/skills/`) roda ao fim de toda edição de documentação.
- **Commits:** convencionais (`test(red)`, `feat(green)`, `refactor`, `docs`, `ci`, `chore`), com `git add` por caminho explícito, sem `git add .` nem `git add -A`. O arquivo `.env` e o material de apoio ignorado pelo Git nunca entram no índice.
- **Regras completas para agentes:** [AGENTS.md](AGENTS.md).
