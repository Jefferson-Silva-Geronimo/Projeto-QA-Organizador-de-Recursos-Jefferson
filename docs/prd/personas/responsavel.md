# Persona — Responsável

Fonte do perfil: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção 2. Decisões citadas (A1 a A8, B1 a B4) estão em [perguntas-abertas.md](../perguntas-abertas.md).

Legenda: **fato** (vem da especificação), **decisão** (da equipe, com ID), **suposição** (inferência, com impacto), **lacuna** (ainda sem decisão).

## 1. Resumo

| Item | Descrição | Natureza |
| --- | --- | --- |
| Papel | Aprova solicitações especiais, valida a alocação de docentes e acompanha retiradas e devoluções de material. Também cria reservas | Fato; criar reservas é decisão B1 |
| Contexto de uso | Acompanha o ciclo da reserva: decide aprovações, registra início de uso, retirada e devolução, conclui e marca não comparecimento | Fato e decisão A8 |
| Frequência | Recorrente, concentrada em torno do início e do fim das atividades | Suposição, sem dado de uso. Impacto: define a prioridade de notificações e da fila |
| Dispositivo | Computador; celular no local de retirada e devolução | Suposição. Impacto: telas de registro de retirada e devolução precisam funcionar em viewport pequeno (RF-13) |
| Familiaridade | Usuário frequente, com conhecimento do fluxo | Suposição. Impacto: tolera telas mais densas |
| Restrição de operação | Precisa haver ao menos dois Responsáveis | Decisão B1 |

## 2. Cenário típico (ilustrativo)

O Responsável recebe uma notificação de solicitação pendente (A5) e abre a fila de aprovações. Vê uma reserva com um recurso restrito, confere se o professor está livre e a aprova (RF-07).

No dia da atividade, registra o início do uso, que leva a reserva a EM_USO (A8), e anota a retirada do material. Ao fim, registra a devolução e conclui a reserva. Outra reserva APROVADA do mesmo dia não foi usada: depois da tolerância, ele a marca como não compareceu.

No fim da semana, cria uma reserva própria com recurso restrito. Ela fica à espera de outro Responsável, porque ninguém aprova a própria reserva (B1).

Cenário ilustrativo, não é dado de pesquisa.

## 3. Objetivos

| Objetivo | Natureza | RF e RN | Critério de sucesso observável |
| --- | --- | --- | --- |
| Decidir aprovações com contexto | Fato (aprovar); decisão da equipe quanto à segregação | RF-07, RN-05, RN-06, A1, B1 | Toda reserva SOLICITADA com recurso restrito sai da fila com decisão e ator registrados na auditoria (RN-08) |
| Validar a alocação de docentes | Fato; a forma é suposição: ocorre pela aprovação quando o professor é recurso restrito (A1). Impacto: se for outra validação, surge fluxo novo | RF-05, RF-07 | Professor restrito só é alocado após aprovação |
| Acompanhar retiradas e devoluções | Fato | RF-09, RN-05 | Cada retirada e devolução registrada com quem registrou e quando |
| Conduzir a reserva pelos estados | Decisão A8 | RN-05, RN-07 | Registra início, conclui e marca não compareceu respeitando as transições permitidas |
| Fazer o material voltar | Decisão C3: conclusão só com material retirado devolvido; cobrança de atraso fora de escopo | RF-09, RN-05 | Nenhuma reserva é concluída com material retirado e não devolvido |
| Ter visão geral das reservas | Decisão B3 | RF-04, RF-10 | Vê todas as reservas e a fila de aprovações |

## 4. Tarefas principais

| Tarefa | Gatilho | Resultado esperado | RF |
| --- | --- | --- | --- |
| Revisar fila de aprovações | Notificação de solicitação pendente | Reserva aprovada ou rejeitada, com decisão registrada | RF-07 |
| Registrar início de uso ou retirada do primeiro material | Chegada para usar o recurso | Reserva passa de APROVADA para EM_USO (A8) | RF-09 |
| Registrar devolução | Material devolvido | Devolução registrada para a unidade (A3) | RF-09 |
| Concluir reserva | Fim do uso | Reserva em CONCLUÍDA | RF-09 |
| Marcar não compareceu | Início mais tolerância sem uso | Reserva APROVADA vai a não compareceu (A8) | RF-04 |
| Cancelar reserva APROVADA com motivo | Necessidade operacional | Reserva cancelada, com motivo e auditoria (A8) | RF-04, RF-10 |
| Criar reserva própria | Precisa de recurso | Reserva criada e aprovada por outro Responsável, se houver recurso restrito (B1) | RF-04 |
| Consultar histórico e relatório | Acompanhamento ou prestação de contas | Histórico das reservas e relatório RF-12 filtrado e paginado (C4, C5) | RF-10, RF-12 |

## 5. Frustrações

Hipóteses: a especificação não descreve frustrações.

