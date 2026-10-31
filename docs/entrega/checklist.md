# Checklist de entrega (avaliador externo)

Conferência feita como **avaliador externo** sobre o commit `b5e9bbd` (execução E-27, merge do PR 113), em 31/10/2026, com os valores medidos abaixo. A tag avaliada é a `v1.0.0-rc4` e só difere desse commit em arquivos `.md` (`git diff --stat b5e9bbd v1.0.0-rc4`); o commit da tag se obtém com `git rev-list -n 1 v1.0.0-rc4` e a [Release v1.0.0-rc4](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/releases/tag/v1.0.0-rc4) traz o hash e o run da CI da tag. Ver F7-28 em [decisoes-equipe.md](../decisoes-equipe.md). Fonte dos entregáveis: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Entregáveis".

## 1. Como foi conferido

Clone novo do repositório público numa pasta temporária fora do projeto, `git checkout --detach` no commit `b5e9bbd`, **seguindo apenas o README**, sem reaproveitar `.env`, `target/` nem contêineres do trabalho (`.env` gerado na hora com valores fictícios), projeto Compose exclusivo `rc4`. Os tempos são acumulados desde o início do script de conferência, num único computador (notebook Intel Core i5-7200U, Windows 11, Docker Desktop), que estava mais lento que nas provas anteriores (a inicialização do banco levou mais de 4 minutos). O detalhe está em [limitadores-de-nota.md](../testes/limitadores-de-nota.md), seção 2.9.

| Passo | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone no commit `b5e9bbd` e `.env` (README, "Como subir", passo 1) | Feito | 30 s |
| `docker compose up -d postgres` e banco saudável (passo 2) | Feito | 262 s |
| `./mvnw spring-boot:run` e `GET /actuator/health` (passos 3 e 4) | HTTP 200, `{"status":"UP"}` | 337 s |
| Login do Administrador do bootstrap e `GET /api/auth/eu` (passo 5) | Login com token; HTTP 200 com perfil `ADMINISTRADOR` | 340 s |
| Front end: `npm ci`, `npm run dev`, `GET http://localhost:5173/` (passo 6) | `npm ci` saiu com 0; HTTP 200; preflight de CORS devolve a origem | 867 s |
| `./mvnw -B verify` (README, "Como testar") | **Passou:** 231 testes de unidade e arquitetura e 439 de integração e BDD, 0 falhas, "All coverage checks have been met", `BUILD SUCCESS` | **480 s** (duração do comando) |
| Front: `npm run gerar:api` (schema sem diferença de conteúdo), `lint`, `typecheck`, `test` (910 testes em 56 arquivos) e `build` | Todos com saída 0 | 3 s, 40 s, 13 s, 220 s e 13 s |

**Nenhum passo do README faltou.** O erro de credencial do Docker no Git Bash, visto em 30/10/2026, não se repetiu porque a imagem do PostgreSQL já estava no cache ([limitadores-de-nota.md](../testes/limitadores-de-nota.md), seção 2.8).

**Limites:** uma só máquina; a imagem do PostgreSQL já estava baixada; outros computadores e sistemas operacionais não foram provados.

## 2. Entregáveis da especificação

| # | Item | Existe | Atualizado | Caminho | Observação |
| --- | --- | --- | --- | --- | --- |
| 1 | Repositório com histórico de trabalho e revisão por pares | Sim | Sim | Repositório público; `git log`; 535 commits e 78 pull requests mesclados na `main` no commit `b5e9bbd` (`git rev-list --count` e `gh pr list --state merged`, 31/10/2026) | **Parcial:** há histórico e revisão **assistida** registrada; "revisão por pares" com equipe de uma pessoa é limitação declarada (F7-16, item 14) |
| 2 | Aplicação executável e instruções de instalação | Sim | Sim | [README.md](../../README.md), "Como subir" | Subiu em clone limpo (tabela da seção 1) |
| 3 | `README.md` e documentação dos fluxos ou da API | Sim | Sim | [README.md](../../README.md); [openapi.json](../api/openapi.json); [fluxos-sequencia.md](../prd/fluxos-sequencia.md); [navegacao-telas.md](../prd/navegacao-telas.md) | README com Fase 7 concluída, a tag `v1.0.0-rc4` e os números da execução E-27 |
| 4 | `RTM.md` ligando requisito, risco, teste e evidência | Sim | Sim | [RTM.md](../../RTM.md); [rtm.md](../rtm.md); [auditoria-rtm.md](../testes/auditoria-rtm.md) | 55 linhas; execuções E-24 a E-27 |
| 5 | Diagramas de contexto, componentes e sequências críticas | Sim | Sim | [arquitetura.md](../arquitetura.md), seções 10.1 (contexto), 10.2 (contêineres) e 10.3 (componentes); [fluxos-sequencia.md](../prd/fluxos-sequencia.md) (14 diagramas) | A renderização dos diagramas Mermaid não foi refeita na fase de fechamento (limitação declarada) |
| 6 | Plano, suíte automatizada e relatório de testes | Sim | Sim | [plano-de-teste.md](../plano-de-teste.md); [plano-tdd.md](../testes/plano-tdd.md); `src/test` e `frontend`; [casos-de-teste.md](../testes/casos-de-teste.md); [execucao-e27.md](../testes/execucao-e27.md); [relatorio-qualidade.md](../relatorio-qualidade.md) | Sem `TODO` no plano de teste |
| 7 | Pipeline de integração contínua | Sim | Sim | [ci.yml](../../.github/workflows/ci.yml) | Jobs `test`, `frontend`, `e2e` e `segredos`; proteção da `main` com os quatro; CI verde na execução E-27 (run `41238067466`) |
| 8 | Relatórios de SonarCloud e cobertura (JaCoCo) | Sim | Sim | [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md), seção 9; [jacoco-resumo.md](../testes/jacoco-resumo.md), seção 6; painel do SonarCloud; artefato `relatorio-jacoco` da CI | Quality Gate OK na execução E-27; artefato com retenção de 30 dias (expira em 30/11/2026) e resumo versionado |
| 9 | Plano e resultado do teste de carga | Sim | Sim | [rnf.md](../performance/rnf.md); [resultado-01.md](../performance/resultado-01.md); [resultado-02.md](../performance/resultado-02.md); `perf/` (JMeter) | **RNF-08b não atendido**, declarado |
| 10 | Registro de defeitos encontrados, priorizados e corrigidos | Sim | Sim | [defeitos/README.md](../defeitos/README.md); [analise-causa-raiz.md](../defeitos/analise-causa-raiz.md) | 28 defeitos: 27 fechados e 1 mitigado (BUG-017, não será corrigido, risco aceito); o BUG-028 foi achado e corrigido na própria rc4 |
| 11 | Relatório final de qualidade | Sim | Sim | [relatorio-qualidade.md](../relatorio-qualidade.md); [decisao-qualidade.md](../decisao-qualidade.md) | Decisão **liberar com ressalvas**; declaração de autoria com o nome completo do autor |
| 12 | Apresentação e demonstração do sistema | Não (fora do repositório) | n/a | n/a | Feita pelo autor, fora do repositório; nada no repositório a substitui |

