# Casos de teste

Casos de teste CT-xxx do back end, derivados de [regras-negocio.md](../prd/regras-negocio.md), [requisitos-funcionais.md](../prd/requisitos-funcionais.md), dos cenários CEN-01 a CEN-11 de [ciclo-00.md](../avaliacao-arquitetural/ciclo-00.md) e dos ADR. Estratégia, níveis e critérios em [plano-de-teste.md](../plano-de-teste.md). Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

## 1. Como ler

| Item | Significado |
| --- | --- |
| Nível | **U** unitário (domínio, sem Spring), **I** integração (PostgreSQL real em Testcontainers), **A** API em caixa-preta (MockMvc sobre o contexto completo e banco real), **C** concorrência (integração com banco real), **F** front end (Vitest e Testing Library, sem banco; a API é simulada na fronteira), **E** ponta a ponta (Playwright no Chromium, com PostgreSQL, API e front reais e sem mocks) |
| Dados | Fictícios. Horários em America/Sao_Paulo, salvo indicação. Nenhum dado pessoal real |
| Esperado | Resultado observável e mensurável. Contagens são verificadas por consulta ao banco, não só pela resposta |
| Rastreio | RF, RN, CEN e ADR que o caso cobre |
| Fatia | Fatia do plano em que o caso é implementado (4.1 a 4.11) |

Valores marcados como **valor de teste** existem só na configuração de teste e **não** são valores de produção. Eles não resolvem as lacunas D1, D3, D4 e D17.

## 2. Dados de teste padrão

| Item | Descrição |
| --- | --- |
| Sala A | Capacidade e localização fictícias, janela 07:00 às 22:00, segunda a sexta |
| Sala B | Sem restrição, mesma janela da Sala A |
| Professor 1 | Sem vínculo com usuário |
| Professor 2 | Vinculado ao Solicitante 1 |
| Projetor P-001 | Material com patrimônio, **restrito** |
| Notebook N-001 e N-002 | Materiais com patrimônio, não restritos |
| Solicitante 1 e 2 | Usuários com perfil Solicitante |
| Responsável 1 e 2 | Usuários com perfil Responsável |
| Administrador 1 | Usuário com perfil Administrador |
| 20/10/2026 | Terça-feira. 21/10 é quarta, 24/10 é sábado e 25/10 é domingo |

Instante atual nos testes: sempre um `Clock` fixo, nunca `Instant.now()` nem `Thread.sleep` (ADR-005).

## 3. Casos por fatia

### 3.1 Fatia 4.1: fundações, login e perfis (RF-01, RF-13, RF-15)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-001 | Login válido abre sessão com um perfil | A | 1) Cadastrar Solicitante 1. 2) POST login com credenciais corretas | 200, token opaco, exatamente 1 perfil, 1 linha em `sessoes` com só o hash | RF-01, RN-17, ADR-004 |
| CT-002 | Login inválido não cria sessão | A | 1) POST login com senha errada | 401, 0 linhas novas em `sessoes`, corpo sem detalhe interno | RF-01, RNF-07 |
| CT-003 | Requisição sem token | A | 1) GET reservas sem cabeçalho de autorização | 401 e 0 alterações no banco | RF-01 |
| CT-004 | Expiração da sessão em trinca | U e A | Sessão expira às 15:00:00 pelo valor de teste. Relógio em 14:59:59.999, 15:00:00 e 15:00:00.001 | Aceita, recusada (401), recusada (401) | RF-01, RF-13, ADR-004 |
| CT-005 | Sessão revogada deixa de valer | A | 1) Login. 2) Administrador 1 desativa o usuário (revoga). 3) Usar o token | 401 na requisição seguinte | RF-01, RN-29, ADR-004 |
| CT-006 | Erro com código estável e sem vazamento | A | 1) Provocar recusa por regra. 2) Provocar exceção interna | Corpo com `code` estável e mensagem do motivo; 0 ocorrências de pilha, nome de tabela ou segredo | RF-13, RNF-07, ADR-008 |
| CT-007 | Constraint de exclusão impede sobreposição | I | 1) Inserir ocupação da Sala A 14:00–16:00 ativa. 2) Inserir 15:00–17:00 ativa | Segunda inserção falha com violação de exclusão; 1 linha ativa | RN-03, RN-11, ADR-003 |
| CT-008 | Fronteira semiaberta no banco | I | 1) Ocupação 14:00–16:00. 2) Inserir 16:00–18:00 | Aceita; 2 linhas ativas, sem conflito | RN-11, ADR-003 |
| CT-009 | Ocupação inativa não conflita | I | 1) Ocupação 14:00–16:00 inativa. 2) Inserir 14:00–16:00 ativa | Aceita | RN-03, ADR-003 |
| CT-010 | CHECKs do esquema | I | Inserir reserva com fim igual ao início; ocupação com `reserva_id` e `bloqueio_id` ambos nulos e ambos preenchidos | As três inserções falham | RN-01, ADR-002 |
| CT-011 | Auditoria somente inserção | I | 1) Inserir evento. 2) UPDATE e DELETE sobre ele | As duas operações falham; 1 linha inalterada | RN-08, RF-10, ADR-006 |
| CT-012 | Usuário com exatamente um perfil | A | Administrador 1 cria usuário com perfil Responsável; depois tenta atribuir um segundo perfil | Criação 201; segundo perfil recusado; 1 perfil gravado | RF-15, RN-17 |
| CT-013 | Só o Administrador gere usuários | A | Solicitante 1 e Responsável 1 tentam criar usuário | 403 em ambos e 0 usuários novos | RF-15, RN-17 |
| CT-014 | Dois Responsáveis cadastráveis | A | Cadastrar Responsável 1 e 2 | Ambos gravados | RF-15, RN-16 |
| CT-015 | Desativação de usuário com restrições | A | 1) Desativar o penúltimo Responsável. 2) Desativar usuário com reserva futura | 409 com a lista, nada muda; sem pendência, desativa e revoga sessões | RN-16, D14 |
| CT-016 | Auditoria de usuários e perfis | I | Criar, alterar perfil e desativar usuário | 1 evento por operação, com ator, antes e depois | RF-15, RN-29 |

