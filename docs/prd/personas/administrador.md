# Persona — Administrador

Fonte do perfil: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção 2. Decisões citadas (A1 a A8, B1 a B4) estão em [perguntas-abertas.md](../perguntas-abertas.md).

Legenda: **fato** (vem da especificação), **decisão** (da equipe, com ID), **suposição** (inferência, com impacto), **lacuna** (ainda sem decisão).

## 1. Resumo

| Item | Descrição | Natureza |
| --- | --- | --- |
| Papel | Gerencia salas, professores, materiais, usuários, bloqueios e períodos de manutenção | Fato |
| Limites | Não aprova (RN-06) e não cria reservas próprias nesta versão; cada usuário tem um perfil | Decisão B2 |
| Contexto de uso | Mantém o catálogo e o controle de acesso, supervisiona reservas e auditoria, e bloqueia recursos em manutenção | Fato e decisão B3 |
| Frequência | Baixa a moderada, com picos em cadastros novos e em manutenções | Suposição, sem dado de uso. Impacto: define quanto investir em operações em lote |
| Dispositivo | Computador | Suposição. Impacto: telas administrativas podem priorizar densidade sobre uso em celular, embora RF-13 exija responsividade |
| Familiaridade | Alta; conhece o catálogo de recursos e o calendário de manutenção | Suposição. Impacto: tolera formulários extensos |

## 2. Cenário típico (ilustrativo)

No início do período, o Administrador cadastra uma nova sala com capacidade, localização e janela de abertura e fechamento (A6). Cadastra um projetor, com código de patrimônio (A3), e o marca como restrito (A1). Vincula um professor ao seu usuário, porque ele também reserva (A4).

Mais tarde, recebe um aviso de manutenção da sala e tenta bloquear um período. O sistema responde 409 com a lista de reservas conflitantes (A7). Ele confirma, e as reservas SOLICITADA e APROVADA são canceladas pelo sistema com motivo MANUTENCAO. Em outra manutenção, existe uma reserva EM_USO e o bloqueio é recusado, sem opção de forçar.

Cenário ilustrativo, não é dado de pesquisa.

## 3. Objetivos

| Objetivo | Natureza | RF e RN | Critério de sucesso observável |
| --- | --- | --- | --- |
| Manter o catálogo correto | Fato | RF-02 | Recurso cadastrado aparece na pesquisa com os atributos informados; material tem código de patrimônio (A3) |
| Controlar quem é restrito | Decisão A1 | RF-07, RN-06 | Reservas novas com recurso restrito exigem aprovação; as existentes não mudam |
| Gerenciar usuários e perfis | Fato; um perfil por usuário é decisão B2 | RF-01 | Cada usuário tem exatamente um perfil |
| Bloquear recurso sem surpresa | Fato; fluxo é decisão A7 | RF-08, RN-04, RN-07 | O bloqueio só é gravado após confirmar a lista de conflitos; EM_USO impede |
| Supervisionar reservas e auditoria | Decisão B3 | RF-10, RN-08 | Encontra quem mudou o quê e quando |
| Intervir com cancelamento motivado | Decisão A8 | RF-04, RN-05 | Cancela SOLICITADA e APROVADA com motivo obrigatório |
| Consultar utilização dos recursos | Decisão D5: acessa o relatório RF-12, somente leitura | RF-12, B4, RN-31 | Obtém carga horária, utilização de salas e conflitos evitados por filtro |

## 4. Tarefas principais

| Tarefa | Gatilho | Resultado esperado | RF |
| --- | --- | --- | --- |
| Cadastrar sala com janela | Nova sala disponível | Sala pesquisável, com abertura, fechamento e dias de funcionamento (A6, C5) | RF-02 |
| Cadastrar professor e competências | Novo docente | Professor alocável; vínculo com usuário opcional (A4) | RF-02 |
| Cadastrar material com patrimônio | Nova unidade | Unidade com código, tratada como recurso (A3) | RF-02 |
| Marcar recurso como restrito | Recurso exige controle | Novas reservas com ele exigem aprovação (A1) | RF-07 |
| Criar e alterar usuários e perfis | Novo usuário ou mudança de função | Usuário com um único perfil (B2) | RF-01 |
| Bloquear recurso em manutenção | Manutenção programada | 409 com lista; após confirmar, cancelamento com motivo MANUTENCAO (A7) | RF-08 |
| Consultar reservas e auditoria | Dúvida ou incidente | Histórico completo disponível (B3) | RF-10 |
| Cancelar reserva com motivo | Necessidade operacional | Reserva cancelada com motivo e auditoria (A8) | RF-04 |

## 5. Frustrações

Hipóteses: a especificação não descreve frustrações.

