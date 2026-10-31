# Leitura final de cobertura e análise estática (item 2.4, Fase 7)

Leitura única, feita **no estado final da `main`** depois dos defeitos corrigidos e das decisões do item 2.5 mescladas (ordem decidida na F7-05). Fonte dos requisitos e das metas: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Metas mensuráveis". Cada número cita o run ou a consulta; nenhum vem de execução antiga da RTM.

## 1. O que foi lido

| Item | Valor |
| --- | --- |
| Commit lido | `608cdbc` (`main`, depois do PR 85) |
| Run da CI | [`40120487376`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40120487376) (push na `main`), jobs `test`, `frontend`, `e2e` e `segredos` com sucesso |
| JaCoCo | Artefato `relatorio-jacoco` desse run (`jacoco.xml` e `jacoco.csv`); os totais do XML conferem com a soma das 127 classes do CSV |
| SonarCloud | API pública, projeto `Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson`, branch `main`. A análise lida é a de **2026-10-24 às 18:29 UTC**, com `revision` = `608cdbc`, o mesmo commit do run |
| Consultas | `https://sonarcloud.io/api/qualitygates/project_status`, `https://sonarcloud.io/api/measures/component`, `https://sonarcloud.io/api/issues/search` e `https://sonarcloud.io/api/project_analyses/search`, todas com `branch=main` e sem token |

## 2. Metas contra resultado

| Meta (especificação, seção "Metas mensuráveis") | Resultado | Situação | Origem |
| --- | --- | --- | --- |
| Cobertura de **linhas** de 80% | **97,01%** (1751 de 1805 linhas; 54 não cobertas) | **Atingida** | JaCoCo, run `40120487376` |
| Cobertura de **branches** de 70% | **86,88%** (523 de 602 branches; 79 não cobertos) | **Atingida** | JaCoCo, run `40120487376` |
| Gate do JaCoCo no `verify` | "All coverage checks have been met" | Atingido | Log do job `test`, `jacoco:check` |
| Quality Gate do SonarCloud | **OK** (condições: confiabilidade, segurança e manutenibilidade em A; cobertura do código novo 97,3% contra 80%; duplicação 0,0% contra 3%; hotspots revisados 100%) | **Atingido** | `project_status`; log "QUALITY GATE STATUS: PASSED" |
| **Bugs** críticos: 0 | **0** bugs no total | **Atingida** | `measures/component` |
| **Vulnerabilidades** críticas: 0 | **0** vulnerabilidades no total | **Atingida** | `measures/component` |

Outras medidas do SonarCloud na mesma análise: 0 code smells, 0 security hotspots, 0,0% de linhas duplicadas, notas de confiabilidade, segurança e manutenibilidade A, A e A, 4724 linhas de código, cobertura do SonarCloud de 94,5% (a combinação de linhas e condições que ele mesmo calcula: 2274 de 2407, ou seja, 94,47%).

**Issues abertas no SonarCloud: 0** (CRITICAL 0, BLOCKER 0, MAJOR 0, MINOR 0, INFO 0; bugs 0, vulnerabilidades 0, code smells 0).

## 3. Testes no mesmo run

| Nível | Resultado | Origem |
| --- | --- | --- |
| Back end, unidade e arquitetura (Surefire) | 231 testes, 0 falhas | Log do job `test` |
| Back end, integração e BDD (Failsafe) | 434 testes, 0 falhas | Log do job `test` |
| Front end (Vitest) | **910 testes em 56 arquivos**, 0 falhas | Log do job `frontend` |
| E2E (Playwright, Chromium) | 5 de 5 | Log do job `e2e` |

## 4. Cobertura do JaCoCo por pacote

A meta do projeto vale para o conjunto (`BUNDLE`, regra do `pom.xml`: linhas 0,80 e branches 0,70), não por pacote. A tabela mostra o detalhe.