### 3.2 Fatia 4.2: cadastro e pesquisa (RF-02, RF-03)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-017 | Sala exige todos os campos | A | Parametrizado: sem capacidade, sem localização, sem abertura, sem fechamento, sem dia de funcionamento | Erro de validação em cada caso; 0 salas gravadas | RF-02, RN-14 |
| CT-018 | Sala válida | A | Sala A com capacidade, localização, 07:00–22:00 e seg–sex | 201 e aparece na consulta com os atributos informados | RF-02 |
| CT-019 | Material exige patrimônio único | A | 1) N-001 sem patrimônio. 2) N-001 com patrimônio novo. 3) Outro com o mesmo patrimônio | Recusado; aceito; recusado | RF-02, RN-12 |
| CT-020 | Professor sem usuário | A | Cadastrar Professor 1 sem vínculo | 201, sem usuário | RF-02, RN-13 |
| CT-021 | Vínculo não altera perfil | A | Vincular Professor 2 ao Solicitante 1 | Perfil do usuário continua Solicitante | RF-02, RN-13 |
| CT-022 | Alterar "restrito" não altera reservas | I | 1) Reserva com P-001 (exige aprovação). 2) Administrador 1 desmarca P-001 | `exige_aprovacao` da reserva continua verdadeiro; 0 reservas alteradas | RF-02, RN-10 |
| CT-023 | Desativar recurso com reserva futura | A | 1) Sala A com reserva APROVADA em 20/10/2026. 2) Desativar a Sala A em 15/10/2026 | 409 com a lista; recurso continua ativo | RN-32, D6 |
| CT-024 | "Reserva futura" é término posterior ao instante | U | Reserva termina em 14:00 e relógio em 13:59:59, 14:00:00 e 14:00:01 | Impede, não impede, não impede | RN-32, D11 |
| CT-025 | Desativar recurso sem reserva futura | A | N-001 só com reserva CONCLUÍDA | 200; some das buscas; histórico consultável | RN-32, RF-02 |
| CT-026 | Auditoria de cadastro | I | Criar, alterar e desativar a Sala A | 1 evento por operação | RF-02, RN-29 |
| CT-027 | Filtros de pesquisa | A | Parametrizado: tipo, capacidade mínima, localização, competência | 0 resultados que não satisfaçam o filtro, por filtro | RF-03 |
| CT-028 | Disponibilidade na fronteira | A | Sala A reservada 14:00–16:00. Consultar 16:00–18:00 e 15:59–18:00 | Sala A devolvida; Sala A não devolvida | RF-03, RN-11 |
| CT-029 | Bloqueio cobre o intervalo | A | Bloqueio da Sala A 08:00–12:00 em 21/10/2026. Consultar 11:00–13:00 | Sala A não devolvida como disponível | RF-03, RN-04 |
| CT-030 | Janela e dia de funcionamento | A | Consultar 06:00–08:00, 21:00–23:00 e sábado 24/10/2026 | Sala A não devolvida nos três | RF-03, RN-14 |
| CT-031 | Disponibilidade sem identificar o dono | A | Solicitante 2 consulta horário ocupado pelo Solicitante 1 | 0 identificações do dono na resposta | RF-03, RN-26 |
| CT-032 | Recurso desativado fora da busca | A | Desativar N-002 e pesquisar | N-002 não devolvido | RF-03 |

### 3.3 Fatia 4.3: domínio de reservas (RF-04, RF-05)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-033 | Término posterior ao início | U | Parametrizado: 14:00–16:00 aceita; 14:00–14:00 e 16:00–14:00 recusadas | 0 reservas nas recusas; código estável | RN-01, RF-04 |
| CT-034 | Conflito em trinca | U | Existente 14:00–16:00. Novo: 16:00–18:00, 15:59–18:00, 12:00–14:00, 12:00–14:01 | Sem conflito; conflito; sem conflito; conflito | RN-11, RN-02, RF-05 |
| CT-035 | Conflito por tipo de recurso | U | Mesmos casos de CT-034 para sala, professor e material | Resultado idêntico nos três tipos | RF-05, RN-02 |
| CT-036 | Janela da sala | U | 20/10/2026: 07:00–22:00 aceita; 06:00–08:00, 21:00–23:00 recusadas; 23:00–01:00 recusada | Aceita; recusadas; cruzar a meia-noite recusado | RN-14, S3 |
| CT-037 | Dia sem funcionamento | U | Sala A em 24/10/2026 (sábado) e 25/10/2026 (domingo) | Recusada nos dois | RN-14 |
| CT-038 | Armazenamento em UTC | I | Reserva às 14:00 locais | Gravada como o instante UTC correspondente e devolvida como 14:00 local | RN-15 |
| CT-039 | Início no passado em trinca | U | Relógio em 14:00:00. Início às 13:59:59.999, 14:00:00 e 14:00:00.001 | Recusado, recusado, aceito | D16, RN-01 |
| CT-040 | Reserva sem recurso restrito | A | Solicitante 1 reserva Sala A e N-001 | SOLICITADA e depois APROVADA; 2 eventos; ator do segundo é SISTEMA | RN-09, RF-04 |
| CT-041 | Reserva com recurso restrito | A | Solicitante 1 reserva Sala A e P-001 | Permanece SOLICITADA; `exige_aprovacao` verdadeiro | RN-10, RN-09 |
| CT-042 | Valor do cliente é ignorado | A | Corpo com `exigeAprovacao` falso e P-001 | `exige_aprovacao` verdadeiro | RN-10, RF-04 |
| CT-043 | Administrador não reserva | A | Administrador 1 cria reserva | 403 e 0 reservas | RN-17, RF-01 |
| CT-044 | Responsável também reserva | A | Responsável 1 reserva Sala A | 201 e dono é o Responsável 1 | B1, RN-16 |
| CT-045 | Alteração só de título | A | Reserva APROVADA com P-001; mudar título | Continua APROVADA; 1 evento de alteração | RN-19, RF-04 |
| CT-046 | Alteração de período reaprova | A | Reserva APROVADA com P-001 14:00–16:00 muda para 15:00–17:00 sem conflito | Volta a SOLICITADA; 1 evento; notificação pendente | RN-19 |
| CT-047 | Alteração com conflito não muda nada | I | Sala A ocupada 15:00–17:00; mudar outra reserva para esse horário | 409; ocupações e estado idênticos aos anteriores | RN-19, RF-04 |
| CT-048 | Alteração com recurso restrito (D12) | A | Reserva APROVADA sem restrito; acrescentar P-001, com `exigeAprovacao` falso no corpo | Volta a SOLICITADA; `exige_aprovacao` verdadeiro | RN-10, D12, CEN-11 |
| CT-049 | Remoção do último restrito (D12) | A | Reserva SOLICITADA só com P-001; remover P-001 | Vai a APROVADA com ator SISTEMA | D12, RN-09 |
| CT-050 | Alteração em EM_USO ou terminal | A | Parametrizado: EM_USO, CONCLUÍDA, cancelada | Recusada em todos; 0 mudanças | RN-19 |
| CT-051 | Alteração só pelo dono, até o início | U | Relógio 13:59:59.999, 14:00:00 e 14:00:00.001; início 14:00 | Aceita, recusada, recusada | D10, RN-19 |
| CT-052 | Cancelamento por estado e perfil | U | Tabela estado × perfil de RN-18, parametrizada | Resultado conforme RN-18 em todas as combinações | RN-18, RF-04 |
| CT-053 | Cancelamento pelo dono em trinca | U | Mesmo relógio de CT-051 | Aceito, recusado, recusado | D10, RN-18 |
| CT-054 | Cancelamento exige motivo de terceiros | A | Administrador 1 cancela SOLICITADA do Solicitante 1 sem e com motivo | Recusado; aceito | RN-18 |
| CT-055 | Cancelada continua consultável | A | Cancelar e consultar | Estado cancelada e motivo presentes; 0 linhas removidas | RN-27, RF-04 |
| CT-056 | Não existe exclusão de reserva | A | DELETE em reserva em cada estado | Sem rota de exclusão; 0 linhas removidas | RN-07, RN-27 |
| CT-057 | Professor ocupado | I | Professor 1 alocado 14:00–16:00 na Sala A; reservar Sala B 15:00–17:00 com Professor 1 | 409 identificando o professor; 1 tentativa SOBREPOSICAO | RF-05, RN-02, CEN-03 |
| CT-058 | Professor vinculado alocado por si | A | Solicitante 1 reserva aula com Professor 2; depois outra com Professor 2 no mesmo horário | Primeira aceita; segunda 409 | RN-13, RF-05 |
| CT-059 | Recusa gera tentativa de conflito | I | Uma recusa por sobreposição | Exatamente 1 linha em `tentativas_conflito` | RN-30, RF-05 |

