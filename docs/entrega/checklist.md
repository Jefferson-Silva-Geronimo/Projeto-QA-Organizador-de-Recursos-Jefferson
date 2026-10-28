# Checklist de entrega (avaliador externo)

Conferência feita como **avaliador externo** em dois momentos: em 26/10/2026 sobre a `main` no commit `5253908`, antes de qualquer `v1.0.0-rc2`, e, depois da tag, em 26/10/2026 **no commit da tag `v1.0.0-rc2` (`d2b6af1`)**, que era o commit avaliado na ocasião (a tag avaliada passou a ser a `v1.0.0-rc3`, de código idêntico; ver F7-24 em [decisoes-equipe.md](../decisoes-equipe.md)). Os documentos que registram esta conferência entram depois da tag e só mudam documentação. Fonte dos entregáveis: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Entregáveis".

## 1. Como foi conferido

Clone novo do repositório público numa pasta temporária fora do projeto, `git checkout --detach v1.0.0-rc2`, **seguindo apenas o README**, sem reaproveitar `.env`, `target/` nem contêineres do trabalho (`.env` gerado na hora com valores fictícios; o `CLASSPATH` da máquina foi limpo para o percurso). Os tempos são acumulados desde o início do script de conferência, num único computador (notebook Intel Core i5-7200U, Windows 11, Docker Desktop). O detalhe passo a passo está em [limitadores-de-nota.md](../testes/limitadores-de-nota.md), seção 2.6.

| Passo | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone no commit `d2b6af1` e `.env` (README, "Como subir", passo 1) | Feito; sobraram só `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY`, declaradas opcionais no README | 13 s |
| `docker compose up -d postgres` e banco saudável (passo 2) | Feito; banco `healthy` | 40 s |
| `./mvnw spring-boot:run` e `GET /actuator/health` (passos 3 e 4) | HTTP 200, `{"status":"UP"}`; `Started ... in 21.199 seconds` | 150 s |
| Login do Administrador do bootstrap e `GET /api/auth/eu` (passo 5) | Login com token; HTTP 200 com perfil `ADMINISTRADOR` | 152 s |
| Front end: `npm ci`, `npm run dev`, `GET http://localhost:5173/` (passo 6) | `npm ci` saiu com 0; HTTP 200; preflight de CORS devolve a origem | 366 s |
| `./mvnw -B verify` (README, "Como testar") | **Passou:** 231 testes de unidade e arquitetura e 434 de integração e BDD, 0 falhas, "All coverage checks have been met", `BUILD SUCCESS` | **539 s** |

**Nenhum passo do README faltou.** A **primeira tentativa falhou por ambiente** antes de chegar à aplicação: o Git Bash não achou `docker-credential-desktop` no `PATH` e o `docker compose up` terminou com saída 1; depois de um `docker pull` da imagem fixada pelo PowerShell, a segunda tentativa passou sem alterar nenhum arquivo do repositório (mesma falha de ambiente das tentativas 1 a 3 da `v1.0.0-rc1`). Na conferência anterior, no commit `5253908`, o `verify` passou na primeira tentativa (773 s).

**Limites:** uma só máquina; a imagem do PostgreSQL já estava baixada; outros computadores e sistemas operacionais não foram provados.

## 2. Entregáveis da especificação

| # | Item | Existe | Atualizado | Caminho | Observação |
| --- | --- | --- | --- | --- | --- |
| 1 | Repositório com histórico de trabalho e revisão por pares | Sim | Sim | Repositório público; `git log` (510 commits no commit da tag); 68 pull requests mesclados | **Parcial:** há histórico e revisão **assistida** registrada; "revisão por pares" com equipe de uma pessoa é limitação declarada (F7-16, item 14) |
| 2 | Aplicação executável e instruções de instalação | Sim | Sim | [README.md](../../README.md), "Como subir" | Subiu em clone limpo no commit da tag (tabela da seção 1) |
| 3 | `README.md` e documentação dos fluxos ou da API | Sim | Sim | [README.md](../../README.md); [openapi.json](../api/openapi.json); [fluxos-sequencia.md](../prd/fluxos-sequencia.md); [navegacao-telas.md](../prd/navegacao-telas.md) | README com Fase 7 concluída, tag e números do commit da tag |
| 4 | `RTM.md` ligando requisito, risco, teste e evidência | Sim | Sim | [RTM.md](../../RTM.md); [rtm.md](../rtm.md); [auditoria-rtm.md](../testes/auditoria-rtm.md) | 55 linhas; execuções E-24 e E-25 |
| 5 | Diagramas de contexto, componentes e sequências críticas | Sim | Sim | [arquitetura.md](../arquitetura.md), seções 10.1 (contexto), 10.2 (contêineres) e 10.3 (componentes); [fluxos-sequencia.md](../prd/fluxos-sequencia.md) (14 diagramas) | A renderização dos diagramas Mermaid não foi refeita na fase de fechamento (limitação declarada) |
| 6 | Plano, suíte automatizada e relatório de testes | Sim | Sim | [plano-de-teste.md](../plano-de-teste.md); [plano-tdd.md](../testes/plano-tdd.md); `src/test` e `frontend`; [casos-de-teste.md](../testes/casos-de-teste.md); [execucao-e25.md](../testes/execucao-e25.md); [relatorio-qualidade.md](../relatorio-qualidade.md) | Sem `TODO` no plano de teste |
| 7 | Pipeline de integração contínua | Sim | Sim | [ci.yml](../../.github/workflows/ci.yml) | Jobs `test`, `frontend`, `e2e` e `segredos`; proteção da `main` com os quatro; CI verde no commit da tag (run `40373624577`) |
| 8 | Relatórios de SonarCloud e cobertura (JaCoCo) | Sim | Sim | [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md), seção 7; painel do SonarCloud; artefato `relatorio-jacoco` da CI | Quality Gate OK no commit da tag; artefato com retenção de 30 dias (expira em 25/11/2026) e resumo versionado |
| 9 | Plano e resultado do teste de carga | Sim | Sim | [rnf.md](../performance/rnf.md); [resultado-01.md](../performance/resultado-01.md); [resultado-02.md](../performance/resultado-02.md); `perf/` (JMeter) | **RNF-08b não atendido**, declarado |
| 10 | Registro de defeitos encontrados, priorizados e corrigidos | Sim | Sim | [defeitos/README.md](../defeitos/README.md); [analise-causa-raiz.md](../defeitos/analise-causa-raiz.md) | 27 defeitos: 26 fechados e 1 mitigado (BUG-017, não será corrigido, risco aceito) |
| 11 | Relatório final de qualidade | Sim | Sim | [relatorio-qualidade.md](../relatorio-qualidade.md); [decisao-qualidade.md](../decisao-qualidade.md) | Decisão **liberar com ressalvas**; declaração de autoria com o nome completo do autor |
| 12 | Apresentação e demonstração do sistema | Não (fora do repositório) | n/a | n/a | Feita pelo autor, fora do repositório; nada no repositório a substitui |

