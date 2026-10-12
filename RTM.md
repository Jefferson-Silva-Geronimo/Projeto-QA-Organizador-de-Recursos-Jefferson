# Matriz de Rastreabilidade de Requisitos (RTM)

Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

## Como ler

- Há uma linha por requisito funcional (RF-01 a RF-16) e uma linha por regra de negócio (RN-01 a RN-33).
- Nas linhas de RF, a coluna Requisito traz o RF e a coluna Regra traz as RN ligadas. Nas linhas de RN, a coluna Regra traz a RN e a coluna Requisito traz os RF ligados.
- **crítico:** critério explícito. Uma regra é crítica se for uma das regras críticas da especificação (RN-01 a RN-08, seção 4). Um RF é crítico se, na matriz de [requisitos-funcionais.md](docs/prd/requisitos-funcionais.md), estiver ligado a pelo menos uma dessas regras. Por esse critério são críticos 12 dos 16 RF: RF-01, RF-03 a RF-10, RF-12, RF-13 e RF-16. Meta da especificação: 100% dos requisitos críticos na RTM.
- Risco: identificador R-xx definido em [plano-de-teste.md](docs/plano-de-teste.md), seção 8. É risco inicial, a refinar.
- Cenário, caso de teste e evidência ficam vazios até a Fase 2 (cenários) e a Fase 4 (casos CT-xxx e evidências). Status inicial: não iniciado.
- RF-15 e RF-16 são acréscimos da equipe. RN-09 em diante são decisões da equipe.

## Matriz