| Frustração | Impacto se estiver errada |
| --- | --- |
| Aprovar sem contexto sobre quem pediu, para quê e se há conflito | Médio: muda os dados mostrados na fila |
| Fila sem prazo para decidir (C2), com risco de a reserva ser cancelada por SEM_DECISAO ao chegar o início | Médio: depende da validação de S6 e pode exigir ordenação por data de início |
| Reserva APROVADA que não é usada e ocupa o recurso até ser marcada | Médio: depende da tolerância (S4) |
| Material que não volta sem registro claro | Médio: RF-09 e RN-08 cobrem o registro |
| Reserva própria parada por falta de outro Responsável (B1) | Baixo: é restrição de operação conhecida |

## 6. Regras de negócio que afetam a persona

| Regra | Efeito na experiência |
| --- | --- |
| RN-03 | Em pedidos simultâneos só um é aceito; a fila nunca tem dois pedidos concorrentes aceitos |
| RN-05 | É o executor de várias transições: aprovar, iniciar, concluir e marcar não comparecimento |
| RN-06 | Só o Responsável aprova recursos restritos; ele mesmo não aprova a própria reserva (B1) |
| RN-07 | Não pode apagar reserva iniciada; EM_USO só termina pela conclusão (A8) |
| RN-08 | Cada ação sua gera um evento de auditoria |
| A1 | Reservas sem recurso restrito não chegam à fila: são aprovadas pelo SISTEMA |
| RN-23 | Só conclui a reserva quando todo material retirado foi devolvido |
| RN-24 | Rejeitar exige motivo; aprovar tem motivo opcional |
| RN-25 | Reserva SOLICITADA sem decisão ao chegar o início é cancelada pelo sistema |
| A8 | Cancela APROVADA com motivo; não cancela EM_USO nem estados terminais |

## 7. Permissões e visibilidade de dados

| Operação ou dado | Permitido | Decisão ou origem |
| --- | --- | --- |
| Aprovar reserva de outro usuário com recurso restrito | Sim | RN-06, A1 |
| Aprovar a própria reserva | Não | B1 |
| Rejeitar solicitação de outro usuário | Sim, com motivo obrigatório | C2, D8, RN-33 |
| Rejeitar a própria reserva | Não; ele a cancela | D8, RN-33, A8 |
| Criar reservas | Sim, com as permissões do Solicitante | B1 |
| Ver todas as reservas e a fila de aprovações | Sim | B3 |
| Ver o histórico das reservas e o relatório RF-12 | Sim | C4 |
| Ver a auditoria completa (cadastros, usuários, perfis) | Não | C4, C7 |
| Registrar início, retirada, devolução e conclusão | Sim | A8, RF-09 |
| Marcar não compareceu | Sim, após início mais tolerância | A8 |
| Cancelar reserva SOLICITADA de outro usuário | Não (só o dono ou o Administrador); a ação cabível é rejeitar | A8 |
| Cancelar reserva APROVADA | Sim, com motivo | A8 |
| Cancelar EM_USO | Não | A8 |
| Gerenciar cadastros, usuários e bloqueios | Não | B2 |
| Definir que um recurso é restrito | Não | A1 |

## 8. Relação com as outras personas

| Com quem | O que entrega | O que recebe |
| --- | --- | --- |
| Solicitante | Decisão de aprovar ou rejeitar, registro de início, retirada e devolução | Pedidos que exigem aprovação |
| Administrador | Nada diretamente | Recursos restritos definidos por ele (A1) e perfil de acesso (B2) |
| Outro Responsável | Aprovação das reservas do colega | Aprovação das próprias reservas (B1) |
| Sistema | Ações nos estados | Notificações de solicitação pendente (A5) |

## 9. Cenários de risco e uso indevido

Alimentam os testes de autorização.

| O que poderia tentar | O que impede |
| --- | --- |
| Aprovar a própria reserva | B1, RN-06: resposta 403, sem mudança de estado |
| Aprovar reserva cancelada, rejeitada ou já em uso | RN-05: transição proibida |
| Cancelar reserva EM_USO ou estado terminal | A8, RN-07 |
| Marcar não compareceu antes de terminar a tolerância | A8 |
| Registrar devolução de material não retirado | RF-09, RN-05 |
| Alterar o atributo "restrito" para liberar uma aprovação | A1: só o Administrador altera, e reservas existentes não mudam |
| Usar uma segunda conta para aprovar a própria reserva | RN-08: a auditoria registra o ator; B2 limita a um perfil por usuário. Controle de credenciais compartilhadas é fora do sistema (suposição) |
| Cancelar reserva alheia SOLICITADA em vez de rejeitá-la | A8: operação não permitida |
| Rejeitar a própria reserva para escapar da fila | D8, RN-33: recusado com 403; ele a cancela |
| Concluir reserva com material retirado e não devolvido | C3, RN-23 |
| Rejeitar sem informar motivo | C2, RN-24 |
| Abrir a auditoria completa de cadastros e perfis | C4, C7: acesso negado |

## 10. Questões remanescentes

- D1: valor padrão da tolerância de não comparecimento.
- D2: mecanismo do cancelamento por SEM_DECISAO e da marcação automática de não comparecimento.

## 11. Jornada na aplicação

