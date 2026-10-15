# Avaliação arquitetural, ciclo 00 (ATAM)

| Campo | Valor |
| --- | --- |
| Projeto | Organização de Recursos |
| Documento | Ciclo 00 da avaliação arquitetural (Prompt 2.3 da Fase 2) |
| Data | 15/10/2026 |
| Estado | Rascunho para o painel do Prompt 2.4. Nenhum teste foi executado: toda constatação abaixo vem da leitura dos artefatos |
| Arquitetura avaliada | [arquitetura.md](../arquitetura.md), seções 10 a 17 |
| Catálogo de táticas | [taticas-arquiteturais-len-bass.md](../taticas-arquiteturais-len-bass.md) |
| Fonte dos requisitos | [Especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html) |

Este ciclo **não apaga** origem, suposições nem alternativas de [arquitetura.md](../arquitetura.md). Ele as consome e acrescenta cenários, táticas, evidências e descobertas. A avaliação é feita pelo mesmo analista que escreveu a arquitetura, o que limita a independência; o Prompt 2.4 corrige isso com o painel de seis papéis.

## 1. Como ler

| Termo | Significado neste documento |
| --- | --- |
| **Fato** | Está na especificação ou em artefato versionado, com a origem citada |
| **Decisão** | Escolha da equipe (A1 a D16) ou decisão de arquitetura aprovada em 15/10/2026 |
| **Hipótese** | Medida sem origem na especificação. Vem de valor de exemplo das aulas ou de proposta da equipe e tem **validação pendente** |
| **Risco confirmado** | A fraqueza decorre do que os artefatos já dizem, sem precisar executar nada |
| **Dúvida não investigada** | Suspeita que só um teste ou uma medição resolve |
| **Não risco (provisório)** | Tática presente e com métrica definida, **ainda sem teste executado**; só vira não risco definitivo com a evidência |

(I, D) é a classificação de **importância e dificuldade** (A alta, M média, B baixa). É proposta da equipe e foi mantida; a validação é do painel do Prompt 2.4.

## 2. Utility tree

Atributo → refinamento → cenário. O valor ao lado do cenário é (I, D).

| Atributo | Refinamento | Cenário | (I, D) |
| --- | --- | --- | --- |
| Confiabilidade e integridade | Alocação sem conflito sob concorrência | CEN-01 | (A, A) |
| Confiabilidade e integridade | Alocação sem conflito por tipo de recurso | CEN-03 | (A, M) |
| Confiabilidade e integridade | Alocação sem conflito na fronteira do bloqueio | CEN-07 | (A, B) |
| Segurança | Autorização por perfil e posse | CEN-02 | (A, M) |
| Segurança | Confidencialidade na integração externa | CEN-09 | (A, B) |
| Desempenho | Latência sob carga concorrente | CEN-04 | (A, A) |
| Disponibilidade | Degradação com provedor de notificação falho | CEN-05 | (A, M) |
| Auditabilidade | Trilha completa e atômica | CEN-06 | (A, M) |
| Modificabilidade | Troca do provedor de notificação | CEN-08 | (M, B) |

## 3. Cenários de seis partes

Cada cenário traz fonte, estímulo, ambiente, artefato, resposta e medida. Números que não vêm da especificação nem de decisão da equipe estão marcados como **hipótese**.

### CEN-01. Solicitações simultâneas para a mesma sala e horário

| Parte | Conteúdo |
| --- | --- |
| Fonte | Vários Solicitantes autenticados, ao mesmo tempo |
| Estímulo | Solicitações de reserva da mesma sala no mesmo horário |
| Ambiente | Operação normal, PostgreSQL real em container, sem manutenção no período |
| Artefato | Caso de uso de criação de reserva e constraint de exclusão em `ocupacoes` |
| Resposta | Exatamente uma reserva aceita. As demais recusadas com 409 e código estável. Uma tentativa de conflito CONCORRENCIA por recusa (RN-30) |
| Medida | Fato: uma única reserva aceita (RN-03). **Hipótese**: 20 solicitações e 5 execuções seguidas, valores de exemplo da [Aula 10](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_testes-carga-jmeter.html), validação pendente |

