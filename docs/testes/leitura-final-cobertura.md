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

## 7. Leitura no commit da tag `v1.0.0-rc2` (26/10/2026)

Leitura repetida **no commit da tag**, sem assumir os números das seções 1 a 6 (que são de 24/10/2026, commit `608cdbc`).

| Item | Valor |
| --- | --- |
| Commit lido | `d2b6af1` (tag `v1.0.0-rc2`) |
| Run da CI | [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577) (push na `main`), jobs `test`, `frontend`, `e2e` e `segredos` com sucesso |
| Testes | Back end **665** (231 de unidade e arquitetura e 434 de integração e BDD), front **910** em 56 arquivos, E2E **5 de 5**, 0 falhas ([execucao-e25.md](execucao-e25.md)) |
| JaCoCo, linhas | **97,01%** (1751 de 1805), meta de 80% atingida |
| JaCoCo, branches | **86,88%** (523 de 602), meta de 70% atingida |
| Origem | Artefato `relatorio-jacoco` do run, `jacoco.csv` (soma de `LINE_*` e `BRANCH_*` das classes); o log do job `test` diz "All coverage checks have been met"; o artefato expira em 25/11/2026 |
| SonarCloud | API pública, branch `main`, análise de 2026-10-26 às 18:04 UTC com `revision` `d2b6af1`: Quality Gate **OK**, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 0 issues abertas; a cobertura que o SonarCloud calcula (94,5%) é a do Java e difere da do JaCoCo por critério |
| Dependabot | Todos os alertas abertos em `.aiox-core/` e 0 fora; o número está em [alertas-dependabot.md](alertas-dependabot.md) |

A lacuna da seção 6 continua: o front não tem cobertura medida e o SonarCloud não analisa o TypeScript.

Os totais do JaCoCo (linhas, branches, instruções, métodos e classes), a cobertura por pacote, o SHA-256 do `jacoco.xml` e a explicação da cobertura geral de 94,5% do SonarCloud foram extraídos do artefato antes da expiração e estão em [jacoco-resumo-rc2.md](jacoco-resumo-rc2.md).

## 8. Leitura no commit da tag `v1.0.0-rc3` (28/10/2026)

Leitura repetida no commit da `v1.0.0-rc3`, que tem o mesmo código da `v1.0.0-rc2` (seção 7); nenhum número da seção 7 foi assumido.

| Item | Valor |
| --- | --- |
| Commit lido | `005c7af` (tag `v1.0.0-rc3`) |
| Run da CI | [`40790098761`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40790098761) (push na `main`), jobs `test`, `frontend`, `e2e` e `segredos` com sucesso |
| Testes | Back end **665** (231 + 434), front **910** em 56 arquivos, E2E **5 de 5**, 0 falhas ([execucao-e26.md](execucao-e26.md)) |
| JaCoCo, linhas | **97,01%** (1751 de 1805), meta de 80% atingida |
| JaCoCo, branches | **86,54%** (521 de 602), meta de 70% atingida; na seção 7 eram 86,88% (523 de 602) com o mesmo código |
| Origem | Artefato `relatorio-jacoco` do run, `jacoco.xml`; o log do job `test` diz "All coverage checks have been met"; o artefato expira em 27/11/2026 |
| SonarCloud | API pública, branch `main`, análise de 2026-10-28 às 23:56 UTC com `revision` `005c7af`: Quality Gate **OK**, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 0 issues abertas; `lines_to_cover` 1805 com 54 não cobertas, `conditions_to_cover` 602 com 81 não cobertas, cobertura geral **94,4%** |
| Dependabot | Todos os alertas abertos em `.aiox-core/` e 0 fora ([alertas-dependabot.md](alertas-dependabot.md), seção 9) |

A cobertura geral do SonarCloud segue a conta da [seção 4 de jacoco-resumo-rc2.md](jacoco-resumo-rc2.md): (1751 + 521) / (1805 + 602) = 2272 / 2407 = 94,39%, que o painel arredonda para 94,4%. A diferença para a seção 7 (94,5%) é a dos 2 branches; a causa não foi investigada. A lacuna da seção 6 continua: o front não tem cobertura medida.

