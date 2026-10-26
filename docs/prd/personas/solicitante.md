# Persona — Solicitante

Fonte do perfil: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Escopo e perfis". Decisões e lacunas citadas (identificadores A, B, C e D) estão em [perguntas-abertas.md](../perguntas-abertas.md).

Legenda: **fato** (vem da especificação), **decisão** (da equipe, com ID), **suposição** (inferência, com impacto), **lacuna** (ainda sem decisão).

## 1. Resumo

| Item | Descrição | Natureza |
| --- | --- | --- |
| Papel | Professor ou coordenador que consulta a disponibilidade e cria, altera ou cancela suas reservas | Fato |
| Contexto de uso | Reserva sala, professor e material para atividades acadêmicas, antes de a atividade acontecer | Suposição: decorre do objetivo da especificação. Impacto: define o momento em que a tela de busca é usada |
| Frequência | Ocasional, ligada ao calendário das atividades | Suposição, sem dado de uso. Impacto: usuário eventual precisa de interface autoexplicativa |
| Dispositivo | Computador e celular | Suposição: RF-13 exige interface responsiva. Impacto: a tela de reserva precisa funcionar em viewport pequeno |
| Familiaridade | Sabe usar sistemas web em geral, sem treinamento específico | Suposição. Impacto: mensagens e fluxo precisam dispensar manual |

## 2. Cenário típico (ilustrativo)

Uma professora precisa de uma sala com capacidade para a turma e de um projetor para uma aula extra. Ela pesquisa por tipo, capacidade e intervalo e vê os horários ocupados sem saber de quem são (B3). Escolhe uma sala livre e inclui o projetor, que o Administrador marcou como restrito (A1).

A reserva fica em SOLICITADA e ela recebe uma notificação quando o Responsável a aprova (A5). Dias depois, a aula é cancelada e ela cancela a reserva APROVADA antes do início (A8), liberando o recurso. Em outra ocasião, reserva só uma sala sem recurso restrito e a reserva é aprovada automaticamente (A1).

Cenário ilustrativo, não é dado de pesquisa.

## 3. Objetivos

| Objetivo | Natureza | RF e RN | Critério de sucesso observável |
| --- | --- | --- | --- |
| Saber o que está livre | Fato | RF-03, A6, B3 | A busca devolve apenas recursos livres no intervalo, dentro da janela da sala, sem identificar quem reservou |
| Reservar sem conflito | Fato | RF-04, RF-05, RF-06, RN-01, RN-02, RN-03 | Reserva criada, ou recusa com motivo; nenhuma sobreposição é aceita, nem com pedidos simultâneos |
| Obter aprovação de recurso restrito | Fato | RF-07, RN-05, RN-06, A1 | Vê a reserva em SOLICITADA e depois em APROVADA ou rejeitada, com notificação |
| Alterar e cancelar as próprias reservas | Fato | RF-04, RN-05, RN-07, RN-18, RN-19, A8, C1 | Cancelamento aceito em SOLICITADA e em APROVADA até o início; recusado em EM_USO |
| Entender a recusa | Decisão da equipe de apresentar o motivo; suposição quanto ao conteúdo | RF-13 | A mensagem indica o motivo (sobreposição, manutenção, fora da janela) sem identificar terceiros. Impacto se estiver errada: muda o texto dos erros |

## 4. Tarefas principais

| Tarefa | Gatilho | Resultado esperado | RF |
| --- | --- | --- | --- |
| Pesquisar disponibilidade | Precisa de recurso para uma atividade | Lista filtrada por tipo, capacidade, localização, competência e intervalo | RF-03 |
| Criar reserva | Encontrou recurso livre | Reserva em SOLICITADA; passa a APROVADA automaticamente se não houver recurso restrito (A1) | RF-04, RF-05, RF-06 |
| Acompanhar o pedido | Enviou reserva com recurso restrito | Estado atualizado e notificação de aprovação ou rejeição (A5) | RF-07, RF-11 |
| Alterar reserva | Mudou horário ou recursos | Reserva atualizada sem conflito, de forma atômica; volta a SOLICITADA se exigia aprovação (C1) | RF-04 |
| Cancelar reserva | Atividade cancelada ou remarcada | Reserva cancelada e recurso liberado | RF-04 |
| Ler o motivo de uma recusa | Recebeu recusa ou conflito | Entende o que mudar para reservar | RF-13 |

## 5. Frustrações

Hipóteses: a especificação não descreve frustrações.