### CEN-02. Aprovação da própria reserva ou sem perfil

| Parte | Conteúdo |
| --- | --- |
| Fonte | Solicitante autenticado, ou Responsável dono da reserva |
| Estímulo | Tentativa de aprovar reserva com recurso restrito |
| Ambiente | Operação normal, reserva SOLICITADA |
| Artefato | Endpoint de aprovação e política de autorização por posse |
| Resposta | 403 com código estável, sem mudança de estado e sem evento de aprovação (RN-06, RN-16) |
| Medida | 0 aprovações indevidas; toda combinação proibida da matriz perfil × operação responde 403 |

### CEN-03. Professor já alocado

| Parte | Conteúdo |
| --- | --- |
| Fonte | Solicitante autenticado |
| Estímulo | Reserva de sala em horário em que o professor alocado já está ocupado |
| Ambiente | Operação normal |
| Artefato | Criação de reserva e ocupações por recurso |
| Resposta | 409 com código estável que identifica o recurso em conflito (RN-02, RF-05). Nenhuma reserva nem ocupação nova. Uma tentativa de conflito SOBREPOSICAO |
| Medida | 0 linhas novas em `reservas` e `ocupacoes`; 1 em `tentativas_conflito` |

### CEN-04. Latência com usuários simultâneos

| Parte | Conteúdo |
| --- | --- |
| Fonte | Usuários simultâneos, quantidade **hipótese** |
| Estímulo | Consulta de disponibilidade e criação de reserva |
| Ambiente | Carga com PostgreSQL real e dados semeados; volume de dados: **lacuna** |
| Artefato | API, consulta de disponibilidade sobre o índice da constraint e pool de conexões |
| Resposta | Respostas dentro do limite, com 409 esperado sem contar como erro |
| Medida | **Hipótese**: p95 de até 300 ms para 50 usuários e erros abaixo de 1% (RNF-08). Valor de exemplo da Aula 10; a especificação não define critério de desempenho; validação pendente |

### CEN-05. Provedor de notificação com falha

| Parte | Conteúdo |
| --- | --- |
| Fonte | Provedor de notificação (webhook) |
| Estímulo | Resposta 5xx ou lentidão no envio |
| Ambiente | Reserva recém-aprovada, operação normal |
| Artefato | Despachante de notificações, adaptador de webhook e `notificacoes` |
| Resposta | A reserva permanece válida. A notificação fica PENDENTE com próxima tentativa. A resposta ao usuário não espera o provedor, porque o envio ocorre depois do commit (RN-28) |
| Medida | 0 reservas desfeitas; reenvio com a mesma chave de idempotência. **Hipótese**: o limite de tempo do envio é configurável e **sem valor** definido |

### CEN-06. Auditoria atômica

| Parte | Conteúdo |
| --- | --- |
| Fonte | Responsável, Administrador ou SISTEMA |
| Estímulo | Qualquer transição de estado, inclusive as do job e as em cascata do bloqueio |
| Ambiente | Operação normal e com falha injetada na gravação da auditoria |
| Artefato | Casos de uso e `auditoria_eventos` |
| Resposta | Exatamente um evento por transição, na mesma transação. Falha ao auditar desfaz a transição. A tabela não admite atualização nem exclusão |
| Medida | 1 evento por transição; 0 transições sem evento; 0 eventos alterados ou apagados |

### CEN-07. Fronteira do bloqueio de manutenção