## 3. Arquivos e regras da Aula 14

| Item | Existe | Atualizado | Caminho | Observação |
| --- | --- | --- | --- | --- |
| `docs/entrega/checklist.md` | Sim | Sim | Este arquivo | Atualizado no commit da tag |
| `CHANGELOG.md` | Sim | Sim | [CHANGELOG.md](../../CHANGELOG.md) | `1.0.0-rc3` e `1.0.0-rc2`, com data e tag |
| `docs/evidencias/README.md` (índice do pacote) | Sim | Sim | [evidencias/README.md](../evidencias/README.md) | Run da CI no commit da tag, Quality Gate, JaCoCo e clone limpo |
| `docs/rtm.md` | Sim | Sim | [rtm.md](../rtm.md) | Uma linha que aponta para a RTM da raiz, sem duplicar |
| `docs/decisao-qualidade.md` | Sim | Sim | [decisao-qualidade.md](../decisao-qualidade.md) | Declaração de autoria com o nome completo |
| Tag anotada no commit avaliado | Sim | Sim | `v1.0.0-rc3` (avaliada) e `v1.0.0-rc2` em `d2b6af1` (histórico) | A `v1.0.0-rc1` (`276224b`) permanece como histórico; nenhuma tag foi movida |
| CI verde no commit da tag | Sim | Sim | Run `40373624577` | `test`, `frontend`, `e2e` e `segredos` verdes |
| Repositório público | Sim | Sim | Visibilidade `PUBLIC` lida pela API do GitHub | |
| Nenhum token ou dado pessoal real | Sim | Sim | Job `segredos` verde; `.env` fora do Git | Conferência por varredura da CI, não por leitura de todo o histórico |
| Toda evidência aponta para o commit da tag | Sim | Sim | [evidencias/README.md](../evidencias/README.md) | Os documentos de evidência entram depois da tag e só mudam documentação; o commit avaliado é o da tag `v1.0.0-rc3`; até a E-26, os números são os da E-25 (rc2, mesmo código) |
| Envio do formulário do Hub | n/a | n/a | n/a | **Ação do autor**; não foi enviado |

## 4. Bloqueadores

| # | Bloqueador (lido em 24/10/2026) | Estado no commit da tag |
| --- | --- | --- |
| 1 | `./mvnw -B verify` falhava em computador lento | **Resolvido** (PR 93); passou no commit da tag em 539 s e na conferência anterior em 773 s |
| 2 | O relatório do JaCoCo da CI expirava em 7 dias | **Resolvido**: `retention-days: 30`, expira em 25/11/2026; resumo versionado em [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) |
| 3 | Faltavam `CHANGELOG.md`, `docs/evidencias/README.md`, `docs/rtm.md` e `docs/decisao-qualidade.md` | **Resolvido** |
| 4 | As evidências não apontavam para o commit da tag | **Resolvido** com a tag `v1.0.0-rc2` |
| 5 | `plano-de-teste.md` com 4 `TODO` | **Resolvido** |
| 6 | README e `relatorio-qualidade.md` desatualizados | **Resolvido** |
| 7 | README mandava preencher variáveis `SONAR_*` que são só do SonarCloud | **Resolvido** |

**Sem bloqueador aberto.** Resta fora do repositório, por ser do autor: o envio do formulário do Hub, a apresentação e o treino da prova oral.
