# Modelo de ameaças (STRIDE, curto)

Decisão **F7-07** ([decisoes-equipe.md](../decisoes-equipe.md)), de 24/10/2026: modelo de ameaças curto para fechar a lacuna de **OWASP A06, Insecure Design**, registrada em [revisao-seguranca.md](revisao-seguranca.md). Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html) (RF-01, falha de autorização é limitador de nota).

**Regras do modelo.** Cada ameaça cita a evidência que a cobre (teste, ADR, decisão ou risco). Ameaça sem evidência vira **lacuna declarada**, nunca "mitigada". Não se inventa ameaça: todas nascem de cenários (CEN), riscos (R), ADR ou da [revisão de segurança](revisao-seguranca.md). Os testes citados passaram no run da CI [`40111556987`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40111556987) (PR 75, `main` mais a soma do Maven): 664 testes no back end, 0 falhas.

## 1. Escopo e fronteiras de confiança

| Superfície | Fronteira | Evidência da arquitetura |
| --- | --- | --- |
| Navegador e front end React | Navegador ↔ API (CORS, token no `sessionStorage`) | [ADR-015](../adr/ADR-015-stack-do-front-end.md), [ADR-004](../adr/ADR-004-autenticacao-e-autorizacao.md) |
| API Spring Boot | Perfil e posse em duas camadas | CEN-02, [ADR-004](../adr/ADR-004-autenticacao-e-autorizacao.md) |
| PostgreSQL | API ↔ banco (constraint, gatilho de auditoria) | [ADR-003](../adr/ADR-003-dupla-reserva-constraint-de-exclusao.md), CEN-01, CEN-06 |
| Provedor de notificação | API ↔ provedor externo (WireMock nos testes) | CEN-05, CEN-09, [ADR-007](../adr/ADR-007-notificacao-por-porta-e-adaptador.md) |
| Repositório, CI e dependências | Cadeia de suprimento | [revisao-seguranca.md](revisao-seguranca.md), A03; F7-06; F7-08 |

## 2. Ameaças

Situação: **Coberta** (há teste que exercita a ameaça), **Parcial** (parte coberta, parte lacuna), **Risco aceito** (decisão registrada, sem teste que a impeça) ou **Lacuna** (sem evidência de cobertura).