### 3.4 Fatia 4.4: concorrência (RF-06)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-060 | Solicitações simultâneas para a mesma sala | C | **Hipótese**: 20 solicitações com `CountDownLatch` para Sala A, 14:00–16:00 | Exatamente 1 aceita e 19 com 409; 1 ocupação ativa; 19 tentativas CONCORRENCIA | RF-06, RN-03, CEN-01 |
| CT-061 | Simultâneas para o mesmo professor | C | Mesma estrutura de CT-060 com o Professor 1 em salas diferentes | 1 aceita e 19 com 409; 1 ocupação ativa do professor | RF-06, RN-02, CEN-01 |
| CT-062 | Estabilidade em repetição | C | **Hipótese**: CT-060 cinco vezes seguidas | 5 de 5 verdes; 0 casos de duas reservas ativas sobrepostas | RF-06, CEN-01 |
| CT-063 | Prova de que o teste protege | C | Executar CT-060 com a constraint removida em ambiente descartável | Vermelho (mais de 1 aceita); verde ao restaurar | RF-06, ADR-003 |
| CT-064 | Reserva com vários recursos em ordens opostas | C | Transação A: Sala A e P-001. Transação B: P-001 e Sala A, simultâneas | 1 aceita, 1 com 409; 0 impasse não tratado | R-17, ADR-003 |
| CT-065 | Tentativa gravada fora da transação desfeita | I | Recusa por conflito | Tentativa persistida mesmo com a reserva desfeita | RN-30, ADR-003 |

### 3.5 Fatia 4.5: estados, aprovação e manutenção (RF-07, RF-08, RF-16)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-066 | Responsável aprova reserva de outro | A | Reserva do Solicitante 1 com P-001; Responsável 1 aprova | APROVADA; 1 evento com o ator | RN-06, RF-07 |
| CT-067 | Quem não pode aprovar | A | Parametrizado: Solicitante 1, Administrador 1, Responsável dono | 403 em todos; estado inalterado | RN-06, RN-16, RN-17 |
| CT-068 | Rejeição exige motivo | A | Responsável 2 rejeita sem e com motivo | Erro de validação e SOLICITADA; depois rejeitada | RN-24, RF-07 |
| CT-069 | Quem pode rejeitar | A | Parametrizado: dono Responsável, Solicitante, Administrador | 403; o dono cancela a própria | RN-33, RN-18 |
| CT-070 | Fila de aprovações | A | Uma reserva com P-001 e outra sem restrito | 1 na fila; 0 reservas sem restrito | RF-07, RN-09 |
| CT-071 | Aprovação no instante de início | U | Início 14:00. Relógio 13:59:59.999 e 14:00:00 | Aceita; 409 | D2, D10, RN-25 |
| CT-072 | SEM_DECISAO no instante de início | I | Reserva SOLICITADA com início 14:00; job em 13:59:59.999 e 14:00:00 | Nada; cancelada com SEM_DECISAO e ator SISTEMA | RN-25, D2, CEN-10 |
| CT-073 | Job idempotente | I | Duas execuções seguidas e duas simultâneas | 1 evento e 1 notificação por reserva | RN-25, CEN-10, R-22 |
| CT-074 | Job não toca reserva APROVADA | I | Reserva APROVADA com início passado | Estado inalterado | RN-25 |
| CT-075 | Transições proibidas | U | Tabela da seção 3.2 de [regras-negocio.md](../prd/regras-negocio.md), parametrizada | Recusa em todas; 0 mudanças de estado | RN-05, RF-16 |
| CT-076 | Bloqueio sem reservas | A | Administrador 1 bloqueia Sala A em 21/10/2026 08:00–12:00 | 201 e ocupação do bloqueio ativa | RF-08, RN-04 |
| CT-077 | Bloqueio sobre reservas pede confirmação | A | Duas reservas APROVADA no período | 409 com a lista; bloqueio não gravado | RF-08, RN-22 |
| CT-078 | Confirmação cancela por inteiro | A | Confirmar. Uma reserva tem Sala A e P-001 | Ambas canceladas com MANUTENCAO; P-001 livre; 1 evento e 1 notificação por reserva | RF-08, RN-22, D7 |
| CT-079 | Bloqueio com reserva EM_USO | A | Reserva EM_USO no período | Recusado, sem opção de forçar; nada muda | RN-22, RN-07 |
| CT-080 | Bordas do bloqueio | U | Bloqueio 08:00–12:00. Reservas 07:00–08:00, 12:00–14:00, 11:00–13:00 | Aceita, aceita, recusada | RN-04, RN-11, CEN-07 |
| CT-081 | Nova reserva em recurso bloqueado | A | Reservar Sala A 11:00–13:00 | 409 MANUTENCAO; 1 tentativa MANUTENCAO | RN-04, RN-30 |
| CT-082 | Levantar bloqueio | A | Administrador 1 levanta o bloqueio com motivo | Período volta a ser reservável; reservas canceladas continuam canceladas; 1 evento | D15, RN-22 |
| CT-083 | Só o Administrador gere bloqueio | A | Solicitante 1 e Responsável 1 criam e levantam bloqueio | 403 | RN-17, RF-08 |

### 3.6 Fatia 4.6: retirada e devolução (RF-09, RF-16)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-084 | Primeira retirada leva a EM_USO | A | Reserva APROVADA com P-001; Responsável 1 registra a retirada | EM_USO; retirada com unidade, quem e quando | RF-09, RN-20 |
| CT-085 | Início de uso sem material | A | Reserva APROVADA só com Sala A | EM_USO | RF-16, RN-20 |
| CT-086 | Início só em APROVADA | U | Parametrizado: SOLICITADA, EM_USO, terminais | Recusado em todos | RF-16, RN-20 |
| CT-087 | Quem registra o início | A | Solicitante 1 tenta registrar | 403 | RN-20 |
| CT-088 | Devolução sem retirada | A | Devolver N-001 não retirada | Recusada | RF-09, RN-23 |
| CT-089 | Conclusão com material pendente | A | P-001 retirado e não devolvido | Recusada com a lista de unidades pendentes | RN-23, RF-09 |
| CT-090 | Conclusão com tudo devolvido | A | P-001 retirado e devolvido | CONCLUÍDA; 1 evento | RN-23 |
| CT-091 | Conclusão sem material retirado | A | P-001 reservado e nunca retirado | CONCLUÍDA | RN-23, C3 |
| CT-092 | Responsável dono opera a própria reserva | A | Responsável 1 registra retirada, devolução e conclusão da própria reserva | Aceito, com ator auditado | D13, RN-16 |
| CT-093 | Não compareceu em trinca | U | Início 14:00, tolerância de teste T. Relógio em início+T menos 1 ms, em início+T e depois | Recusado, aceito, aceito | RN-21, RF-16 |
| CT-094 | Não compareceu em outros estados | U | SOLICITADA e EM_USO | Recusado | RN-21 |
| CT-095 | Histórico de retirada e devolução | A | Consultar o histórico da reserva | Retirada e devolução presentes | RF-09, RF-10 |