| Frustração | Impacto se estiver errada |
| --- | --- |
| Bloqueio que cancela reservas de vários usuários de uma vez | Alto: a lista e a confirmação de A7 são a mitigação; se insuficiente, pode precisar de remanejamento |
| Cadastro trabalhoso de muitas unidades com patrimônio | Baixo: pode demandar importação em lote (requisito novo) |
| Mudar o atributo "restrito" e ver que reservas existentes não mudam | Médio: A1 precisa estar visível na interface |
| Não poder reservar para si | Baixo: B2 é decisão de escopo desta versão |
| Não saber quem são os Responsáveis disponíveis | Médio: B1 exige ao menos dois |

## 6. Regras de negócio que afetam a persona

| Regra | Efeito na experiência |
| --- | --- |
| RN-02 e A2 | Bloqueios usam a mesma fronteira semiaberta das reservas |
| RN-04 | O bloqueio torna o recurso não reservável no período |
| RN-05 | Os cancelamentos por manutenção são transições para cancelada |
| RN-06 | Não aprova, mesmo sendo administrador (B2) |
| RN-07 | Reserva EM_USO impede o bloqueio e não pode ser cancelada |
| RN-08 | Vê a auditoria; suas ações também geram eventos |
| A6 e C5 | Define a janela e os dias de funcionamento das salas |
| RN-22 | O bloqueio exige confirmação e cancela SOLICITADA e APROVADA; EM_USO impede |
| RN-27 | Reservas nunca são apagadas; os cancelamentos ficam consultáveis |
| RN-29 | Suas ações de cadastro, perfil e bloqueio geram auditoria |
| RN-32 | Não desativa recurso com reservas futuras SOLICITADA, APROVADA ou EM_USO |

## 7. Permissões e visibilidade de dados

| Operação ou dado | Permitido | Decisão ou origem |
| --- | --- | --- |
| Cadastrar e consultar salas, professores e materiais | Sim | RF-02 |
| Definir que um recurso é restrito | Sim | A1 |
| Gerenciar usuários e perfis | Sim | RF-01, B2 |
| Atribuir mais de um perfil a um usuário | Não | B2 |
| Criar bloqueio de manutenção | Sim, com confirmação após 409 | A7, RF-08 |
| Bloquear período com reserva EM_USO | Não, sem opção de forçar | A7, RN-07 |
| Criar reservas próprias | Não | B2 |
| Aprovar recurso restrito | Não | RN-06, B2 |
| Ver todas as reservas e toda a auditoria, incluindo cadastro e perfil | Sim | B3, C4, C7 |
| Ver o relatório RF-12 | Sim, somente leitura | D5 |
| Desativar recurso sem reservas futuras SOLICITADA, APROVADA ou EM_USO | Sim | D6, RN-32 |
| Desativar recurso com essas reservas | Não: recusado com 409 | D6, RN-32 |
| Rejeitar solicitação | Não | D8, RN-33 |
| Cancelar reserva SOLICITADA ou APROVADA | Sim, com motivo obrigatório | A8 |
| Cancelar EM_USO ou estado terminal | Não | A8, RN-07 |
| Registrar início, retirada, devolução, conclusão e não comparecimento | Não | A8 (ações do Responsável) |
| Alterar reserva de outro usuário | Não: só o dono altera | C1 |

## 8. Relação com as outras personas

| Com quem | O que entrega | O que recebe |
| --- | --- | --- |
| Solicitante | Catálogo, janelas das salas e bloqueios | Nada diretamente; reservas ficam visíveis a ele (B3) |
| Responsável | Contas e perfis; definição de quais recursos exigem sua aprovação | Nada diretamente |
| Sistema | Confirmações de bloqueio | Cancelamentos automáticos com ator SISTEMA, auditados |

A criação dos usuários Responsáveis é dele; B1 exige ao menos dois.

## 9. Cenários de risco e uso indevido

Alimentam os testes de autorização.

| O que poderia tentar | O que impede |
| --- | --- |
| Aprovar uma reserva | RN-06, B2: resposta 403 |
| Criar reserva própria | B2: resposta 403 |
| Bloquear período com reserva EM_USO para forçar o cancelamento | A7, RN-07: bloqueio recusado |
| Confirmar bloqueio sem ver a lista de conflitos | A7: a gravação só ocorre após o 409 e a confirmação |
| Alterar "restrito" para esvaziar aprovações já exigidas | A1: reservas existentes não mudam; C7: a alteração é auditada |
| Dar a si mesmo outro perfil para aprovar | B2: um perfil por usuário; C7: a troca de perfil é auditada |
| Cancelar reserva sem informar motivo | A8: motivo obrigatório para o Administrador |
| Apagar reserva iniciada ou histórico de auditoria | RN-07, RN-08, RN-27, RF-10 |
| Desativar um recurso para derrubar as reservas dele | D6, RN-32: recusado com 409, sem cancelamento automático |
| Rejeitar uma reserva | D8, RN-33: recusado com 403 |

