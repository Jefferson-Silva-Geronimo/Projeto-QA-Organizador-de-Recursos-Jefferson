# PRD — Organização de Recursos

| Campo | Valor |
| --- | --- |
| Projeto | Organização de Recursos (Qualidade de Software, TADS, 2026.2) |
| Fonte de verdade | [Especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), lida em 12/10/2026 |
| Estado | Rascunho da Fase 1, Prompts 1.1 e 1.1b |
| Entrega | Semana 46 |

Este documento separa o que a especificação **afirma** (fato), o que a equipe **decidiu** (decisão, com ID), o que é **suposição** (com impacto) e o que segue em **lacuna**. O registro completo está em [perguntas-abertas.md](prd/perguntas-abertas.md).

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
- Visibilidade por perfil em [B3](prd/perguntas-abertas.md).

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

O detalhamento (persona, jornada, regras ligadas e critério de aceite) é produzido no Prompt 1.3 e não faz parte deste documento.

### 4.2 Regras críticas

Fato (especificação, seção 4). Numeração preservada.

| ID | Regra |
| --- | --- |
| RN-01 | O término deve ser posterior ao início |
| RN-02 | Reservas do mesmo recurso não podem se sobrepor (sala, material ou professor) |
| RN-03 | Duas solicitações simultâneas devem produzir uma única reserva aceita |
| RN-04 | Recursos em manutenção não podem ser reservados |
| RN-05 | Fluxo principal `SOLICITADA → APROVADA → EM_USO → CONCLUÍDA`; estados alternativos: rejeitada, cancelada e não compareceu |
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

Decisões de 12/10/2026, detalhadas com justificativa, alternativas e impacto em [perguntas-abertas.md](prd/perguntas-abertas.md). A coluna "Confirmar" indica o que ainda depende do professor.

| ID | Decisão que afeta o escopo | RF e RN | Confirmar com o professor |
| --- | --- | --- | --- |
| A1 | Atributo "restrito" no recurso, definido pelo Administrador; reserva sem recurso restrito é aprovada automaticamente, com ator SISTEMA; "exige aprovação" fica gravado na reserva | RF-02, RF-07, RN-05, RN-06, RN-08 | Sim |
| A2 | Intervalos semiabertos [início, fim); duração zero é inválida; vale também para bloqueios | RN-01, RN-02, RN-04 | Não |
| A3 | Material é unidade identificada, com código de patrimônio; cada unidade é um recurso | RF-02, RF-09, RN-02 | Sim |
| A4 | Professor é recurso; vínculo com usuário é opcional | RF-01, RF-02, RF-05 | Não |
| A5 | Notificação por porta e adapter de webhook configurável; envio após o commit; falha do provedor não desfaz a reserva | RF-11 | Sim |
| A6 | Fuso America/Sao_Paulo configurável; UTC no armazenamento; janela de abertura e fechamento por sala | RF-03, RF-04, RN-01, RN-02 | Não |
| A7 | Bloqueio sobre reservas: 409 com lista, confirmação, cancelamento pelo sistema com motivo MANUTENCAO; recusado se houver reserva EM_USO | RF-08, RN-04, RN-07 | Não |
| A8 | Matriz de cancelamento por estado e perfil; sem antecedência mínima; início de uso e não comparecimento pelo Responsável | RF-04, RF-09, RN-05, RN-07 | Não |
| B1 | Responsável também reserva; ninguém aprova a própria reserva | RF-04, RF-07, RN-06 | Não |
| B2 | Administrador não aprova nem reserva; um perfil por usuário | RF-01, RN-06 | Não |
| B3 | Visibilidade por perfil; Solicitante não vê quem reservou | RF-03, RF-10 | Não |
| B4 | Definições de carga horária, utilização (só salas) e conflitos evitados | RF-12 | Não |

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

## 5. Fora de escopo

A especificação **não traz uma lista de itens fora de escopo**. O recorte abaixo separa fato, decisão, suposição e lacuna.

| Item | Natureza | Observação |
| --- | --- | --- |
| Funcionalidades do Foot Fanatics | Fato | A especificação diz que ele é só o case de demonstração das aulas |
| Controle de material por quantidade em estoque e consumíveis | Decisão A3 | Cada material é uma unidade identificada. Se o professor discordar, o modelo de dados muda |
| Reserva que cruza a meia-noite local | Decisão A6 (suposição S3) | Impacto se estiver errada: eventos noturnos ficam impossíveis de reservar |
| Reservas próprias do Administrador | Decisão B2 | O Administrador administra; quem precisa reservar usa outro perfil |
| Qualquer funcionalidade além de RF-01 a RF-14 | Suposição S2 | Só entra como RF-15 em diante se uma jornada ficar sem requisito, com justificativa |
| Pontos listados na seção C de [perguntas-abertas.md](prd/perguntas-abertas.md) | Lacuna | Não são implementados nem assumidos até haver decisão |

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

- As oito lacunas da seção 10 da especificação e as quatro dúvidas da redação estão **decididas pela equipe** em [perguntas-abertas.md](prd/perguntas-abertas.md).
- Três decisões aguardam confirmação do professor: A1, A3 e A5.
- Oito lacunas novas (C1 a C8) surgiram ao aplicar as decisões e seguem abertas na seção C do mesmo documento.

## 9. Suposições registradas

| ID | Suposição | Impacto se estiver errada |
| --- | --- | --- |
| S1 | O problema hoje é resolvido de forma manual e sujeito a conflito | Muda o texto de motivação, não os requisitos |
| S2 | O escopo é RF-01 a RF-14 mais acréscimos justificados por jornada | O escopo pode estar subdimensionado |
| S3 | Reservas que cruzam a meia-noite local não são necessárias nesta versão (A6) | Eventos noturnos não podem ser reservados; a regra de janela precisa ser revista |
| S4 | O valor padrão da tolerância de não comparecimento ainda não foi definido e exige validação (A8) | Reservas não usadas ocupam o recurso por mais tempo, ou são marcadas cedo demais |
| S5 | O endpoint de teste da demonstração basta como integração externa para RF-11 (A5) | Pode ser exigido provedor real, com credenciais e contrato |
