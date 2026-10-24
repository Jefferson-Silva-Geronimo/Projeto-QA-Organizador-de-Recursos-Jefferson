# Decisões e suposições da equipe

A equipe é uma pessoa (Jefferson). Este arquivo registra o que foi decidido ou suposto, com origem, quem aceitou e
quando, para a banca ver o que é fato da especificação e o que é escolha. Texto completo das decisões A a D e das
lacunas: [perguntas-abertas.md](prd/perguntas-abertas.md). Perguntas ao professor:
[perguntas-professor.md](perguntas-professor.md).

## Como ler

| Termo | Significado |
| --- | --- |
| Decisão da equipe | Escolha aceita por Jefferson na conversa, com a data |
| Pré-aprovada | Aceita de antemão por Jefferson para um escopo definido; a validar com o professor |
| Suposição | Premissa adotada sem resposta do professor, com o impacto se estiver errada e o teste que a isola |

## 1. Decisões anteriores (Fases 1 e 2)

Registradas em [perguntas-abertas.md](prd/perguntas-abertas.md), com status "Decidida (equipe)".

| Grupo | IDs | Data | Aceita por | Observação |
| --- | --- | --- | --- | --- |
| Lacunas da seção 10 | A1 a A8 | 12/10/2026 | Equipe (Jefferson) | A1, A3 e A5 aguardam confirmação do professor |
| Dúvidas do PRD | B1 a B4 | 12/10/2026 | Equipe (Jefferson) | — |
| Decisões ao aplicar A e B | C1 a C8 | 12/10/2026 | Equipe (Jefferson) | C2 com a suposição S6 |
| Decisões ao aplicar C | D5 a D8 | 12/10/2026 | Equipe (Jefferson) | — |
| Revisão das Fases 0 e 1, Fase 2 | D2, D10 a D16 | 15/10/2026 | Equipe (Jefferson) | D2 com a suposição S6 |
| Estrutura MVC | ADR-014 | 15/10/2026 | Jefferson, por determinação | Instrução do usuário na Fase 4 |
| Acesso a dados por JDBC | ADR-013 | 15/10/2026 | Analista dentro da delegação do usuário | "A equipe pode revisar": ver DS-01 (17/10/2026) |

## 2. Decisões desta sessão (17/10/2026)

Cada linha traz a recomendação, a alternativa descartada, o motivo e a origem. **Decisão da equipe (Jefferson),
17/10/2026**: DS-01 a DS-08 e SQ-01 a SQ-03 foram apresentadas e confirmadas por ele (DS-01, DS-02 e DS-03 uma a uma;
DS-04 a DS-08 e SQ-03 juntas, com "confirmo"). DS-02 teve a variante escolhida por ele: diagrama único em MVC, com nota
para a visão hexagonal original.

| ID | Decisão | Alternativa descartada | Motivo | Origem |
| --- | --- | --- | --- | --- |
| DS-01 | ADR-001 passa a "Aceito, emendado" pelos ADR-013 e ADR-014; o texto original fica preservado com uma nota de emenda | Marcar como "Substituído" | Seguem valendo o monólito de um artefato, o Spring Boot 3.x, a transação local e o domínio sem Spring. Só mudaram a estrutura de pacotes e o acesso a dados | ADR-014; ADR-013; código em `src/main` |
| DS-02 | `arquitetura.md`, seção 10.3, redesenhada só com a estrutura MVC e os nomes reais de componente; tabela 10.4 acrescenta a integração e o relógio; nota aponta o ADR-001 e o histórico do Git para a visão hexagonal original | Manter o diagrama hexagonal com uma tabela de correspondência; manter os dois diagramas (risco de divergir de novo, como em BUG-005) | O diagrama divergia do código; a tabela sozinha obrigava o leitor a traduzir | Plano mestre, Bloco B; `ArquiteturaTest` |
| DS-03 | A imagem do PostgreSQL é fixada por digest do índice multi-arquitetura, lido do Docker Hub em 17/10/2026, no `compose.yaml` e no Testcontainers | Manter a tag móvel `17` | A tag mudou de digest entre a máquina local (7 semanas) e o registro; o banco do teste mudaria sem alteração de código | Registro Docker Hub; `verify` verde com o digest |
| DS-04 | **Nenhuma correção** do tratamento do impasse 40P01 (BUG-007) e nenhum BUG-009 | Não contar o impasse em `tentativas_conflito` | A RN-30 manda gravar o pedido perdedor de uma disputa simultânea; o ADR-003 manda tratar o impasse como conflito; o CT-060 exige exatamente uma tentativa por recusa. Não há inflação | RN-30; ADR-003; `ConcorrenciaApiIT` |
| DS-05 | PIT só como relatório, no pacote `model`, fora do `verify`, sem meta | Gate de mutação | O plano pede relatório; a especificação não define meta de mutação | Plano mestre, Bloco C |
| DS-06 | Cucumber 7.23.0, com `cucumber-spring` | Cucumber 7.34.9 | A versão 7.24+ exige JUnit Platform 1.13 e o Spring Boot 3.5.16 gerencia a 1.12 (falha de descoberta observada) | Prompt 4.F; falha reproduzida |
| DS-07 | Remoção de `EstadoReserva.ocupaRecurso` e `Periodo.duracao`, sem uso | Cobri-los com teste | Teste só para chamar código morto sobe o número sem proteger comportamento | PIT; busca por usos em `src/main` |
| DS-08 | BUG-009 corrigido: falha ao gravar a tentativa mantém o 409 e vai para o log (`61ce37d`) | Deixar o 500 e atualizar o ADR-003 | A decisão de 15/10/2026 já dizia que o 409 é mantido; o código divergia. Corrigir o código cumpre a decisão aprovada | ADR-003; `arquitetura.md` seção 13.2; ciclo-01 DV-01 |

### Decisões com resposta explícita de Jefferson (17/10/2026)

| ID | Decisão | Resposta |
| --- | --- | --- |
| DS-09 | Bloco D usa o CT-106 (troca do provedor), porque a janela de não compareceu já existia | "CT-106 troca do provedor (Recomendada)" |
| DS-10 | Criar e fechar 6 issues retroativas (BUG-001 a BUG-006), mantendo o registro nos `.md` | "Pode criar as 6 e fechá-las como sugeriu, mas mantenha o devido registro no arquivo md também". Issues 3 a 8 |
| DS-11 | A proteção da `main` por API não é possível no plano atual (HTTP 403: "Upgrade to GitHub Pro or make this repository public"). Alternativas em aberto: tornar o repositório público, assinar o GitHub Pro, ou manter sem proteção e registrar a limitação | Aguardando resposta |

### Quality Gate do SonarCloud, PR 2 (17/10/2026)

O gate reprovou só em `new_security_rating` (E, limite A); cobertura nova 93,9%, duplicação 0%, hotspots 100% revisados.

| ID | Apontamento | Análise | Tratamento |
| --- | --- | --- | --- |
| SQ-01 | `java:S2699`, `AutorizacaoApiIT:172`: teste sem asserção | Procedente: o teste só gerava o arquivo da matriz | **Corrigido:** passa a afirmar que `docs/testes/matriz-autorizacao.md` é igual à lista de operações testada |
| SQ-02 | `java:S6437`, `AutenticacaoService:45`: senha comprometida | Não era credencial: senha-isca para tempo constante no login. Literal fixo é evitável | **Corrigido:** senha-isca aleatória por inicialização (`UUID`) |
| SQ-03 | `java:S4502`, `SegurancaConfig:43`: CSRF desligado | CSRF só ameaça autenticação por cookie. A API é stateless e o token vai no cabeçalho `Authorization` (ADR-004) | **Aceito com justificativa** no código (`NOSONAR java:S4502`) e aqui. Confirmada por Jefferson em 17/10/2026 |

## 3. Pré-aprovada

| ID | Escopo | Aceita por | Data | Situação |
| --- | --- | --- | --- | --- |
| PA-01 | Janela de não compareceu: transição APROVADA para NAO_COMPARECEU só após a tolerância configurada, pelo Responsável, com o `Clock`, auditoria na mesma transação e sem job | Jefferson (pré-aprovada) | Antes de 17/10/2026 | **Já implementada** (`UsoService#marcarNaoCompareceu`, CT-093). Pré-aprovada, a validar com o professor |

## 4. Suposições abertas (sem resposta do professor)