Jornada pensada como telas do front end. Detalhe visual fica para a Fase 6.

### Pré-condições

- O usuário tem perfil Responsável e está autenticado (RF-01).
- Existe ao menos outro Responsável cadastrado (B1).
- Existem reservas SOLICITADA, APROVADA e EM_USO para tratar, e os materiais são unidades com patrimônio (A3).

### Fluxo principal

| # | Ação da pessoa | Resposta do sistema | RF e RN |
| --- | --- | --- | --- |
| 1 | **Tela de login:** informa as credenciais | Autentica e abre o painel, com a fila de aprovações | RF-01, RN-26 |
| 2 | **Fila de aprovações:** abre um pedido pendente, geralmente após notificação | Mostra reserva, recursos, quais são restritos, solicitante, período e a agenda do professor alocado | RF-07, RN-10, RN-26, RN-28 |
| 3 | **Validação de docentes:** confere a alocação do professor | Mostra a agenda e sinaliza sobreposição. A validação ocorre junto à aprovação quando o professor é restrito (suposição: a forma de validar não está definida pela especificação) | RF-05, RF-07, RN-02 |
| 4 | Aprova, com ou sem motivo | Muda para APROVADA, registra auditoria e notifica o Solicitante | RF-07, RN-06, RN-24, RN-08, RN-28 |
| 4a | Alternativa: rejeita informando o motivo | Muda para rejeitada, registra auditoria e notifica o Solicitante com o motivo | RF-07, RN-24, RN-05, RN-08 |
| 5 | **Reservas do dia:** na chegada, registra o início do uso ou a retirada do primeiro material | Muda de APROVADA para EM_USO e registra o evento | RF-09, RN-20, RN-08 |
| 6 | **Retirada:** seleciona a unidade pelo código de patrimônio e registra a retirada | Grava quem registrou e quando; vincula a unidade à reserva | RF-09, RN-12 |
| 7 | **Devolução:** seleciona a unidade e registra a devolução | Grava quem registrou e quando | RF-09 |
| 8 | **Concluir:** conclui a reserva | Muda para CONCLUÍDA se todo material retirado foi devolvido | RF-09, RN-05, RN-23 |
| 9 | **Não compareceu:** abre a lista de reservas APROVADA vencidas (início mais tolerância) e marca | Muda para não compareceu e registra auditoria | RN-21, RN-05, RN-08 |
| 10 | **Cancelar:** abre uma reserva APROVADA de outro usuário e cancela com motivo | Muda para cancelada, registra o motivo e notifica o Solicitante | RF-04, RN-18, RN-28 |
| 11 | **Histórico:** filtra por reserva, recurso, estado e período | Lista as reservas e a sequência de estados de cada uma | RF-10, RN-26 |
| 12 | **Relatório:** escolhe período, tipo de recurso e recurso | Mostra carga horária, utilização (salas) e conflitos evitados, paginado | RF-12, RN-30, RN-31 |

### Criar reservas próprias

O Responsável percorre a jornada do Solicitante, passos 2 a 8, em [solicitante.md](solicitante.md). A diferença:

- Se a reserva tem recurso restrito, fica em SOLICITADA até que **outro** Responsável a aprove; ele não aprova a própria (RN-16).
- Sem recurso restrito, é aprovada automaticamente, como a do Solicitante (RN-09).

### Fluxos alternativos e de erro

| Situação | Resposta do sistema | RF e RN |
| --- | --- | --- |
| Aprovar a própria reserva | Recusa com 403 e nenhuma mudança de estado | RN-16, RN-06 |
| Rejeitar a própria reserva | Recusa com 403; o dono a cancela | RN-33, RN-18 |
| Pedido já decidido ou cancelado por outro motivo | Recusa a transição e atualiza a fila | RN-05, RN-25 |
| Rejeição sem motivo | Recusa de validação | RN-24 |
| Concluir com material retirado e não devolvido | Recusa e lista as unidades pendentes | RN-23 |
| Registrar devolução de unidade não retirada | Recusa | RF-09 |
| Marcar não compareceu antes de terminar a tolerância | Recusa | RN-21 |
| Cancelar reserva EM_USO | Recusa; só a conclusão encerra | RN-18, RN-07 |
| Recurso passou a estar em manutenção depois do pedido | A reserva pendente é cancelada pelo sistema com motivo MANUTENCAO e o Solicitante é notificado | RN-04, RN-22 |
| Professor ocupado em outra reserva aprovada | O pedido não chega à fila; foi recusado na criação por sobreposição | RF-05, RN-02 |
| Token expirado | O servidor responde 401, nada é gravado e a tela leva ao login | RF-01 |
| Acesso negado à auditoria completa ou a operação de outro perfil | Recusa com 403 | RF-01, C4, RN-26 |

### Resultado esperado

- Toda solicitação pendente recebe decisão registrada, com motivo na rejeição.
- O ciclo de uso é registrado do início à conclusão, sem material retirado e não devolvido ao concluir.
- Reservas não usadas são marcadas e passam a constar no histórico e no relatório.
- Nenhuma reserva é aprovada por quem a criou.