| Parte | Conteúdo |
| --- | --- |
| Fonte | Solicitante autenticado |
| Estímulo | Reserva cujo período toca o bloqueio: um instante antes, no instante e um instante depois da fronteira |
| Ambiente | Recurso com bloqueio ativo, relógio controlado |
| Artefato | Criação de reserva e ocupação do bloqueio em `ocupacoes` |
| Resposta | Recusada com 409 (MANUTENCAO) quando há sobreposição. Aceita quando termina no início do bloqueio ou começa no término dele, pela convenção [início, fim) (A2, RN-11) |
| Medida | 100% dos resultados esperados na trinca de valores limite. A hipótese do plano anterior sobre a fronteira foi resolvida por A2 |

### CEN-08. Troca do provedor de notificação

| Parte | Conteúdo |
| --- | --- |
| Fonte | Equipe de desenvolvimento |
| Estímulo | Substituir o provedor por outro |
| Ambiente | Desenvolvimento |
| Artefato | Porta de notificação e adaptador de webhook |
| Resposta | A alteração fica restrita ao adaptador |
| Medida | **Hipótese**: 1 componente alterado e 0 diferenças no contrato da API, validação pendente |

### CEN-09. Segredo do provedor em corpo de erro

| Parte | Conteúdo |
| --- | --- |
| Fonte | Provedor de notificação (webhook) |
| Estímulo | Corpo de erro que inclui o token do próprio provedor |
| Ambiente | Operação normal |
| Artefato | Adaptador de webhook, tradutor de erros e log |
| Resposta | O corpo não atravessa a API nem entra no log. Só o status é registrado (RNF-07, RNF-12) |
| Medida | 0 ocorrências do valor sensível na resposta da API e nos logs. Origem do cenário: Aula 08 |

## 4. Decisão, tática e evidência por cenário

As táticas usam os nomes exatos do catálogo ([seção 4](../taticas-arquiteturais-len-bass.md)). "Custo" é o que a tática impõe, e a evidência é o que provará o resultado.

| Cenário | Decisão relacionada | Tática | Custo | Evidência |
| --- | --- | --- | --- | --- |
| CEN-01 | Constraint de exclusão em `ocupacoes` ([arquitetura.md](../arquitetura.md), seção 13.1) | **Transactions**, com **Introduce Concurrency** sobre o mesmo recurso | Contenção e latência (CEN-04) | Teste de concorrência com Testcontainers, repetido; relatório JMeter |
| CEN-02 | Autorização em duas camadas e política única (seção 13.3) | **Authorize Actors**, com **Identify Actors** | Complexidade da política e atrito | Matriz perfil × operação em teste automatizado |
| CEN-03 | Recurso como supertipo (seção 12, item 1) | **Transactions** e **Rollback**, com **Exception Handling** específico | Uma consulta extra para identificar o recurso | Teste de integração com banco real, por tipo de recurso |
| CEN-04 | Constraint com índice GiST e paginação (seção 12, itens 2 e 12) | **Increase Resource Efficiency** e **Bound Execution Times** | Escrita mais cara por reserva | JMeter com percentis |
| CEN-05 | Porta, adaptador e linha PENDENTE na transação (seção 13.4) | **Exception Detection** (timeout), **Retry** idempotente e **Degradation** | Tabela de notificações e executor de reenvio | WireMock com 200, 404, 500, lentidão e JSON inválido |
| CEN-06 | Auditoria na mesma transação, tabela somente inserção (seção 13.2) | **Audit**, **Transactions**, **Rollback** e **Timestamp** | Escrita extra em cada transição | Teste de integração com falha injetada e tentativa de UPDATE e DELETE |
| CEN-07 | Relógio injetável e fronteira semiaberta (seção 13.5) | **Transactions** e **Limit Nondeterminism** | Relógio como dependência em todo caso de uso | Valor limite em trinca com relógio controlado |
| CEN-08 | Porta e adaptador (seção 13.4) | **Use an Intermediary**, **Encapsulate** e **Restrict Dependencies** | Indireção no caminho do envio | Teste de arquitetura e comparação do contrato OpenAPI |
| CEN-09 | Adaptador e erros com códigos estáveis (seção 12, itens 6 e 7) | **Tailor Interface**, **Encapsulate** e **Limit Exposure** | Perda de detalhe para diagnóstico | WireMock devolvendo o segredo e teste de log |