| ID | STRIDE | Ameaça | Evidência | Situação |
| --- | --- | --- | --- | --- |
| TH-01 | Spoofing | Adivinhar senha por tentativas em massa no login | Limite por conta, 5 tentativas em 10 minutos (D18, SEC-01); `LimiteDeLoginApiIT` (11 testes) e `LimiteDeLoginTest` | **Coberta**, com os limites de TH-13 |
| TH-02 | Spoofing | Descobrir quais e-mails existem pela resposta do login | `AutenticacaoApiIT.ct002_loginDeUsuarioInexistenteTemAMesmaResposta`. O tempo igual (senha-isca, `AutenticacaoService.java:52`) **não tem teste de tempo** | **Parcial**: resposta igual testada; tempo constante sem teste (lacuna) |
| TH-03 | Spoofing | Usar token roubado, expirado ou de usuário desativado | `AutorizacaoApiIT.ct119` (sem token, inválido, revogado e expirado dão 401); `AutenticacaoApiIT.ct005_sairRevogaASessao` e `UsuariosApiIT.ct005_desativarUsuarioRevogaAsSessoes` (sair e desativar usuário revogam a sessão); token opaco com só o hash no banco (revisão A04) | **Coberta** quanto a expiração e revogação. O roubo em si, por XSS, é TH-12 |
| TH-04 | Tampering | Dupla reserva por solicitações simultâneas | R-01, [ADR-003](../adr/ADR-003-dupla-reserva-constraint-de-exclusao.md), CEN-01; `ConcorrenciaApiIT` (7 testes) e a prova sem a constraint em [limitadores-de-nota.md](limitadores-de-nota.md) | **Coberta** |
| TH-05 | Tampering | Alterar ou apagar a auditoria | R-07, R-23, CEN-06; `EsquemaIT.ct011_auditoriaEhSomenteInsercao`; `AuditoriaPapelIT` (papel que não é dono não altera nem desliga o gatilho). **A aplicação roda como dono das tabelas**, que pode desligar o gatilho (SEC-02) | **Parcial**: coberto para papel que não é dono; o papel dono é risco aceito (R-23) |
| TH-06 | Tampering | Injeção de SQL ou entrada maliciosa | [ADR-008](../adr/ADR-008-erros-padronizados-e-consultas-parametrizadas.md); `AutorizacaoApiIT.ct120_injecaoEmFiltrosDePesquisaNaoRetornaErroNemAlteraOBanco`; varredura manual de SQL parametrizado (revisão A05) | **Parcial**: o teste de injeção cobre os filtros de pesquisa; as demais entradas dependem de validação (`@Valid`) e da varredura manual, sem teste de injeção dedicado |
| TH-07 | Repudiation | Alguém nega ter feito uma mudança de estado | R-07, RN-08, CEN-06; `AuditoriaApiIT.ct096` (um evento por transição, com ator e instante) e `ct097` (falha ao auditar desfaz a transição); `AuditoriaApiIT` (7 testes) | **Parcial**: mudanças auditadas; **tentativas negadas (401 e 403) não são auditadas**, só vão ao log (revisão A09) |
| TH-08 | Information disclosure | Ver dado de outro usuário ou perfil | R-12, RN-26; `AutorizacaoApiIT.ct118` (Solicitante não lê nem altera reserva de outro) e `ct121` (a recusa por conflito não identifica quem reservou); `AuditoriaApiIT.ct100` (visibilidade do histórico) | **Coberta** |
| TH-09 | Information disclosure | Segredo ou detalhe interno em erro ou log | CEN-09, R-12; `AutenticacaoApiIT.ct006_falhaInternaNaoVazaDetalhe`; `LogSeguroApiIT` (2 testes); `NotificacaoApiIT.int06` (token devolvido no corpo do erro do provedor não aparece em log) | **Coberta** |
| TH-10 | Information disclosure | Escuta do tráfego e conteúdo ativo no navegador | A aplicação fala HTTP; TLS e `Strict-Transport-Security` ficam para um ambiente de implantação que o projeto não tem (revisão A02 e A04). **Não encontrei `Content-Security-Policy`** em `frontend/nginx.conf`, `compose.e2e.yaml` nem `src/main`; o [ADR-015](../adr/ADR-015-stack-do-front-end.md) deixou o CSP como "ponto a validar". Cabeçalhos `X-Content-Type-Options`, `X-Frame-Options` e `Cache-Control` têm teste (`CabecalhosDeSegurancaApiIT`) | **Lacuna** (TLS e CSP) |
| TH-11 | Information disclosure | Site de outra origem chama a API pelo navegador do usuário | `CorsComOrigemApiIT` (2), `CorsSemOrigemApiIT` (2) e `CorsPropertiesTest`: origem só por variável, sem curinga | **Coberta** |
| TH-12 | Spoofing e information disclosure | Script injetado na página lê o token do `sessionStorage` (XSS) | [ADR-015](../adr/ADR-015-stack-do-front-end.md), "Risco residual aceito"; mitigações: módulo único de sessão, `dangerouslySetInnerHTML` proibido por lint (`frontend/eslint.config.js`, linha 22), sem script de terceiros, dependências travadas. **Não encontrei teste dedicado de XSS** | **Risco aceito** (Jefferson, 18/10/2026) |
| TH-13 | Denial of service | Bloquear a conta de outra pessoa de propósito, por tentativas erradas | D18, SEC-01; limites conhecidos em revisão A07 (conta alheia bloqueável, tentativas simultâneas passam de N por pouco, e-mail da falha guardado na janela) | **Risco aceito** |
| TH-14 | Denial of service | Provedor de notificação lento ou fora do ar derruba a reserva | R-10, CEN-05; `NotificacaoApiIT.int03` (500 deixa pendente e a reserva continua válida) e `NotificacaoTempoLimiteApiIT.int04` (lentidão interrompe e marca pendente) | **Coberta** |
| TH-15 | Denial of service | Excesso de volume: listas sem limite e criação lenta sob carga | [resultado-02.md](../performance/resultado-02.md): criação com p95 de 568 a 886 ms contra a hipótese de 300 ms (RNF-08b **não atendido**), 0 erro real; L-03 e [fase-7-pendencias.md](../fase-7-pendencias.md): reservas, fila, catálogo e auditoria sem paginação. **Não encontrei limitação de taxa** além do limite de login em `src/main/java` | **Lacuna** |
| TH-16 | Elevation of privilege | Perfil sem permissão executa uma operação | R-03, CEN-02, RN-06, RN-16, RN-17; `AutorizacaoApiIT` (141 testes, matriz de 34 operações em 3 perfis); BUG-008 achado por ela e corrigido. **BUG-026** ([issue 69](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/69)): ao remover o portão de perfil da aprovação, só o caso do Administrador ficou vermelho; o do Solicitante não é isolado | **Parcial**: matriz verde, com a lacuna de teste do BUG-026 aberta |
| TH-17 | Elevation of privilege | Quebrar a segregação de funções: Responsável aprova a própria reserva, Administrador reserva | RN-16, RN-17; `AprovacaoBloqueioApiIT.ct067` (dono Responsável recebe 403 `ACESSO_NEGADO`) e `ReservasApiIT.ct043_administradorNaoCriaReserva` (Administrador não cria reserva) | **Coberta** |
| TH-18 | Tampering | Dependência, ação de CI ou distribuição do Maven adulterada | F7-06: soma SHA-256 do Maven (`MavenWrapperTest`; a CI barra soma errada, PR descartável 74); ações do GitHub fixadas por SHA e gitleaks por checksum (revisão A03); Dependabot sem alerta no produto e 27 no framework ([alertas-dependabot.md](alertas-dependabot.md)). **SBOM, verificação de licenças e assinatura do artefato não existem** (dívida técnica, F7-06) | **Parcial** |

