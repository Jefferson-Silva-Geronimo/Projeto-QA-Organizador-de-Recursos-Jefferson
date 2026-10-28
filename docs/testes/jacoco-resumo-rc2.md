# Resumo do JaCoCo no commit da tag `v1.0.0-rc2`

Extração do relatório do JaCoCo do run da CI no commit da tag, feita para que os totais de cobertura continuem comprovados depois que o artefato expirar. Fonte das metas: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Metas mensuráveis" (80% de linhas e 70% de branches). Regra do projeto: o gate do `pom.xml` vale para o conjunto (`BUNDLE`), não por pacote.

## 1. Origem da extração

| Item | Valor |
| --- | --- |
| Run da CI | [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577) (push na `main`), jobs `test`, `frontend`, `e2e` e `segredos` verdes |
| Commit | `d2b6af1` (tag `v1.0.0-rc2`) |
| Artefato | `relatorio-jacoco`; o GitHub o retém por 30 dias e ele **expira em 25/11/2026** |
| Como foi extraído | `gh run download 40373624577 -n relatorio-jacoco`, para um diretório temporário fora do repositório (apagado depois); os totais abaixo são os contadores do nível do relatório (elemento `report`, depois do último `package`) do `jacoco.xml`, e a coluna "Classes" é o contador `CLASS` de cada pacote |
| Data da extração | 28/10/2026 |
| SHA-256 do `jacoco.xml` | `3a829f30659a418c23d30365558552dbbcaf96278d14b27d3146dcd5c0b67b0d` |
| Início da sessão de execução registrada no XML | 26/10/2026 às 17:59 UTC |

## 2. Totais

| Contador | Cobertos | Total | Cobertura |
| --- | --- | --- | --- |
| Linhas | 1751 | 1805 | 97,01% |
| Branches | 523 | 602 | 86,88% |
| Instruções | 10390 | 10618 | 97,85% |
| Métodos | 455 | 464 | 98,06% |
| Classes | 125 | 127 | 98,43% |

Metas: linhas 80% (resultado **97,01%**, atingida) e branches 70% (resultado **86,88%**, atingida). Os totais de linhas e de branches são os mesmos de [leitura-final-cobertura.md](leitura-final-cobertura.md), seções 2 e 7. O log do job `test` do run registra "All coverage checks have been met".

## 3. Cobertura por pacote

| Pacote | Classes | Linhas | Branches | Instruções | Métodos |
| --- | --- | --- | --- | --- | --- |
| `br.senac.recursos` | 1 | 33,33% (1 de 3) | sem | 37,50% (3 de 8) | 50,00% (1 de 2) |
| `br.senac.recursos.config` | 12 | 87,26% (137 de 157) | 63,04% (29 de 46) | 92,51% (827 de 894) | 83,78% (31 de 37) |
| `br.senac.recursos.controller` | 10 | 97,06% (132 de 136) | 80,56% (29 de 36) | 97,81% (848 de 867) | 98,44% (63 de 64) |
| `br.senac.recursos.dto` | 26 | 100,00% (52 de 52) | 100,00% (4 de 4) | 100,00% (738 de 738) | 100,00% (37 de 37) |
| `br.senac.recursos.exception` | 3 | 100,00% (58 de 58) | sem | 100,00% (361 de 361) | 100,00% (10 de 10) |
| `br.senac.recursos.integration` | 1 | 100,00% (38 de 38) | 62,50% (10 de 16) | 97,81% (179 de 183) | 100,00% (7 de 7) |
| `br.senac.recursos.model` | 33 | 100,00% (67 de 67) | 100,00% (14 de 14) | 100,00% (804 de 804) | 100,00% (40 de 40) |
| `br.senac.recursos.model.regra` | 13 | 100,00% (129 de 129) | 98,25% (112 de 114) | 100,00% (659 de 659) | 100,00% (30 de 30) |
| `br.senac.recursos.repository` | 12 | 98,91% (452 de 457) | 91,67% (66 de 72) | 99,15% (2100 de 2118) | 100,00% (105 de 105) |
| `br.senac.recursos.security` | 2 | 100,00% (65 de 65) | 83,33% (5 de 6) | 100,00% (420 de 420) | 100,00% (17 de 17) |
| `br.senac.recursos.service` | 14 | 96,42% (620 de 643) | 86,39% (254 de 294) | 96,78% (3451 de 3566) | 99,13% (114 de 115) |

Os pacotes com menor cobertura de branches são `br.senac.recursos.integration` (10 de 16) e `br.senac.recursos.config` (29 de 46); a meta não vale por pacote. O front end (TypeScript) não entra no JaCoCo nem no SonarCloud (limitação declarada em [limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md)).

## 4. Nota sobre o SonarCloud: por que a cobertura exibida é 94,5%

Leitura pela API pública do SonarCloud (consultas de leitura, sem alteração), projeto `Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson`, branch `main`, análise de 26/10/2026 às 18:04 UTC (`revision` `d2b6af1`) conferida pelo histórico de medidas; a análise mais recente (`9d7f327`, 26/10/2026 às 19:40 UTC, depois só de documentação) mostra os mesmos valores.

| Medida do SonarCloud | Valor |
| --- | --- |
| `coverage` (cobertura geral exibida) | **94,5%** |
| `line_coverage` | 97,0% |
| `branch_coverage` | 86,9% |
| `lines_to_cover` / `uncovered_lines` | 1805 / 54 |
| `conditions_to_cover` / `uncovered_conditions` | 602 / 79 |

A cobertura geral do SonarCloud **combina linhas e condições (branches)** numa só razão: (linhas cobertas + condições cobertas) / (linhas a cobrir + condições a cobrir) = (1751 + 523) / (1805 + 602) = 2274 / 2407 = 94,47%, que o painel arredonda para 94,5%. O JaCoCo mantém as duas medidas **separadas** (97,01% de linhas, 1751 de 1805; 86,88% de branches, 523 de 602) e o gate do projeto usa cada uma com a sua meta (80% e 70%). Por isso 94,5% e 97,01% / 86,88% descrevem o mesmo código, sem divergência.
