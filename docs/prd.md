# PRD — Organização de Recursos

| Campo | Valor |
| --- | --- |
| Projeto | Organização de Recursos (Qualidade de Software, TADS, 2026.2) |
| Fonte de verdade | [Especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), lida em 12/10/2026 |
| Estado | Fase 1 concluída e revisada em 12/10/2026 |
| Entrega | Semana 46 |

Este documento separa o que a especificação **afirma** (fato), o que a equipe **decidiu** (decisão, com ID), o que é **suposição** (com impacto) e o que segue em **lacuna**. O registro completo está em [perguntas-abertas.md](prd/perguntas-abertas.md) e as regras, com exemplos e técnica de teste, em [regras-negocio.md](prd/regras-negocio.md).

## 1. Visão

Uma aplicação que organiza a alocação de **salas, professores e materiais** sem conflitos de horário.

Fato (especificação, seção 1): o foco da avaliação é apresentar **evidências objetivas de qualidade, segurança, rastreabilidade e desempenho**, e não apenas que o sistema funcione. O Foot Fanatics, visto nas aulas, é só o case de demonstração; o projeto avaliado é este.

## 2. Problema

A especificação não descreve o problema em narrativa; ela declara o objetivo: alocar salas, professores e materiais sem conflito de horário. Do objetivo e das regras críticas decorre o que o produto precisa resolver:

- Um mesmo recurso (sala, professor ou material) não pode estar em duas reservas ao mesmo tempo (RN-02).
- Pedidos feitos ao mesmo tempo para o mesmo recurso não podem gerar duas reservas aceitas (RN-03).
- Recursos em manutenção não podem ser reservados (RN-04).
- Recursos restritos exigem aprovação de um responsável (RF-07, RN-06).

**Suposição S1:** o problema atual é resolvido por meio manual e sujeito a conflito. Origem: inferência do objetivo. Impacto se estiver errada: o texto de motivação do produto muda, sem efeito sobre os requisitos, que vêm da especificação.

## 3. Perfis de usuário

Fato (especificação, seção 2). Detalhe em [docs/prd/personas](prd/personas/).

| Perfil | Papel | Persona |
| --- | --- | --- |
| Solicitante | Professor ou coordenador que consulta a disponibilidade e cria, altera ou cancela suas reservas | [solicitante.md](prd/personas/solicitante.md) |
| Responsável | Aprova solicitações especiais, valida a alocação de docentes e acompanha retiradas e devoluções de material | [responsavel.md](prd/personas/responsavel.md) |
| Administrador | Gerencia salas, professores, materiais, usuários, bloqueios e períodos de manutenção | [administrador.md](prd/personas/administrador.md) |

Decisões sobre os perfis:

- Professor é recurso alocável e o vínculo com usuário é opcional ([A4](prd/perguntas-abertas.md)).
- O Responsável também cria reservas, mas ninguém aprova a própria ([B1](prd/perguntas-abertas.md)).
- O Administrador não aprova nem cria reservas próprias; cada usuário tem exatamente um perfil ([B2](prd/perguntas-abertas.md)).
- Visibilidade por perfil em [B3](prd/perguntas-abertas.md) e [D5](prd/perguntas-abertas.md).
- Rejeita apenas o Responsável que não é o dono da reserva ([D8](prd/perguntas-abertas.md)).

## 4. Escopo

### 4.1 Requisitos funcionais obrigatórios

Fato (especificação, seção 3). Numeração preservada.

| ID | Requisito |
| --- | --- |
| RF-01 | Autenticação e autorização por perfil |
| RF-02 | Cadastro e consulta de salas, professores e materiais |
| RF-03 | Pesquisa por tipo, capacidade, localização, competência e disponibilidade |
| RF-04 | Criação, alteração e cancelamento de reservas |
| RF-05 | Detecção de sobreposição de horários, inclusive na agenda do professor |
| RF-06 | Proteção contra dupla reserva em solicitações simultâneas |
| RF-07 | Aprovação obrigatória para recursos restritos |
| RF-08 | Bloqueio de recursos em manutenção |
| RF-09 | Registro de retirada e devolução de materiais e equipamentos |
| RF-10 | Histórico auditável de mudanças |
| RF-11 | Notificação simulada ou integração com API externa |
| RF-12 | Relatório de utilização por recurso, carga horária alocada e conflitos evitados |
| RF-13 | Interface responsiva e mensagens de erro compreensíveis |
| RF-14 | Documentação de API ou dos fluxos públicos do sistema |

O detalhamento (persona, jornada, regras ligadas, decisões e critério de aceite) está em [requisitos-funcionais.md](prd/requisitos-funcionais.md), que também traz os acréscimos da equipe RF-15 e RF-16.

### 4.2 Regras críticas