### 3.7 Fatia 4.7: auditoria (RF-10)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-096 | Um evento por transição | I | Percorrer SOLICITADA, APROVADA, EM_USO e CONCLUÍDA | Exatamente 1 evento por transição, com anterior, novo, ator e instante | RN-08, RF-10, CEN-06 |
| CT-097 | Falha ao auditar desfaz a transição | I | Injetar falha na gravação do evento | Estado da reserva inalterado; 0 eventos | RN-08, CEN-06 |
| CT-098 | Ator SISTEMA | I | Aprovação automática e SEM_DECISAO | Evento com tipo de ator SISTEMA e `ator_id` nulo | RN-09, RN-25 |
| CT-099 | Auditoria de cadastros, usuários e bloqueios | I | Uma operação por tipo de entidade | 1 evento com ator, entidade, antes e depois | RN-29, RF-10 |
| CT-100 | Visibilidade da auditoria | A | Responsável 1 e Administrador 1 abrem a auditoria completa | 403; 200 | RF-10, RN-26 |
| CT-101 | Histórico de reserva encerrada | A | Reserva rejeitada, cancelada e CONCLUÍDA | Histórico consultável nos três | RF-10, RN-27 |

### 3.8 Fatia 4.8: notificação (RF-11)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| INT-01 | Resposta 200 válida | I | WireMock responde 200 | Notificação ENVIADA | RN-28 |
| INT-02 | Resposta 404 | I | WireMock responde 404 | Erro próprio do domínio, sem repetir a chamada na mesma tentativa; registrada | RN-28 |
| INT-03 | Resposta 500 | I | WireMock responde 500 | Reserva continua válida; notificação PENDENTE com próxima tentativa | RN-28, CEN-05 |
| INT-04 | Resposta mais lenta que o limite | I | WireMock com atraso acima do limite de teste (`NotificacaoTempoLimiteApiIT`, com o limite de produção; antes em `NotificacaoApiIT`, movido no BUG-017) | Interrompe dentro do limite; PENDENTE | RN-28, CEN-05 |
| INT-05 | JSON inválido ou campo ausente | I | WireMock responde corpo malformado | Conteúdo rejeitado; correlação registrada | RN-28 |
| INT-06 | Provedor devolve o próprio token | I | WireMock devolve o token no corpo do erro | 0 ocorrências do token na resposta da API e no log | RNF-07, CEN-09 |
| CT-102 | Destinatários por evento | I | Pendente, aprovada, rejeitada, cancelada | Pendente para cada Responsável; os demais para o Solicitante | RF-11, RN-28 |
| CT-103 | Corpo mínimo | I | Capturar o POST | Só tipo, id da reserva, id do destinatário, instante e chave de idempotência | RF-11, RN-28 |
| CT-104 | Envio depois do commit | I | Falhar a transação depois de gravar a linha | 0 chamadas ao provedor; 0 linhas persistidas | RN-28, ADR-007 |
| CT-105 | Reenvio com a mesma chave | I | Falha seguida de sucesso | 2 tentativas registradas; mesma chave; 1 efeito | RN-28, CEN-05 |
| CT-106 | Troca do provedor | U | Substituir o adaptador por outro na porta | Nenhum teste de domínio e nenhum contrato alterado | CEN-08 |

### 3.9 Fatia 4.9: relatórios (RF-12)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-107 | Carga horária | I | APROVADA 14:00–16:00 em 20/10/2026 | 2 horas no período de 20/10/2026 | RN-31, RF-12 |
| CT-108 | Estados que contam | I | SOLICITADA, APROVADA, EM_USO, CONCLUÍDA, cancelada | Só APROVADA, EM_USO e CONCLUÍDA somam | RN-31 |
| CT-109 | Parte interna do período | I | Reserva APROVADA 14:00–16:00 em 20/10/2026 e filtro de 15:00 às 18:00 do mesmo dia | 1 hora conta, e não 2 | RN-31 |
| CT-110 | Utilização só de salas | I | Sala A com 7 horas alocadas em dia de 15 horas de funcionamento | Utilização conforme a divisão; professor e material sem utilização | RN-31, C5 |
| CT-111 | Conflitos evitados | I | Tentativas dos três motivos, por solicitante, recurso e período | Contagem total e distinta conferida contra o banco | RN-30, RN-31 |
| CT-112 | Filtros e paginação | A | Filtros de período, tipo e recurso; páginas | Só o que satisfaz; páginas completas e sem repetição | RF-12 |
| CT-113 | Acesso ao relatório | A | Responsável, Administrador e Solicitante | 200; 200 somente leitura; 403 | RN-26, D5 |

### 3.10 Fatia 4.10: documentação da API (RF-14)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-114 | Contrato publicado | A | Obter o documento OpenAPI | Toda operação com perfis, parâmetros, respostas e códigos de erro | RF-14 |
| CT-115 | Contrato corresponde ao comportamento | A | Comparar as respostas reais ao contrato | 0 divergências | RF-14, R-15 |
| CT-116 | Documentação sem segredo | A | Procurar valores sensíveis no documento | 0 ocorrências | RF-14 |

### 3.11 Fatia 4.11: autorização completa (RF-01)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-117 | Matriz perfil × operação | A | Toda operação da API contra os três perfis, parametrizada | Resultado conforme `docs/testes/matriz-autorizacao.md`, criada na fatia 4.11: 0 falhas | RF-01, RNF-06, CEN-02 |
| CT-118 | Reserva de outro usuário | A | Solicitante 2 lê, altera e cancela reserva do Solicitante 1 | 403 ou 404 sem dados; 0 mudanças | RF-01, RN-26 |
| CT-119 | Token inválido, ausente, revogado, expirado | A | Quatro situações em toda rota protegida | 401 em todas | RF-01 |
| CT-120 | Entrada inválida | A | Campo ausente, tamanho, tipo e injeção em filtros | Erro de validação; 0 pilhas; 0 efeitos | RNF-07, RF-13 |
| CT-121 | Nenhum vazamento de terceiros | A | Mensagens de erro de recusa | 0 identificações de terceiros | RF-13, B3 |
| CT-122 | Primeiro Administrador | I | Tabela de usuários vazia; semear o primeiro Administrador duas vezes, com e-mails diferentes | A primeira chamada cria 1 Administrador com e-mail normalizado e 1 evento de auditoria com ator SISTEMA; a segunda não cria nada | RF-15, RN-17, RN-29, ADR-004 |