| Pacote | Linhas | Branches |
| --- | --- | --- |
| `br.senac.recursos` | 33,33% (1 de 3) | sem branches |
| `br.senac.recursos.config` | 87,26% (137 de 157) | 63,04% (29 de 46) |
| `br.senac.recursos.controller` | 97,06% (132 de 136) | 80,56% (29 de 36) |
| `br.senac.recursos.dto` | 100,00% (52 de 52) | 100,00% (4 de 4) |
| `br.senac.recursos.exception` | 100,00% (58 de 58) | sem branches |
| `br.senac.recursos.integration` | 100,00% (38 de 38) | 62,50% (10 de 16) |
| `br.senac.recursos.model` | 100,00% (67 de 67) | 100,00% (14 de 14) |
| `br.senac.recursos.model.regra` | 100,00% (129 de 129) | 98,25% (112 de 114) |
| `br.senac.recursos.repository` | 98,91% (452 de 457) | 91,67% (66 de 72) |
| `br.senac.recursos.security` | 100,00% (65 de 65) | 83,33% (5 de 6) |
| `br.senac.recursos.service` | 96,42% (620 de 643) | 86,39% (254 de 294) |

**Observação:** o pacote `config` tem 63,04% de branches, abaixo de 70%, e o `integration`, 62,50%. Isso não reprova nada, pois a meta e o gate são do conjunto, mas fica dito.

## 5. Revalidações feitas na mesma leitura (24/10/2026)