| Requisito | Regra | Risco | Cenário | Caso de teste | Evidência | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RF-01 Autenticação e autorização por perfil **(crítico)** | RN-06, RN-17, RN-26 | R-03 Falha de autorização ou escalada de perfil; R-12 Vazamento de dados entre perfis ou de segredo em erro | | | | não iniciado |
| RF-02 Cadastro e consulta de salas, professores e materiais | RN-10, RN-12, RN-13, RN-14, RN-29, RN-32 | R-14 Cadastro inconsistente de recurso ou usuário; R-08 Bloqueio ou desativação inconsistente; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-03 Pesquisa por tipo, capacidade, localização, competência e disponibilidade **(crítico)** | RN-02, RN-04, RN-11, RN-14, RN-15, RN-26 | R-02 Sobreposição não detectada nas fronteiras ou por tipo de recurso; R-09 Erro de fuso, janela ou fronteira de horário; R-12 Vazamento de dados entre perfis ou de segredo em erro | | | | não iniciado |
| RF-04 Criação, alteração e cancelamento de reservas **(crítico)** | RN-01, RN-02, RN-04, RN-05, RN-07, RN-09, RN-10, RN-11, RN-13, RN-14, RN-15, RN-17, RN-18, RN-19, RN-26, RN-27 | R-02 Sobreposição não detectada nas fronteiras ou por tipo de recurso; R-04 Aprovação contornada; R-05 Perda de integridade em alteração ou cancelamento; R-09 Erro de fuso, janela ou fronteira de horário; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-05 Detecção de sobreposição de horários, inclusive na agenda do professor **(crítico)** | RN-02, RN-11, RN-13, RN-30 | R-02 Sobreposição não detectada nas fronteiras ou por tipo de recurso | | | | não iniciado |
| RF-06 Proteção contra dupla reserva em solicitações simultâneas **(crítico)** | RN-03, RN-30 | R-01 Dupla reserva sob concorrência | | | | não iniciado |
| RF-07 Aprovação obrigatória para recursos restritos **(crítico)** | RN-05, RN-06, RN-09, RN-10, RN-16, RN-24, RN-25, RN-33 | R-04 Aprovação contornada; R-03 Falha de autorização ou escalada de perfil; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-08 Bloqueio de recursos em manutenção **(crítico)** | RN-04, RN-07, RN-11, RN-22 | R-08 Bloqueio ou desativação inconsistente; R-02 Sobreposição não detectada nas fronteiras ou por tipo de recurso; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-09 Registro de retirada e devolução de materiais e equipamentos **(crítico)** | RN-05, RN-12, RN-20, RN-23 | R-13 Controle incorreto de unidade e devolução de material; R-06 Transição de estado indevida; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-10 Histórico auditável de mudanças **(crítico)** | RN-08, RN-26, RN-27, RN-29 | R-07 Auditoria incompleta ou alterável; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-11 Notificação simulada ou integração com API externa | RN-28 | R-10 Falha do provedor afeta a reserva; R-12 Vazamento de dados entre perfis ou de segredo em erro; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-12 Relatório de utilização por recurso, carga horária alocada e conflitos evitados **(crítico)** | RN-02, RN-03, RN-04, RN-15, RN-26, RN-30, RN-31 | R-11 Números incorretos no relatório; R-09 Erro de fuso, janela ou fronteira de horário; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-13 Interface responsiva e mensagens de erro compreensíveis **(crítico)** | RN-01, RN-02, RN-03, RN-04, RN-14, RN-18, RN-19, RN-22, RN-23, RN-24, RN-33 | R-12 Vazamento de dados entre perfis ou de segredo em erro | | | | não iniciado |
| RF-14 Documentação de API ou dos fluxos públicos do sistema | transversal, sem regra específica | R-15 Documentação diverge do comportamento | | | | não iniciado |
| RF-15 Gestão de usuários e perfis | RN-13, RN-17, RN-29 | R-03 Falha de autorização ou escalada de perfil; R-14 Cadastro inconsistente de recurso ou usuário; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-16 Ciclo de vida de uso da reserva **(crítico)** | RN-05, RN-08, RN-18, RN-20, RN-21, RN-23, RN-25 | R-06 Transição de estado indevida; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-04, RF-13 | RN-01 Término posterior ao início **(crítico)** | R-09 Erro de fuso, janela ou fronteira de horário; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-03, RF-04, RF-05, RF-12, RF-13 | RN-02 Sem sobreposição do mesmo recurso **(crítico)** | R-02 Sobreposição não detectada nas fronteiras ou por tipo de recurso | | | | não iniciado |
| RF-06, RF-12, RF-13 | RN-03 Simultâneas geram uma reserva aceita **(crítico)** | R-01 Dupla reserva sob concorrência | | | | não iniciado |
| RF-03, RF-04, RF-08, RF-12, RF-13 | RN-04 Recurso em manutenção não é reservável **(crítico)** | R-08 Bloqueio ou desativação inconsistente | | | | não iniciado |
| RF-04, RF-07, RF-09, RF-16 | RN-05 Estados da reserva **(crítico)** | R-06 Transição de estado indevida | | | | não iniciado |
| RF-01, RF-07 | RN-06 Só responsáveis aprovam restritos **(crítico)** | R-03 Falha de autorização ou escalada de perfil | | | | não iniciado |
| RF-04, RF-08 | RN-07 Reserva iniciada não é apagada **(crítico)** | R-06 Transição de estado indevida | | | | não iniciado |
| RF-10, RF-16 | RN-08 Mudança de estado gera auditoria **(crítico)** | R-07 Auditoria incompleta ou alterável | | | | não iniciado |
| RF-04, RF-07 | RN-09 Aprovação automática sem restrito | R-04 Aprovação contornada | | | | não iniciado |
| RF-02, RF-04, RF-07 | RN-10 Aprovação exigida, gravada na criação | R-04 Aprovação contornada; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-03, RF-04, RF-05, RF-08 | RN-11 Intervalos [início, fim) | R-02 Sobreposição não detectada nas fronteiras ou por tipo de recurso | | | | não iniciado |
| RF-02, RF-09 | RN-12 Material é unidade identificada | R-13 Controle incorreto de unidade e devolução de material | | | | não iniciado |
| RF-02, RF-04, RF-05, RF-15 | RN-13 Professor é recurso, vínculo opcional | R-14 Cadastro inconsistente de recurso ou usuário | | | | não iniciado |
| RF-02, RF-03, RF-04, RF-13 | RN-14 Janela e dias de funcionamento da sala | R-09 Erro de fuso, janela ou fronteira de horário | | | | não iniciado |
| RF-03, RF-04, RF-12 | RN-15 UTC e fuso configurável | R-09 Erro de fuso, janela ou fronteira de horário | | | | não iniciado |
| RF-07 | RN-16 Segregação de funções | R-03 Falha de autorização ou escalada de perfil; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-01, RF-04, RF-15 | RN-17 Administrador não reserva nem aprova | R-03 Falha de autorização ou escalada de perfil | | | | não iniciado |
| RF-04, RF-13, RF-16 | RN-18 Cancelamento por estado e perfil | R-05 Perda de integridade em alteração ou cancelamento; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-04, RF-13 | RN-19 Alteração atômica e reaprovação | R-05 Perda de integridade em alteração ou cancelamento; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-09, RF-16 | RN-20 Início de uso | R-06 Transição de estado indevida; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-16 | RN-21 Não compareceu | R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-08, RF-13 | RN-22 Bloqueio sobre reservas existentes | R-08 Bloqueio ou desativação inconsistente; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-09, RF-13, RF-16 | RN-23 Conclusão condicionada à devolução | R-13 Controle incorreto de unidade e devolução de material; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-07, RF-13 | RN-24 Motivo na decisão do Responsável | R-06 Transição de estado indevida | | | | não iniciado |
| RF-07, RF-16 | RN-25 Cancelamento SEM_DECISAO | R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-01, RF-03, RF-04, RF-10, RF-12 | RN-26 Visibilidade por perfil | R-12 Vazamento de dados entre perfis ou de segredo em erro | | | | não iniciado |
| RF-04, RF-10 | RN-27 Nenhuma exclusão física | R-05 Perda de integridade em alteração ou cancelamento | | | | não iniciado |
| RF-11 | RN-28 Notificação | R-10 Falha do provedor afeta a reserva; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-02, RF-10, RF-15 | RN-29 Auditoria ampliada | R-07 Auditoria incompleta ou alterável; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-05, RF-06, RF-12 | RN-30 Conflitos evitados registrados | R-11 Números incorretos no relatório | | | | não iniciado |
| RF-12 | RN-31 Cálculos do relatório | R-11 Números incorretos no relatório; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-02 | RN-32 Desativação de recurso | R-08 Bloqueio ou desativação inconsistente; R-16 Decisão pendente ou suposição altera o comportamento | | | | não iniciado |
| RF-07, RF-13 | RN-33 Quem rejeita | R-03 Falha de autorização ou escalada de perfil | | | | não iniciado |

## Resumo

| Item | Quantidade |
| --- | --- |
| Linhas de RF | 16 |
| Linhas de RN | 33 |
| RF críticos | 12 |
| RN críticas (especificação) | 8 |
| Linhas com status não iniciado | 49 |
