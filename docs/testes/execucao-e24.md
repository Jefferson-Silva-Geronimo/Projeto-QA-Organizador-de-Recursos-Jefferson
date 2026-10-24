# Execução E-24: CI da `main` em 24/10/2026

Execução de referência da Fase 7 para a [RTM](../../RTM.md) (BUG-025). Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Todo número vem do log do run abaixo.

| Item | Valor |
| --- | --- |
| Run | [`40116523445`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40116523445) (push na `main`) |
| Commit | `c9240cd` (depois dos PRs 72 a 78 da Fase 7) |
| Jobs | `test`, `frontend`, `e2e` e `segredos`: sucesso |
| Back end | **665 testes** (231 de unidade e arquitetura no Surefire e 434 de integração e BDD no Failsafe), 0 falhas, 0 erros, 0 ignorados |
| Front end | **910 testes** em 56 arquivos, 0 falhas |
| E2E | **5 de 5** testes (Playwright, Chromium) |

**Por que este run vale para a RTM.** Os PRs de documentação que vêm depois não mudam código nem teste, então o código sob teste é o mesmo deste commit. A diferença em relação à E-23 (659 testes no back end) é de código e teste, todos desta fase: `MavenWrapperTest` (5 testes, F7-06 e F7-14), o teste novo do BUG-026 e a pré-condição do `ct063` (BUG-023, sem teste novo).

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

## 3. Front end: arquivos de teste

56 arquivos, 910 testes, 0 falhas. A ligação de cada CT de front aos arquivos está em [casos-de-teste.md](casos-de-teste.md), seção 4.1.

| Arquivo (em `frontend/`) | Testes |
| --- | --- |
| `src/Rotas.test.tsx` | 55 |
| `src/api/cliente.test.ts` | 8 |
| `src/autenticacao/ProvedorDeSessao.test.tsx` | 11 |
| `src/datas/fuso.test.ts` | 25 |
| `src/erros/mensagens.test.ts` | 74 |
| `src/erros/problema.test.ts` | 6 |
| `src/estilo/contraste.test.ts` | 5 |
| `src/estilo/regras-dos-temas.test.ts` | 4 |
| `src/estilo/tema.test.ts` | 7 |
| `src/estilo/tokens.test.ts` | 66 |
| `src/layout/Navegacao.test.tsx` | 7 |
| `src/layout/SeletorDeTema.test.tsx` | 3 |
| `src/paginas/aprovacoes/PaginaDeAprovacoes.acoes.test.tsx` | 9 |
| `src/paginas/aprovacoes/PaginaDeAprovacoes.decisao.test.tsx` | 39 |
| `src/paginas/aprovacoes/PaginaDeAprovacoes.lista.test.tsx` | 11 |
| `src/paginas/auditoria/PaginaDeAuditoria.administrador.test.tsx` | 12 |
| `src/paginas/auditoria/PaginaDeAuditoria.responsavel.test.tsx` | 18 |
| `src/paginas/bloqueios/PaginaDeBloqueios.criar.test.tsx` | 15 |
| `src/paginas/bloqueios/PaginaDeBloqueios.lista.test.tsx` | 22 |
| `src/paginas/busca/PaginaDeBusca.acoes.test.tsx` | 8 |
| `src/paginas/busca/PaginaDeBusca.estados.test.tsx` | 7 |
| `src/paginas/busca/PaginaDeBusca.filtros.test.tsx` | 12 |
| `src/paginas/busca/PaginaDeBusca.test.tsx` | 7 |
| `src/paginas/catalogo/PaginaDoCatalogo.admin.test.tsx` | 25 |
| `src/paginas/catalogo/PaginaDoCatalogo.cadastro.test.tsx` | 22 |
| `src/paginas/catalogo/PaginaDoCatalogo.lista.test.tsx` | 14 |
| `src/paginas/entrada/PaginaDeEntrada.envio.test.tsx` | 17 |
| `src/paginas/entrada/PaginaDeEntrada.estrutura.test.tsx` | 6 |
| `src/paginas/relatorios/PaginaDeRelatorios.filtros.test.tsx` | 12 |
| `src/paginas/relatorios/PaginaDeRelatorios.resultado.test.tsx` | 16 |
| `src/paginas/reserva/PaginaDeAlteracao.test.tsx` | 33 |
| `src/paginas/reserva/PaginaDeNovaReserva.envio.test.tsx` | 9 |
| `src/paginas/reserva/PaginaDeNovaReserva.erros.test.tsx` | 20 |
| `src/paginas/reserva/PaginaDeNovaReserva.estrutura.test.tsx` | 12 |
| `src/paginas/reservas/PaginaDeReservas.acaoAusente.test.tsx` | 14 |
| `src/paginas/reservas/PaginaDeReservas.cancelamento.test.tsx` | 40 |
| `src/paginas/reservas/PaginaDeReservas.lista.test.tsx` | 22 |
| `src/paginas/reservas/PaginaDeReservas.perfis.test.tsx` | 5 |
| `src/paginas/retiradas/PaginaDeRetiradas.acoes.test.tsx` | 14 |
| `src/paginas/retiradas/PaginaDeRetiradas.lista.test.tsx` | 17 |
| `src/paginas/retiradas/PaginaDeRetiradas.registro.test.tsx` | 34 |
| `src/paginas/usuarios/PaginaDeUsuarios.acoes.test.tsx` | 14 |
| `src/paginas/usuarios/PaginaDeUsuarios.cadastro.test.tsx` | 11 |
| `src/paginas/usuarios/PaginaDeUsuarios.lista.test.tsx` | 10 |
| `src/recursos/formatacao.test.ts` | 15 |
| `src/rotas/RotaProtegida.test.tsx` | 7 |
| `src/rotas/destino.test.ts` | 24 |
| `src/rotas/navegacao.test.ts` | 16 |
| `src/rotas/telas.test.ts` | 6 |
| `src/sessao/armazenamento.test.ts` | 10 |
| `src/sessao/regra-do-token.test.ts` | 2 |
| `src/ui/Aviso.test.tsx` | 11 |
| `src/ui/Botao.test.tsx` | 6 |
| `src/ui/Campo.test.tsx` | 9 |
| `src/ui/Estados.test.tsx` | 4 |
| `src/ui/foco-do-calendario.test.ts` | 2 |

## 4. E2E

5 de 5 testes passaram em `frontend/e2e/jornadas.spec.ts` (CT-161 a CT-165).

## 5. Limites

- A contagem por classe e por arquivo é a do log; o log não separa o resultado por método.
- O `NotificacaoApiIT.int01ECt103` (R-25, BUG-017 mitigado) passou neste run sem repetição de job.
- Esta execução não mede cobertura de código; isso é o item 2.4 (JaCoCo e SonarCloud).
