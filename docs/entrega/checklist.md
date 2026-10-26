# Checklist de entrega (avaliador externo)

Conferência feita em 26/10/2026 como **avaliador externo**, sobre a `main` no commit `5253908` (merge do PR 95), depois da tag `v1.0.0-rc1` (`276224b`) e antes de qualquer `v1.0.0-rc2`. Fonte dos entregáveis: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Entregáveis". **O checklist não corrige nada:** os bloqueadores corrigíveis foram tratados no pull request que o traz, e a coluna "Tratado" da seção 4 diz como.

## 1. Como foi conferido

Clone novo do repositório público numa pasta temporária fora do projeto, no commit `5253908`, **seguindo apenas o README**, sem reaproveitar o `.env`, o `target/` nem os contêineres do trabalho (`.env` gerado na hora com valores fictícios; o `CLASSPATH` da máquina foi limpo para o percurso). Os tempos são acumulados desde o início do script de conferência, medidos pelo próprio script, num único computador (notebook Intel Core i5-7200U, Windows 11, Docker Desktop), sem outro trabalho pesado rodando na etapa do `verify`.

| Passo | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone e `.env` (README, "Como subir", passo 1) | Feito; sobraram 2 variáveis vazias, `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY`, que a análise do SonarCloud usa e que o README não listava como opcionais | 26 s |
| `docker compose up -d postgres` e banco saudável (passo 2) | Feito; banco `healthy` | 61 s |
| `./mvnw spring-boot:run` e `GET /actuator/health` (passos 3 e 4) | HTTP 200, `{"status":"UP"}`; `Started OrganizacaoRecursosApplication in 11.167 seconds` | 119 s |
| `POST /api/auth/login` com o Administrador do bootstrap e `GET /api/auth/eu` (passo 5) | Login com token; HTTP 200 com perfil `ADMINISTRADOR` | 121 s |
| Front end: `npm ci`, `npm run dev`, `GET http://localhost:5173/` (passo 6) | `npm ci` saiu com 0; HTTP 200; preflight de CORS devolve `Access-Control-Allow-Origin: http://localhost:5173` | 405 s (`npm ci` em cerca de 277 s) |
| Aplicação e banco encerrados (requisito 3 de "Requisitos para rodar o `verify`") | Feito | 417 s |
| `./mvnw -B verify` (README, "Como testar"), **tentativa 1** | **Passou:** 231 testes de unidade e arquitetura e 434 de integração e BDD, 0 falhas, "All coverage checks have been met", `BUILD SUCCESS` | **773 s** (de 417 s a 1190 s) |

**Nenhum passo do README faltou nem falhou.** O `verify`, que no checklist de 24/10/2026 falhou 2 de 3 vezes por causa do prazo de 60 s do PostgreSQL do Testcontainers, passou na primeira tentativa depois da correção da F7-19.

**Limites:** uma só máquina e uma só conferência; a imagem do PostgreSQL já estava baixada; o Docker Desktop foi religado antes (estava fechado). Outros computadores e sistemas operacionais não foram provados.

## 2. Entregáveis da especificação

| # | Item | Existe | Atualizado | Caminho | Observação |
| --- | --- | --- | --- | --- | --- |
| 1 | Repositório com histórico de trabalho e revisão por pares | Sim | Sim | Repositório público; `git log` (497 commits na `main`); 62 pull requests mesclados | **Parcial:** há histórico e revisão **assistida** registrada; "revisão por pares" com equipe de uma pessoa é limitação declarada (F7-16, item 14) |
| 2 | Aplicação executável e instruções de instalação | Sim | Sim | [README.md](../../README.md), "Como subir" | Subiu em clone limpo (tabela da seção 1) |
| 3 | `README.md` e documentação dos fluxos ou da API | Sim | Sim | [README.md](../../README.md); [openapi.json](../api/openapi.json); [fluxos-sequencia.md](../prd/fluxos-sequencia.md); [navegacao-telas.md](../prd/navegacao-telas.md) | README com fase, estrutura e pacote de evidências atualizados neste pull request |
| 4 | `RTM.md` ligando requisito, risco, teste e evidência | Sim | Sim | [RTM.md](../../RTM.md); [rtm.md](../rtm.md); [auditoria-rtm.md](../testes/auditoria-rtm.md) | 55 linhas; auditada e corrigida na Fase 7 |
| 5 | Diagramas de contexto, componentes e sequências críticas | Sim | Sim | [arquitetura.md](../arquitetura.md), seções 10.1 (contexto), 10.2 (contêineres) e 10.3 (componentes); [fluxos-sequencia.md](../prd/fluxos-sequencia.md) (14 diagramas) | Os diagramas Mermaid não tiveram a renderização refeita na fase de fechamento (limitação declarada) |
| 6 | Plano, suíte automatizada e relatório de testes | Sim | Sim | [plano-de-teste.md](../plano-de-teste.md); [plano-tdd.md](../testes/plano-tdd.md); `src/test` e `frontend`; [casos-de-teste.md](../testes/casos-de-teste.md); [execucao-e24.md](../testes/execucao-e24.md); [relatorio-qualidade.md](../relatorio-qualidade.md) | Os 4 `TODO` do plano de teste foram resolvidos neste pull request |
| 7 | Pipeline de integração contínua | Sim | Sim | [ci.yml](../../.github/workflows/ci.yml) | Jobs `test`, `frontend`, `e2e` e `segredos`; proteção da `main` com os quatro; CI verde no commit da tag |
| 8 | Relatórios de SonarCloud e cobertura (JaCoCo) | Sim | Sim | [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md); painel do SonarCloud; artefato `relatorio-jacoco` da CI | Artefatos da CI com retenção de 30 dias a partir deste pull request; antes expiravam em 7 dias |
| 9 | Plano e resultado do teste de carga | Sim | Sim | [rnf.md](../performance/rnf.md); [resultado-01.md](../performance/resultado-01.md); [resultado-02.md](../performance/resultado-02.md); `perf/` (JMeter) | **RNF-08b não atendido**, declarado |
| 10 | Registro de defeitos encontrados, priorizados e corrigidos | Sim | Sim | [defeitos/README.md](../defeitos/README.md); [analise-causa-raiz.md](../defeitos/analise-causa-raiz.md) | 27 defeitos: 26 fechados e 1 mitigado (BUG-017) |
| 11 | Relatório final de qualidade | Sim | Sim | [relatorio-qualidade.md](../relatorio-qualidade.md); [decisao-qualidade.md](../decisao-qualidade.md) | Decisão **liberar com ressalvas** em arquivo próprio; a declaração de autoria traz o nome completo do autor |
| 12 | Apresentação e demonstração do sistema | Não (fora do repositório) | n/a | n/a | Feita pelo autor, fora do repositório; nada no repositório a substitui |

