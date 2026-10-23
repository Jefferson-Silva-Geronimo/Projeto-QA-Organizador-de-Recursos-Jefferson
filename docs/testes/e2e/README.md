# Testes E2E (Fase 6, 6.D)

Cinco jornadas ponta a ponta no navegador (Playwright, Chromium), contra o **PostgreSQL, a API e o front reais**, subidos por [compose.e2e.yaml](../../../compose.e2e.yaml). **Sem mocks no fluxo crítico e só com dados fictícios.** Os testes ficam em `frontend/e2e/`, e o job `e2e` da CI ([ci.yml](../../../.github/workflows/ci.yml)) os roda a cada pull request.

## O que é verificado

| Caso | Jornada | RF |
| --- | --- | --- |
| CT-161 | A Solicitante busca salas livres no período e reserva uma; a reserva aparece na lista dela, aprovada | RF-03, RF-04, RF-05 |
| CT-162 | Uma segunda reserva no mesmo horário mostra a mensagem de conflito, em linguagem comum e sem código técnico | RF-04, RF-13 |
| CT-163 | O Responsável aprova a reserva de um recurso restrito, e quem pediu a vê aprovada | RF-07 |
| CT-164 | A Solicitante não vê a ação de aprovar: sem item de menu, sem Aprovar nem Rejeitar no pedido dela e "Acesso negado" pelo endereço | RF-07, RF-13 |
| CT-165 | O fluxo principal (buscar e reservar) em 360 por 640, sem rolagem horizontal | RF-13 |

O que cada teste verifica passa pela tela. A API é chamada só para montar uma pré-condição (a semente de pessoas e recursos e, no teste de conflito, a reserva concorrente que "chega primeiro"), nunca para decidir o resultado.

## Como rodar no seu computador

Pré-requisitos: Docker, Node 22.12 ou mais novo. Os valores abaixo são **à sua escolha**; nada disso vai para o repositório.

```bash
export E2E_DB_NAME=e2e E2E_DB_USER=e2e
export E2E_DB_PASSWORD=<valor-local> E2E_ADMIN_SENHA=<valor-local>
export E2E_SOLICITANTE_SENHA=<valor-local> E2E_RESPONSAVEL_SENHA=<valor-local>
export E2E_ADMIN_EMAIL=admin.e2e@exemplo.test

docker compose -f compose.e2e.yaml up --build -d      # PostgreSQL, API (8080) e front (4173)
cd frontend
npm ci --ignore-scripts
npx playwright install chromium
npm run e2e                                          # relatório em frontend/playwright-report
cd .. && docker compose -f compose.e2e.yaml down -v   # derruba e apaga o banco
```

Se a API demorar a subir, espere `http://localhost:8080/actuator/health` responder 200 antes do `npm run e2e`.

**O banco é descartável e a suíte não é repetível no mesmo banco.** Cada teste ocupa uma sala num dia próprio (semanas distantes); numa segunda rodada sem `down -v` a sala já está ocupada e o primeiro teste falha. Isso também mostra que os testes podem falhar de verdade. Sempre derrube com `-v` entre as rodadas. Os testes rodam em série (um trabalhador) por compartilharem esse banco.

## Na CI

O job `e2e` gera as credenciais fictícias na hora (`openssl rand`, mascaradas no log), sobe o compose, espera a API, instala o Chromium e roda `npm run e2e`. O **relatório HTML e os traces** (de todos os testes, passando ou falhando) e os **logs dos serviços** sobem como artifacts com `if: always()` (`relatorio-e2e` e `logs-e2e`, sete dias). Para ver um trace: baixe o artifact e rode `npx playwright show-trace <arquivo>.zip`, ou abra `playwright-report/index.html`.

## O `e2e` é check obrigatório na `main`

Desde **22/10/2026** (F6-21, [decisoes-equipe.md](../../decisoes-equipe.md)) a proteção da `main` exige `test`, `frontend` e `e2e`, depois de três execuções verdes seguidas em pull requests reais: #54 `39880389131`, #55 `39881122909` e #56 `39881853920` (e antes #52 `39872935422` e #53). O resto da proteção não mudou: pull request obrigatório, 0 aprovações, valendo para administrador, `strict` (branch atualizada), sem force push e sem exclusão da branch.

Como foi aplicado (e como reaplicar, só com autorização do responsável pelo repositório): leia a proteção com `gh api repos/<dono>/<repositório>/branches/main/protection`, acrescente o contexto com `POST repos/<dono>/<repositório>/branches/main/protection/required_status_checks/contexts` (corpo `["e2e"]`, que só altera os contextos) e leia de novo para conferir que só `required_status_checks.contexts` e `.checks` mudaram. Pela interface: **Settings → Branches**, regra da `main`, **Require status checks to pass before merging**, adicione `e2e` e mantenha **Require branches to be up to date before merging**.

## Limites conhecidos

- Só Chromium. Outros navegadores não foram exercidos.
- Os cinco fluxos cobrem as jornadas do plano, não todas as telas: a verificação tela a tela (axe, teclado, 360 e 1280 px, nos dois temas) está no [roteiro de navegador real](../roteiro-navegador-real/README.md).
- O teste de conflito monta a reserva concorrente pela API entre o preenchimento e o envio, porque a tela só oferece recursos livres no período; é assim que o servidor recusa na vida real quando duas pessoas disputam o mesmo horário.