| ID | Suposição | Impacto se estiver errada | Teste que a isola |
| --- | --- | --- | --- |
| S-D1 | Tolerância de não comparecimento sem valor padrão; sem configuração a marcação é recusada | Reservas ocupam o recurso por mais tempo, ou são marcadas cedo demais | CT-093 (`UsoMaterialApiIT`), com 30 minutos só em teste e caso sem tolerância |
| S-D3 | Tentativas e intervalo de reenvio sem valor padrão | Notificações perdidas ou carga sobre o provedor | CT-105 (`NotificacaoApiIT`), com 3 tentativas e 1 minuto só em teste |
| S-D4 | Tamanho da página do relatório é parâmetro obrigatório | Relatório lento ou incômodo de navegar | CT-112 (`RelatorioApiIT`) |
| S-D9 | Sem retenção nem expurgo da auditoria e das notificações | Dado pessoal guardado além do necessário | Nenhum; é ausência de funcionalidade |
| S-D17 | Duração da sessão obrigatória por variável de ambiente, sem padrão | Sessão que nunca expira ou expira cedo | CT-004 (`AutenticacaoApiIT`), com 1 hora só em teste |
| S-SEG | O período aceita precisão de segundos | A API passaria a recusar segundos | BDD-06, linhas de um segundo (`aprovacao-bloqueio.feature`) |
| S-PAR | Sem revisor humano, vale a revisão crítica assistida, registrada em cada pull request | Pode ser exigido revisor externo | Não há teste; ver [perguntas-professor.md](perguntas-professor.md) |
| S-A1 a S-A8 | Lacunas 1 a 8 da especificação resolvidas como em A1 a A8 | Ver a tabela em [perguntas-professor.md](perguntas-professor.md) | CT por regra, em [casos-de-teste.md](testes/casos-de-teste.md) |

## 5. Decisões da Fase 5 (17/10/2026)

**Decisão da equipe (Jefferson), 17/10/2026.** Origem: plano mestre, seção 9 e Prompts 5.A a 5.C. Cada uma foi apresentada
com alternativas e escolhida por Jefferson.

| ID | Decisão | Alternativas descartadas | Ajustes pedidos por Jefferson |
| --- | --- | --- | --- |
| P5-01 | Meta de desempenho como **proposta** (p95 de 300 ms, 50 usuários, erros abaixo de 1%), escrita em `docs/performance/rnf.md` antes da primeira rodada | Esperar o professor antes de rodar; propor a meta a partir da medição | O resultado diz "atende" ou "não atende" à hipótese; o relatório declara que o professor ainda não validou; a conclusão fica limitada à máquina local |
| P5-02 | Modelo de carga: uma rodada principal com 50 usuários, consulta e criação de reserva disputando o mesmo recurso | Carga em degraus; só o pico de disputa | Usuários, ramp-up, duração e mistura de operações são propostos no `rnf.md` e **aprovados por Jefferson antes de rodar** |
| P5-03 | Apache JMeter 5.6, binário oficial, em pasta fora do repositório | Plugin Maven; imagem Docker de terceiros | Checksum publicado conferido; versão registrada em `resultado-01.md`; se o download for bloqueado, Jefferson baixa e informa o caminho |
| P5-04 | Revisão de segurança percorre todas as categorias aplicáveis do OWASP Top 10 | Só as categorias mais ligadas aos riscos | Cada uma com status, evidência e ação; registrar a edição do OWASP usada |
| P5-05 | Dependabot (Maven) e varredura de segredos na CI com action fixada por SHA, além do secret scanning nativo | Só Dependabot; só a action | `dependabot.yml` ignora o Cucumber (DS-06); npm só na Fase 6; se a action exigir licença, usar o CLI do gitleaks |
| P5-06 | CORS: origem lida de variável de ambiente, sem valor padrão (sem a variável, nenhuma origem) | Padrão `localhost:5173`; deixar para a Fase 6 | Teste de API com 3 casos (sem variável, com variável, nunca `*`); a porta do Vite vai no `.env.example` e no compose da Fase 6 |
| P5-07 | Log registra a classe da exceção, mensagem saneada (sem detalhe do banco) e identificador de correlação | Só classe e identificador; manter como está | Teste de log: violação de constraint com e-mail fictício e verificação de que ele não aparece no log |
| P5-08 | Teste com papel de banco que não é dono da tabela: não altera, não apaga e não remove o gatilho da auditoria | Separar papel de migração e de aplicação já; aceitar o risco | Registrar o papel que a aplicação usa; se for o dono, risco aceito com nome e motivo, e a opção B vai para a dívida técnica do relatório final |
| P5-09 | Autorrevisão estruturada + revisão assistida registrada em cada PR + ferramentas automáticas (Sonar e CodeRabbit se disponível) | Só revisão externa; só ferramentas | Checklist no modelo de PR preenchido por Jefferson; sem intervalo mínimo obrigatório: Jefferson decidiu em 17/10/2026 que, trabalhando só e com prazos, abrir e mesclar na mesma sessão é permitido, desde que CI verde, Quality Gate, autorrevisão, revisão assistida e confirmação dele estejam cumpridos (registrado no modelo de PR); chamar de "revisão assistida", nunca de "revisão por pares"; revisão externa nos PRs críticos se o professor exigir; pergunta ao professor mantida em `perguntas-professor.md` |

### Resultado da execução de P5-08 e risco aceito R-23 (17/10/2026)

| Item | Registro |
| --- | --- |
| Papel que a aplicação usa de verdade | O **dono** das tabelas: o mesmo usuário que roda as migrações. No teste, o usuário do contêiner; no desenvolvimento local, `POSTGRES_USER` do `.env` |
| O que o teste prova | Um papel que não é dono, mesmo com todos os privilégios de dados, não altera, não apaga, não trunca nem desliga o gatilho da auditoria (`AuditoriaPapelIT`, provado por mutação) |
| O que o teste não cobre | O papel dono da aplicação **pode** desligar o gatilho |
| **Risco aceito R-23** | **Aceito por Jefferson em 17/10/2026.** Motivo: separar o papel de migração do de aplicação é endurecimento de implantação, fora do que a especificação pede, e o projeto não tem ambiente de produção. O gatilho já protege contra qualquer caminho do código da aplicação |
| Dívida técnica | **Opção B** (papéis separados para migração e para aplicação) vai para a dívida técnica do relatório final |

### Quality Gate do SonarCloud, PR 10 (17/10/2026)

| ID | Apontamento | Análise | Tratamento |
| --- | --- | --- | --- |
| SQ-04 | `githubactions:S6506`, `ci.yml:87`: o `curl` que baixa o gitleaks não impõe HTTPS | Procedente: um redirecionamento poderia levar a um destino sem TLS. O checksum SHA-256 conferido depois já barraria um binário adulterado, mas a defesa em profundidade é barata | **Corrigido:** `curl --proto '=https' --tlsv1.2` |

## 6. SEC-01: limite de tentativas de login (17/10/2026)

**Decisão da equipe (Jefferson), 17/10/2026**, ao aceitar todas as recomendações apresentadas. Origem: achado SEC-01 de
[revisao-seguranca.md](testes/revisao-seguranca.md) (OWASP A07:2025). **A especificação não pede este controle nem define
valores:** é decisão da equipe, e todo número é proposta.

| ID | Decisão | Alternativas descartadas |
| --- | --- | --- |
| P5-10 | **Opção A:** limite por conta, guardado no banco, usando o `Clock` injetado | B (por IP, na memória); C (atraso progressivo); D (não implementar, risco aceito) |
| P5-10a | Os valores do limite são configuração **sem valor padrão no código** (D18, decidida abaixo). A configuração é **obrigatória**: sem ela a aplicação não sobe | Desligado quando não configurado |
| P5-10b | Durante o bloqueio a resposta é **idêntica** à de credencial inválida (mesmo código `CREDENCIAIS_INVALIDAS`, mesma mensagem), para não revelar quais contas existem nem quais estão bloqueadas | Resposta 429 distinta |

**Refinamento de implementação (declarado por Claude, ratificado por Jefferson em 17/10/2026, opção 3A):** em vez de três parâmetros (N, janela e tempo de
bloqueio), a regra é uma **janela deslizante com dois**: `tentativas` falhas dentro de `janela` bloqueiam a conta até a mais
antiga dessas falhas sair da janela. Um tempo de bloqueio separado criaria liberação antecipada quando as falhas saem da
janela antes do fim do bloqueio. Tentativas feitas durante o bloqueio não são registradas (não estendem o bloqueio).

**D18 decidida pela equipe (Jefferson), 17/10/2026:** **5 tentativas em 10 minutos**. A especificação não define o valor,
então é decisão da equipe, e não há o que confirmar com o professor (opção 1A: a pergunta saiu de
[perguntas-professor.md](perguntas-professor.md)). O valor é sugerido em `.env.example` (opção 2A) e entra por
`LOGIN_TENTATIVAS` e `LOGIN_JANELA`; o código continua sem valor padrão e a aplicação não sobe sem eles. Os testes
usam os mesmos 5 e 10 minutos.

Limitações conhecidas: (1) o e-mail da tentativa falha é guardado durante a janela (dado pessoal de vida curta; ligado à
lacuna D9); (2) um atacante pode bloquear a conta de outra pessoa de propósito (risco inerente à opção A); (3) tentativas
simultâneas podem passar de N por pouco, porque a checagem e o registro não são atômicos.

## 7. Fechamento da Fase 5 antes da Fase 6 (17/10/2026)

