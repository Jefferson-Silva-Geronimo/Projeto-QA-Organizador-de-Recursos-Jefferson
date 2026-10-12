# AGENTS.md - Synkra AIOX (Codex CLI)

Este arquivo define as instrucoes do projeto para o Codex CLI.

<!-- AIOX-MANAGED-START: core -->
## Core Rules

1. Siga a Constitution em `.aiox-core/constitution.md`
2. Priorize `CLI First -> Observability Second -> UI Third`
3. Trabalhe por stories em `docs/stories/`
4. Nao invente requisitos fora dos artefatos existentes
<!-- AIOX-MANAGED-END: core -->

<!-- AIOX-MANAGED-START: quality -->
## Quality Gates

- Rode `npm run lint`
- Rode `npm run typecheck`
- Rode `npm test`
- Atualize checklist e file list da story antes de concluir
<!-- AIOX-MANAGED-END: quality -->

<!-- AIOX-MANAGED-START: codebase -->
## Project Map

- Core framework: `.aiox-core/`
- CLI entrypoints: `bin/`
- Shared packages: `packages/`
- Tests: `tests/`
- Docs: `docs/`
<!-- AIOX-MANAGED-END: codebase -->

<!-- AIOX-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:skills:codex`
- `npm run sync:skills:codex:global` (opcional; neste repo o padrao e local-first)
- `npm run validate:structure`
- `npm run validate:agents`
<!-- AIOX-MANAGED-END: commands -->

<!-- AIOX-MANAGED-START: shortcuts -->
## Agent Shortcuts

Preferencia de ativacao no Codex CLI:
1. Use `/skills` e selecione `aiox-<agent-id>` vindo de `.codex/skills` (ex.: `aiox-architect`)
2. Se preferir, use os atalhos abaixo (`@architect`, `/architect`, etc.)

Interprete os atalhos abaixo carregando o arquivo correspondente em `.aiox-core/development/agents/` (fallback: `.codex/agents/`), renderize o greeting via `generate-greeting.js` e assuma a persona ate `*exit`:

- `@architect`, `/architect`, `/architect.md` -> `.aiox-core/development/agents/architect.md`
- `@dev`, `/dev`, `/dev.md` -> `.aiox-core/development/agents/dev.md`
- `@qa`, `/qa`, `/qa.md` -> `.aiox-core/development/agents/qa.md`
- `@pm`, `/pm`, `/pm.md` -> `.aiox-core/development/agents/pm.md`
- `@po`, `/po`, `/po.md` -> `.aiox-core/development/agents/po.md`
- `@sm`, `/sm`, `/sm.md` -> `.aiox-core/development/agents/sm.md`
- `@analyst`, `/analyst`, `/analyst.md` -> `.aiox-core/development/agents/analyst.md`
- `@devops`, `/devops`, `/devops.md` -> `.aiox-core/development/agents/devops.md`
- `@data-engineer`, `/data-engineer`, `/data-engineer.md` -> `.aiox-core/development/agents/data-engineer.md`
- `@ux-design-expert`, `/ux-design-expert`, `/ux-design-expert.md` -> `.aiox-core/development/agents/ux-design-expert.md`
- `@squad-creator`, `/squad-creator`, `/squad-creator.md` -> `.aiox-core/development/agents/squad-creator.md`
- `@aiox-master`, `/aiox-master`, `/aiox-master.md` -> `.aiox-core/development/agents/aiox-master.md`
<!-- AIOX-MANAGED-END: shortcuts -->

<!-- PROJETO-START: organizacao-recursos -->
## Projeto Organização de Recursos — Regras do Projeto

Projeto: aplicação que aloca **salas, professores e materiais** sem conflito de horário.
Stack: Java 21, Spring Boot 3.x, Maven, PostgreSQL, front end React + Vite.
Fonte dos requisitos: https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html
(cite a especificação por esse endereço nos documentos versionados, nunca por caminho local).

Esta seção é do projeto e não faz parte dos blocos `AIOX-MANAGED`; os sincronizadores do aiox-core não devem sobrescrevê-la.
Onde houver conflito com os blocos acima (por exemplo, `npm run lint` e `docs/stories/`), vale esta seção para o código e a documentação do projeto.

### Regras

1. **Consultar `.aiox-core/` antes de qualquer tarefa** (personas em `.aiox-core/development/agents/`, skills em `.aiox-core/development/skills/`, tasks, templates e checklists).
2. **Executar a skill `analyze-docs` ao finalizar qualquer criação ou edição de documentação.** Só considerar o trabalho pronto com zero erros.
3. **Nunca inventar número, SLA, volume ou regra.** Classificar cada afirmação como:
   - **fato**, com o caminho do arquivo de origem;
   - **lacuna**, algo que a fonte não define;
   - **suposição**, com o impacto se estiver errada e a validação pendente;
   - **decisão**, com a origem (requisito, cenário, restrição ou ADR).
4. **Nunca gravar token, senha ou dado pessoal real** em arquivo, log, commit ou documento. Não ler nem imprimir `.env`.
5. **Trabalhar em branch**, com commits `test(red)`, `feat(green)`, `refactor`, `docs` e `ci`. Commit e push são feitos por quem revisa o diff, nunca sem pedido explícito.
6. **Nunca alterar, desativar ou enfraquecer um teste para fazê-lo passar.** Teste que parece errado é confrontado com a regra na fonte.

### Convenção de identificadores

`RN-xx` regra de negócio · `RF-xx` requisito funcional (RF-01 a RF-14 são os 14 da especificação, extras começam em RF-15) · `RNF-xx` não funcional · `CEN-xx` cenário de qualidade · `ADR-xxx` decisão de arquitetura · `CT-xxx` caso de teste · `INT-xx` integração externa · `BUG-xxx` defeito · `R-xx` risco. Sempre com hífen e zeros à esquerda.

### Ordem de trabalho

Documento antes de código, arquitetura antes de teste, teste antes de implementação. Cada requisito crítico termina na `RTM.md` ligado a risco, teste e evidência. Agentes analisam e propõem; a equipe decide.

### Estrutura de pastas

```text
README.md, RTM.md
docs/prd/ (personas/, regras-negocio.md, requisitos-funcionais.md, modelo-dados.dbml, fluxos-sequencia.md)
docs/arquitetura.md, docs/adr/, docs/avaliacao-arquitetural/
docs/plano-de-teste.md, docs/testes/, docs/defeitos/, docs/performance/
perf/ (JMeter), frontend/ (React + Vite), src/ (Maven, na raiz)
.github/ (ISSUE_TEMPLATE/defeito.md, pull_request_template.md, workflows/)
```
<!-- PROJETO-END: organizacao-recursos -->