Decisões **sem cenário que as exerça por inteiro**: o job de SEM_DECISAO (RN-25) não tem cenário próprio, a observabilidade (RNF-12) só é tocada por CEN-09 e o recálculo de "exige aprovação" (D12) só aparece indiretamente em CEN-02. Ficam como pendência da seção 7.

## 5. Descobertas

### 5.1 Pontos de sensibilidade

Um parâmetro que, sozinho, determina a resposta de um atributo.

| ID | Parâmetro | Atributo afetado | Cenário | Observação |
| --- | --- | --- | --- | --- |
| PS-01 | Tamanho do pool de conexões | Desempenho | CEN-04 | Sem valor na fonte. Dúvida não investigada |
| PS-02 | Limite de tempo do envio ao provedor | Disponibilidade | CEN-05 | Configurável e sem valor (pergunta 5 de [arquitetura.md](../arquitetura.md), seção 8.5) |
| PS-03 | Frequência do job de SEM_DECISAO | Corretude do tempo | CEN-06, RN-25 | Decide por quanto tempo uma reserva vencida fica SOLICITADA. Mitigado pela recusa da aprovação após o início (D2) |
| PS-04 | Tentativas e intervalo do reenvio (D3) | Disponibilidade e carga sobre o provedor | CEN-05 | Lacuna sem valor |
| PS-05 | Ordem de inserção das ocupações | Confiabilidade | CEN-01 | Em reserva com vários recursos, ordens diferentes entre transações podem causar impasse |
| PS-06 | Duração da sessão (D17) | Segurança | CEN-02 | Lacuna sem valor |

### 5.2 Pontos de trade-off

Um parâmetro ou decisão que move dois atributos em direções opostas.

| ID | Decisão | Atributo favorecido | Atributo prejudicado | Cenários |
| --- | --- | --- | --- | --- |
| TO-01 | Constraint de exclusão | Integridade da alocação | Latência sob contenção | CEN-01, CEN-03, CEN-07 contra CEN-04 |
| TO-02 | Notificação gravada na transação da reserva | Ausência de perda de notificação | Duração da transação de reserva, mais uma escrita | CEN-05 contra CEN-04 |
| TO-03 | Tentativa de conflito em transação separada | Completude de "conflitos evitados" (RN-30) | Atomicidade: a gravação pode falhar sem desfazer o 409 | CEN-01 contra CEN-06 |
| TO-04 | Token opaco com revogação | Efeito imediato de perfil alterado e usuário desativado | Latência: consulta ao banco a cada requisição, e dependência do banco | CEN-02 contra CEN-04 |
| TO-05 | Camadas que espelham o C4 | Testabilidade e modificabilidade | Custo de mapeamento entre camadas | CEN-08 contra CEN-04 |

### 5.3 Riscos

Cada risco recebe um identificador R-xx, definido em [plano-de-teste.md](../plano-de-teste.md), seção 8, com os riscos R-01 a R-16.