**Decisão da equipe (Jefferson), 17/10/2026**, aceitando as recomendações apresentadas, sempre dentro da especificação e do
plano mestre. Origem: plano mestre, seção 9 (porta de saída da Fase 5) e Prompt 5.B.

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F5-01 | **Rodada 02 de carga agora**, para separar o efeito da máquina do custo por requisição. Uma variável por vez: rodada 02 com 50 usuários e alvos sorteados, e rodada 03 com 25 usuários, ambas com métricas de CPU e do pool. Otimização só se o dado apontar o código, em TDD, com teste de desempenho antes | Refazer a medição só na Fase 7 |
| F5-02 | **`analyze-docs` completo antes da Fase 6** (ortografia, IDs cruzados, termos canônicos, números sem origem), além das checagens mecânicas já feitas | Deixar para a Fase 7 |
| F5-03 | **Apagar as branches já mescladas** na `main` (fases 3, 4 e 5 e as de documentação) | Mantê-las |
| F5-04 | **`tutorial.md` não se aplica a esta fase.** O documento serviu de base só para as fases iniciais (sugestões de prompts e escolhas); a referência passa a ser a especificação e o plano mestre. Registrado como não aplicável, não como pendência | Procurar ou recriar o arquivo |

Dependências já tratadas na mesma sessão, todas respeitando a especificação: PRs #14 (Spring Boot 4.1.1) e #13 (springdoc 3.1.1)
**fechados sem mesclar**, porque a especificação exige Spring Boot 3.x; PR #11 (PIT 1.30.1) e PR #12 (Maven 3.10.0) mesclados
com CI verde, pois nem a especificação nem o plano mestre fixam essas versões.

### Resultado de F5-01 (17/10/2026)

Rodadas 02, 03 e 04 executadas e analisadas em [resultado-02.md](performance/resultado-02.md). A hipótese de saturação do pool foi
refutada; a causa do p95 acima de 300 ms na criação foi localizada no `fsync` do PostgreSQL em Docker nesta máquina. Como o dado
**não** aponta o código, **nenhuma otimização foi feita**, conforme a condição de F5-01. A hipótese de 300 ms segue sem validação do
professor, e o relatório final declara RNF-08b como não atendido nesta máquina.


## 8. Decisões de front end da Fase 6 (18/10/2026)

**Decisão da equipe (Jefferson), 18/10/2026**, escolhendo entre alternativas que respeitam a especificação e o plano mestre
(seção 10.3). Texto completo, mitigações e alternativas descartadas em [ADR-015](adr/ADR-015-stack-do-front-end.md).

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-01 | Cliente e tipos gerados com **openapi-typescript + openapi-fetch** | Orval; OpenAPI Generator |
| F6-02 | Token opaco em **`sessionStorage`**, com mitigações registradas no ADR-015 (módulo único, limpeza em logout e 401, sem HTML injetado, CSP). Risco residual de XSS aceito | Só memória; `localStorage` |
| F6-03 | **React Router + TanStack Query** | React Router com `useState`/`useEffect` |
| F6-04 | **CSS Modules + variáveis CSS**, sem biblioteca de componentes | Tailwind; MUI |
| F6-05 | Corpo de erro (`code`, `itens`, `campos`) tipado **só no front**, em um módulo, com teste contra o `TratadorDeErros` (L-01 de [navegacao-telas.md](prd/navegacao-telas.md)) | Acrescentar o esquema ao back end |

As decisões 1, 2, 3, 5 e 6 do plano (cliente gerado, mapa de erros, front sem regra de negócio, *mobile-first*, datas com
offset) não tinham alternativa e entram direto no ADR-015.

### F6-06. Mudanças mínimas no back end para o front (18/10/2026)

**Decisão da equipe (Jefferson), 18/10/2026**, para que as telas não fiquem pobres mexendo o mínimo no back end fechado.
Origem: lacunas L-02 a L-04 de [navegacao-telas.md](prd/navegacao-telas.md).

| ID | Decisão | Condições impostas por Jefferson |
| --- | --- | --- |
| F6-06a (L-02) | Acrescentar `GET /api/bloqueios` | TDD; `openapi.json` atualizado no mesmo PR; teste de autorização por perfil e de listagem vazia |
| F6-06b (L-04) | A fila de aprovações passa a trazer o **nome** do solicitante, nunca o e-mail | TDD; `openapi.json` no mesmo PR; teste de perfil proibido e de não autenticado |
| F6-06c (L-03) | Filtro de período da auditoria **no front** | Só vale se o endpoint devolver tudo. Verificado em 18/10/2026: a consulta não é paginada, então vale. Se a paginação for criada, o filtro migra para o servidor |

CT-115 e CT-106 comparam o contrato com `docs/api/openapi.json` e vão falhar de propósito quando o contrato mudar. O arquivo é
atualizado de forma consciente, sem enfraquecer os testes.

### F6-08 e F6-09. Navegação e tema do front end (18/10/2026)

**Decisão da equipe (Jefferson), 18/10/2026.** A decisão visual F6-07 (direção moderna, com cor forte nos destaques) fica
registrada junto com a paleta, depois que Jefferson escolher entre as paletas validadas em contraste.

| ID | Decisão | Condições impostas por Jefferson |
| --- | --- | --- |
| F6-08 | **Menu lateral no desktop e barra inferior no celular** | No celular, no máximo 4 itens principais do perfil e um quinto item "Mais" para as demais telas; no desktop, todas as telas do perfil. Todo item com rótulo de texto junto do ícone, nunca só ícone. Item ativo destacado por mais que cor (indicador ou peso da fonte), com foco visível e navegação completa por teclado. Rotas por perfil seguem só como conveniência; o back end decide o acesso |
| F6-09 | **Tema claro e escuro** | Tokens semânticos (fundo, texto, destaque, erro, foco, borda) que mudam por tema, sem cor fixa nos componentes. Segue `prefers-color-scheme` e tem botão manual; a escolha manual fica só no navegador, sem dado pessoal. Todo par de cores dos dois temas com no mínimo WCAG AA, validado antes do protótipo. axe e capturas do Playwright nos dois temas, em 360 px e 1280 px. O tema claro é a referência; o escuro é o primeiro item a cortar se faltar tempo, e **a decisão de cortar é de Jefferson**: avisá-lo antes |

**Motivo do tema escuro, nas palavras da decisão:** reduz o desconforto em ambiente escuro e combina com o público jovem e com
a direção visual moderna. **Não é requisito de acessibilidade do WCAG** e não é apresentado como conformidade.

### F6-07. Direção visual e paleta (18/10/2026)

**Decisão da equipe (Jefferson), 18/10/2026.** Direção **moderna com cor mais forte**, com a **paleta A (violeta e rosa)**, escolhida
entre três paletas com contraste calculado (102 pares, 0 falhas). Valores dos tokens e verificação em
[ADR-015](adr/ADR-015-stack-do-front-end.md), seção "Paleta escolhida".

| Condição imposta por Jefferson | Como é atendida |
| --- | --- |
| Contraste acessível vale mais que o visual: todo par com no mínimo WCAG AA, validado antes do protótipo. Se uma cor não passar, ajusta-se a cor, não o critério | Pares calculados por script; o anel de foco ganhou espaço de 2 px em vez de afrouxar o critério |
| *Mobile-first*, 360 px e 1280 px, rótulos, foco visível, CSS Modules sem biblioteca de UI | F6-04 e plano mestre, seção 10.3 |
| Cor vibrante só nos destaques, base neutra, sem fundo todo saturado | Tokens `fundo` e `superficie` neutros; `destaque` só em botão, indicador e estado |
| Cantos arredondados e sombras suaves, telas densas legíveis, tabelas compactas no desktop e cartões no celular | Regra de projeto para Fila, Relatórios, Auditoria e Catálogo |
| Neutralidade de marca | Nenhum nome, logotipo ou paleta de instituição real |

Alternativas descartadas: paletas B (verde-azulado e âmbar) e C (magenta e ciano); direções "institucional limpo" e "denso e utilitário".

### F6-10. Campos obrigatórios das respostas no contrato (18/10/2026)

**Decisão da equipe (Jefferson), 18/10/2026**, resolvendo a lacuna L-06 de [navegacao-telas.md](prd/navegacao-telas.md): os
esquemas de resposta do OpenAPI não declaravam `required`, e o gerador marcava todo campo como opcional. Escolheu a
**alternativa B**: o back end marca como obrigatórios só os campos de resposta que nunca são nulos. É mudança **só de
documentação**: nenhum comportamento HTTP muda.

| Item | Decisão |
| --- | --- |
| O que entra | O que o tipo ou o banco garantem: primitivos, colunas `NOT NULL` e listas sempre montadas. O Jackson omite campo nulo (`default-property-inclusion: non_null`), então "obrigatório" significa "sempre presente" |
| Regra de dúvida | Na dúvida se um campo pode faltar, ele **não** entra |
| Onde está a lista | `ObrigatoriedadeDasRespostasConfig.java`, num ponto só, com o motivo de cada exclusão. `ContratoObrigatoriosApiIT` (CT-134 e CT-135) a confere contra o contrato e contra respostas reais |
| Contrato | `docs/api/openapi.json` regenerado conscientemente. O CT-115 falhou de propósito e voltou a passar sem alterar o teste; o CT-114 não mudou. Verificado estruturalmente: 12 `required` acrescentados e o resto do contrato idêntico |
| Front | Cliente regenerado: 63 campos deixaram de ser opcionais. Nenhum `?.` nem guarda de resposta da API havia a remover; o guarda do login fica, com o teste CT-129 |