## 3. Arquivos e regras da Aula 14

| Item | Existe | Atualizado | Caminho | Observação |
| --- | --- | --- | --- | --- |
| `docs/entrega/checklist.md` | Sim | Sim | Este arquivo | Atualizado na revisão avaliada |
| `CHANGELOG.md` | Sim | Sim | [CHANGELOG.md](../../CHANGELOG.md) | Seção `1.0.0-rc4` e histórico de versões, com data |
| `docs/evidencias/README.md` (índice do pacote) | Sim | Sim | [evidencias/README.md](../evidencias/README.md) | Run da CI, Quality Gate, JaCoCo e clone limpo |
| `docs/rtm.md` | Sim | Sim | [rtm.md](../rtm.md) | Uma linha que aponta para a RTM da raiz, sem duplicar |
| `docs/decisao-qualidade.md` | Sim | Sim | [decisao-qualidade.md](../decisao-qualidade.md) | Declaração de autoria com o nome completo |
| Tag anotada no commit avaliado | Sim | Sim | `v1.0.0-rc4` (avaliada); `git rev-list -n 1 v1.0.0-rc4` | As tags de versões anteriores permanecem como histórico (CHANGELOG.md); nenhuma tag foi movida |
| CI verde na execução E-27 | Sim | Sim | Run `41238067466` | `test`, `frontend`, `e2e` e `segredos` verdes |
| Repositório público | Sim | Sim | Visibilidade `PUBLIC` lida pela API do GitHub | |
| Nenhum token ou dado pessoal real | Sim | Sim | Job `segredos` verde; `.env` fora do Git | Conferência por varredura da CI, não por leitura de todo o histórico |
| Toda evidência aponta para o código avaliado | Sim | Sim | [evidencias/README.md](../evidencias/README.md) | As execuções E-25 e E-26 são anteriores à correção do BUG-028; os números da revisão avaliada são os da execução E-27 ([execucao-e27.md](../testes/execucao-e27.md)) |
| Envio do formulário do Hub | n/a | n/a | n/a | **Ação do autor**; não foi enviado |

## 4. Bloqueadores

| # | Bloqueador (lido em 24/10/2026) | Estado na revisão avaliada |
| --- | --- | --- |
| 1 | `./mvnw -B verify` falhava em computador lento | **Resolvido** (PR 93); passou na execução E-27 em 480 s no clone limpo (539 s na E-25 e 773 s na conferência anterior) |
| 2 | O relatório do JaCoCo da CI expirava em 7 dias | **Resolvido**: `retention-days: 30`, o artefato da E-27 expira em 30/11/2026; resumo versionado em [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) |
| 3 | Faltavam `CHANGELOG.md`, `docs/evidencias/README.md`, `docs/rtm.md` e `docs/decisao-qualidade.md` | **Resolvido** |
| 4 | As evidências não apontavam para a tag avaliada | **Resolvido** com a `v1.0.0-rc4` |
| 5 | `plano-de-teste.md` com 4 `TODO` | **Resolvido** |
| 6 | README e `relatorio-qualidade.md` desatualizados | **Resolvido** |
| 7 | README mandava preencher variáveis `SONAR_*` que são só do SonarCloud | **Resolvido** |

**Sem bloqueador aberto.** Resta fora do repositório, por ser do autor: o envio do formulário do Hub, a apresentação e o treino da prova oral.