| Frustração | Impacto se estiver errada |
| --- | --- |
| Ver horário ocupado sem saber quando volta a ficar livre ou de quem é (B3 impede ver o dono) | Baixo: se for relevante, B3 pode ser revista |
| Esperar a aprovação sem prazo (C2) e ver a reserva cancelada com SEM_DECISAO se o início chegar | Médio: depende da validação de S6 |
| Ter reserva APROVADA cancelada por manutenção (A7) | Médio: a notificação precisa explicar o motivo |
| Receber recusa sem entender o motivo | Médio: muda o conteúdo das mensagens (RF-13) |
| Alteração de período ou recurso que devolve a reserva a SOLICITADA (C1) | Médio: a interface precisa avisar antes de confirmar |

## 6. Regras de negócio que afetam a persona

| Regra | Efeito na experiência |
| --- | --- |
| RN-01 | Fim deve ser posterior ao início; duração zero é recusada (A2) |
| RN-02 | Reservas do mesmo recurso não se sobrepõem; reservas consecutivas são permitidas (A2) |
| RN-03 | Em pedidos simultâneos, só um é aceito; o outro recebe recusa |
| RN-04 | Recurso em manutenção não pode ser reservado |
| RN-05 | A reserva percorre estados e algumas ações só existem em certos estados (A8) |
| RN-06 | Não pode aprovar recurso restrito; depende de um Responsável |
| RN-07 | Reserva iniciada não pode ser apagada nem cancelada (A8) |
| RN-08 | Toda mudança de estado gera auditoria; o Solicitante não acessa a auditoria (B3) |
| RN-09 e RN-10 | Reserva sem recurso restrito é aprovada automaticamente; com recurso restrito aguarda aprovação |
| RN-14 | A reserva precisa caber na janela e nos dias de funcionamento da sala e não cruza a meia-noite local |
| RN-19 | Altera em SOLICITADA e em APROVADA até o início; a alteração é atômica |
| RN-25 | Reserva SOLICITADA sem decisão ao chegar o início é cancelada pelo sistema |
| RN-27 | A reserva nunca é apagada; cancelar é mudança de estado |

## 7. Permissões e visibilidade de dados

| Operação ou dado | Permitido | Decisão ou origem |
| --- | --- | --- |
| Pesquisar disponibilidade | Sim, vendo intervalos ocupados sem identificar quem reservou | RF-03, B3 |
| Criar reserva | Sim | Fato (RF-04); aprovação automática sem recurso restrito (A1) |
| Ver as próprias reservas | Sim | B3 |
| Ver reservas de outros usuários | Não | B3 |
| Alterar a própria reserva | Sim, em SOLICITADA e em APROVADA até o início | Fato (RF-04); C1 |
| Cancelar reserva SOLICITADA própria | Sim, sem motivo | A8 |
| Cancelar reserva APROVADA própria | Sim, até o início | A8 |
| Cancelar reserva EM_USO ou em estado terminal | Não | A8, RN-07 |
| Aprovar recurso restrito | Não | RN-06 |
| Ver a auditoria | Não | B3 |
| Gerenciar cadastros, usuários e bloqueios | Não | B2 (atribuições do Administrador) |
| Definir que um recurso é restrito | Não | A1 |

## 8. Relação com as outras personas

| Com quem | O que entrega | O que recebe |
| --- | --- | --- |
| Responsável | O pedido que exige aprovação (recurso restrito) | Decisão de aprovar ou rejeitar; registro de início e de retirada ao usar o recurso |
| Administrador | Nada diretamente; depende do catálogo e dos bloqueios por ele mantidos | Recursos cadastrados, restrições e cancelamento por manutenção (A7) |
| Sistema | Pedido de reserva | Aprovação automática (ator SISTEMA, A1), notificações (A5) |

O Responsável também pode ser Solicitante (B1); nesse caso, a reserva dele não é aprovada por ele mesmo.

## 9. Cenários de risco e uso indevido

Alimentam os testes de autorização.

| O que poderia tentar | O que impede |
| --- | --- |
| Ver, alterar ou cancelar a reserva de outro usuário | RF-01, B3, A8: acesso recusado |
| Aprovar a própria reserva de recurso restrito | RN-06, B1: resposta 403, sem mudança de estado |
| Descobrir quem reservou um horário pela consulta de disponibilidade | B3: a resposta só traz intervalos |
| Enviar a reserva com "exige aprovação" falso | A1: o valor é calculado no servidor a partir do cadastro, não vem do cliente |
| Reservar recurso em manutenção ou fora da janela da sala | RN-04, A6 |
| Enviar dois pedidos ao mesmo tempo para o mesmo recurso e horário | RN-03, RF-06: uma única reserva aceita |
| Cancelar reserva em uso ou apagar reserva iniciada | RN-07, RN-27, A8 |
| Alterar reserva EM_USO ou em estado terminal | C1, RN-19 |
| Informar fim antes do início ou duração zero | RN-01, A2 |
| Incluir recurso restrito, por alteração, em reserva que não exigia aprovação | RN-10 e RN-19 não definem o recálculo: lacuna D12 |
| Reservar com início no passado | RN-01 não cobre: lacuna D16 |

