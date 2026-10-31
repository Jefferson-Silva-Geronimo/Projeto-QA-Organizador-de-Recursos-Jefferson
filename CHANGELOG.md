# Changelog

Todas as mudanças relevantes do projeto **Organização de Recursos** por versão. Formato: Adicionado, Corrigido, Alterado e Limitações conhecidas. Fonte: `git log` e pull requests do repositório (números `#nn`). Versões seguem o nome da tag.

## [1.0.0-rc4], 31/10/2026

Release candidate definitivo. Entra o que foi mesclado na `main` depois da versão anterior: a correção do BUG-028 (PR 112, código e testes) e a documentação corrigida e verificada contra o código, a CI e a aplicação em execução. **Diferente da versão anterior, o código mudou**: só `AgendamentoConfig` (novo), `AgendadorDeTransicoes` (sem a anotação `@EnableScheduling`) e testes novos; a configuração padrão não mudou. Os commits e os números da revisão estão na [Release v1.0.0-rc4](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/releases/tag/v1.0.0-rc4) e em `git rev-list -n 1 v1.0.0-rc4`.

### Adicionado
- `config/AgendamentoConfig`: `@EnableScheduling` incondicional (BUG-028, #111, PR 112).
- Testes CT-168 a CT-170 (`AgendamentoDeNotificacoesIT`, `AgendamentoDeSemDecisaoIT`, `AgendamentoDesligadoIT`) e o auxiliar `TarefasAgendadas`; experimento de mutação 23 em `docs/testes/mutacao-manual.md`.
- BUG-028 em `docs/defeitos/README.md` e em `docs/defeitos/analise-causa-raiz.md`.
- Seção "Configuração opcional" do README (tolerância de não comparecimento, D1, e reenvio de notificações, D3), com os comandos verificados.
- Seção 9 de `docs/testes/leitura-final-cobertura.md` (leitura da API do SonarCloud e variação de branches entre execuções de código idêntico), `docs/testes/execucao-e27.md`, seções de clone limpo e dos quatro cenários dos agendadores em `docs/testes/limitadores-de-nota.md`.
- Decisões F7-27, F7-28 e F7-29 em `docs/decisoes-equipe.md`.

### Corrigido
- **BUG-028:** o despacho de notificações (RF-11) só era agendado quando o job de SEM_DECISAO também estava ligado, porque `@EnableScheduling` ficava em `AgendadorDeTransicoes`. Cada agendador liga agora de forma independente, e os dois continuam desligados por padrão.
- Documentação: despacho de notificações descrito como desligado por padrão (README e limitações); lacunas D1, D3, D4, D9 e D17 no Roadmap; riscos R-25 e R-26 e pendências já entregues em `docs/plano-de-teste.md`; vazão da rodada 01 em `docs/performance/resultado-02.md` (31,1/s e 13,3/s no recorte do regime); vermelho de CT-081 em `4a54c35`; caminho local do autor removido de `docs/performance/resultado-01.md`; regra 12 do `AGENTS.md` (quatro checks obrigatórios e o Quality Gate dentro do job `test`); nota sobre CT-034 e `PeriodoTest` na RTM; nota "(141 testes; BUG-022)" junto aos "137 casos".

### Alterado
- A tag avaliada passa a ser a `v1.0.0-rc4` em README, RTM, relatório de qualidade, decisão de qualidade (reafirmação do autor), checklist e documentos de evidência; as execuções anteriores ficam identificadas por número (E-24, E-25, E-26), commit e run.
- O resumo do JaCoCo passa a se chamar `docs/testes/jacoco-resumo.md` (o nome antigo trazia o número de uma versão).

### Limitações conhecidas
Ver [docs/limitacoes-e-divida-tecnica.md](docs/limitacoes-e-divida-tecnica.md). Os dois agendadores (notificações e SEM_DECISAO) vêm **desligados por padrão** e ligam cada um pela sua propriedade `app.jobs.*`; a tolerância de não comparecimento e o reenvio de notificações só se configuram por SQL na tabela `configuracao`; a cobertura de branches varia entre execuções de código idêntico (de 519 a 523 de 602 antes desta versão); o erro de credencial do Docker no Git Bash, observado em 30/10/2026, não foi reproduzido em 31/10/2026.

## [1.0.0-rc3], 28/10/2026, tag em `005c7af`

Entra o que foi mesclado na `main` depois da tag `v1.0.0-rc2` (`d2b6af1`), até o PR 103 e o PR de preparação da rc3. **O código, os testes e a configuração são idênticos aos da `v1.0.0-rc2`**: a diferença para ela são arquivos `.md` e `docs/prd/modelo-dados.dbml`. A `v1.0.0-rc3` passa a ser a tag avaliada, publicada com autorização expressa do autor; a `v1.0.0-rc2` e a `v1.0.0-rc1` permanecem como histórico. A tag `v1.0.0-rc3` aponta para o commit `005c7af`; o run da CI dele é o `40790098761`, registrado em `docs/testes/execucao-e26.md` (665 testes no back end, 910 no front, 5 E2E, JaCoCo 97,01% e 86,54%).

### Adicionado
- `docs/testes/jacoco-resumo-rc2.md`: totais e cobertura por pacote do `jacoco.xml` da rc2, com o SHA-256 do arquivo, para o dado não depender do artefato da CI, que expira em 25/11/2026 (#102).
- Seção CEN-10 e CEN-11 em `docs/avaliacao-arquitetural/ciclo-01.md`, com arquivo, linha e teste, e o que continua não verificado (#102).
- Tabela `tentativas_login` (migração V4) em `docs/prd/modelo-dados.dbml`, que passa a ter as 19 tabelas das migrações (#102).
- Decisões F7-23 (rótulos S1 a S3), F7-24 (a rc3 como tag avaliada) e, depois da tag, F7-25.
- Depois da tag: `docs/testes/execucao-e26.md` (CI no commit da rc3), seção 2.7 de `docs/testes/limitadores-de-nota.md` (clone limpo da rc3) e seção 8 de `docs/testes/leitura-final-cobertura.md`.
- Consulta do Dependabot de 28/10/2026 em `docs/testes/alertas-dependabot.md` (#102).

### Corrigido
- Nome do autor completo ("Jefferson Silva Geronimo") nos campos de autoria dos ADR, de `arquitetura.md`, de `plano-de-teste.md` e de `status-requisitos.md` (#102).
- README, CHANGELOG, RTM, `evidencias/README.md` e o checklist deixam de descrever a tag como futura e passam a apontar para a tag publicada (#99 e #100).
- Pendência esquecida em `docs/prd/requisitos-funcionais.md` trocada pela referência ao CT-165 (#102).

### Alterado
- Ocorrência I-1 (job `e2e` vermelho por rede em `e0ab982`) registrada, sem reexecutar o run (#101, F7-22).
- Notas de desambiguação dos rótulos S1 a S3 em `docs/prd.md` e em `docs/testes/revisao-assistida-front.md` (#102, F7-23).
- Frase em `docs/testes/evidencia-tdd.md` sobre os esqueletos de produção em 46 dos 98 commits `test(red)` (#102).
- A tag avaliada passa a ser a `v1.0.0-rc3` em README, `docs/decisao-qualidade.md` (reafirmação do autor em 28/10/2026) e nos documentos de evidência.

### Limitações conhecidas
Ver [docs/limitacoes-e-divida-tecnica.md](docs/limitacoes-e-divida-tecnica.md). Além das da rc2: o cancelamento automático por SEM_DECISAO vem **desligado por padrão** (#103); o `dependabot.yml` e o `Dockerfile` continuam como dívida técnica, sem alteração, para o código ficar idêntico ao da rc2 (F7-24).

## [1.0.0-rc2], 26/10/2026, tag em `d2b6af1`

Entra o que foi mesclado na `main` depois da tag `v1.0.0-rc1` (`276224b`), até o PR 98. A tag `v1.0.0-rc2` foi publicada em 26/10/2026 com autorização expressa do autor, depois de CI verde e Quality Gate OK no commit; a `v1.0.0-rc1` permanece como histórico.

### Adicionado
- `docs/testes/execucao-e25.md`: CI no commit da tag (665 testes no back end, 910 no front, 5 E2E, JaCoCo 97,01% e 86,88%).
- Mutação dos quatro requisitos críticos que faltavam (RF-03, RF-09, RF-12 e RF-13): 22 de 22 críticos com prova de que o teste falha (PR 98).
- Registro do clone limpo no commit da `v1.0.0-rc1` em `docs/testes/limitadores-de-nota.md`, seção 2.5 (#91).
- Plano de projeto versionado, `docs/plano-de-projeto.md`, e atribuição das lacunas A1 a A8 à análise da equipe (#92, F7-17 e F7-18).
- `docs/limitacoes-e-divida-tecnica.md`, com o que está aberto ou declarado (#94).
- `docs/status-requisitos.md`, `docs/testes/plano-tdd.md` e `docs/testes/mutacao-manual.md`: situação dos requisitos, inventário das regras com casos e 14 experimentos de mutação em #95 e mais 8 antes da tag, com 22 de 22 requisitos críticos com prova de que o teste falha.
- Pacote de entrega: `CHANGELOG.md`, `docs/evidencias/README.md` (índice de evidências), `docs/decisao-qualidade.md`, `docs/rtm.md`, `docs/seguranca/matriz-autorizacao.md` e `docs/entrega/checklist.md`.

### Corrigido
- `./mvnw -B verify` falhava em computadores lentos: o prazo de início do PostgreSQL do Testcontainers passou de 60 s para 180 s, com 5 execuções consecutivas verdes em clone novo (#93, F7-19).
- Linguagem de sessão e de primeira pessoa removida da RTM e de documentos; run da execução E-24 conciliado em `40116523445`; DS-11 atualizada (#94).

### Alterado
- Atualizações do front mescladas antes da tag: `vite` 8.3.5 (#81), `@tanstack/react-query` 5.104.5 (#82) e `typescript-eslint` 8.72.0 (#83), sem alerta de segurança (F7-20).
- Issue 39 (R-25, BUG-017) fechada como "not planned": causa desconhecida, BUG-017 mitigado e risco aceito (F7-20).
- Declaração de autoria preenchida em `docs/decisao-qualidade.md`; o GitHub Copilot não foi usado.
- Citações da especificação passam do número da seção ao nome da seção, porque a página oficial não numera os títulos (#94).
- Configurações de outras ferramentas de agente (`.antigravity`, `.codex`, `.cursor`, `.gemini`, `.grok`, `.kimi`) deixam de ser versionadas; o projeto foi desenvolvido com o Claude Code (os agentes do GitHub Copilot em `.github/agents/` não foram usados) (#94).
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