**Campos que ficaram de fora (opcionais) e por quê:**

| Esquema | Campos de fora | Motivo |
| --- | --- | --- |
| `ReservaResposta`, `ReservaDaFilaResposta` | `descricao`, `motivo` | Colunas anuláveis (`descricao`; `motivo_sistema` e `motivo_texto`) |
| `RecursoResposta` | `capacidade`, `localizacao`, `tipoSala`, `horaAbertura`, `horaFechamento`, `diasFuncionamento`, `codigoPatrimonio`, `descricao`, `usuarioId`, `competencias` | Dependem do tipo do recurso (sala, professor ou material); `tipo_sala` é opcional desde a migração V3 |
| `EventoAuditoriaResposta` | `atorId`, `estadoAnterior`, `estadoNovo`, `motivo`, `antes`, `depois`, `correlacaoId` | Colunas anuláveis: o ator é nulo para SISTEMA, e eventos de cadastro não têm estado |
| `ItemRelatorioResposta` | `utilizacao` | Nula para professor e material (B4) |

Alternativas descartadas: **A** (validar no front, sem mexer no back end: duplicaria o contrato à mão, contra a F6-01) e
**C** (marcar só o fluxo crítico: contrato inconsistente).

### F6-11 a F6-13. Padrão das telas, campo de data e Dependabot (18/10/2026)

**Decisão da equipe (Jefferson), 18/10/2026**, depois de ver as capturas do protótipo da Busca e da Nova reserva.

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-11 | **Padrão visual e de interação aprovado**: cartões, formulário em blocos com `fieldset` e legenda, avisos com ícone e texto, recusas pela tabela de erros com o foco na mensagem, dados preservados em toda recusa e confirmação com resumo derivada do estado do servidor. As outras nove telas repetem o padrão, **uma tela por pull request**, na ordem do mapa de telas. Cada tela repete: TDD estrito, verificação em navegador real, axe nos dois temas e tamanhos, navegação só por teclado e ausência de rolagem horizontal | Pedir ajustes ao protótipo |
| F6-12 | **Campo de data e hora nativo do navegador mantido.** Motivo: as 6 paradas de Tab por campo (5 partes e o ícone do calendário) são o comportamento padrão do navegador e os leitores de tela o conhecem; dois campos separados criam mais código e mais risco de erro de fuso (ADR-005). **Limitações declaradas:** as 6 paradas de Tab e o anel de foco do ícone do calendário, que é o do navegador (preto no tema claro e branco no escuro), não a cor do sistema | Campo de data e campo de hora separados |
| F6-13 | **PR #24 do Dependabot (`jsdom` 29 para 30) fechado sem mesclar.** O `jsdom` entra na lista de saltos maiores ignorados em `.github/dependabot.yml`; o salto será avaliado em PR nosso, com a suíte completa do front. O Dependabot não recebe segredos, então o SonarCloud não roda nos PRs dele e o Quality Gate nunca é cumprido por eles | Mesclar o PR do Dependabot; deixá-lo aberto |

### F6-14. O back end diz o que o usuário pode fazer com cada reserva (19/10/2026)

**Decisão da equipe (Jefferson), 19/10/2026**, ao resolver as duas dúvidas da tela Reservas (T04) registradas em [fase-7-pendencias.md](fase-7-pendencias.md).

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-14 | **A resposta de toda reserva traz `podeAlterar` e `podeCancelar`**, calculados no servidor para o usuário logado, pelas mesmas políticas que hoje recusam (`PoliticaDeAlteracao` e `PoliticaDeCancelamento`) e pelo `Clock` injetado (ADR-005). Cobre o dono (RN-18 e RN-19), o perfil e o início da reserva (RN-07, RN-20 e D10). O front só mostra ou esconde a ação: não guarda o id do usuário nem olha o relógio. A recusa pelo código estável continua valendo como defesa (ADR-004). Mudança **aditiva e só de contrato**: os dois campos entram no `required` da resposta e o `openapi.json` foi regenerado (CT-115 falhou de propósito; CT-114 não mudou) | **A** (manter como estava e mostrar a recusa do servidor) e guardar o id do usuário no front para decidir por dono (contra F6-02 e contra o princípio de que o front não decide) |

**Suposições registradas (o cálculo não decidiu nenhuma lacuna A1 a A8; segue o que o back end já fazia):**

| # | Suposição | Origem | Impacto se estiver errada |
| --- | --- | --- | --- |
| 1 | O motivo do cancelamento conta como informado: quem precisa dele (Responsável e Administrador, RN-18) "pode cancelar" informando-o; o servidor segue exigindo o motivo e responde `MOTIVO_OBRIGATORIO` se faltar | `PoliticaDeCancelamento.java`, `exigirMotivo` | Só muda se a tela deveria avisar antes que o motivo é obrigatório; hoje a ajuda do campo já diz |
| 2 | O Administrador nunca "pode alterar": a alteração é só de Solicitante e Responsável (RN-17, `@PreAuthorize` do `PUT /api/reservas/{id}`) | `ReservaController.java`; RN-17 | Só a ação Alterar some para o Administrador, que já a recebia como acesso negado |
| 3 | O dono cancela SOLICITADA em qualquer horário (sem limite de início), como a política já fazia; o limite do instante de início vale para APROVADA (D10) | `PoliticaDeCancelamento.java` | Só o texto do campo muda se a regra mudar |

Os campos são calculados por `PermissoesDaReserva` (regra pura, em `model.regra`) e montados por `RespostasDeReserva` no pacote `controller`; as respostas de criar, alterar, cancelar, aprovar, rejeitar e do uso de material trazem os mesmos campos. A fila de aprovações (`ReservaDaFilaResposta`) não mudou.

### F6-15. A fila de aprovações diz o que o Responsável pode decidir (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026**, ao preparar a tela Fila de aprovações (T05), no mesmo molde da F6-14.

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-15 | **Cada item de `GET /api/reservas/fila` traz `podeAprovar` e `podeRejeitar`**, calculados no servidor para o Responsável logado, pelas mesmas regras que hoje recusam (`PoliticaDeDecisao`, usada também por `AprovacaoService`) e pelo `Clock` injetado (ADR-005). Cobre a posse (RN-16 e RN-33), o estado e o início da reserva (D2 e D10). O front só mostra ou esconde a ação: não guarda o id do usuário nem olha o relógio. A recusa pelo código estável (`ACESSO_NEGADO`, `APROVACAO_APOS_INICIO`) continua como defesa (ADR-004). Mudança **aditiva e só de contrato**: os dois campos entram no `required` e o `openapi.json` foi regenerado (CT-115 falhou de propósito; CT-114 não mudou) | Sempre mostrar as duas ações e tratar a recusa; guardar o id do usuário no front (contra F6-02 e ADR-004) |

**Suposições registradas (o cálculo não decidiu nenhuma lacuna A1 a A8; segue o que o back end já fazia):**

| # | Suposição | Origem | Impacto se estiver errada |
| --- | --- | --- | --- |
| 1 | O motivo da rejeição conta como informado: `podeRejeitar` é verdadeiro sem olhar o motivo; o servidor segue exigindo-o e responde `MOTIVO_OBRIGATORIO` se faltar (RN-24) | `AprovacaoService.rejeitar`; mesmo tratamento da F6-14 | Só muda se a tela deveria avisar antes; hoje o diálogo exige o motivo |
| 2 | **A rejeição não tem limite de horário**: uma reserva SOLICITADA pode ser rejeitada mesmo depois do instante de início. Só a aprovação para no início (D2 e D10) | `AprovacaoService.rejeitar` não compara com o início; D2 trata só da aprovação | Se a regra for rejeitar só antes do início, `podeRejeitar` passa a ser falso no início e depois, e o servidor também precisa mudar. **Suposição aceita por Jefferson em 22/10/2026**; o servidor não muda. A dúvida segue em [perguntas-professor.md](perguntas-professor.md) e em [fase-7-pendencias.md](fase-7-pendencias.md) |
| 3 | Só o perfil Responsável tem os campos verdadeiros; para Solicitante e Administrador são falsos (a fila já lhes responde 403) | `@PreAuthorize` de `GET /api/reservas/fila`; RN-06 | Nenhum efeito visível hoje, porque eles não recebem a fila |

O cálculo está em `PermissoesDeDecisao` e `PoliticaDeDecisao` (regra pura, em `model.regra`) e a montagem em `RespostasDeReserva.daFila`. As respostas de aprovar e rejeitar não mudaram.

