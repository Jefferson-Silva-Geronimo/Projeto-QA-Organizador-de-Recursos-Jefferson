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
| Consultar utilização dos recursos | Suposição: RF-12 não nomeia o perfil (C4). Impacto: define quem acessa o relatório | RF-12, B4 | Obtém carga horária, utilização de salas e conflitos evitados por filtro |

## 4. Tarefas principais

| Tarefa | Gatilho | Resultado esperado | RF |
| --- | --- | --- | --- |
| Cadastrar sala com janela | Nova sala disponível | Sala pesquisável, com abertura e fechamento (A6) | RF-02 |
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
| A6 | Define a janela de funcionamento das salas |

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
| Ver todas as reservas e a auditoria | Sim | B3 |
| Cancelar reserva SOLICITADA ou APROVADA | Sim, com motivo obrigatório | A8 |
| Cancelar EM_USO ou estado terminal | Não | A8, RN-07 |
| Registrar início, retirada, devolução, conclusão e não comparecimento | Não | A8 (ações do Responsável) |
| Alterar reserva de outro usuário | Não decidido | Lacuna C1 |

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
| Alterar "restrito" para esvaziar aprovações já exigidas | A1: reservas existentes não mudam; C7 trata o rastro da alteração |
| Dar a si mesmo outro perfil para aprovar | B2: um perfil por usuário; C7 trata a auditoria da troca de perfil |
| Cancelar reserva sem informar motivo | A8: motivo obrigatório para o Administrador |
| Apagar reserva iniciada ou histórico de auditoria | RN-07, RN-08, RF-10 |

## 10. Questões remanescentes

- C1: se pode alterar reserva de outro usuário e em quais estados.
- C4: acesso ao relatório RF-12 por perfil.
- C5: horas de funcionamento (dias, feriados) para a utilização.
- C7: auditoria de mudanças de cadastro e de perfil.

## 11. Jornada na aplicação

A jornada passo a passo é produzida no Prompt 1.2. TODO.
