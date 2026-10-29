# Execução E-26: CI da `main` no commit da tag `v1.0.0-rc3`, em 28/10/2026

Execução de referência do release candidate `v1.0.0-rc3` para a [RTM](../../RTM.md). Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Todo número vem do log do run abaixo ou da API pública do SonarCloud, lida em 28/10/2026. Este documento entra **depois** da tag e só muda documentação: o commit avaliado continua sendo o da `v1.0.0-rc3`.

| Item | Valor |
| --- | --- |
| Run | [`40790098761`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40790098761) (push na `main`) |
| Commit | `005c7af` (`005c7afc88c155a3d0d6f0cf64d369f43f882636`), o commit da tag `v1.0.0-rc3` (merge do PR 104) |
| Jobs | `test`, `frontend`, `e2e` e `segredos`: sucesso |
| `test` (back end) | **665 testes** (231 de unidade e arquitetura no Surefire e 434 de integração e BDD no Failsafe), 0 falhas, 0 erros, 0 ignorados; "All coverage checks have been met"; `BUILD SUCCESS` (5 min 51 s no Maven) |
| `frontend` | **910 testes** em 56 arquivos, 0 falhas |
| `e2e` | **5 de 5** testes (Playwright, Chromium) |
| JaCoCo (artefato `relatorio-jacoco`) | Linhas **97,01%** (1751 de 1805) e branches **86,54%** (521 de 602) |
| SonarCloud | Análise de 28/10/2026 às 23:56 UTC com `revision` `005c7af`: Quality Gate **OK** (`QUALITY GATE STATUS: PASSED` no log do job `test`), 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 0 issues abertas; cobertura geral 94,4% |
| Artefatos | `relatorio-jacoco` e `relatorios-de-teste` expiram em 27/11/2026 |

**Diferença em relação à E-25** (run `40373624577`, `d2b6af1`, a `v1.0.0-rc2`): a contagem de testes é a mesma em todos os níveis e a contagem por classe (seções 1 e 2) é idêntica à da E-25. O código, os testes e a configuração são os mesmos (`git diff v1.0.0-rc2 v1.0.0-rc3` só lista arquivos `.md` e `docs/prd/modelo-dados.dbml`). Houve **uma diferença de medida**: os branches cobertos do JaCoCo passaram de 523 para **521** de 602 (86,88% para 86,54%), todos no pacote `br.senac.recursos.repository` (64 de 72 contra 66 de 72); as linhas (1751 de 1805) não mudaram. Também a cobertura geral do SonarCloud passou de 94,5% para 94,4%, que é a mesma conta com 521 no lugar de 523: (1751 + 521) / (1805 + 602) = 94,39%. **A causa não foi investigada** (lacuna): o código é idêntico, então a variação vem da execução, não de uma mudança do produto. Os dois valores atendem a meta de 70%. Os totais completos e a cobertura por pacote estão em [jacoco-resumo-rc2.md](jacoco-resumo-rc2.md), seção 5.

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