## 3. Arquivos e regras da Aula 14

| Item | Existe | Atualizado | Caminho | Observação |
| --- | --- | --- | --- | --- |
| `docs/entrega/checklist.md` | Sim | Sim | Este arquivo | |
| `CHANGELOG.md` | Sim | Sim | [CHANGELOG.md](../../CHANGELOG.md) | O que entra na `v1.0.0-rc2`; criado neste pull request |
| `docs/evidencias/README.md` (índice do pacote) | Sim | Sim | [evidencias/README.md](../evidencias/README.md) | Cita a tag pelo nome; links conferidos pelo `analyze-docs` |
| `docs/rtm.md` | Sim | Sim | [rtm.md](../rtm.md) | Uma linha que aponta para a RTM da raiz, sem duplicar |
| `docs/decisao-qualidade.md` | Sim | Sim | [decisao-qualidade.md](../decisao-qualidade.md) | Declaração de autoria com o nome completo do autor |
| Tag anotada no commit avaliado | Sim (`v1.0.0-rc1`); `v1.0.0-rc2` **não existe** | n/a | `v1.0.0-rc1` em `276224b` | A tag usada não se move; correção depois dela é `v1.0.0-rc2`, só com autorização expressa |
| CI verde no commit da tag | Sim | Sim | Run `40128131459` (commit `276224b`) | |
| Repositório público | Sim | Sim | Visibilidade `PUBLIC` lida pela API do GitHub | |
| Nenhum token ou dado pessoal real | Sim | Sim | Job `segredos` verde; `.env` fora do Git | Conferência por varredura da CI, não por leitura de todo o histórico |
| Toda evidência aponta para o commit da tag | Parcial | n/a | [evidencias/README.md](../evidencias/README.md) | O índice cita a tag pelo nome (o arquivo está dentro do commit da tag e não pode conter o run dele); a prova da `v1.0.0-rc2` só existe depois da tag |
| Envio do formulário do Hub | n/a | n/a | n/a | **Ação do autor**; não foi enviado |

## 4. Bloqueadores, em ordem

| # | Bloqueador (lido em 24/10/2026) | Tratado |
| --- | --- | --- |
| 1 | `./mvnw -B verify` falhava em computador lento (2 de 3 tentativas) | **Resolvido** no PR 93 (prazo do PostgreSQL de 180 s) e confirmado nesta conferência: passou na primeira tentativa, 773 s |
| 2 | O relatório do JaCoCo da CI expirava em 7 dias | **Tratado neste pull request:** `retention-days: 30` nos quatro artefatos da CI (`relatorios-de-teste`, `relatorio-jacoco`, `relatorio-e2e` e `logs-e2e`); o resumo versionado está em [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) |
| 3 | Faltavam `CHANGELOG.md`, `docs/evidencias/README.md`, `docs/rtm.md` e `docs/decisao-qualidade.md` | **Criados neste pull request** |
| 4 | As evidências não apontavam para o commit da tag | **Parcial:** o índice cita a tag pelo nome; a execução da CI no commit da `v1.0.0-rc2` só existe depois da tag |
| 5 | `plano-de-teste.md` com 4 `TODO` desatualizados | **Resolvidos neste pull request** (Playwright, 5 repetições da concorrência, `relatorio-qualidade.md`, treinamento como lacuna declarada) |
| 6 | README e `relatorio-qualidade.md` desatualizados | **Atualizados** neste pull request e no PR 94 |
| 7 (novo) | O README manda preencher "todas as variáveis que vierem vazias", mas `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY` ficam vazias e são só do SonarCloud | **Corrigido neste pull request:** linha na tabela do README dizendo que podem ficar vazias |

**O que continua aberto e não é deste pull request:** (a) a tag `v1.0.0-rc2`, **só com autorização expressa**; (b) depois dela, refazer o clone limpo no commit da tag, conferir o SonarCloud nesse commit e apontar o índice de evidências para ela; (d) o envio do formulário do Hub e a apresentação, que são do autor.
