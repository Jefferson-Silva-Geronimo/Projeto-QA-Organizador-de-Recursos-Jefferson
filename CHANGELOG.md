# Changelog

Todas as mudanças relevantes do projeto **Organização de Recursos** por versão. Formato: Adicionado, Corrigido, Alterado e Limitações conhecidas. Fonte: `git log` e pull requests do repositório (números `#nn`). Versões seguem o nome da tag.

## [1.0.0-rc2], sem data: só será criada com autorização expressa

Entra o que foi mesclado na `main` depois da tag `v1.0.0-rc1` (`276224b`). A tag `v1.0.0-rc2` **ainda não existe**.

### Adicionado
- Registro do clone limpo no commit da `v1.0.0-rc1` em `docs/testes/limitadores-de-nota.md`, seção 2.5 (#91).
- Plano de projeto versionado, `docs/plano-de-projeto.md`, e atribuição das lacunas A1 a A8 à análise da equipe (#92, F7-17 e F7-18).
- `docs/limitacoes-e-divida-tecnica.md`, com o que está aberto ou declarado (#94).
- `docs/status-requisitos.md`, `docs/testes/plano-tdd.md` e `docs/testes/mutacao-manual.md`: situação dos requisitos, inventário das regras com casos e 14 experimentos de mutação, com 18 de 22 requisitos críticos com prova de que o teste falha (#95).
- Pacote de entrega: `CHANGELOG.md`, `docs/evidencias/README.md` (índice de evidências), `docs/decisao-qualidade.md`, `docs/rtm.md`, `docs/seguranca/matriz-autorizacao.md` e `docs/entrega/checklist.md`.

### Corrigido
- `./mvnw -B verify` falhava em computadores lentos: o prazo de início do PostgreSQL do Testcontainers passou de 60 s para 180 s, com 5 execuções consecutivas verdes em clone novo (#93, F7-19).
- Linguagem de sessão e de primeira pessoa removida da RTM e de documentos; run da execução E-24 conciliado em `40116523445`; DS-11 atualizada (#94).

### Alterado
- Citações da especificação passam do número da seção ao nome da seção, porque a página oficial não numera os títulos (#94).
- Configurações de outras ferramentas de agente (`.antigravity`, `.codex`, `.cursor`, `.gemini`, `.grok`, `.kimi`) deixam de ser versionadas; o projeto usa Claude Code e GitHub Copilot (#94).
- `AGENTS.md` sem o modelo genérico do AIOX; `.claude/CLAUDE.md` importa `AGENTS.md` (#94).
- Retenção dos artefatos da CI (`relatorios-de-teste`, `relatorio-jacoco`, `relatorio-e2e` e `logs-e2e`) de 7 para 30 dias, para o relatório do JaCoCo continuar disponível durante a avaliação.
- `docs/plano-de-teste.md` sem os 4 `TODO`; `docs/relatorio-qualidade.md` aponta para `docs/decisao-qualidade.md`; `ciclo-01.md` com JaCoCo, SonarCloud e riscos revisados (#95 e pacote de entrega).

### Limitações conhecidas
Ver [docs/limitacoes-e-divida-tecnica.md](docs/limitacoes-e-divida-tecnica.md). Em resumo: RNF-08b não atendido, R-25 aberto, front sem cobertura medida, lacunas da especificação decididas pela equipe sem validação externa e revisão por pares feita como revisão assistida.

## [1.0.0-rc1], 24/10/2026, tag em `276224b`

Primeiro release candidate, com decisão de qualidade **liberar com ressalvas** ([docs/relatorio-qualidade.md](docs/relatorio-qualidade.md)).

### Adicionado
- Back end em Java 21 e Spring Boot 3.x, em TDD e BDD, com PostgreSQL real nos testes: reservas, conflito, aprovação, bloqueio de manutenção, retirada e devolução, auditoria, notificação por webhook, relatório e documentação OpenAPI (Fase 4, PR 1 e PR 2 mesclados em 17/10/2026).
- Testes de carga com JMeter (rodadas 01 a 04), revisão de segurança OWASP, limite de tentativas de login e papel do banco (Fase 5, #10, #11, #12, #15 e #17).
- Front end React com as 11 telas (T01 a T11), 910 testes de componente e 5 testes E2E com Playwright na CI (Fase 6, pull requests #19 a #57).
- Revisão assistida independente do front, evidência dos quatro limitadores de nota, auditoria da RTM, modelo de ameaças, soma SHA-256 do Maven no wrapper, leitura final de cobertura e relatório final de qualidade (Fase 7, pull requests #58 a #90).

### Corrigido
- README não subia a aplicação em clone limpo (BUG-019, #61).
- Oito defeitos achados na auditoria da RTM (BUG-020 a BUG-027, #77 a #80).
- Impasse tratado como conflito (BUG-007), autorização (BUG-008) e perda da tentativa de conflito (BUG-009), entre outros, na Fase 4; ver [docs/defeitos/README.md](docs/defeitos/README.md).

### Alterado
- Estrutura MVC no lugar das camadas hexagonais (ADR-014).
- `segredos` passa a ser check obrigatório da `main` (F7-10).

### Limitações conhecidas
Ver [docs/limitacoes-e-divida-tecnica.md](docs/limitacoes-e-divida-tecnica.md).