## 10. Questões remanescentes

- D9: retenção da auditoria e tratamento de dados pessoais nela.

## 11. Jornada na aplicação

Jornada pensada como telas do front end. Detalhe visual fica para a Fase 6.

### Pré-condições

- O usuário tem perfil Administrador e está autenticado (RF-01).
- Existe ao menos um usuário com perfil Responsável, e a restrição de dois Responsáveis é conhecida (B1).

### Fluxo principal

| # | Ação da pessoa | Resposta do sistema | RF e RN |
| --- | --- | --- | --- |
| 1 | **Tela de login:** informa as credenciais | Autentica e abre o painel administrativo | RF-01 |
| 2 | **Cadastro de salas:** informa capacidade, localização, hora de abertura, hora de fechamento, dias de funcionamento e se é restrita | Grava a sala, que passa a ser pesquisável, e registra auditoria | RF-02, RN-14, RN-10, RN-29 |
| 3 | **Cadastro de professores:** informa dados e competências; vincula a um usuário, se houver | Grava o professor como recurso alocável; o vínculo não concede perfil | RF-02, RN-13, RN-29 |
| 4 | **Cadastro de materiais:** informa o código de patrimônio e se é restrito | Grava a unidade como recurso | RF-02, RN-12, RN-29 |
| 5 | **Recurso restrito:** altera o atributo "restrito" de um recurso | Aplica a novas reservas; as existentes não mudam; registra auditoria | RN-10, RN-29 |
| 6 | **Usuários e perfis:** cria usuário e atribui um perfil | Grava com exatamente um perfil; registra auditoria | RF-01, RN-17, RN-29 |
| 7 | **Bloqueio de manutenção:** informa recurso, período e motivo | Responde 409 com a lista das reservas SOLICITADA e APROVADA conflitantes, sem gravar | RF-08, RN-04, RN-22 |
| 8 | Revisa a lista e confirma o bloqueio | Grava o bloqueio, cancela por inteiro as reservas listadas, mesmo com vários recursos, com motivo MANUTENCAO, registra auditoria e notifica os Solicitantes | RF-08, RN-22, RN-28, RN-08 |
| 9 | **Reservas:** consulta todas as reservas e cancela uma com motivo | Cancela com motivo obrigatório e registra auditoria; a reserva continua consultável | RF-04, RN-18, RN-26, RN-27 |
| 10 | **Auditoria:** filtra por entidade, ator e período | Lista eventos com ator, entidade, estado anterior e novo, de reservas, recursos, usuários, perfis e bloqueios | RF-10, RN-08, RN-29, RN-26 |
| 11 | **Relatório:** escolhe período, tipo de recurso e recurso | Mostra carga horária, utilização (salas) e conflitos evitados, paginado, somente leitura | RF-12, RN-31, RN-26 |

### Fluxos alternativos e de erro

| Situação | Resposta do sistema | RF e RN |
| --- | --- | --- |
| Bloqueio sobre período com reserva EM_USO | Recusa o bloqueio sem opção de forçar | RN-22, RN-07 |
| Confirmação de bloqueio sem a lista prévia | Recusa; a gravação só ocorre após a resposta 409 e a confirmação | RN-22 |
| Conflito de horário com outro bloqueio | Recusa com 409; os bloqueios usam a mesma fronteira das reservas | RN-11, RN-04 |
| Material com código de patrimônio já existente | Recusa de validação (suposição: o código identifica uma única unidade) | RN-12 |
| Sala sem janela ou sem dias de funcionamento | Recusa de validação do cadastro | RN-14 |
| Atribuir segundo perfil ao mesmo usuário | Recusa | RN-17 |
| Tentar criar ou aprovar reserva | Recusa com 403 | RN-17, RN-06 |
| Cancelar reserva sem motivo | Recusa de validação | RN-18 |
| Cancelar reserva EM_USO | Recusa | RN-18, RN-07 |
| Desativar recurso com reservas futuras SOLICITADA, APROVADA ou EM_USO | Recusa com 409 listando as reservas; nada é desativado nem cancelado | RN-32 |
| Token expirado | O servidor responde 401, nada é gravado e a tela leva ao login | RF-01 |
| Acesso negado a operação de outro perfil | Recusa com 403 | RF-01 |

### Resultado esperado

- Catálogo, restrições e perfis consistentes, com cada mudança auditada.
- Bloqueios aplicados somente após o Administrador ver e confirmar o efeito sobre as reservas.
- Nenhum bloqueio atinge reserva em uso.
- Toda a auditoria consultável por ele, incluindo cadastro e perfil.