### 3.12 Fase 6: apoio ao front end (F6-06)

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-123 | Listagem de bloqueios vazia | A | Administrador autenticado, nenhum bloqueio cadastrado, `GET /api/bloqueios` | 200 e lista com 0 itens | RF-08, F6-06a |
| CT-124 | Listagem de bloqueios | A | Dois bloqueios de uma sala, um deles levantado; `GET /api/bloqueios` | 200 com 2 itens em ordem de início, com `ativo` falso para o levantado e os campos do contrato; a linha "Listar bloqueios" da matriz de autorização recusa Solicitante e Responsável com 403 | RF-08, RN-22, F6-06a |
| CT-125 | Fila com o nome do solicitante | A | Solicitante com nome e e-mail conhecidos reserva um recurso restrito; Responsável consulta a fila | 1 item com `solicitanteNome` igual ao nome e 0 ocorrências do e-mail ou do campo `email` no corpo | RF-07, RN-26, B3, F6-06b |
| CT-126 | Fila: perfil proibido e sem sessão | A | `GET /api/reservas/fila` por Solicitante, por Administrador e sem token | 403 com `ACESSO_NEGADO` para os dois perfis e 401 com `NAO_AUTENTICADO` sem token | RF-01, RF-07, F6-06b |
| CT-134 | Campos obrigatórios das respostas no contrato | A | Cenário real com os 12 esquemas de resposta (login, usuários, recursos dos três tipos, reservas com e sem descrição e motivo, fila, retirada de material, bloqueio, auditoria, relatório, ocupações); `required` de cada esquema no `/v3/api-docs` contra a lista decidida e contra as respostas reais (`ContratoObrigatoriosApiIT`) | O `required` de cada esquema é exatamente a lista decidida, e todo campo obrigatório está presente e não nulo em toda resposta real | RF-14, R-15, F6-10 |
| CT-135 | Campos de fora realmente faltam | A | Mesmo cenário; para cada campo deixado de fora que tem amostra natural, procura uma resposta real sem o campo | Cada campo de fora falta em ao menos uma resposta real, então a exclusão se justifica | RF-14, R-15, F6-10 |

### 3.13 Fase 6: front end (etapa 6.B)

Testes de `frontend/src`. O nome do arquivo está na coluna de passos; o resultado vem da execução registrada na RTM.