| Item | Resultado | Origem |
| --- | --- | --- |
| Alertas do Dependabot | Todos em `.aiox-core/` e 0 fora (0 em `frontend/` e 0 no Maven); o número está em [alertas-dependabot.md](alertas-dependabot.md) | `gh api .../dependabot/alerts`; [alertas-dependabot.md](alertas-dependabot.md) |
| Issues abertas no GitHub | 1: a #39, o R-25 (`NotificacaoApiIT.int01ECt103`) | `gh issue list` |
| Pull requests abertos (em 24/10/2026) | 3, do Dependabot (#81, #82 e #83), então adiados (F7-15); mesclados antes da tag, F7-20 | `gh pr list` |

## 6. Lacunas e limites

| Item | Tipo | Detalhe |
| --- | --- | --- |
| Cobertura do front end | **Lacuna** | O front não tem medição de cobertura configurada (o `frontend/package.json` e o `vite.config.ts` não têm `coverage`). Há 910 testes de componente e 5 de E2E, mas **nenhum percentual de cobertura do front**. As metas de 80% e 70% foram lidas só para o Java |
| Análise estática do front | **Limite** | A análise do SonarCloud cobre **Java, XML e YAML** (`java=4329;xml=219;yaml=176`); o TypeScript não entra. No front, a análise estática é o `lint` e o `typecheck` do job `frontend` (verde), que não geram número de issues |
| Cobertura do E2E | Lacuna | Os 5 testes E2E não medem cobertura de código |
| Uma leitura | Limite | Cada número vem de uma única leitura, sem repetição. A cobertura do JaCoCo é determinística para o mesmo código, mas o SonarCloud pode mudar com novas regras |
| Quality Gate | Limite | O Quality Gate do SonarCloud avalia o **código novo** (as condições `new_*`); a cobertura do projeto inteiro é a do JaCoCo e a medida `coverage` do SonarCloud acima |
| Critério de "crítico" | Suposição | "Bugs ou vulnerabilidades críticos" foi lido como **severidade CRITICAL ou BLOCKER**, e todos os totais são 0; como não há issue aberta de nenhuma severidade, a leitura da palavra "crítico" não altera o resultado |
| Mutação | Lacuna | O relatório de mutação da Fase 4 ([mutacao.md](mutacao.md)) não foi repetido nesta leitura |

## 7. Leitura da execução E-25 (26/10/2026)

Leitura repetida **no commit da execução E-25**, sem assumir os números das seções 1 a 6 (que são de 24/10/2026, commit `608cdbc`).

| Item | Valor |
| --- | --- |
| Commit lido | `d2b6af1` (execução E-25) |
| Run da CI | [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577) (push na `main`), jobs `test`, `frontend`, `e2e` e `segredos` com sucesso |
| Testes | Back end **665** (231 de unidade e arquitetura e 434 de integração e BDD), front **910** em 56 arquivos, E2E **5 de 5**, 0 falhas ([execucao-e25.md](execucao-e25.md)) |
| JaCoCo, linhas | **97,01%** (1751 de 1805), meta de 80% atingida |
| JaCoCo, branches | **86,88%** (523 de 602), meta de 70% atingida |
| Origem | Artefato `relatorio-jacoco` do run, `jacoco.csv` (soma de `LINE_*` e `BRANCH_*` das classes); o log do job `test` diz "All coverage checks have been met"; o artefato expira em 25/11/2026 |
| SonarCloud | API pública, branch `main`, análise de 2026-10-26 às 18:04 UTC com `revision` `d2b6af1`: Quality Gate **OK**, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 0 issues abertas; a cobertura que o SonarCloud calcula (94,5%) é a do Java e difere da do JaCoCo por critério |
| Dependabot | Todos os alertas abertos em `.aiox-core/` e 0 fora; o número está em [alertas-dependabot.md](alertas-dependabot.md) |

A lacuna da seção 6 continua: o front não tem cobertura medida e o SonarCloud não analisa o TypeScript.

Os totais do JaCoCo (linhas, branches, instruções, métodos e classes), a cobertura por pacote, o SHA-256 do `jacoco.xml` e a explicação da cobertura geral de 94,5% do SonarCloud foram extraídos do artefato antes da expiração e estão em [jacoco-resumo.md](jacoco-resumo.md).

## 8. Leitura da execução E-26 (28/10/2026)

Leitura repetida no commit da execução E-26, que tem o mesmo código da E-25 (seção 7); nenhum número da seção 7 foi assumido.

| Item | Valor |
| --- | --- |
| Commit lido | `005c7af` (execução E-26) |
| Run da CI | [`40790098761`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40790098761) (push na `main`), jobs `test`, `frontend`, `e2e` e `segredos` com sucesso |
| Testes | Back end **665** (231 + 434), front **910** em 56 arquivos, E2E **5 de 5**, 0 falhas ([execucao-e26.md](execucao-e26.md)) |
| JaCoCo, linhas | **97,01%** (1751 de 1805), meta de 80% atingida |
| JaCoCo, branches | **86,54%** (521 de 602), meta de 70% atingida; na seção 7 eram 86,88% (523 de 602) com o mesmo código |
| Origem | Artefato `relatorio-jacoco` do run, `jacoco.xml`; o log do job `test` diz "All coverage checks have been met"; o artefato expira em 27/11/2026 |
| SonarCloud | API pública, branch `main`, análise de 2026-10-28 às 23:56 UTC com `revision` `005c7af`: Quality Gate **OK**, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 0 issues abertas; `lines_to_cover` 1805 com 54 não cobertas, `conditions_to_cover` 602 com 81 não cobertas, cobertura geral **94,4%** |
| Dependabot | Todos os alertas abertos em `.aiox-core/` e 0 fora ([alertas-dependabot.md](alertas-dependabot.md), seção 9) |

A cobertura geral do SonarCloud segue a conta da [seção 4 de jacoco-resumo.md](jacoco-resumo.md): (1751 + 521) / (1805 + 602) = 2272 / 2407 = 94,39%, que o painel arredonda para 94,4%. A diferença para a seção 7 (94,5%) é a dos 2 branches; a causa está no parágrafo seguinte. A lacuna da seção 6 continua: o front não tem cobertura medida.


**Variação da cobertura de branches entre execuções de código idêntico.** A E-25 ([`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577)) deu 523 de 602 branches (86,88%) e a E-26 ([`40790098761`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40790098761)) deu 521 de 602 (86,54%); as linhas foram 1751 de 1805 nas duas. A diferença está só no pacote `br.senac.recursos.repository` (66 de 72 contra 64 de 72), nas duas lambdas de `JdbcConfiguracaoRepository`, `tentativasReenvio` (linha 39) e `intervaloReenvioInicial` (linha 49), cada uma com o ternário `rs.wasNull() ? null : ...`, que na E-26 teve um dos dois branches sem cobertura. `DespachoDeNotificacoesService.despachar()` chama as duas (linhas 52 e 53). **Causa apurada pela leitura do código e pela ordem das classes nos logs do Failsafe:** os testes de integração compartilham um só PostgreSQL (`BancoRealIT`), e a limpeza entre testes (`limparBanco()`) preserva a tabela `configuracao`. `NotificacaoApiIT` (linha 88) e `NotificacaoTempoLimiteApiIT` (linha 69) gravam `tentativas_reenvio = 3` e o intervalo no `@BeforeEach` e não desfazem; só `TrocaDeProvedorApiIT` (linha 105) chama `despachar()` sobre o repositório real sem esses valores gravados. Ela foi a 6ª das 35 classes de integração na E-25, antes das duas de notificação, e a 30ª na E-26, depois delas (`NotificacaoApiIT` foi a 21ª e a 22ª, e `NotificacaoTempoLimiteApiIT` a 34ª e a 11ª). Depende, portanto, da ordem em que o Failsafe executa as classes, não do produto. **A ausência de temporização e de concorrência vem da leitura do código, não de experimento:** o `AgendadorDeNotificacoes` só liga com `app.jobs.notificacoes.habilitado=true`, que não consta em `application.yml`; os testes não usam `Thread.sleep` e o relógio é controlado (ADR-005). **Inferência, não verificado:** que o lado do ternário sem cobertura na E-26 seja o do valor nulo (o JaCoCo mostra um branch perdido por lambda, não qual), e o que define a ordem das classes entre execuções (o `pom.xml` não fixa `runOrder`). O `verify` do clone limpo local da execução E-26 deu 523 de 602 ([limitadores-de-nota.md](limitadores-de-nota.md), seção 2.7; a ordem dessa execução não foi registrada). A meta de 70% de branches e o gate do `pom.xml` (80% de linhas e 70% de branches) continuam atendidos nas duas execuções, e nenhum teste ou código mudou por causa disso ([limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md), seção 3, e F7-26 em [decisoes-equipe.md](../decisoes-equipe.md)).

## 9. Leitura atual da API do SonarCloud e terceira medida de branches (31/10/2026)

Leitura da API pública do SonarCloud (`project_analyses/search`, `measures/component`, `qualitygates/project_status` e `measures/search_history`, só leitura), branch `main`, projeto `Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson`.

| Item | Valor |
| --- | --- |
| Análise mais recente da `main` | 2026-10-29 às 01:15 UTC, `revision` `b7beb8f` (merge do PR 106, só documentação sobre o código das execuções E-25 e E-26) |
| Quality Gate | **OK**: confiabilidade, segurança e manutenibilidade novas em A; cobertura do código novo 97,3% contra 80%; duplicação 0,0% contra 3%; hotspots revisados 100% |
| Medidas | 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 4724 linhas de código |
| Cobertura geral | **94,3%**; linhas 97,0% (1805 a cobrir, 54 não cobertas); branches 86,2% (602 a cobrir, **83 não cobertos**, ou seja, 519 cobertos) |

**Os 2 branches da variação (F7-26) e uma terceira medida.** O histórico de medidas do SonarCloud para `uncovered_conditions` na `main` é 79 (execução E-25), 81 (execução E-26 e as análises seguintes até 29/10/2026 às 00:48 UTC) e **83** (análise de `b7beb8f`), sempre com 602 condições a cobrir. O artefato `relatorio-jacoco` do run [`40798680789`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40798680789) (push na `main` em `b7beb8f`, verde) confirma: **519 de 602 branches (86,21%)** e 1751 de 1805 linhas, com `jacoco.xml` de SHA-256 `fe527d36c996b7a84cd08f3309fe069dafb68a2f9d7cd6d16b36174ee4c245cb`. Contra o artefato da E-26, a única classe diferente é `ReservaService` (104 de 116 contra 102 de 116), nas linhas 329 e 330 de `ehConflitoDeConcorrencia`: a linha 329 (`SQLSTATE_VIOLACAO_DE_EXCLUSAO.equals(...)`) tinha os dois desfechos cobertos na E-26 e só o verdadeiro em `b7beb8f`, e a linha 330 (`SQLSTATE_IMPASSE.equals(...)`, que só é avaliada quando o primeiro termo é falso) perdeu um branch por consequência. Fato: o código é o mesmo e a meta de 70% segue atendida nas três medidas. Hipótese, não verificada: o branch do impasse (`40P01`) só é exercido nas execuções em que o banco detecta um impasse nos testes de concorrência, o que depende de temporização. A explicação de F7-26 (ordem de execução das classes que alteram a tabela `configuração`, em `JdbcConfiguracaoRepository`) cobre a diferença entre a E-25 e a E-26, mas **não** esta; o intervalo observado de branches cobertos com código idêntico é, portanto, de **4** (523, 521 e 519 de 602), não de 2. Nenhum teste, código ou configuração foi alterado por causa disto; a execução E-27 mede mais uma vez.