### F6-16. A reserva diz o que o Responsável pode fazer no uso, e o histórico diz quem registrou e o que é atual (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026**, ao preparar a tela Retirada e devolução (T06), no mesmo molde da F6-14 e da F6-15.

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-16 | **(a)** A resposta de toda reserva traz `podeIniciar`, `podeConcluir` e `podeMarcarNaoComparecimento`, calculados no servidor para o usuário logado, pelas mesmas regras que hoje recusam (`PoliticaDeUso`, usada também por `UsoService`) e pelo `Clock` injetado (ADR-005). **(b)** Cada movimentação do histórico traz `registradoPorNome`, só o nome e nunca o e-mail (mesmo molde da L-04), inclusive de quem foi desativado depois. **(c)** Cada movimentação traz `atual`, verdadeiro na mais recente de cada material, pela mesma função (`MovimentacoesAtuais`) com que o servidor recusa `MATERIAL_JA_RETIRADO` e `DEVOLUCAO_SEM_RETIRADA`. O front só mostra ou esconde a ação e lê `atual`: não ordena nem compara sequências, não guarda id, não chama `GET /api/usuarios` e não olha o relógio. A recusa pelo código estável continua como defesa (ADR-004). Mudança **aditiva e só de contrato**: os campos entram no `required` e o `openapi.json` foi regenerado (CT-115 falhou de propósito; CT-114 não mudou). Quem já via o histórico continua vendo, e ninguém ganhou acesso novo | Derivar tudo no front (repetiria regra do servidor e mostraria "Não compareceu" mesmo com a tolerância em curso); lista de materiais com estado e ações por unidade (estrutura nova, PR quase duas vezes maior, segunda fonte de verdade); o front ordenar as movimentações por conta própria (aprovada a marcação `atual` no back end) |

**Suposições registradas (o cálculo não decidiu nenhuma lacuna A1 a A8 nem D1; segue o que o back end já fazia):**

| # | Suposição | Origem | Impacto se estiver errada |
| --- | --- | --- | --- |
| 1 | **Iniciar o uso não tem limite de horário**: `podeIniciar` é verdadeiro em reserva APROVADA mesmo antes do horário de início. O servidor só confere o estado, e RN-20 não fala de horário | `UsoService.iniciar`; RN-20 | Se o início só valer a partir do horário da reserva, `podeIniciar` passa a ser falso antes dele e o servidor também precisa recusar |
| 2 | **Tolerância não configurada (D1) deixa `podeMarcarNaoComparecimento` falso**; o servidor responderia `TOLERANCIA_NAO_CONFIGURADA`. O valor da tolerância continua lacuna: nada foi inventado | `UsoService.marcarNaoCompareceu`; D1 | Se o professor definir um valor padrão, o campo passa a ser verdadeiro sem configuração; a tela não explica por que a ação não aparece |
| 3 | **A marcação de não comparecimento não tem fim de janela**: depois de início mais tolerância ela vale a qualquer hora, e no instante exato já vale (`!agora.isBefore(início + tolerância)`) | `UsoService.marcarNaoCompareceu`; RN-21 | Se houver um limite superior, o campo e o servidor mudam juntos |
| 4 | `podeConcluir` é falso enquanto houver unidade retirada e não devolvida (RN-23), e a tela precisa devolver primeiro. Reserva em uso com material só reservado e nunca retirado pode concluir | `UsoService.concluir`; RN-23 | Só muda se a regra de conclusão mudar; a recusa `MATERIAL_PENDENTE` com a lista de pendentes continua como defesa |
| 5 | Só o Responsável recebe os três campos verdadeiros, seja ou não o dono da reserva (D13); para Solicitante e Administrador são falsos (os endpoints já respondem 403) | `@PreAuthorize` de `UsoController`; RN-20 e D13 | Nenhum efeito visível hoje, porque eles não operam o uso |
| 6 | `atual` usa o maior `id` da movimentação de cada material, o que equivale à ordem cronológica porque o servidor numera na ordem do registro e ordena por `id` | `JdbcMovimentacaoRepository.listar`; RF-09 | Se um dia a movimentação puder ser registrada fora de ordem, a regra de "atual" precisa olhar o instante |

Os campos de uso são calculados por `PermissoesDeUso` (regra pura, em `model.regra`) e montados por `UsoService.permissoes` e `RespostasDeReserva`; as respostas de criar, alterar, cancelar, aprovar, rejeitar e do uso de material trazem os mesmos campos. A lista de reservas lê a tolerância uma vez por chamada e consulta as movimentações só das reservas em uso do Responsável (ver [fase-7-pendencias.md](fase-7-pendencias.md)).

### F6-17. O histórico diz quem agiu pelo nome; Desativar não ganha campo "pode" (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026**, ao levantar o que as telas T07 a T11 exigem do back end.

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-17 | **(a)** Cada evento de `GET /api/reservas/{id}/historico` e de `GET /api/auditoria` traz `atorNome`, só o nome de quem agiu, **nunca o e-mail**, no mesmo molde da L-04 e da F6-16. O usuário desativado depois continua com o nome no histórico, e o SISTEMA não tem nome. Mudança **aditiva e só de contrato** (o campo não entra no `required`, porque falta no SISTEMA); `openapi.json` regenerado (CT-115 falhou de propósito; CT-114 não mudou). Quem já via o histórico continua vendo e ninguém ganhou acesso novo; o front não chama `GET /api/usuarios` para isso. **(b)** A T07 (Catálogo) e a T11 (Usuários) **não ganham `podeDesativar`**: a tela oferece Desativar e, quando o servidor recusa (`RECURSO_COM_RESERVA_FUTURA`, `USUARIO_COM_RESERVA_FUTURA`, `MINIMO_DE_RESPONSAVEIS`), mostra a mensagem e a ação do mapa de erros e a lista de reservas afetadas em `itens`. Motivo: a decisão continua do servidor, nenhuma regra nova vai para o front, e um campo falso esconderia o botão sem dizer por quê, quando a lista é exatamente o que o Administrador precisa ver | **(a)** mostrar "Usuário nº 12" no lugar do nome (contra a L-04); **(b)** `podeDesativar` em recursos e usuários (consulta de reservas futuras por item e botão que some sem explicação) |

Os testes da T07 e da T11 cobrem a recusa com a lista de reservas afetadas (teste de componente).

### F6-18. Como acelerar sem perder a rastreabilidade (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026.** Regras de trabalho, sem mudar nenhuma regra do produto.

| ID | Decisão | Condições |
| --- | --- | --- |
| F6-18 | Em **PR de front puro ou de campo aditivo**, roda-se local só as classes de teste afetadas, o contrato (CT-114, CT-115 e CT-134) e a arquitetura (ArchUnit), e a suíte completa fica para a CI | Se o PR mudar **regra de negócio, política, migração ou consulta**, a suíte completa roda local antes de abrir o PR. O PR declara o que rodou local e o que ficou para a CI. **Os números de testes da RTM e dos relatórios vêm sempre da CI, nunca do local.** A regra de repetir o job da CI uma única vez para `NotificacaoApiIT.int01ECt103` (R-25 e R-26) continua; qualquer outro teste falhando, pára e avisa |

Também valem, a partir de 22/10/2026: textos de interface que seguem o padrão já aprovado (T04, T05 e T06) e permissões no molde da F6-14, da F6-15 e da F6-16 não são perguntados, e entram no resumo do PR; só se pergunta o que for novo ou conflitar com a especificação ou o plano mestre; enquanto a CI de um PR roda, a próxima tela começa em branch novo; nas telas simples (Usuários e Catálogo) o navegador real roda só o modo da própria tela, com axe nos dois temas e tamanhos, teclado e rolagem, e o PR declara o que deixou de rodar.

### F6-19. O contrato declara o motivo do bloqueio como obrigatório (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026**, ao receber o achado da T08: o servidor exige o motivo ao criar e ao levantar um bloqueio (`MOTIVO_OBRIGATORIO`, RN-22 e D15), mas o OpenAPI o declarava opcional, e o cliente gerado aceitava um corpo que o servidor recusa com 400. Pedido: corrigir agora, em PR próprio de back end, no molde da F6-10.

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-19 | **O `required` de `NovoBloqueioRequisicao` ganha `motivo` (fica `recursoId`, `inicio`, `fim` e `motivo`) e `LevantamentoRequisicao` ganha `required: [motivo]`.** Mudança **só de documentação**, como a F6-10: o comportamento HTTP não muda, e o código de erro continua `MOTIVO_OBRIGATORIO`. Fica em `ObrigatoriedadeDasRequisicoesConfig.java`, num ponto só. `ContratoDeRequisicoesApiIT` confere o contrato (CT-166) e que o servidor continua recusando sem motivo, sem gravar nada (CT-167). `openapi.json` regenerado: o CT-115 falhou de propósito e voltou a passar sem alterar o teste; o CT-114, o CT-134 e o CT-135 não mudaram. Diff do contrato verificado: só os dois `required`. Front: cliente regenerado (2 linhas: `motivo` deixa de ser opcional nos dois esquemas), 910 testes, lint, tipos e build sem tocar em teste nem em tela | Marcar o campo com `@NotBlank` (Bean Validation): mudaria o código de erro de `MOTIVO_OBRIGATORIO` para `VALIDACAO_FALHOU`, ou seja, o comportamento, e quebraria o mapa de erros |

### F6-20. A porta de saída da Fase 6 vale para os RF com interação humana (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026**, resolvendo a ressalva do fechamento da Fase 6: RF-11 (notificação simulada) e RF-14 (documentação) não têm tela, e a porta de saída diz "Todo RF de 01 a 14 é acessível pela interface por pelo menos um perfil" (plano mestre, seção 10, porta de saída da Fase 6).