| ID | Título | Nível | Dados e passos | Esperado | Rastreio |
| --- | --- | --- | --- | --- | --- |
| CT-127 | Mapa de erros: código estável para mensagem | F | Os 34 códigos de `CodigoErro.java` e a tabela da seção 5.1 de `navegacao-telas.md` (`erros/mensagens.test.ts`, `erros/problema.test.ts`) | Cada código tem a mensagem e a ação documentadas; código desconhecido, resposta sem código e falha de rede têm mensagem própria; o texto cru do servidor nunca é guardado | RF-13, ADR-008, F6-05 |
| CT-128 | Sessão no sessionStorage | F | Guardar, ler, expirar (um segundo antes, no limite, depois), valor corrompido, armazenamento indisponível, só o módulo de sessão toca o armazenamento, sem HTML injetado (`sessao/*.test.ts`) | Token só no sessionStorage; sessão inválida ou expirada é apagada; sem armazenamento a sessão segue na memória da aba | RF-01, RF-13, ADR-004, ADR-015, F6-02 |
| CT-129 | Cliente da API e ciclo da sessão | F | Cabeçalho `Authorization`, 401 em rota autenticada e no login, `executar`, entrar, sair com e sem resposta do servidor (`api/cliente.test.ts`, `autenticacao/ProvedorDeSessao.test.tsx`) | Token enviado só com sessão; 401 apaga a sessão e avisa a interface; login sem token nunca vira sessão; sair apaga a sessão local mesmo sem resposta | RF-01, RF-13, ADR-004, F6-01, F6-02 |
| CT-130 | Contraste dos tokens nos dois temas | F | 22 pares de cor em 3 blocos de `tokens.css`: tema claro, escuro pela preferência e escuro pela escolha (`estilo/tokens.test.ts`, `estilo/contraste.test.ts`, `estilo/regras-dos-temas.test.ts`) | Texto com no mínimo 4,5:1; foco, bordas de campo, indicador e botão com no mínimo 3:1; blocos escuros iguais; nenhuma cor fixa fora de `tokens.css` | RF-13, RNF-10, F6-07, F6-09 |
| CT-131 | Tema claro, escuro ou do sistema | F | Escolher, sistema, valor inválido, aplicar ao abrir, armazenamento indisponível, seletor com `aria-pressed` (`estilo/tema.test.ts`, `layout/SeletorDeTema.test.tsx`) | Só a escolha fica no navegador; sem escolha vale `prefers-color-scheme` | RF-13, F6-09 |
| CT-132 | Telas e acesso por perfil iguais à matriz | F | Matriz da seção 3 de `navegacao-telas.md` contra o código; rotas protegidas; redirecionamentos; 404; sair (`rotas/*.test.ts(x)`, `Rotas.test.tsx`) | Cada perfil vê exatamente as telas da matriz; perfil proibido vê a mensagem de acesso negado; sem sessão vai ao login; a decisão final continua no servidor | RF-01, RN-17, ADR-004, F6-08 |
| CT-133 | Navegação lateral e barra do celular | F | Itens com rótulo de texto, `aria-current`, barra com no máximo 4 itens e "Mais", Escape devolve o foco (`layout/Navegacao.test.tsx`) | A barra mostra até 4 telas e "Mais" abre as demais; tudo opera por teclado | RF-13, F6-08 |
| CT-136 | Datas no fuso do campus | F | ISO-8601 com offset, ida e volta, intervalo legível, soma de dias e virada do horário de verão de outro fuso, em trinca (`datas/fuso.test.ts`, `recursos/formatacao.test.ts`) | O offset sai do fuso e não está fixo no código; hora exibida sempre na do campus | RF-13, ADR-005, F6-04 |
| CT-137 | Componentes de interface acessíveis | F | `Aviso`, `Campo`, `Botao`, `Carregando` e `EstadoVazio` com auditoria axe (`ui/*.test.tsx`) | Papel ARIA correto, rótulo em texto, erro e ajuda lidos junto ao controle, envio sem clique duplo, 0 violações no axe | RF-13, F6-08 |
| CT-138 | Busca de recursos (T02) | F | Resultados, contagem anunciada, filtros no endereço, período com offset, início sem fim, limpar, vazio, recusas, Reservar e horários ocupados (`paginas/busca/*.test.tsx`) | O front mostra o que o servidor devolve e nunca decide disponibilidade; erro só por mensagem da tabela, sem texto cru; horários sem dono | RF-03, RF-13, B3, ADR-005 |
| CT-139 | Nova reserva (T03) | F | Período, recursos livres agrupados, pré-seleção, aviso de recurso não livre, envio, confirmação pelo estado do servidor, clique duplo, foco, recusas por código, campos inválidos, rede e lista refeita após conflito (`paginas/reserva/*.test.tsx`) | A confirmação vem do estado devolvido (SOLICITADA ou APROVADA) e o front não decide sobreposição nem aprovação; nada digitado se perde numa recusa | RF-04, RF-05, RF-07, RF-13, ADR-004 |
| CT-140 | Foco, título e telas reais nas rotas | F | Troca de tela move o foco ao conteúdo sem roubá-lo na abertura nem ao mudar só os filtros; título por tela; ícone do calendário com foco visível (`Rotas.test.tsx`, `ui/foco-do-calendario.test.ts`) | Teclado nunca fica no corpo da página; cada tela tem título; o foco no ícone do calendário é visível nos dois temas | RF-13, F6-08 |
| CT-141 | Login (T01) | F | Estrutura e `autocomplete`, mostrar senha, envio, clique duplo, campos em branco, recusa sem dizer qual campo errou, foco, tabela de mensagens, destino depois do login sem redirecionamento aberto, aviso de sessão terminada e login nas rotas (`paginas/entrada/*.test.tsx`, `rotas/destino.test.ts`, `autenticacao/ProvedorDeSessao.test.tsx`, `Rotas.test.tsx`) | O e-mail é cortado nas pontas e a senha vai como digitada; recusa mostra só a mensagem da tabela e apaga a senha; o destino é sempre endereço interno de tela que o perfil vê; sessão encerrada pelo servidor leva ao login com aviso, e sair por vontade própria não | RF-01, RF-13, ADR-004, ADR-015, F6-11 |
| CT-142 | Reservas (T04) | F | Lista com título, período no fuso do campus, estado em texto e nomes dos recursos; contagem; vazio, recusa, rede e tentar de novo; reserva cancelada continua listada com o motivo (motivos do sistema em texto); Alterar e Cancelar aparecem conforme `podeAlterar` e `podeCancelar` devolvidos pelo servidor (F6-14), sem olhar estado nem perfil, e o Administrador sem Alterar vem do campo; reserva Solicitada, Aprovada ou Em uso sem nenhuma ação mostra "Você não pode alterar nem cancelar esta reserva agora.", lida junto com o cartão, e reserva encerrada fica sem mensagem; diálogo de confirmação (foco entra e volta, Tab preso, Escape); cancelamento com motivo e sem clique duplo; recusas por código (MOTIVO_OBRIGATORIO, RESERVA_JA_INICIADA, TRANSICAO_PROIBIDA, ACESSO_NEGADO, NAO_ENCONTRADO, ERRO_INTERNO, rede) e lista refeita quando o estado mudou (`paginas/reservas/*.test.tsx`, `Rotas.test.tsx`) | O front mostra o estado devolvido e nunca decide por relógio, dono ou regra de negócio; a recusa vem do servidor, como mensagem da tabela de erros, com o diálogo aberto e o foco na mensagem; reserva cancelada não some da lista | RF-04, RF-13, RN-07, RN-18, RN-26, RN-27, ADR-004, ADR-008, F6-11 |
| CT-143 | Alteração de reserva (T03) | F | Abre com os dados atuais da reserva na hora do campus; recursos da própria reserva marcados mesmo quando o servidor não os lista como livres; consulta de livres no período; envio completo; confirmação pelo estado devolvido (SOLICITADA diz que voltou para aprovação); clique duplo; recusas por código; conflito reaproveita o tratamento da Nova reserva (lista refeita e recurso que deixou de estar livre desmarcado); rota, título da página e acesso negado ao Administrador (`paginas/reserva/PaginaDeAlteracao.test.tsx`, `Rotas.test.tsx`) | A alteração usa o mesmo formulário e o mesmo tratamento de recusa da Nova reserva; o front envia os dados e o servidor decide se algo mudou, se a reserva volta para aprovação e se há conflito (RN-19) | RF-04, RF-05, RF-13, RN-17, RN-19, ADR-004, F6-11 |
| CT-144 | Permissões da reserva (regra pura) | F | Estado × perfil × posse × instante, com o início em trinca (1 ms antes, no instante e 1 ms depois), para alterar e cancelar: dono Solicitante, dono Responsável, outro Solicitante, Responsável que não é o dono, Administrador, EM_USO e os quatro estados terminais; o motivo conta como informado (`model/regra/PermissoesDaReservaTest.java`) | A tabela vem de RN-18, RN-19 e D10, não da implementação: o dono perde as duas ações no instante de início de uma reserva APROVADA; o Responsável e o Administrador seguem cancelando com motivo; o Administrador nunca altera; EM_USO e estados terminais não têm ação | RF-04, RN-07, RN-17, RN-18, RN-19, RN-20, D10, F6-14 |
| CT-145 | Permissões da reserva na API | F | `podeAlterar` e `podeCancelar` na consulta, na lista, na criação, no cancelamento e na aprovação, por dono, outro Solicitante (nem vê a reserva), Responsável e Administrador; início em trinca com o relógio fixo; EM_USO e estados terminais; coerência com a defesa: quando o campo diz não, o servidor recusa com o código estável, e quando diz sim, aceita (`controller/PermissoesDaReservaApiIT.java`; contrato em `DocumentacaoApiIT` e `ContratoObrigatoriosApiIT`, CT-115 e CT-134) | O campo e a recusa do servidor dizem a mesma coisa; os dois campos nunca são nulos e constam do `required` do contrato | RF-04, RF-13, RN-18, RN-19, RN-26, ADR-004, D10, F6-14 |
| CT-146 | Permissões de decisão da fila (regra pura) | F | Estado × perfil × posse × instante, com o início em trinca (antes, no instante e depois): o Responsável que não é o dono aprova só antes do início e rejeita sem limite de horário; o dono não decide a própria reserva; Solicitante e Administrador não decidem; fora de SOLICITADA ninguém decide (`PermissoesDeDecisaoTest`) | `podeAprovar` e `podeRejeitar` seguem as regras escritas (RN-06, RN-16, RN-33, D2, D10), não a implementação do serviço | RF-07, RN-06, RN-16, RN-33, D10, F6-15 |
| CT-147 | Permissões de decisão da fila na API | F | `podeAprovar` e `podeRejeitar` em cada item de `GET /api/reservas/fila` para o dono, para outro Responsável e para a reserva do Solicitante; início em trinca com o relógio fixo; coerência com a defesa (quando o campo é falso, o servidor recusa com `ACESSO_NEGADO` ou `APROVACAO_APOS_INICIO`; quando é verdadeiro, aceita); Solicitante e Administrador continuam sem a fila (`PermissoesDaFilaApiIT`, `ContratoObrigatoriosApiIT`) | O campo e a recusa do servidor dizem a mesma coisa; os dois campos entram no `required` do contrato | RF-07, RF-14, RN-16, RN-33, D10, F6-15 |
| CT-148 | Fila de aprovações (T05) | F | Lista com título, solicitante pelo nome (nunca e-mail nem número), período no fuso do campus, nomes dos recursos, contagem, vazio ("Sem pendências") e erros da tabela; Aprovar e Rejeitar conforme `podeAprovar` e `podeRejeitar`, sem olhar relógio, dono nem perfil; mensagem "Você não pode aprovar nem rejeitar esta solicitação agora." só quando os dois são falsos, visível e lida junto com o cartão; diálogos de aprovação (motivo opcional) e de rejeição (motivo obrigatório, sem envio sem ele) com foco preso, Escape e foco devolvido; sucesso anunciado com foco; clique duplo; recusas pelo código estável (ACESSO_NEGADO ao aprovar a própria reserva, APROVACAO_APOS_INICIO, TRANSICAO_PROIBIDA, NAO_ENCONTRADO, ERRO_INTERNO, rede) com a mensagem do mapa de erros no diálogo; a fila refeita sem perder a mensagem; a rota e o acesso negado de Solicitante e Administrador sem consultar a fila (`paginas/aprovacoes/*.test.tsx`, `Rotas.test.tsx`) | O front mostra o que o servidor devolve e nunca decide por dono, perfil ou relógio; a recusa vem do servidor, pela tabela de erros; a rejeição só é enviada com motivo | RF-07, RF-13, RN-06, RN-16, RN-24, RN-33, ADR-004, L-04, F6-11, F6-15 |
| CT-149 | Acesso negado com título de página (BUG-018) | F | A tela de acesso negado tem `h1` "Acesso negado" acima da mensagem da tabela de erros, e a aba diz o mesmo em vez do nome da tela negada; perfil permitido não vê o título; a aba volta a ter o nome da tela (`rotas/RotaProtegida.test.tsx`, `Rotas.test.tsx`) | Toda página tem título de nível 1 e título de aba coerente com o que está na tela | RF-13, ADR-004, F6-11 |
| CT-150 | Permissões de uso da reserva (regra pura) | F | Estado × perfil × material pendente × tolerância × instante, com o limite da tolerância em trinca (um milissegundo antes, no instante e depois): APROVADA inicia a qualquer hora e só marca não comparecimento a partir de início mais tolerância; tolerância não configurada nunca oferece não comparecimento; EM_USO conclui só sem material pendente; os outros estados e os perfis Solicitante e Administrador não recebem ação (`PermissoesDeUsoTest`) | `podeIniciar`, `podeConcluir` e `podeMarcarNaoComparecimento` seguem as regras escritas (RN-05, RN-20, RN-21, RN-23, D1), não a implementação do serviço | RF-09, RF-16, RN-20, RN-21, RN-23, D1, F6-16 |
| CT-151 | Movimentação atual de cada material (regra pura) | F | A mais recente prevalece pelo `id`: retirada sozinha, devolução, nova retirada do mesmo material, material nunca movimentado, vários materiais intercalados e lista fora de ordem; a mesma regra recusa retirada de unidade já retirada e devolução de unidade não retirada (`MovimentacoesAtuaisTest`) | A marcação `atual` e as recusas MATERIAL_JA_RETIRADO e DEVOLUCAO_SEM_RETIRADA vêm da mesma função | RF-09, F6-16 |
| CT-152 | Permissões de uso da reserva na API | F | Os três campos na consulta, na lista e nas respostas de iniciar, retirar, devolver e não comparecimento, para o Responsável (dono ou não), o Solicitante e o Administrador; tolerância em trinca com o relógio fixo; tolerância não configurada; material pendente até a devolução; estados sem ação; coerência com a defesa (quando o campo é falso o servidor recusa com TRANSICAO_PROIBIDA, TOLERANCIA_NAO_ENCERRADA, TOLERANCIA_NAO_CONFIGURADA ou MATERIAL_PENDENTE; quando é verdadeiro, aceita) (`PermissoesDeUsoApiIT`, `ContratoObrigatoriosApiIT`) | O campo e a recusa do servidor dizem a mesma coisa; os campos entram no `required` do contrato | RF-09, RF-14, RF-16, RN-20, RN-21, RN-23, D1, D13, F6-16 |
| CT-153 | Histórico de movimentações com nome e movimentação atual | F | `registradoPorNome` presente e o e-mail ausente da resposta, nome de cada registrante, nome de usuário desativado depois; `atual` na retirada, na devolução, na nova retirada, em material nunca movimentado e com vários materiais; coerência com MATERIAL_JA_RETIRADO e DEVOLUCAO_SEM_RETIRADA; quem já via o histórico continua vendo e ninguém ganha acesso novo (`HistoricoDeMovimentacoesApiIT`) | O histórico nunca expõe o e-mail; a tela lê `atual` e não interpreta sequências | RF-09, RN-26, L-04, ADR-004, F6-16 |
| CT-154 | Retirada e devolução (T06) | F | Lista só as reservas aprovadas e em uso, na ordem do servidor, com período, estado, recursos, contagem, vazio ("Nada para registrar") e erros da tabela; materiais como unidades e o estado de cada uma pela movimentação `atual` (não retirado, retirado com hora e nome, devolvido com hora e nome, lista fora de ordem), nunca com e-mail; Iniciar uso, Concluir reserva e Não compareceu conforme os três campos, sem olhar estado nem relógio; mensagem "Você não pode registrar o uso desta reserva agora." só com os três falsos e sem material, lida junto com o cartão; Retirar, Devolver e Iniciar com resultado anunciado e foco, clique duplo e botões desabilitados em andamento; diálogos de conclusão e de não comparecimento com foco preso, Escape e foco devolvido; recusas pelo código estável (MATERIAL_JA_RETIRADO, MATERIAL_FORA_DA_RESERVA, DEVOLUCAO_SEM_RETIRADA, TRANSICAO_PROIBIDA, TOLERANCIA_NAO_ENCERRADA, TOLERANCIA_NAO_CONFIGURADA, MATERIAL_PENDENTE com o nome dos pendentes, ACESSO_NEGADO, ERRO_INTERNO, rede); `formatarHora` no fuso do campus; a rota e o acesso negado de Solicitante e Administrador sem consultar as reservas (`paginas/retiradas/*.test.tsx`, `datas/fuso.test.ts`, `Rotas.test.tsx`) | O front mostra o que o servidor devolve e nunca decide por estado, relógio, tolerância nem sequência de movimentações; a recusa vem do servidor, pela tabela de erros | RF-09, RF-13, RF-16, RN-20, RN-21, RN-23, D1, L-09, ADR-004, F6-11, F6-16 |
| CT-155 | Histórico de auditoria com o nome de quem agiu | F | `atorNome` presente e o e-mail ausente da resposta, nome de cada ator, SISTEMA sem nome, usuário desativado depois com o nome mantido, auditoria completa do Administrador com o nome, e quem já via continua vendo e ninguém ganha acesso novo (Solicitante que não é dono, Responsável na auditoria completa e sem sessão continuam recusados) (`AtorDoHistoricoApiIT`) | O histórico nunca expõe o e-mail; a tela mostra o nome e não resolve usuários por conta própria | RF-10, RN-08, L-04, ADR-004, F6-17 |
| CT-156 | Catálogo de recursos (T07) | F | Abas por tipo (consulta só o tipo, seta, Home e End, Tab só na aba escolhida, painel ligado à aba); detalhes de sala, professor (competências e vínculo sem número) e material; contagem, vazio por aba e erros da tabela; Solicitante e Responsável só consultam; o Administrador cadastra sala, professor (com o usuário escolhido por nome e perfil, sem e-mail) e material, com campos obrigatórios conferidos antes do envio e recusas do servidor marcando os campos (VALIDACAO_FALHOU, PATRIMONIO_JA_EXISTE, VINCULO_JA_EXISTE); caixa Restrito que só muda depois da resposta, com aviso de que não muda reservas existentes; Desativar com diálogo (foco, Tab preso, Escape), recusa RECURSO_COM_RESERVA_FUTURA com a lista de reservas afetadas e as outras recusas da tabela; clique duplo e envio em andamento (`paginas/catalogo/*.test.tsx`, `Rotas.test.tsx`) | O front mostra o que o servidor devolve e não decide por reserva futura nem por perfil além da matriz de telas; a recusa vem do servidor, pela tabela de erros, com a lista de reservas afetadas | RF-02, RF-13, RN-32, ADR-004, F6-11, F6-17 |
| CT-157 | Relatórios (T10) | F | Sem período mostra "Informe o período" e não consulta; período obrigatório aponta início e fim, com o foco no primeiro campo; filtros no endereço (voltar, recarregar, limpar); tipo e recurso opcionais com a lista de recursos acompanhando o tipo; tabela com horas, utilização em porcentagem, conflitos evitados e solicitantes distintos exatamente como o servidor devolve; "Não se aplica" para professor e material; contagem, vazio, carregando e erros da tabela; paginação com tamanho configurável, foco no resultado, Anterior e Próxima desabilitados nas pontas; Solicitante com acesso negado e sem consulta (`paginas/relatorios/*.test.tsx`, `Rotas.test.tsx`) | O front mostra o que o servidor calculou e não recalcula nada; a regra de período e o acesso por perfil são do servidor, pela tabela de erros | RF-12, RF-13, RN-31, D4, ADR-004, F6-11 |
| CT-158 | Usuários e perfis (T11) | F | Lista com nome, e-mail, perfil e situação, contagem, vazio, carregando e erro; desativado sem ações; nenhuma senha na tela; cadastro com campos obrigatórios conferidos antes do envio, senha em campo de senha sem preenchimento do navegador, perfil único começando em Solicitante, dados sem espaços nas pontas, aviso com o foco, usuário novo na lista e senha fora da tela, clique duplo e recusas do servidor marcando os campos (USUARIO_JA_EXISTE, VALIDACAO_FALHOU); trocar perfil com o perfil atual escolhido, aviso com o foco e as recusas da tabela de erros (MINIMO_DE_RESPONSAVEIS, ACESSO_NEGADO, NAO_ENCONTRADO); desativar com diálogo (foco, Tab preso, Voltar), recusa USUARIO_COM_RESERVA_FUTURA com a lista de reservas afetadas e recusa MINIMO_DE_RESPONSAVEIS sem lista (`paginas/usuarios/*.test.tsx`, `Rotas.test.tsx`) | O front mostra o que o servidor devolve e não decide por reserva futura, por mínimo de Responsáveis nem por perfil além da matriz de telas; a recusa vem do servidor, pela tabela de erros | RF-15, RF-13, D14, ADR-004, F6-11, F6-17 |
| CT-159 | Histórico de auditoria (T09) | F | Responsável: sem número pede a reserva e não consulta, número obrigatório com o foco no campo, histórico da reserva na ordem do servidor com contagem, quando (hora do campus), quem (nome, SISTEMA para o sistema), mudança de estado e motivo traduzido, filtro no endereço, ação desconhecida pelo código, vazio, carregando, tentar de novo e NAO_ENCONTRADO pela tabela de erros; Administrador: auditoria inteira ao abrir, entidade e número enviados ao servidor, ACESSO_NEGADO pela tabela de erros; período filtrado na tela, no dia do campus, sem nova consulta; nunca o e-mail, o número do ator nem o conteúdo bruto de antes e depois (`paginas/auditoria/*.test.tsx`, `Rotas.test.tsx`) | O front mostra o que o servidor devolve e não decide quem vê o quê além da matriz de telas; a consulta e a recusa são do servidor, pela tabela de erros | RF-10, RF-13, L-03, L-10, ADR-004, F6-11 |
| CT-160 | Bloqueios de manutenção (T08) | F | Lista com recurso, período na hora do campus, motivo e situação, contagem, vazio, carregando e erro; só os ativos oferecem Levantar; formulário com campos obrigatórios conferidos antes do envio; criar sem reservas afetadas; BLOQUEIO_PENDE_CONFIRMACAO com mensagem, ação e reservas afetadas, campos travados e foco na mensagem; Confirmar e cancelar reenviando os mesmos dados com as reservas confirmadas e anunciando as canceladas; Voltar sem enviar; BLOQUEIO_LISTA_DESATUALIZADA voltando ao formulário e recomeçando o ciclo; BLOQUEIO_COM_RESERVA_EM_USO sem forçar; MOTIVO_OBRIGATORIO e PERIODO_INVALIDO marcando campos; clique duplo e falha de rede; levantar com diálogo (motivo obrigatório, sem espaços nas pontas, foco, Escape, Tab preso, recusas da tabela de erros) (`paginas/bloqueios/*.test.tsx`, `Rotas.test.tsx`) | O front repete a lista de reservas que o servidor mostrou e não decide o que é afetado; as recusas vêm do servidor, pela tabela de erros | RN-22, RF-08, RF-13, L-02, ADR-004, F6-11 |
| CT-161 | Solicitante busca e reserva uma sala (E2E) | E | Pela tela, a Solicitante busca salas livres no período, abre a Nova reserva pela sala escolhida, reserva, vê "Reserva aprovada" e a encontra na lista dela como Aprovada (`frontend/e2e/jornadas.spec.ts`) | A reserva é criada de verdade no servidor e aparece aprovada, sem mocks | RF-03, RF-04, RF-05, F6-11 |
| CT-162 | Segunda reserva no mesmo horário mostra o conflito (E2E) | E | O João preenche a reserva da Sala 203 e, antes de enviar, a Maria reserva a mesma sala no mesmo horário (pré-condição pela API); ao enviar, a tela mostra a mensagem de conflito em linguagem comum, sem "CONFLITO_DE_ALOCACAO" nem "409", e não anuncia reserva criada (`jornadas.spec.ts`) | O servidor recusa e a tela mostra a mensagem da tabela de erros | RF-04, RF-13, ADR-004, F6-11 |
| CT-163 | Responsável aprova recurso restrito (E2E) | E | A Solicitante pede o laboratório (restrito) e vê "enviada para aprovação"; o Responsável abre Aprovações, aprova com a confirmação e vê "aprovada"; a Solicitante vê a reserva Aprovada (`jornadas.spec.ts`) | O ciclo SOLICITADA para APROVADA acontece de verdade, por pessoas diferentes | RF-07, RN-16, F6-11 |
| CT-164 | Solicitante não vê a ação de aprovar (E2E) | E | Com um pedido do laboratório aguardando decisão, a Solicitante não tem o item Aprovações no menu, vê o pedido como Solicitada sem Aprovar nem Rejeitar, e abrir /aprovacoes mostra "Acesso negado" (`jornadas.spec.ts`) | A ação de aprovar não é oferecida a quem não tem perfil | RF-07, RF-13, ADR-004, F6-11 |
| CT-165 | Fluxo principal em celular, 360 por 640 (E2E) | E | No viewport 360 por 640, a Solicitante busca e reserva uma sala e a encontra na lista; a página não rola na horizontal antes nem depois (`jornadas.spec.ts`) | Jornada completa utilizável em celular | RF-13, F6-07, F6-11 |

## 4. Cobertura por regra crítica

| Regra | Casos |
| --- | --- |
| RN-01 | CT-033, CT-039, CT-010 |
| RN-02 | CT-034, CT-035, CT-057, CT-061 |
| RN-03 | CT-007, CT-060, CT-062, CT-063 |
| RN-04 | CT-029, CT-080, CT-081 |
| RN-05 | CT-075, CT-096 |
| RN-06 | CT-066, CT-067 |
| RN-07 | CT-056, CT-079 |
| RN-08 | CT-011, CT-096, CT-097 |

## 5. Ambiguidades e perguntas

| Pergunta | Efeito nos casos |
| --- | --- |
| Os valores de tolerância (D1), reenvio (D3), página (D4) e duração da sessão (D17) não existem | CT-093, CT-105, CT-112 e CT-004 usam **valor de teste** e verificam que o valor é configurável, não o valor |
| Os valores 20 solicitações e 5 repetições são hipóteses da [Aula 10](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_testes-carga-jmeter.html) | CT-060 e CT-062 ficam marcados como hipótese até a validação do professor |
| Limite de tentativas de login e transporte cifrado não têm requisito | Sem caso de teste; registrado como pergunta ao professor em [arquitetura.md](../arquitetura.md), seção 22.4 |
