# AGENTS.md: regras do projeto Organização de Recursos

Projeto: aplicação que aloca **salas, professores e materiais** sem conflito de horário.
Stack: Java 21, Spring Boot 3.x, Maven, PostgreSQL, front end React + Vite.
Fonte dos requisitos: <https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html>
(cite a especificação por esse endereço nos documentos versionados, nunca por caminho local).

Este arquivo vale para os agentes do projeto: Claude Code (que o lê pela importação em `.claude/CLAUDE.md`, porque o Claude Code lê `CLAUDE.md`, não `AGENTS.md`) e GitHub Copilot (agentes em `.github/agents/`). O framework AIOX fica em `.aiox-core/` e não é editado; onde um texto genérico do framework contrariar este arquivo, vale este arquivo para o código e a documentação do projeto.

## Regras

1. **Consultar `.aiox-core/` antes de qualquer tarefa** (personas em `.aiox-core/development/agents/`, skills em `.aiox-core/development/skills/`, tasks, templates e checklists).
2. **Executar a skill `analyze-docs` ao finalizar qualquer criação ou edição de documentação.** Só considerar o trabalho pronto com zero erros.
3. **Nunca inventar número, SLA, volume ou regra.** Em todo documento do projeto, classificar cada afirmação como:
   - **fato**, com o caminho do arquivo de origem;
   - **lacuna**, algo que a fonte não define;
   - **suposição**, com o impacto se estiver errada e a validação pendente;
   - **decisão**, com a origem (requisito, cenário, restrição ou ADR).
4. **Nunca gravar token, senha ou dado pessoal real** em arquivo, log, commit ou documento. Não ler nem imprimir `.env`.
5. **Trabalhar em branch**, com commits `test(red)`, `feat(green)`, `refactor`, `docs`, `ci` e `chore`. Commit só quando o usuário pedir. Nunca `git push`, `--amend`, `rebase` nem `--no-verify` sem pedido explícito.
6. **Nunca alterar, desativar ou enfraquecer um teste para fazê-lo passar.** Teste que parece errado é confrontado com a regra na fonte.
7. **Citar a especificação pelo endereço público** `https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html` e nunca por caminho local. A página não numera os títulos: cite a seção pelo nome (por exemplo, seção "Entregáveis"). `docs/especificacao.md` é cópia local, ignorada pelo Git: não é versionada nem citada nos documentos do projeto. O plano de trabalho é versionado em [docs/plano-de-projeto.md](docs/plano-de-projeto.md) e pode ser citado. Nenhum documento versionado pode linkar ou citar como fonte um arquivo ignorado pelo Git.
8. **Preservar identificadores.** Nunca renumerar nem reutilizar RF, RN, RNF, CEN, ADR, CT, INT, BUG, R e S, nem as decisões A a D. RF-01 a RF-14 e RN-01 a RN-08 mantêm o texto fiel da especificação; só a ortografia pode ser corrigida.
9. **Commits com caminho explícito.** `git add <arquivo>`, um a um; nunca `git add .` nem `git add -A`. Antes de commitar, `git diff --cached --name-only` deve confirmar que `.env` e `docs/especificacao.md` não estão no índice. `mvnw.cmd` nunca é commitado (só muda o fim de linha no Windows).
10. **Não decidir lacunas.** Lacuna, ambiguidade ou contradição numa decisão registrada vai ao usuário, com alternativas e recomendação. O texto de uma decisão registrada não é alterado, e nenhum valor sem origem é preenchido.
11. **Documentos em português do Brasil, com acentuação completa**, termos canônicos da convenção de nomes de `docs/prd/regras-negocio.md` e links relativos válidos. Sem linguagem de sessão nem de agente em primeira pessoa: relatórios de sessão e notas de trabalho ficam fora do repositório.
12. **Publicar só com autorização.** `git push`, `gh pr create` e `gh pr merge` são do agente `@devops` (`AIOX_ACTIVE_AGENT=devops`, em comando isolado). O merge só acontece com os cinco checks verdes (`test`, `frontend`, `e2e`, `segredos` e SonarCloud), em merge commit. Tag de release só com autorização expressa do usuário.

## Convenção de identificadores

`RN-xx` regra de negócio · `RF-xx` requisito funcional (RF-01 a RF-14 são os 14 da especificação, extras começam em RF-15) · `RNF-xx` não funcional · `CEN-xx` cenário de qualidade · `ADR-xxx` decisão de arquitetura · `CT-xxx` caso de teste · `INT-xx` integração externa · `BUG-xxx` defeito · `R-xx` risco. Sempre com hífen e zeros à esquerda.

## Ordem de trabalho

Documento antes de código, arquitetura antes de teste, teste antes de implementação. Cada requisito crítico termina na `RTM.md` ligado a risco, teste e evidência. Agentes analisam e propõem; a equipe decide.

## Estrutura de pastas

```text
README.md, RTM.md, AGENTS.md, CHANGELOG.md
docs/prd.md, docs/prd/   personas/, perguntas-abertas.md, regras-negocio.md,
                         requisitos-funcionais.md, modelo-dados.dbml, fluxos-sequencia.md,
                         navegacao-telas.md
docs/plano-de-projeto.md, docs/plano-de-teste.md
docs/arquitetura.md, docs/taticas-arquiteturais-len-bass.md
docs/adr/, docs/avaliacao-arquitetural/, docs/testes/, docs/defeitos/, docs/performance/
docs/decisoes-equipe.md, docs/perguntas-professor.md, docs/limitacoes-e-divida-tecnica.md
docs/relatorio-qualidade.md, docs/decisao-qualidade.md, docs/status-requisitos.md, docs/rtm.md,
docs/evidencias/, docs/entrega/, docs/api/
perf/                    JMeter
frontend/                React + Vite (ADR-015)
src/, pom.xml            Maven, na raiz. Pacotes MVC em br.senac.recursos: controller, dto, service,
                         repository, model, exception, config e security (ADR-014)
.github/                 ISSUE_TEMPLATE/defeito.md, pull_request_template.md, dependabot.yml,
                         workflows/ci.yml e agents/ (GitHub Copilot)
.claude/                 Claude Code: CLAUDE.md, regras, hooks e skills
.aiox-core/              framework AIOX, instalado; não editar
```