| ID | Decisão | Alternativa descartada |
| --- | --- | --- |
| F6-20 | **A frase da porta de saída vale para os RF com interação humana.** Fundamento: o **Anexo A do plano mestre** (cobertura dos 14 requisitos funcionais) já diz "Sem tela própria" para RF-11 (teste principal INT-01 a INT-06) e para RF-14 (teste principal: contrato OpenAPI). **Nenhuma tela nova é criada.** É uma **interpretação declarada**: entra em `fase-7-pendencias.md` e no relatório final como tal, não como cumprimento literal da frase. RF-11 está provado pelos testes INT-01 a INT-06 e RF-14 pelo OpenAPI e pelos testes de contrato; a prova, com os arquivos e a execução na CI, está em [relatorio-sessao-fase-6-fechamento.md](relatorio-sessao-fase-6-fechamento.md), seção 1.1 | Criar uma tela de notificações simuladas e um link para o OpenAPI só para cumprir a frase: aumentaria o escopo sem ganho de prova, e o próprio Anexo A não a pede |

### F6-21. O job `e2e` passa a ser check obrigatório na `main` (22/10/2026)

**Decisão da equipe (Jefferson), 22/10/2026**, depois de três execuções verdes seguidas do job `e2e` em pull requests reais, do commit final de cada um: #54 `39880389131`, #55 `39881122909` e #56 `39881853920` (e antes #52 `39872935422` e #53). Combinado de 18/10/2026: o `e2e` só vira obrigatório depois de visto verde em PR real, como o `frontend`.

| ID | Decisão | Como foi aplicado |
| --- | --- | --- |
| F6-21 | **`test`, `frontend` e `e2e` são os checks obrigatórios da `main`.** O `e2e` entra ao lado dos dois que já valiam; o resto da proteção não muda | A proteção foi lida antes (`gh api repos/<dono>/<repositório>/branches/main/protection`), o `e2e` foi acrescentado com `POST .../protection/required_status_checks/contexts` (que só mexe nos contextos) e a proteção foi lida de volta. **Diferença entre o antes e o depois: só `required_status_checks.contexts` e `required_status_checks.checks`, que ganharam `e2e`.** |

| Item da proteção da `main` | Antes | Depois |
| --- | --- | --- |
| Checks obrigatórios | `test`, `frontend` | **`test`, `frontend`, `e2e`** |
| Branch atualizada antes de mesclar (`strict`) | sim | sim |
| Aprovações exigidas em pull request | 0 (o PR é obrigatório) | 0 |
| Vale para administrador (`enforce_admins`) | sim | sim |
| Force push | não | não |
| Exclusão da branch | não | não |
| Histórico linear, conversas resolvidas, assinatura, bloqueio de criação | não | não |

Os checks `segredos` e SonarCloud **não** estão entre os obrigatórios da proteção (nunca estiveram); a prática combinada de só mesclar com eles verdes continua valendo por regra de trabalho, não por proteção.

### F7-01 a F7-03. Revisão assistida independente do front end (24/10/2026)

**Decisões da equipe (Jefferson), 24/10/2026**, sobre os achados de [revisao-assistida-front.md](testes/revisao-assistida-front.md), conforme a especificação e o plano mestre. Nenhuma abre BUG; cada uma traz a condição que a reabre como defeito.

| ID | Decisão | Origem | Reabre como defeito se |
| --- | --- | --- | --- |
| F7-01 | **R1: exceção aceita, sem BUG.** `DialogoDeDecisao.tsx:65` não envia a rejeição sem motivo; é conferência de preenchimento (campo vazio ou em branco). O servidor segue como autoridade (`MOTIVO_OBRIGATORIO`) | RN-24; [navegacao-telas.md](prd/navegacao-telas.md), seção 9 (T05) | Qualquer conferência local passar a avaliar outra regra |
| F7-02 | **S1, S2 e S3: observações, sem BUG; nada muda em código nesta fase.** S1 (recursos da própria reserva na alteração) e S3 (texto de ajuda do cancelamento) só apresentam e o servidor decide no envio. **S2** (`DIAS_DA_JANELA_PADRAO = 14` em `PaginaDeBusca.tsx:24`) entra como **suposição sem origem**, com o impacto: só a janela inicial da Busca, que a pessoa pode alterar. Registrada em `revisao-assistida-front.md`, `fase-7-pendencias.md` e no relatório final | Revisão assistida; RN-18 (S3) | Algum dos três passar a decidir regra |
| F7-03 | **Textos fixos fora do mapa de 34 códigos: desvio da letra da seção 5, não da intenção; observação, sem BUG.** São dicas de preenchimento e as três mensagens de ação ausente (T04, T05 e T06); não são recusas do servidor, não explicam regra e não usam texto do servidor. O ajuste proposto da frase da seção 5 de `navegacao-telas.md` ("Toda mensagem de recusa do servidor vem da tabela...") **não foi aplicado nesta decisão; foi aplicado depois, na F7-12 (24/10/2026)** | [navegacao-telas.md](prd/navegacao-telas.md), seções 5 e 9 | Algum texto passar a explicar regra ou a exibir texto do servidor |

### F7-04. Como provar o vermelho intencional do pipeline (24/10/2026)

**Decisão da equipe (Jefferson), 24/10/2026**, entre alternativas conformes à especificação (seção 8) e ao plano mestre (seção 11.4). Alternativas apresentadas: A (uma asserção invertida no job `test`), B (uma asserção do E2E, job `e2e`) e C (três quebras, uma por check obrigatório).

| ID | Decisão | Como foi aplicado |
| --- | --- | --- |
| F7-04 | **Alternativa A.** PR descartável que inverte uma asserção de um teste unitário de regra crítica (a fronteira do `Periodo`), no job `test`. A `main` nunca recebe a quebra; o PR fica sem mesclar, é fechado e o branch é apagado. Commit e título dizem que é quebra intencional e descartável | PR #59 (`teste(descartavel): quebra intencional para provar o check obrigatorio (NAO MESCLAR)`), commit `f19d3e0`, `PeriodoTest.java` linha 34 (`encosta no fim`: `false` para `true`). Run vermelho `40099734514`, `mergeStateStatus` `BLOCKED`, PR fechado sem mesclar, branch apagada no local e no remoto. Detalhes em [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 3 |

### F7-05 a F7-13. Escolhas do item 2.5 e plano de correção dos defeitos da 7.A (24/10/2026)

**Decisões da equipe (Jefferson), 24/10/2026.** Para cada uma, as alternativas conformes à especificação e ao plano mestre foram apresentadas com a recomendação, o custo e o impacto; a coluna "Alternativas" resume o que foi apresentado. Nada foi implementado antes da escolha.

