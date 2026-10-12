# Organização de Recursos

## Objetivo

Aplicação que organiza a alocação de **salas, professores e materiais** sem conflitos de horário.

O foco do projeto é apresentar evidências objetivas de qualidade, segurança, rastreabilidade e desempenho, e não apenas que o sistema funcione. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

Disciplina de Qualidade de Software (TADS, 2026.2). Entrega na semana 46.

## Visão do produto

- **Problema:** evitar que um mesmo recurso seja reservado em horários sobrepostos, inclusive com pedidos simultâneos, e controlar quem aprova, retira e devolve.
- **Stack exigida:** Java 21 e Spring Boot 3.x.
- **Decisões da equipe:** PostgreSQL, Maven e front end React + Vite (a especificação não as exige).
- **Escopo:** os 14 requisitos funcionais (RF-01 a RF-14) e as 8 regras críticas (RN-01 a RN-08) da especificação. Detalhes em [docs/prd.md](docs/prd.md).
- **Decisões e lacunas:** [docs/prd/perguntas-abertas.md](docs/prd/perguntas-abertas.md) registra as decisões da equipe (A1 a A8, B1 a B4) e as lacunas remanescentes (C1 a C8). A1, A3 e A5 aguardam confirmação do professor.

## Perfis

| Perfil | Papel | Persona |
| --- | --- | --- |
| Solicitante | Professor ou coordenador que consulta a disponibilidade e cria, altera ou cancela suas reservas | [solicitante](docs/prd/personas/solicitante.md) |
| Responsável | Aprova solicitações especiais, valida a alocação de docentes e acompanha retiradas e devoluções | [responsavel](docs/prd/personas/responsavel.md) |
| Administrador | Gerencia salas, professores, materiais, usuários, bloqueios e períodos de manutenção | [administrador](docs/prd/personas/administrador.md) |

## Como subir

TODO: preencher quando a casca do projeto existir (Fase 3).

## Como testar

TODO: preencher quando a casca do projeto existir (Fase 3).

## Estrutura de pastas

Pastas marcadas como *prevista* ainda não existem ou estão vazias.

```text
README.md              visão do projeto
RTM.md                 matriz de rastreabilidade (cabeçalho; linhas na Fase 1, Prompt 1.6)
AGENTS.md              regras do projeto para agentes
docs/
  prd.md               visão, escopo e métricas
  prd/personas/        solicitante, responsável e administrador
  prd/perguntas-abertas.md   registro de decisões e lacunas
  prd/regras-negocio.md, requisitos-funcionais.md, modelo-dados.dbml, fluxos-sequencia.md   (prevista)
  arquitetura.md       (prevista)
  adr/                 decisões de arquitetura (prevista)
  avaliacao-arquitetural/   (prevista)
  plano-de-teste.md    (prevista)
  testes/              (prevista)
  defeitos/            (prevista)
  performance/         (prevista)
perf/                  testes de carga com JMeter (prevista)
frontend/              React + Vite (prevista)
src/, pom.xml          back end Maven na raiz (prevista)
.github/               templates de issue e pull request; workflows (prevista)
.aiox-core/            framework de agentes (instalado)
```

## Roadmap por fases

| Fase | Foco | Estado |
| --- | --- | --- |
| 0 | Preparação do ambiente e regras do projeto | Concluída |
| 1 | Requisitos funcionais: contexto, personas, regras, RF, modelo de dados, fluxos, RTM em esqueleto | Em andamento (Prompts 1.1 e 1.1b) |
| 2 | Requisitos não funcionais, arquitetura e ATAM | Prevista |
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
