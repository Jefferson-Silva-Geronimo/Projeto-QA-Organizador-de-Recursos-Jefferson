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
| Fazer o material voltar | Suposição: decorre do acompanhamento. Impacto: cobrança de atraso seria requisito novo (RF-15 em diante) | RF-09 | Reservas com material não ficam sem devolução registrada ao concluir (depende de C3) |
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

## 5. Frustrações

Hipóteses: a especificação não descreve frustrações.

| Frustração | Impacto se estiver errada |
| --- | --- |
| Aprovar sem contexto sobre quem pediu, para quê e se há conflito | Médio: muda os dados mostrados na fila |
| Fila que cresce sem prazo ou prioridade (C2) | Médio: pode exigir prazo ou ordenação |
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
| A8 | Cancela APROVADA com motivo; não cancela EM_USO nem estados terminais |

## 7. Permissões e visibilidade de dados

| Operação ou dado | Permitido | Decisão ou origem |
| --- | --- | --- |
| Aprovar reserva de outro usuário com recurso restrito | Sim | RN-06, A1 |
| Aprovar a própria reserva | Não | B1 |
| Rejeitar solicitação | Sim | Suposição: rejeitada é estado de RN-05 e quem aprova é quem decide. Impacto: transição de estados |
| Criar reservas | Sim, com as permissões do Solicitante | B1 |
| Ver todas as reservas e a fila de aprovações | Sim | B3 |
| Ver a auditoria | Não decidido | Lacuna C4 (B3 só a atribui ao Administrador) |
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

## 10. Questões remanescentes

- C2: se decidir exige motivo e se há prazo.
- C3: se a devolução condiciona a conclusão.
- C4: acesso à auditoria e ao relatório RF-12.

## 11. Jornada na aplicação

A jornada passo a passo é produzida no Prompt 1.2. TODO.