Fato (especificação, seção 4). Numeração preservada. Texto fiel, exemplos e técnica de teste em [regras-negocio.md](prd/regras-negocio.md), que também traz RN-09 em diante, decorrentes das decisões da equipe.

| ID | Regra |
| --- | --- |
| RN-01 | O término deve ser posterior ao início |
| RN-02 | Reservas do mesmo recurso não podem se sobrepor (sala, material ou professor) |
| RN-03 | Duas solicitações simultâneas devem produzir uma única reserva aceita |
| RN-04 | Recursos em manutenção não podem ser reservados |
| RN-05 | Fluxo principal `SOLICITADA → APROVADA → EM_USO → CONCLUÍDA`. Estados alternativos: rejeitada, cancelada e não compareceu |
| RN-06 | Somente responsáveis aprovam recursos restritos |
| RN-07 | Reservas iniciadas não podem ser apagadas |
| RN-08 | Toda mudança de estado deve gerar auditoria |

### 4.3 Restrições

| Restrição | Origem |
| --- | --- |
| Java 21 e Spring Boot 3.x | Especificação, seção 1 |
| Entrega na semana 46 | Especificação, seção 1 |
| Unitários com JUnit 5 (inclusive parametrizados), integração, API em caixa-preta e end-to-end | Especificação, seção 5 |
| Banco containerizado com Testcontainers e WireMock para integrações externas | Especificação, seção 5 |
| Teste automatizado de proteção contra dupla reserva | Especificação, seção 5 |
| Ao menos uma funcionalidade nova com evidências de TDD ou BDD | Especificação, seção 5 |
| GitHub Actions em pull requests, JaCoCo e SonarCloud | Especificação, seção 5 |
| JMeter, autorização, validação de entrada e tratamento seguro de erros | Especificação, seção 5 |
| Mocks apenas em testes unitários isolados; persistência e integrações críticas em ambiente real | Especificação, seção 5 |

### 4.4 Decisões da equipe que moldam o escopo

Decisões de 12/10/2026. O texto de cada uma, com justificativa, alternativas e impacto, está em [perguntas-abertas.md](prd/perguntas-abertas.md), que é a fonte. A coluna "Validado pelo professor" é "Não" em todas as linhas: nenhuma decisão foi validada com ele. As lacunas A1 a A8 (plano de projeto, seção 5.3) foram decididas pela equipe em 24/10/2026, sem validação externa ([decisoes-equipe.md](decisoes-equipe.md), F7-16 e F7-17).

| ID | Tema | RF e RN afetados | Validado pelo professor |
| --- | --- | --- | --- |
| A1 | Recurso restrito e aprovação automática | RF-02, RF-07, RN-09, RN-10 | Não (decisão da equipe, 24/10/2026) |
| A2 | Fronteira de horário [início, fim) | RN-11 | Não (decisão da equipe, 24/10/2026) |
| A3 | Material por unidade identificada | RF-02, RF-09, RN-12 | Não (decisão da equipe, 24/10/2026) |
| A4 | Professor como recurso, vínculo opcional | RF-02, RF-05, RN-13 | Não (decisão da equipe, 24/10/2026) |
| A5 | Notificação por webhook, após o commit | RF-11, RN-28 | Não (decisão da equipe, 24/10/2026) |
| A6 | Fuso, UTC e janela da sala | RF-03, RF-04, RN-14, RN-15 | Não (decisão da equipe, 24/10/2026) |
| A7 | Bloqueio sobre reservas existentes | RF-08, RN-22 | Não (decisão da equipe, 24/10/2026) |
| A8 | Cancelamento, início de uso e não comparecimento | RF-04, RF-09, RF-16, RN-18, RN-20, RN-21 | Não (decisão da equipe, 24/10/2026) |
| B1 | Responsável também reserva, sem aprovar a própria | RF-04, RF-07, RN-16 | Não |
| B2 | Administrador não reserva nem aprova | RF-01, RF-15, RN-17 | Não |
| B3 | Visibilidade por perfil | RF-03, RF-10, RN-26 | Não |
| B4 | Cálculos do relatório | RF-12, RN-30, RN-31 | Não |
| C1 | Alteração atômica de reserva | RF-04, RN-19 | Não |
| C2 | Motivo na decisão e cancelamento SEM_DECISAO | RF-07, RF-16, RN-24, RN-25 | Não; S6 a validar |
| C3 | Conclusão condicionada à devolução | RF-09, RF-16, RN-23 | Não |
| C4 | Acesso a histórico, auditoria e relatório | RF-10, RF-12, RN-26 | Não |
| C5 | Dias de funcionamento e relatório paginado | RF-12, RN-14, RN-31 | Não |
| C6 | Contrato e reenvio do webhook | RF-11, RN-28 | Não; S7 a validar |
| C7 | Auditoria ampliada | RF-10, RF-15, RN-29 | Não |
| C8 | Vínculo professor e usuário sem perfil | RF-01, RF-05, RN-13 | Não |
| — | Nenhuma reserva é apagada fisicamente | RF-10, RN-27 | Não |
| D5 | Administrador vê o relatório, somente leitura | RF-12, RN-26 | Não |
| D6 | Desativação de recurso recusada com reservas futuras | RF-02, RN-32 | Não |
| D7 | Bloqueio cancela a reserva inteira | RF-08, RN-22 | Não |
| D8 | Rejeita o Responsável que não é o dono | RF-07, RN-33 | Não |
| D10 | "Até o início" é antes do instante de início | RF-04, RF-16, RN-18, RN-19, RN-25 | Não |
| D11 | Reserva futura é a de término posterior ao instante atual | RF-02, RN-32 | Não |
| D12 | "Exige aprovação" recalculado quando a alteração muda os recursos | RF-04, RF-07, RN-10, RN-19 | Não |
| D13 | Responsável dono opera a própria reserva, sem aprovar nem rejeitar | RF-09, RF-16, RN-16, RN-20, RN-23 | Não |
| D2 | Job agendado só para SEM_DECISAO; não comparecimento manual | RF-07, RF-16, RN-21, RN-24, RN-25 | Não; S6 a validar |
| D14 | Desativação de usuário recusada com pendências ou com menos de dois Responsáveis | RF-15, RF-10, RN-16, RN-29 | Não |
| D15 | Levantamento de bloqueio pelo Administrador, com motivo | RF-08, RF-10, RN-22, RN-29 | Não |
| D16 | Reserva com início no passado é recusada | RF-04, RN-01, RN-18, RN-19 | Não |