## 10. Questões remanescentes

- D2: mecanismo do cancelamento por SEM_DECISAO (suposição S6), que o Solicitante percebe como cancelamento automático.
- D10: instante exato de "até o início" para cancelar e alterar.
- D12: recálculo de "exige aprovação" quando a alteração inclui recurso restrito.
- D16: reserva com início no passado.

## 11. Jornada na aplicação

Jornada pensada como telas do front end. Detalhe visual fica para a Fase 6.

### Pré-condições

- O usuário tem perfil Solicitante e está autenticado (RF-01).
- Existem recursos cadastrados, e as salas têm janela e dias de funcionamento (A6, C5).
- A sessão está válida; o tratamento de sessão expirada está nos fluxos de erro.

### Fluxo principal

| # | Ação da pessoa | Resposta do sistema | RF e RN |
| --- | --- | --- | --- |
| 1 | **Tela de login:** informa as credenciais | Autentica e abre a tela Minhas reservas, com as ações do perfil Solicitante | RF-01 |
| 2 | **Tela de busca:** informa tipo, capacidade, localização, competência, data e intervalo | Lista recursos livres no intervalo e dentro da janela; mostra horários ocupados sem identificar o dono | RF-03, RN-02, RN-04, RN-14, RN-26 |
| 3 | **Nova reserva:** escolhe sala, professor e material e informa título, início e fim | Valida término posterior ao início, fronteira [início, fim) e janela; indica se a reserva exigirá aprovação, valor calculado pelo servidor | RF-04, RF-05, RN-01, RN-10, RN-11, RN-14 |
| 4 | Confirma a reserva | Cria a reserva em SOLICITADA. Sem recurso restrito, passa a APROVADA automaticamente (ator SISTEMA). Com recurso restrito, aguarda um Responsável, que é notificado | RF-04, RF-06, RF-07, RN-03, RN-05, RN-09, RN-28 |
| 5 | **Minhas reservas:** acompanha o estado | Lista apenas as próprias reservas, com estado e motivo de rejeição ou cancelamento | RF-04, RN-26 |
| 6 | **Detalhe da reserva:** altera período, recurso, título ou descrição | Reavalia RN-01, RN-02 e RN-04 e troca as ocupações de forma atômica. Se exigia aprovação e mudou período ou recurso, volta a SOLICITADA. Título e descrição não reaprovam | RF-04, RN-19, RN-08 |
| 7 | Cancela a reserva e confirma | Muda para cancelada, libera o recurso e registra auditoria; a reserva continua consultável | RF-04, RN-18, RN-27, RN-08 |
| 8 | Recebe a notificação de aprovada, rejeitada ou cancelada | Mostra o novo estado e o motivo, quando houver | RF-11, RN-24, RN-28 |

### Fluxos alternativos e de erro

| Situação | Resposta do sistema | RF e RN |
| --- | --- | --- |
| Conflito de horário | Recusa com 409 e código estável; informa que o intervalo está ocupado, sem identificar quem reservou; nada é gravado | RF-05, RN-02, RN-26 |
| Pedido simultâneo perdedor | Recusa com 409; só um dos pedidos é aceito | RF-06, RN-03 |
| Recurso em manutenção | Recusa informando indisponibilidade por manutenção | RF-08, RN-04 |
| Professor ocupado | Recusa com 409 informando que o professor já está alocado no intervalo | RF-05, RN-02 |
| Fora da janela ou em dia sem funcionamento | Recusa informando a janela e os dias da sala | RN-14 |
| Término igual ou anterior ao início | Recusa de validação no formulário e no servidor | RN-01 |
| Alteração com conflito | Responde 409 e a reserva permanece como estava | RN-19 |
| Alterar ou cancelar reserva EM_USO ou em estado terminal | Recusa; a reserva só é encerrada pelo Responsável (conclusão) | RN-18, RN-19, RN-07 |
| Token expirado | O servidor responde 401, nada é gravado e a tela leva ao login. Preservar o formulário preenchido é suposição a validar na Fase 6 | RF-01 |
| Acesso negado (reserva de outro usuário ou operação de outro perfil) | Recusa sem revelar dados da reserva | RF-01, RN-26 |
| Reserva cancelada pelo sistema (MANUTENCAO ou SEM_DECISAO) | O Solicitante recebe a notificação com o motivo | RN-22, RN-25, RN-28 |
| Provedor de notificação indisponível | A reserva permanece válida; o aviso fica pendente para reenvio | RN-28 |

### Resultado esperado

- Reserva criada sem conflito, aprovada automaticamente ou aguardando decisão, com o estado sempre visível.
- Qualquer recusa traz o motivo, sem expor dados de terceiros.
- A reserva alterada ou cancelada mantém a agenda consistente e deixa registro de auditoria.
