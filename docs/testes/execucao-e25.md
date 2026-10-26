# Execução E-25: CI da `main` no commit da tag `v1.0.0-rc2`, em 26/10/2026

Execução de referência do release candidate `v1.0.0-rc2` para a [RTM](../../RTM.md). Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Todo número vem do log do run abaixo. Os documentos que citam esta execução entram **depois** da tag e só mudam documentação: o commit avaliado continua sendo o da tag.

| Item | Valor |
| --- | --- |
| Run | [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577) (push na `main`) |
| Commit | `d2b6af1`, o commit da tag `v1.0.0-rc2` (depois do PR 98) |
| Jobs | `test`, `frontend`, `e2e` e `segredos`: sucesso |
| `test` (back end) | **665 testes** (231 de unidade e arquitetura no Surefire e 434 de integração e BDD no Failsafe), 0 falhas, 0 erros, 0 ignorados; "All coverage checks have been met"; `BUILD SUCCESS` |
| `frontend` | **910 testes** em 56 arquivos, 0 falhas |
| `e2e` | **5 de 5** testes (Playwright, Chromium) |
| JaCoCo (artefato `relatorio-jacoco`) | Linhas **97,01%** (1751 de 1805) e branches **86,88%** (523 de 602) |
| SonarCloud | Análise com `revision` `d2b6af1`: Quality Gate **OK**, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 issues abertas |

**Diferença em relação à E-24** (run `40116523445`, `c9240cd`): mesma contagem de testes e de cobertura. Entre as duas entraram os pull requests 81 a 83, os três bumps do Dependabot no front (`vite` 8.3.5, `@tanstack/react-query` 5.104.5 e `typescript-eslint` 8.72.0), e 91 a 98, de documentação e da correção do `verify` (F7-19, que mudou só o prazo de início do PostgreSQL do teste), sem mudança no número de testes.

## 1. Back end: classes de unidade e arquitetura (Surefire)

| Classe | Testes | Falhas | Erros | Ignorados |
| --- | --- | --- | --- | --- |
| `ArquiteturaTest` | 6 | 0 | 0 | 0 |
| `CorsPropertiesTest` | 5 | 0 | 0 | 0 |
| `EventoAuditoriaTest` | 4 | 0 | 0 | 0 |
| `HorasDeFuncionamentoTest` | 15 | 0 | 0 | 0 |
| `JanelaDeFuncionamentoTest` | 12 | 0 | 0 | 0 |
| `LimiteDeLoginTest` | 13 | 0 | 0 | 0 |
| `MaquinaDeEstadosTest` | 56 | 0 | 0 | 0 |
| `MavenWrapperTest` | 5 | 0 | 0 | 0 |
| `MovimentacoesAtuaisTest` | 9 | 0 | 0 | 0 |
| `PeriodoTest` | 9 | 0 | 0 | 0 |
| `PermissoesDaReservaTest` | 26 | 0 | 0 | 0 |
| `PermissoesDeDecisaoTest` | 17 | 0 | 0 | 0 |
| `PermissoesDeUsoTest` | 20 | 0 | 0 | 0 |
| `PoliticasDeReservaTest` | 29 | 0 | 0 | 0 |
| `ProvedorIsoladoArquiteturaTest` | 1 | 0 | 0 | 0 |
| `ReservaTest` | 1 | 0 | 0 | 0 |
| `TrocaDeProvedorTest` | 3 | 0 | 0 | 0 |

Total: 231 testes, 0 falhas, 0 erros, 0 ignorados.

## 2. Back end: classes de integração e BDD (Failsafe)

| Classe | Testes | Falhas | Erros | Ignorados |
| --- | --- | --- | --- | --- |
| `AprovacaoBloqueioApiIT` | 19 | 0 | 0 | 0 |
| `AtorDoHistoricoApiIT` | 6 | 0 | 0 | 0 |
| `AuditoriaApiIT` | 7 | 0 | 0 | 0 |
| `AuditoriaPapelIT` | 1 | 0 | 0 | 0 |
| `AutenticacaoApiIT` | 10 | 0 | 0 | 0 |
| `AutorizacaoApiIT` | 141 | 0 | 0 | 0 |
| `CabecalhosDeSegurancaApiIT` | 2 | 0 | 0 | 0 |
| `CatalogoApiIT` | 21 | 0 | 0 | 0 |
| `ConcorrenciaApiIT` | 7 | 0 | 0 | 0 |
| `ContextoIT` | 1 | 0 | 0 | 0 |
| `ContratoDeRequisicoesApiIT` | 2 | 0 | 0 | 0 |
| `ContratoObrigatoriosApiIT` | 2 | 0 | 0 | 0 |
| `CorsComOrigemApiIT` | 2 | 0 | 0 | 0 |
| `CorsSemOrigemApiIT` | 2 | 0 | 0 | 0 |
| `CucumberIT` | 15 | 0 | 0 | 0 |
| `DocumentacaoApiIT` | 5 | 0 | 0 | 0 |
| `EsquemaIT` | 6 | 0 | 0 | 0 |
| `FalhaNaTentativaApiIT` | 2 | 0 | 0 | 0 |
| `FilaComSolicitanteApiIT` | 3 | 0 | 0 | 0 |
| `HistoricoDeMovimentacoesApiIT` | 10 | 0 | 0 | 0 |
| `LacunasDeRiscoApiIT` | 14 | 0 | 0 | 0 |
| `LimiteDeLoginApiIT` | 11 | 0 | 0 | 0 |
| `ListagemDeBloqueiosApiIT` | 2 | 0 | 0 | 0 |
| `LogSeguroApiIT` | 2 | 0 | 0 | 0 |
| `NotificacaoApiIT` | 9 | 0 | 0 | 0 |
| `NotificacaoTempoLimiteApiIT` | 1 | 0 | 0 | 0 |
| `PermissoesDaFilaApiIT` | 11 | 0 | 0 | 0 |
| `PermissoesDaReservaApiIT` | 22 | 0 | 0 | 0 |
| `PermissoesDeUsoApiIT` | 19 | 0 | 0 | 0 |
| `PrimeiroAdministradorIT` | 1 | 0 | 0 | 0 |
| `RelatorioApiIT` | 9 | 0 | 0 | 0 |
| `ReservasApiIT` | 34 | 0 | 0 | 0 |
| `TrocaDeProvedorApiIT` | 2 | 0 | 0 | 0 |
| `UsoMaterialApiIT` | 23 | 0 | 0 | 0 |
| `UsuariosApiIT` | 10 | 0 | 0 | 0 |

Total: 434 testes, 0 falhas, 0 erros, 0 ignorados.
