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
| Aceita em bloco | Jefferson autorizou o conjunto ("pode seguir com tudo, desde que esteja correto e de acordo com as nossas especificações", 17/10/2026) antes de ver a tabela item a item. **Ratificar** cada linha na próxima revisão deste arquivo |
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
| Acesso a dados por JDBC | ADR-013 | 15/10/2026 | Analista dentro da delegação do usuário | "A equipe pode revisar": ratificado em bloco em 17/10/2026 |

## 2. Decisões desta sessão (17/10/2026)

Cada linha traz a recomendação, a alternativa descartada, o motivo e a origem. Aceite: **em bloco por Jefferson,
17/10/2026**, a ratificar.

| ID | Decisão | Alternativa descartada | Motivo | Origem |
| --- | --- | --- | --- | --- |
| DS-01 | ADR-001 passa a "Aceito, emendado" pelos ADR-013 e ADR-014; o texto original fica preservado com uma nota de emenda | Marcar como "Substituído" | Seguem valendo o monólito de um artefato, o Spring Boot 3.x, a transação local e o domínio sem Spring. Só mudaram a estrutura de pacotes e o acesso a dados | ADR-014; ADR-013; código em `src/main` |
| DS-02 | `arquitetura.md`, seção 10.3, redesenhada com a estrutura MVC e os nomes reais de componente; tabela 10.4 acrescenta a integração e o relógio | Manter o diagrama hexagonal com uma tabela de correspondência | O diagrama divergia do código; a tabela sozinha obrigava o leitor a traduzir | Plano mestre, Bloco B; `ArquiteturaTest` |
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