| ID | Decisão | Alternativas apresentadas | Como será aplicado |
| --- | --- | --- | --- |
| F7-05 | **Plano de correção dos oito defeitos da auditoria 7.A (BUG-020 a BUG-027), em quatro PRs por tema.** PR 1: BUG-026 sozinho, em TDD estrito. PR 2: BUG-023 (`ct063`), de teste, separado da documentação. PR 3: BUG-020, BUG-021, BUG-024 e BUG-025 (RTM e casos de teste). PR 4: BUG-022 e BUG-027 ("137 casos" para 141 e README). **BUG-024 usa a tabela CT-arquivo em `casos-de-teste.md`, sem renomear teste.** Prioridades: BUG-026 Alta; BUG-020, BUG-024 e BUG-027 Média; BUG-021, BUG-022, BUG-023 e BUG-025 Baixa. **Nova ordem do trabalho:** item 2.5, correção dos defeitos, item 2.4 (leitura de cobertura e SonarCloud uma única vez, no estado final da `main`), item 2.6, item 2.7 (só com autorização expressa de Jefferson) e item 2.8 (perguntar antes) | Para BUG-024: identificador `CT-nnn` no nome dos testes (renomeia testes) ou tabela CT-arquivo (não toca em teste, recomendada) | **BUG-026:** antes de escrever o teste novo, diagnosticar por que o `ct117` também não ficou vermelho para o Solicitante com a regra removida e dizer se é a mesma causa do `ct067` (403 da RN-16, dono da reserva); o teste novo usa um Solicitante que **não** é dono e é provado vermelho por asserção sem a regra (worktree descartável) e verde com ela. **BUG-023:** a correção é proposta e mostrada a Jefferson **antes** de aplicar; o `ct063` não é alterado só para passar, e a prova de dupla reserva sem constraint continua. Em cada PR: índice de defeitos (estado, commit e teste de regressão), issue fechada com link do commit e do teste, `fase-7-pendencias.md` e analyze-docs completo |
| F7-06 | **SEC-03: implementar a soma de verificação do Maven no wrapper (`distributionSha256Sum` em `maven-wrapper.properties`)**, em PR próprio e sem mexer em regra de negócio. **SBOM e SEC-04 (alerta além do log) ficam declarados como dívida técnica no relatório final**, com plano de evolução e sem código novo; A03 e A09 seguem "parcial" para esses dois | (1) só a soma, SBOM e SEC-04 dívida (escolhida); (2) soma e SBOM na CI; (3) os três; (4) nenhum, tudo dívida | **Aplicado em 24/10/2026.** Teste `MavenWrapperTest` (`test(red)` visto vermelho por asserção em `b00569e`; `feat(green)` em `99da303`; o teste da URL do Maven Central nasceu verde, por declaração). A soma foi calculada de `apache-maven-3.10.0-bin.zip` baixado do Maven Central, cujo SHA-512 confere com o publicado (o Central não publica SHA-256: resposta 404). `mvnw` e `mvnw.cmd` recusam soma errada ao baixar (provado localmente com cache novo). **Prova na CI:** PR descartável #74, run [`40109437336`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40109437336), `test` e `e2e` vermelhos com "Failed to validate Maven distribution SHA-256", `mergeStateStatus` `BLOCKED`, PR fechado sem mesclar e branch apagado no local e no remoto; a `main` nunca recebeu a quebra. **Limite:** o wrapper só valida ao baixar o Maven. **Consequência descoberta no PR 75 (F7-14):** a soma é a do `.zip`, mas o `mvnw` troca o `.zip` pelo `.tar.gz` quando não há `unzip` na máquina; no `Dockerfile` da API (imagem do JDK, sem `unzip`) o job `e2e` ficou vermelho com "Failed to validate Maven distribution SHA-256" mesmo com a soma certa (run [`40109690777`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40109690777)), enquanto o job `test` passou porque o runner tem `unzip`. Resolvido pela F7-14. **Quem subir a versão do Maven precisa atualizar a soma:** o Dependabot já alterou o Maven do wrapper uma vez (PR 12, commit `dc0f23d`, de 3.9.9 para 3.10.0), então um PR dele passará a ficar vermelho até a soma ser atualizada |
| F7-07 | **Fazer o modelo de ameaças curto (uma página), só documentação, em PR próprio.** Cada ameaça cita a evidência que a cobre (teste, ADR, decisão ou risco, como CEN-02, CEN-09, R-03, R-12 e ADR-004). **Ameaça sem evidência vira lacuna declarada, nunca "mitigada"**; não se inventa ameaça nem se afirma cobertura não verificada. A06 em `revisao-seguranca.md` só muda no que a evidência sustentar | Fazer o modelo curto (escolhida) ou declarar como não feito | **Aplicado em 24/10/2026** em [modelo-de-ameacas.md](testes/modelo-de-ameacas.md): 18 ameaças com evidência (8 cobertas, 6 parciais, 2 de risco aceito, 2 lacunas). A06 em `revisao-seguranca.md` atualizado só no que a evidência sustenta e **segue "parcial"**. PR de documentação com analyze-docs completo |
| F7-08 | **Os 27 alertas do Dependabot são declarados "não se aplicam ao produto", sem dispensa no GitHub.** Justificativa, fatos e data da consulta em [alertas-dependabot.md](testes/alertas-dependabot.md): 27 abertos, todos em `.aiox-core/` (26 no painel de diagnóstico e 1 na raiz do framework), **0 em `frontend/` e 0 no Maven**; os 22 antigos (17/10/2026) mais 5 novos (22/10/2026). Entra no relatório final como risco declarado. Se algum alerta aparecer fora de `.aiox-core/`, parar e avisar Jefferson | (1) declarar e dispensar no GitHub; (2) só declarar (escolhida); (3) atualizar pelo canal do framework (canal desconhecido, lacuna) | Documento criado neste PR; consulta repetida na leitura final (2.4) e antes da tag (2.7) |
| F7-09 | **Trocar a Origem do ADR-015 (linha 7) por documentos versionados**: `decisoes-equipe.md` (seção 8, F6-01 a F6-05), RF-13 e RNF-10, sem citar o plano mestre (regra 7 do AGENTS). **Muda só a origem, nunca o conteúdo da decisão.** Antes de aplicar, conferir decisão por decisão se essas fontes sustentam o que o ADR diz; o que não bater é mostrado a Jefferson, sem ajuste por conta própria | (1) origem em documentos versionados (escolhida); (2) "plano mestre, seção 10.3" sem link (contraria a regra 7); (3) manter o link e declarar o aviso | **Aplicado em 24/10/2026.** A lista inicial da origem (decisoes-equipe.md F6-01 a F6-05, RF-13 e RNF-10) foi **ampliada após a conferência decisão por decisão**: ela sustenta as decisões 1 (F6-01), 4 (F6-02), 5 (F6-03) e 6 (F6-04), mas não sozinha a 2 (tabela de erros), a 3 (rotas por perfil) nem a 7 (datas no fuso, "ISO-8601 com offset" só aparece na tabela de princípios de `navegacao-telas.md`, linha 18). Foram acrescentadas à origem a tabela de princípios de `navegacao-telas.md`, o ADR-004, o ADR-005 e o ADR-008. Jefferson também aprovou trocar as 7 citações de texto ao plano mestre (o Contexto e seis células "Plano 10.3 (n)") pelas mesmas fontes, decisão por decisão. **Só origem e citações mudaram; o conteúdo de nenhuma decisão mudou** (8 linhas trocadas, todas na linha 7, no Contexto e na coluna Origem). **Duas menções ao plano mestre ficam, por não serem origem:** a linha 81 ("sem relação com a especificação nem com o plano mestre") e a condição da escolha 4 ("nem o plano"). O aviso do ADR-015 no analyze-docs some |
| F7-10 | **Tornar o check `segredos` obrigatório na proteção da `main`**, que passa a exigir `test`, `frontend`, `e2e` e `segredos`. SonarCloud continua barrando por dentro do job `test` (`-Dsonar.qualitygate.wait=true`, `ci.yml` linha 71) e, no check externo, segue como regra de trabalho. **Verificações prévias feitas em 24/10/2026:** `segredos` rodou com sucesso em todos os PRs só de documentação (58, 61, 62 e 71) e nos do Dependabot (24, 12 e 11); o `ci.yml` usa `on: pull_request` sem filtro de caminho | (1) só `segredos` (escolhida); (2) `segredos` e o check externo do SonarCloud (bloquearia os PRs do Dependabot, que não recebem segredos); (3) manter como regra de trabalho | **Aplicado em 24/10/2026**, depois do merge dos PRs 72 a 79: a proteção foi lida antes e depois pela API, com `AIOX_ACTIVE_AGENT=devops` em comando isolado (`POST .../branches/main/protection/required_status_checks/contexts`, que só mexe nos contextos). **Diferença entre o antes e o depois: dos 16 campos comparados, só `required_status_checks.contexts` e `required_status_checks.checks` mudaram (ganharam `segredos`); os outros 14 ficaram iguais**, inclusive `strict` (sim), aprovações exigidas (0), vale para administrador (sim), force push (não) e exclusão da branch (não). Contextos depois: `test`, `frontend`, `e2e`, `segredos`. A descrição da proteção no README foi atualizada no PR 4 (BUG-027) |
| F7-11 | **Adiar o salto do `jsdom` 29 para 30 e declarar como dívida técnica, sem prazo.** Fatos da consulta de 24/10/2026: versão do projeto 29.1.1, última publicada 30.1.3 (`npm view jsdom`), sem alerta de segurança no `jsdom`. O `.github/dependabot.yml` continua ignorando saltos maiores do `jsdom`. Nenhum código nem teste muda | (1) adiar e declarar (escolhida); (2) avaliar em PR nosso com a suíte completa do front | Entra no relatório final como dívida técnica |
| F7-12 | **Aplicar o ajuste da frase da linha 15 de `docs/prd/navegacao-telas.md`**: "Toda mensagem de recusa do servidor vem da tabela da seção 5; dicas de preenchimento e as mensagens de ação ausente aprovadas ficam na seção 9. O texto cru do back end nunca aparece na tela." Muda só essa frase, sem tocar em código nem teste. A F7-03 passa a referenciar o ajuste | (1) aplicar o ajuste (escolhida); (2) só declarar o desvio | **Aplicado** em `docs/prd/navegacao-telas.md`, linha 15 (PR de documentação); a F7-03 e `testes/revisao-assistida-front.md` referenciam o ajuste |
| F7-13 | **A janela inicial de 14 dias da Busca (`PaginaDeBusca.tsx:24`) continua declarada como suposição sem origem**, com o impacto (só a janela inicial; a pessoa pode alterá-la). Já registrada na F7-02; entra no relatório final como suposição, sem mudar código nem teste | (1) só declarar (escolhida); (2) registrar como decisão com a justificativa de Jefferson; (3) tornar configurável | Nenhuma mudança de código |

**Ação de Jefferson, não decidida por agente:** revogar o token antigo do SonarCloud. Continua pendente de confirmação dele em [fase-7-pendencias.md](fase-7-pendencias.md); nada é escrito como "feito" sem essa confirmação.

### F7-14. `unzip` no estágio de compilação do Dockerfile, para a soma do Maven valer (24/10/2026)

**Decisão da equipe (Jefferson), 24/10/2026**, entre alternativas conformes à especificação e ao plano mestre, apresentadas com custo e impacto. Origem: consequência da F7-06 descoberta no PR 75.

