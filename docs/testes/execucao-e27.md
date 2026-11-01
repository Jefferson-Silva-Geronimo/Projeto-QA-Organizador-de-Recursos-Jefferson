# Execução E-27: CI da `main` no commit X (`b5e9bbd`), em 31/10/2026

Execução de referência da `v1.0.0-rc4` para a [RTM](../../RTM.md), com o código que a `v1.0.0-rc5` também tem (F7-31): o commit X é o merge do PR 113 (A), com o código do PR 112 (C, a correção do BUG-028). X não é o commit da tag: a tag fica no commit de merge do PR seguinte (PR B, só documentação), que só difere de X em arquivos `.md` (`git diff --stat b5e9bbd v1.0.0-rc4`); o comando `git rev-list -n 1 v1.0.0-rc4` imprime o commit da tag. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Todo número vem do log do run abaixo, do artefato `relatorio-jacoco` ou da API pública do SonarCloud, lida em 31/10/2026.

| Item | Valor |
| --- | --- |
| Run | [`41238067466`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/41238067466) (push na `main`) |
| Commit | `b5e9bbd` (`b5e9bbd5f68ba01c0dfbb40e16e8a552848348ac`), merge do PR 113 |
| Jobs | `test`, `frontend`, `e2e` e `segredos`: sucesso |
| Tempos dos jobs | `test` 6 min 43 s, `e2e` 2 min 16 s, `frontend` 1 min 30 s, `segredos` 6 s (de `startedAt` a `completedAt` na API do GitHub) |
| `test` (back end) | **670 testes** (231 de unidade e arquitetura no Surefire e 439 de integração e BDD no Failsafe), 0 falhas, 0 erros, 0 ignorados; "All coverage checks have been met" |
| `frontend` | **910 testes** em 56 arquivos, 0 falhas |
| `e2e` | **5 de 5** testes (Playwright, Chromium) |
| JaCoCo (artefato `relatorio-jacoco`) | Linhas **97,84%** (1767 de 1806) e branches **87,21%** (525 de 602) |
| SonarCloud | Análise de 31/10/2026 às 20:21 UTC com `revision` `b5e9bbd`: Quality Gate **OK** (`QUALITY GATE STATUS: PASSED` no log do job `test`), 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots, 0,0% de duplicação, 0 issues abertas; cobertura geral 95,2% (linhas 97,8%, branches 87,2%, 77 condições não cobertas); cobertura do código novo 97,4% |
| Artefatos | `relatorio-jacoco` e `relatorios-de-teste` expiram em 30/11/2026 |

**Diferença em relação à E-26** (run `40790098761`): o código mudou só pela correção do BUG-028 (`AgendamentoConfig`, `AgendadorDeTransicoes` sem a anotação) e pelos 5 testes novos de integração (`AgendamentoDeNotificacoesIT`, `AgendamentoDeSemDecisaoIT`, `AgendamentoDesligadoIT`, CT-168 a CT-170): o total do back end passa de 665 para 670 (os 434 de integração e BDD mais os 5 novos dão 439; os 231 de unidade e arquitetura não mudam). As linhas e os branches sobem em `br.senac.recursos.config` (`AgendamentoConfig` e a execução do agendamento). A variação de branches entre execuções de código idêntico está em [leitura-final-cobertura.md](leitura-final-cobertura.md), seção 9, e o resumo por pacote em [jacoco-resumo.md](jacoco-resumo.md).

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

Total: **231** testes.

## 2. Back end: classes de integração e BDD (Failsafe)

| Classe | Testes | Falhas | Erros | Ignorados |
| --- | --- | --- | --- | --- |
| `AgendamentoDeNotificacoesIT` | 2 | 0 | 0 | 0 |
| `AgendamentoDeSemDecisaoIT` | 2 | 0 | 0 | 0 |
| `AgendamentoDesligadoIT` | 1 | 0 | 0 | 0 |
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

Total: **439** testes.