| ID | Risco | Natureza | Cenário | Decisão ou fonte |
| --- | --- | --- | --- | --- |
| R-17 | Impasse ou espera longa em reserva com vários recursos | Dúvida não investigada | CEN-01 | PS-05; ordem de inserção proposta, sem teste |
| R-18 | `ativa` diverge do estado da reserva e a constraint barra ou libera indevidamente | **Risco confirmado**: o próprio [modelo-dados.dbml](../prd/modelo-dados.dbml) registra a questão | CEN-01, CEN-07 | Seção 13.1, coerência de `ativa` |
| R-19 | A tentativa de conflito se perde quando a gravação separada falha, e o relatório subconta | **Risco aceito por decisão** de 15/10/2026 | CEN-01 | TO-03 |
| R-20 | Notificação perdida ou duplicada entre o commit e o envio, ou reenvio que nunca executa | Dúvida não investigada | CEN-05 | TO-02 |
| R-21 | A consulta de sessão a cada requisição degrada o p95, ou um cache deixa token válido após a revogação | Dúvida não investigada | CEN-02, CEN-04 | TO-04 |
| R-22 | O job de SEM_DECISAO roda em mais de uma instância sem a trava eficaz e gera evento duplicado | Dúvida não investigada | CEN-06 | PS-03; D2 |
| R-23 | A auditoria é alterada por papel com privilégio, por exemplo o da migração | Dúvida não investigada | CEN-06 | Seção 13.2 |
| R-24 | Medidas hipotéticas (p95, usuários, repetições, pool, limites de tempo) tornam cenários sem critério de aceite fechado | **Risco confirmado**: a especificação não define critério de desempenho | CEN-01, CEN-04, CEN-05, CEN-08 | RNF-08 |

### 5.4 Não riscos (provisórios)

| ID | Constatação | Por que é não risco | Falta para ser definitivo |
| --- | --- | --- | --- |
| NR-01 | A garantia contra dupla reserva está no banco, e não só no código | Tática presente (**Transactions**) com métrica definida (CEN-01) | Teste de concorrência executado |
| NR-02 | A falha do provedor não desfaz a reserva | O envio é posterior ao commit e a linha PENDENTE é gravada junto (**Retry** idempotente) | Matriz de respostas com WireMock |
| NR-03 | Operação proibida a um perfil é barrada por duas camadas | **Authorize Actors** com matriz como evidência (CEN-02) | Matriz executada |
| NR-04 | Regras de tempo são testáveis sem espera real | Relógio injetável (**Limit Nondeterminism**) | Trinca de valores limite executada |

### 5.5 Temas de risco

Padrões que se repetem em várias decisões.

| ID | Tema | Onde aparece | Consequência |
| --- | --- | --- | --- |
| TR-01 | **Medidas sem origem**: quase todo número de desempenho e de tempo é hipótese | R-24, PS-01, PS-02, PS-04, PS-06 | Cenários só viram critério de aceite depois da validação com o professor |
| TR-02 | **Três fluxos fora da transação principal**: tentativa de conflito, notificação e job de transições, cada um com perda ou duplicação possível | R-19, R-20, R-22 | Não existe mecanismo único de reconciliação; cada fluxo precisa de teste de falha próprio |
| TR-03 | **Garantias que só existem no PostgreSQL real**: constraint, gatilho, ordem de inserção e trava do job | R-17, R-18, R-22, R-23 | Falha do ambiente de teste containerizado impede toda a evidência; depende da Fase 3 |

## 6. Cobertura da análise

| Item | Estado |
| --- | --- |
| Cenários com as seis partes | CEN-01 a CEN-09 |
| Cenários com decisão, tática e evidência | CEN-01 a CEN-09 |
| Medidas marcadas como hipótese | CEN-01, CEN-04, CEN-05, CEN-08 |
| Trade-offs nomeados | TO-01 a TO-05 |
| Riscos novos | R-17 a R-24 |
| Decisão sem cenário próprio | Job de SEM_DECISAO (RN-25) e recálculo de "exige aprovação" (D12). **Pendência para o Prompt 2.4** |

## 7. Pendências para o Prompt 2.4

1. Decidir se o job de SEM_DECISAO (RN-25) e o recálculo de "exige aprovação" (D12) ganham cenário próprio (por exemplo, idempotência do job com duas instâncias).
2. Confirmar ou corrigir (I, D) de cada cenário no painel.
3. Validar com o professor as hipóteses de CEN-01, CEN-04, CEN-05 e CEN-08.
4. Ligar cada cenário às linhas da [RTM](../../RTM.md), na coluna Cenário.
5. Fechar os ADR dos pontos de trade-off TO-01 a TO-05.
