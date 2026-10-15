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

TODO: ainda não há aplicação. Será preenchido na Fase 3, quando a casca Maven existir.

## Como testar

TODO: ainda não há testes. Será preenchido na Fase 3 (suíte mínima e integração contínua) e completado na Fase 4.

## Estrutura de pastas

Itens marcados como *previsto* ainda não existem ou estão vazios.

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
  arquitetura.md       drivers, C4, painel, matriz e porta de saída da Fase 2
  taticas-arquiteturais-len-bass.md   catálogo de táticas usado no ATAM
  adr/                 ADR-001 a ADR-012 (decisões de arquitetura)
  avaliacao-arquitetural/   ciclo-00.md (ATAM, CEN-01 a CEN-11)
  testes/              (vazio)
  defeitos/            (vazio)
  performance/         (vazio)
perf/                  testes de carga com JMeter (vazio)
frontend/              React + Vite (vazio)
src/, pom.xml          back end Maven na raiz (previstos, Fase 3)
.github/               ISSUE_TEMPLATE/defeito.md e pull_request_template.md; workflows/ (previsto)
.aiox-core/            framework de agentes, instalado, com as skills do projeto
.claude/, .codex/, .cursor/, .gemini/, .antigravity/, .grok/, .kimi/   configuração de agentes e IDEs, geradas pelo aiox-core
```

## Roadmap por fases

| Fase | Foco | Estado |
| --- | --- | --- |
| 0 | Preparação do ambiente e regras do projeto | Concluída |
| 1 | Requisitos funcionais: contexto, personas, regras, RF, modelo de dados, fluxos, RTM e plano de teste em esqueleto | Concluída e revisada; lacunas D1, D3, D4, D9 e D17 seguem abertas |
| 2 | Requisitos não funcionais, arquitetura e ATAM | Concluída em 15/10/2026; ADR aceitos. Pendentes: respostas do professor (A1, A3, A5 e hipóteses) |
| 3 | Casca Maven, integração contínua e processo de defeitos | Prevista |
| 4 | Back end guiado por testes (TDD e BDD) | Prevista |
| 5 | Testes de carga e concorrência (JMeter) | Prevista |
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

## Convenções

- **Documentação:** português do Brasil com acentuação completa; a especificação é citada sempre pelo endereço público, nunca por caminho local; classificação de cada afirmação como fato, lacuna, suposição ou decisão; identificadores RF, RN, RNF, CEN, ADR, CT, INT, BUG, R e S nunca são renumerados. Convenção de nomes em [docs/prd/regras-negocio.md](docs/prd/regras-negocio.md).
- **Verificação:** a skill `analyze-docs` (em `.aiox-core/development/skills/`) roda ao fim de toda edição de documentação.
- **Commits:** convencionais (`test(red)`, `feat(green)`, `refactor`, `docs`, `ci`, `chore`), com `git add` por caminho explícito, sem `git add .` nem `git add -A`. O arquivo `.env` e o material de apoio ignorado pelo Git nunca entram no índice.
- **Regras completas para agentes:** [AGENTS.md](AGENTS.md).