### 4.5 Decisões técnicas da equipe fora da especificação

A especificação exige apenas Java 21, Spring Boot 3.x e interface responsiva (RF-13).

| Decisão | Origem | Estado |
| --- | --- | --- |
| Banco PostgreSQL e gerenciador Maven | Plano da equipe | Decidida; ADR a registrar na Fase 2 |
| Front end em React + Vite, como SPA que consome a API REST | Plano da equipe | Decidida; ADR a registrar na Fase 2 |

### 4.6 Restrições de operação decorrentes das decisões

| Restrição | Origem | Efeito |
| --- | --- | --- |
| Ao menos dois Responsáveis cadastrados | B1 | Com um só Responsável, reserva dele com recurso restrito nunca é aprovada |
| Cada usuário tem exatamente um perfil | B2 | Quem precisa de dois papéis precisa de duas contas |
| Fuso e tolerância de não comparecimento são configuráveis | A6, A8 | Valores iniciais não fazem parte do produto; o da tolerância segue como suposição S4 |
| Endereço do webhook vem de variável de ambiente | A5 | Nenhuma URL ou token no repositório |
| Nenhuma reserva é apagada fisicamente | Regra geral, RN-07, RN-08 | Encerramentos são mudanças de estado com auditoria; não existe operação de exclusão de reserva |
| Número de tentativas e intervalo do reenvio são configuráveis | C6 | Valor padrão segue como suposição S7 |
| Sala exige janela diária e dias de funcionamento | A6, C5 | Sala sem esses dados não aceita reserva |

## 5. Fora de escopo

A especificação **não traz uma lista de itens fora de escopo**. O recorte abaixo separa fato, decisão, suposição e lacuna.

| Item | Natureza | Observação |
| --- | --- | --- |
| Funcionalidades do Foot Fanatics | Fato | A especificação diz que ele é só o case de demonstração das aulas |
| Controle de material por quantidade em estoque e consumíveis | Decisão A3 | Cada material é uma unidade identificada. Se a decisão estiver errada, o modelo de dados muda |
| Reserva que cruza a meia-noite local | Decisão A6 (suposição S3) | Impacto se estiver errada: eventos noturnos ficam impossíveis de reservar |
| Reservas próprias do Administrador | Decisão B2 | O Administrador administra; quem precisa reservar usa outro perfil |
| Cobrança de atraso na devolução de material | Decisão C3 | Só se exige devolução para concluir; a cobrança não existe nesta versão |
| Calendário de feriados na utilização | Decisão C5 | A utilização usa só dias da semana de funcionamento. Impacto: percentual inclui feriados como dias de funcionamento |
| Qualquer funcionalidade além de RF-01 a RF-16 | Suposição S2 | RF-15 e RF-16 foram acrescentados porque uma jornada ficou sem requisito. Outros só entram com a mesma justificativa |
| Pontos listados na seção D de [perguntas-abertas.md](prd/perguntas-abertas.md) | Lacuna | Não são implementados nem assumidos até haver decisão |