## 3. Resumo

| Situação | Quantidade | Ameaças |
| --- | --- | --- |
| Coberta | 8 | TH-01, 03, 04, 08, 09, 11, 14, 17 |
| Parcial | 6 | TH-02, 05, 06, 07, 16, 18 |
| Risco aceito | 2 | TH-12, 13 |
| Lacuna | 2 | TH-10, 15 |
| **Total** | **18** | |

## 4. Lacunas declaradas (nenhuma é dada como mitigada)

- **TH-02:** tempo constante do login sem teste.
- **TH-06:** sem teste de injeção fora dos filtros de pesquisa.
- **TH-07:** tentativas negadas (401 e 403) não auditadas; só log, sem alerta (SEC-04, dívida técnica).
- **TH-10:** TLS, `Strict-Transport-Security` e `Content-Security-Policy` ausentes.
- **TH-15:** sem limitação de taxa geral nem paginação; RNF-08b não atendido.
- **TH-16:** isolamento da RN-06 para o Solicitante (BUG-026).
- **TH-18:** SBOM, licenças e assinatura (dívida técnica).

## 5. Limites deste modelo

- Escrito em 24/10/2026 a partir dos documentos e testes do repositório. **Não houve exploração** nem teste de intrusão; a cobertura vem de testes do próprio projeto.
- A frase "não encontrei" vale para as buscas feitas (CSP em `frontend/nginx.conf`, `compose.e2e.yaml` e `src/main`; limitação de taxa em `src/main/java`; teste de XSS e de tempo em `src/test`); ausência de achado não prova ausência.
- STRIDE aplicado por superfície, sem diagramas de fluxo de dados e sem pontuação de risco (a especificação e o plano mestre não pedem). A priorização usa a severidade dos defeitos e a decisão de aceitar riscos, ambas de Jefferson.
- Esta é uma **revisão assistida**, não revisão por par humano.