| ID | Decisão | Alternativas apresentadas | Como foi aplicado e o que fica declarado |
| --- | --- | --- | --- |
| F7-14 | **Instalar `unzip` no estágio de compilação do `Dockerfile` da API** (`apt-get install -y --no-install-recommends unzip`, limpando as listas do apt). **Uma soma só** (`distributionSha256Sum` do `.zip`), igual no Linux e no Windows. O PR 75 só é mesclado com `test`, `frontend`, `e2e`, `segredos` e SonarCloud verdes no commit final, **sem repetir job para mascarar falha**. A prova de que a CI barra soma errada (PR descartável 74) continua valendo | (1) instalar `unzip` (escolhida); (2) duas somas, com o Dockerfile usando a do `.tar.gz`; (3) compilar com a imagem oficial do Maven por digest; (4) desistir da soma e declarar SEC-03 como dívida | `test(red)` `9f941ef` visto vermelho por asserção (`MavenWrapperTest.dockerfileDaApiInstalaUnzipAntesDeRodarOMvnw`; os testes da imagem final sem `unzip` e das bases por digest nasceram verdes, por declaração); `feat(green)` `7cf3da6`. **Verificado localmente:** `MavenWrapperTest` 5 de 5; build completo da imagem com saída 0; `unzip` **ausente** na imagem final; as duas imagens-base seguem por digest. **Declarado, e levado ao README e ao relatório final:** (a) o pacote do apt **não tem versão fixada** no estágio de build (a imagem-base é fixada por digest); (b) em Linux sem `unzip`, o `mvnw` baixa o `.tar.gz`, cuja soma não confere com a do `.zip`, e falha fechado; (c) ligado ao BUG-027 (README) |

### F7-15. Três PRs do Dependabot ficam abertos até depois da tag (24/10/2026)

**Decisão da equipe (Jefferson), 24/10/2026**, entre mesclar os três agora, deixá-los abertos e fechá-los sem mesclar.

| ID | Decisão | Fatos da consulta de 24/10/2026 | Condição e declaração |
| --- | --- | --- | --- |
| F7-15 | **Deixar os PRs 81, 82 e 83 do Dependabot abertos até depois da tag, sem mesclar e sem fechar.** Razão: não alterar o `package-lock.json` do front entre a leitura final da cobertura (item 2.4) e a prova de clone limpo (item 2.7) | PR 81: `vite` 8.3.4 para 8.3.5 (patch). PR 82: `@tanstack/react-query` 5.104.4 para 5.104.5 (patch). PR 83: `typescript-eslint` 8.71.2 para 8.72.0 (minor). Os três em `frontend/`, com `test`, `frontend`, `e2e` e `segredos` verdes (o `segredos` rodou nos três, o que confirma o F7-10 para PRs do Dependabot). **Sem alerta de segurança:** 27 alertas abertos, todos em `.aiox-core/`, 0 em `frontend/` e 0 no Maven ([alertas-dependabot.md](testes/alertas-dependabot.md)) | **Se qualquer um virar alerta de segurança antes da tag, parar e avisar Jefferson.** Declarado no relatório final como atualização deliberadamente adiada |

### Risco aceito R-25: teste intermitente `NotificacaoApiIT.int01ECt103` (19/10/2026)

| Item | Registro |
| --- | --- |
| **Risco aceito R-25** | **Aceito por Jefferson em 19/10/2026**, depois de investigar (opção a). O teste `int01ECt103_resposta200MarcaEnviadaECorpoTemSoOContratoMinimo` falhou 2 vezes (18/10 e 19/10) em suítes completas, com `expected: 2 but was: 0`, e passou sozinho e em 6 rodadas controladas. **A causa não foi encontrada.** Nenhum teste nem o produto foi alterado por causa dele |
| O que se sabe | Na execução que falhou, o despacho encontrou as duas notificações e as duas chamadas ao WireMock estouraram o tempo de leitura de 1,5 s, que o `despachar()` conta como falha temporária (zero aceitas). O teste é o primeiro da classe, o mais lento em todas as rodadas (custo de partida a frio) |
| Hipótese que sobra, **sem prova** | Parada de mais de 3 s do WireMock ou do cliente HTTP na primeira chamada da classe |
| O que foi descartado | Corrida com o agendador (desligado nos testes); notificação "ainda não elegível" pelo relógio fixo; estado vazado de outro teste; atraso de 4 s do `int04` (roda depois); contexto Spring reaproveitado; carga de CPU sozinha (3 rodadas com os 4 núcleos saturados, 0 falhas); 3 ciclos completos sem carga, 0 falhas |
| Limite de 1,5 s | Valor inicial **"a validar"** do plano da equipe (ADR-007; `timeout-conexao` PT0.5S e `timeout-leitura` PT1.5S no `application.yml`). A especificação não define limites. Nenhuma validação foi feita |
| Conduta | A ocorrência segue vigiada em [ocorrencias-a-vigiar.md](testes/ocorrencias-a-vigiar.md) e entra no relatório final como risco aceito, com nome e motivo. **Se falhar na CI de um PR:** repetir o job uma única vez; se passar, mesclar e registrar a ocorrência 3 com o run das duas execuções; se falhar de novo, parar e avisar Jefferson com os logs, sem repetir mais. Falha de qualquer outro teste nunca entra nessa regra. **Na terceira ocorrência:** abrir BUG-xxx em `docs/defeitos/`, ligado ao RF-11, e levar a proposta (inclusive dar a cada teste o seu controle de tempo) antes de qualquer mudança. Proibido: `@Disabled`, aumentar espera, repetição automática dentro do teste |

### R-26. Limite de leitura de 10 s só nos testes de contrato da notificação (BUG-017, 22/10/2026)

Terceira ocorrência do R-25 (22/10/2026, suíte completa local). Opção B da proposta prevista no R-25, **escolhida por Jefferson em 22/10/2026**.

| Item | Registro |
| --- | --- |
| **Decisão** | `NotificacaoApiIT` sobrescreve **só** `app.notificacao.timeout-leitura` para `PT10S` no `@DynamicPropertySource`. O `int04` (resposta mais lenta que o limite) muda para a classe `NotificacaoTempoLimiteApiIT`, que **não registra** a propriedade e roda com o limite de produção (1,5 s). Nenhuma asserção do `int01` nem do `int04` mudou, e o corpo do `int04` é idêntico ao original (conferido por diff). **Mudança de localização do `int04` aprovada por Jefferson** |
| **Interpretação registrada** | Dar ao `int01` o limite de 10 s **não conta como "aumentar espera"** (proibição do R-25): o `int01` testa o contrato do corpo e o estado das notificações, não o tempo, e o tempo limite continua testado, com o valor de produção, no `int04`. Não há `@Disabled` nem repetição dentro do teste |
| **O que não mudou** | O produto e o limite de produção (`PT1.5S`, `PT0.5S`): `src/main` sem diff. O valor do limite segue lacuna (D3), "a validar" (ADR-007) |
| **Causa** | **Continua desconhecida.** A hipótese (parada de mais de 3 s do WireMock ou do cliente HTTP na primeira chamada, por coleta de lixo, antivírus ou agendamento do Windows) segue sem prova. A mudança reduz a exposição do `int01` a paradas menores que 10 s e **pode mascarar** a causa; **não** a corrige |
| **Estado do BUG-017** | **Mitigado**, não corrigido ([defeitos](defeitos/README.md), issue 39). Severidade Média, prioridade Média (rara, só em suíte completa local; passou na CI dos PRs 36, 37, 38 e 40) |
| **Estado do R-25** | **Permanece aberto** e entra no relatório final como risco aceito, com a causa desconhecida |
| **Se voltar a falhar** | Parar e avisar Jefferson com os logs. A regra de repetir o job da CI uma única vez continua valendo |

**Prova de que os testes continuam protegendo (quebras de propósito, ambas revertidas; `src/main` ficou sem diff):**

| Quebra | Teste esperado vermelho | Resultado |
| --- | --- | --- |
| Campo extra (`email`) no corpo enviado pelo adaptador | `NotificacaoApiIT.int01ECt103` | Vermelho por asserção, `containsExactlyInAnyOrder`, campo `email` inesperado (linha 176) |
| Remover `setReadTimeout` do adaptador | `NotificacaoTempoLimiteApiIT.int04` | Vermelho por asserção, `expected: 2` (linha 94) |

**Custo do contexto Spring extra (uma execução de cada, sem repetição; a máquina varia de uma rodada para outra, então a diferença não prova ganho nem perda):**

| Medida | Antes (`main`, `8ce9edf`) | Depois (`24095c4`) |
| --- | --- | --- |
| Suíte completa (`./mvnw -B -ntp clean verify`) | 10:36 min, 593 testes, 0 falhas | 9:48 min, 593 testes, 0 falhas |
| `NotificacaoApiIT` | 23,68 s (10 testes) | 12,02 s (9 testes) |
| `NotificacaoTempoLimiteApiIT` | não existia | 6,20 s (1 teste) |
| Soma das duas classes | 23,68 s | 18,22 s |

Nessa execução o contexto extra não apareceu como custo visível acima da variação da máquina.