## 6. Métricas de sucesso

Fato (especificação, seção 6). São as metas mensuráveis; todas medem evidência, não entrega de funcionalidade.

| Métrica | Meta | Como será medida |
| --- | --- | --- |
| Cobertura de linhas | **80%** | JaCoCo |
| Cobertura de branches | **70%** | JaCoCo |
| Requisitos críticos na RTM | **100%** | [RTM.md](../RTM.md) |
| Bugs ou vulnerabilidades críticos | **0** | SonarCloud |

Observações:

- Fato (especificação, seção 6): cobertura alta, sozinha, não garante qualidade; testes triviais escritos só para subir o percentual não asseguram pontuação máxima.
- **Lacuna:** a especificação não define critérios de desempenho (tempos de resposta, número de usuários simultâneos). Qualquer número usado nos testes de carga será suposição, com validação pendente. As decisões da equipe não introduziram número algum.
- Fato (especificação, seção 8): são limitadores de nota aplicação que não executa, pipeline ausente, falha de autorização ou possibilidade de dupla reserva. As decisões A1, A8, B1, B2 e B3 aumentam a superfície de autorização e entram na matriz perfil × operação.

## 7. Entregáveis

Fato (especificação, seção 7): repositório com histórico e revisão por pares; aplicação executável com instruções; `README.md` e documentação dos fluxos ou da API; `RTM.md` ligando requisito, risco, teste e evidência; diagramas de contexto, componentes e sequências críticas; plano, suíte automatizada e relatório de testes; pipeline de integração contínua; relatórios de SonarCloud e cobertura; plano e resultado do teste de carga; registro de defeitos; relatório final de qualidade; apresentação e demonstração.

## 8. Lacunas e decisões pendentes de confirmação

- As oito lacunas apontadas pela equipe no plano de projeto (seção 5.3) e as quatro dúvidas da redação estão **decididas pela equipe** em [perguntas-abertas.md](prd/perguntas-abertas.md).
- As lacunas A1 a A8 foram decididas pela equipe em 24/10/2026 e **não foram validadas com o professor** (F7-16 e F7-17 em [decisoes-equipe.md](decisoes-equipe.md)). A3 é a de maior retrabalho se estiver errada.
- As oito lacunas C1 a C8, surgidas ao aplicar as decisões, foram **decididas pela equipe** em 12/10/2026.
- Nove lacunas (D1 a D9) surgiram ao aplicar as decisões C. D5 a D8 foram **decididas** em 12/10/2026 e D2 em 15/10/2026; D1, D3, D4 e D9 foram decididas pela equipe em 24/10/2026, sem valor padrão e sem validação do professor (F7-16).
- Sete ambiguidades (D10 a D16) foram registradas na revisão das Fases 0 e 1. D10, D11, D12 e D13 (instante de "até o início", "reserva futura", recálculo de "exige aprovação" e operação da própria reserva pelo Responsável dono) foram **decididas** em 15/10/2026. D14, D15 e D16 (desativação de usuário, levantamento de bloqueio e reserva com início no passado) também foram **decididas** em 15/10/2026, junto com D2 (mecanismo de SEM_DECISAO). D17 (duração da sessão) foi aberta em 15/10/2026 e segue sem valor.
- Duas decisões carregam suposição a validar: C2 (S6) e C6 (S7).

## 9. Suposições registradas

| ID | Suposição | Impacto se estiver errada |
| --- | --- | --- |
| S1 | O problema hoje é resolvido de forma manual e sujeito a conflito | Muda o texto de motivação, não os requisitos |
| S2 | O escopo é RF-01 a RF-14 mais os acréscimos RF-15 e RF-16, justificados por jornada | O escopo pode estar subdimensionado |
| S3 | Reservas que cruzam a meia-noite local não são necessárias nesta versão (A6) | Eventos noturnos não podem ser reservados; a regra de janela precisa ser revista |
| S4 | O valor padrão da tolerância de não comparecimento ainda não foi definido e exige validação (A8, lacuna D1) | Reservas não usadas ocupam o recurso por mais tempo, ou são marcadas cedo demais |
| S5 | O endpoint de teste da demonstração basta como integração externa para RF-11 (A5) | Pode ser exigido provedor real, com credenciais e contrato |
| S6 | Reserva SOLICITADA sem decisão ao chegar o início deve ser cancelada com motivo SEM_DECISAO (C2) | Reservas legítimas canceladas por demora do Responsável, ou períodos presos sem o cancelamento |
| S7 | O valor padrão de tentativas e do intervalo de reenvio de notificação será definido depois (C6, lacuna D3) | Notificações perdidas ou carga desnecessária sobre o provedor |
