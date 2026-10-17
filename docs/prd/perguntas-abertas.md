# Registro de decisões e lacunas

Registro único das lacunas da [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html) e das dúvidas surgidas na redação dos documentos de produto, com a decisão da equipe para cada uma.

O nome do arquivo foi mantido (`perguntas-abertas.md`) para não quebrar links. Os IDs das decisões (A1 a A8, B1 a B4, C1 a C8, D2, D5 a D8 e D10 a D16) e das lacunas (D1, D3, D4, D9 e D17) são estáveis e não são renumerados.

## Como ler

| Termo | Significado |
| --- | --- |
| **Fato** | Está na especificação |
| **Decisão** | Escolha da equipe, aprovada em 12/10/2026, que não está na especificação |
| **Suposição** | Premissa adotada sem confirmação, com o impacto se estiver errada |
| **Lacuna** | Ponto ainda sem decisão (seção D) |

Observações importantes:

- As **decisões e os status** vêm da equipe. As **justificativas e as alternativas consideradas** foram redigidas a partir das decisões e do texto da especificação; a equipe deve revisá-las e corrigir onde não refletirem o que foi discutido.
- "Decidida (equipe), confirmar com o professor" significa que a decisão vale para o projeto, mas a especificação deixa o ponto em aberto e o professor ainda não a validou. Se ele discordar, o impacto descrito em cada item mostra o que muda.
- Data das decisões: 12/10/2026, exceto D2 e D10 a D16, de 15/10/2026. Responsável: equipe.

## Resumo

| ID | Tema | Decisão em uma linha | Status |
| --- | --- | --- | --- |
| A1 | Recurso restrito | Atributo do recurso, definido pelo Administrador; aprovação automática quando não há recurso restrito | Decidida (equipe), confirmar com o professor |
| A2 | Fronteira de horário | Intervalos semiabertos [início, fim) | Decidida (equipe) |
| A3 | Material | Unidade identificada, com código de patrimônio; cada unidade é um recurso | Decidida (equipe), confirmar com o professor |
| A4 | Professor e usuário | Professor é recurso; vínculo com usuário é opcional | Decidida (equipe) |
| A5 | Notificação | Porta com adapter HTTP de webhook, envio após o commit | Decidida (equipe), confirmar com o professor |
| A6 | Fuso e janela de funcionamento | America/Sao_Paulo, armazenamento em UTC, janela por sala | Decidida (equipe) |
| A7 | Bloqueio sobre reservas existentes | 409 com lista, confirmação do Administrador e cancelamento pelo sistema | Decidida (equipe) |
| A8 | Cancelamento, uso e não comparecimento | Matriz por estado e perfil, sem antecedência mínima | Decidida (equipe) |
| B1 | Responsável reserva | Sim, mas ninguém aprova a própria reserva | Decidida (equipe) |
| B2 | Administrador | Não aprova nem reserva; um perfil por usuário | Decidida (equipe) |
| B3 | Visibilidade | Por perfil, sem expor quem reservou ao Solicitante | Decidida (equipe) |
| B4 | Relatório RF-12 | Definições de carga horária, utilização e conflitos evitados | Decidida (equipe) |
| C1 | Alteração de reserva | O dono altera em SOLICITADA e APROVADA até o início; atômica; reaprova se exigia aprovação | Decidida (equipe) |
| C2 | Decisão do Responsável | Rejeitar exige motivo; sem prazo; SEM_DECISAO ao chegar o início (suposição S6) | Decidida (equipe), com suposição |
| C3 | Conclusão e devolução | CONCLUÍDA só com todo material retirado devolvido | Decidida (equipe) |
| C4 | Acesso a auditoria e relatório | Responsável: histórico e relatório; Administrador: toda a auditoria | Decidida (equipe) |
| C5 | Janela, dias e relatório | Dias da semana por sala; feriados fora de escopo; relatório paginado | Decidida (equipe) |
| C6 | Notificação | POST JSON, idempotência, destinatários e status definidos; reenvio configurável | Decidida (equipe) |
| C7 | Auditoria ampliada | Cadastros, usuários, perfis e bloqueios também auditados | Decidida (equipe) |
| C8 | Vínculo professor e usuário | Vínculo não concede perfil; o próprio professor vinculado pode ser alocado | Decidida (equipe) |
| — | Regra geral | Nenhuma reserva é apagada fisicamente | Decidida (equipe) |
| D5 | Relatório RF-12 para o Administrador | O Administrador vê o relatório, somente leitura | Decidida (equipe) |
| D6 | Desativação de recurso | Recusada com 409 se houver reservas futuras SOLICITADA, APROVADA ou EM_USO | Decidida (equipe) |
| D7 | Bloqueio sobre reserva com vários recursos | Cancela a reserva inteira | Decidida (equipe) |
| D8 | Quem rejeita | O Responsável que não é o dono; o dono cancela | Decidida (equipe) |
| D10 | Instante de "até o início" | Antes do instante de início; às 14:00:00 de uma reserva das 14:00 ela já começou | Decidida (equipe) |
| D11 | "Reserva futura" na desativação | Término posterior ao instante atual, o que inclui EM_USO | Decidida (equipe) |
| D12 | Recálculo de "exige aprovação" | Recalculado quando a alteração muda a lista de recursos; volta a SOLICITADA se passar a exigir | Decidida (equipe) |
| D13 | Responsável dono opera a própria reserva | Registra início, retirada, devolução e conclusão, com o ator auditado; não aprova nem rejeita | Decidida (equipe) |
| D2 | Mecanismo de SEM_DECISAO e de não comparecimento | Job agendado, idempotente e com trava só para SEM_DECISAO; não comparecimento segue manual | Decidida (equipe), com suposição S6 |
| D14 | Desativação de usuário | Recusada com 409 se deixar menos de dois Responsáveis ativos ou se houver reserva futura; revoga as sessões | Decidida (equipe) |
| D15 | Levantamento de bloqueio | O Administrador levanta com motivo e auditoria; o período volta a ser reservável; reservas canceladas não voltam | Decidida (equipe) |
| D16 | Reserva com início no passado | Recusada quando o início é anterior ou igual ao instante atual | Decidida (equipe) |

## A. Lacunas da seção 10 da especificação

### A1. O que torna um recurso restrito?

- **Pergunta:** quem define que um recurso é restrito e por qual critério? Vale para sala, professor e material?
- **Fato:** RF-07 exige aprovação para recursos restritos e RN-06 diz que somente responsáveis os aprovam. A especificação não define o critério (seção 10, item 1).
- **Decisão:** a restrição é o atributo "restrito" no cadastro do recurso, definido pelo Administrador, válido para sala, professor e material. Reserva com ao menos um recurso restrito exige aprovação de um Responsável. Reserva sem recurso restrito passa de SOLICITADA para APROVADA automaticamente, com auditoria cujo ator é SISTEMA. A reserva guarda "exige aprovação" no momento da criação; mudar o atributo depois não altera reservas existentes.
- **Justificativa:** mantém a regra num só lugar (o cadastro), sob controle do Administrador, e dá previsibilidade ao Solicitante. Guardar o valor na reserva evita que uma mudança de cadastro invalide ou reabra aprovações já dadas.
- **Alternativas consideradas:** restrição por tipo de recurso (por exemplo, todo material); restrição escolhida pelo Solicitante na reserva; todas as reservas passarem por aprovação.
- **Impacto:**
  - RF e RN: RF-02, RF-07, RN-06, RN-09, RN-10 (e RN-05, RN-08 para estados e auditoria).
  - Modelo de dados: campo `restrito` no recurso; campo `exige_aprovacao` na reserva; auditoria precisa aceitar o ator SISTEMA.
  - Testes: tabela de decisão perfil × tipo de recurso (RN-06); aprovação automática com ator SISTEMA; mudança do atributo não afeta reserva existente.
- **Status:** Decidida (equipe), confirmar com o professor.
- **Data:** 12/10/2026. **Responsável:** equipe.
- **Se o professor discordar:** o fluxo de aprovação (RF-07) e a regra de aprovação automática mudam; o ator SISTEMA pode deixar de existir.

### A2. Reserva que termina às 10h conflita com outra que começa às 10h?

- **Pergunta:** reservas consecutivas, com o fim de uma igual ao início da outra, são permitidas?
- **Fato:** RN-02 proíbe sobreposição e RN-01 exige término posterior ao início. A especificação não define a fronteira (seção 10, item 2).
- **Decisão:** intervalos semiabertos [início, fim). Terminar às 10h e começar às 10h não conflita. Há conflito se e somente se `inicioA < fimB` e `inicioB < fimA`. Duração zero é inválida (RN-01). A mesma convenção vale para bloqueios de manutenção.
- **Justificativa:** uma única fórmula vale para sala, professor, material e bloqueio, o que simplifica regra, banco e testes. Permite reservas em sequência no mesmo recurso.
- **Alternativas consideradas:** intervalos fechados (fim igual ao início conflita); exigir folga entre reservas.
- **Impacto:**
  - RF e RN: RF-05, RF-06, RN-01, RN-02, RN-04, RN-11.
  - Modelo de dados: o período deve ser armazenado de forma que a proteção contra sobreposição use a mesma convenção (a escolha técnica fica para a Fase 2).
  - Testes: valor limite em trinca (um instante antes, no limite, um instante depois) para reservas e bloqueios.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### A3. Material é controlado por unidade identificada ou por quantidade?

- **Pergunta:** cada material é uma unidade identificável ou há quantidade em estoque reservada por período?
- **Fato:** RN-02 lista material entre os recursos que não podem se sobrepor (seção 10, item 3 da especificação).
- **Decisão:** unidade identificada, com código de patrimônio, e cada unidade é um recurso. Consumíveis e controle por quantidade ficam fora do escopo.
- **Justificativa:** trata material como sala e professor: um recurso, um período, sem sobreposição. Evita um segundo modelo de disponibilidade (saldo de estoque).
- **Alternativas consideradas:** controle por quantidade em estoque; modelo híbrido (unidade para equipamento e quantidade para consumível).
- **Impacto:**
  - RF e RN: RF-02, RF-09, RN-02, RN-03, RN-12.
  - Modelo de dados: material com código de patrimônio, uma linha por unidade; retirada e devolução ligadas à unidade.
  - Testes: sobreposição e concorrência valem igualmente para material; não há teste de saldo.
- **Status:** Decidida (equipe), confirmar com o professor.
- **Data:** 12/10/2026. **Responsável:** equipe.
- **Se o professor discordar:** é a decisão de maior retrabalho, porque o controle por quantidade muda o modelo de dados e a proteção contra dupla reserva para materiais.

### A4. Professor também é usuário do sistema?

- **Pergunta:** o professor alocado precisa de login ou é apenas um recurso cadastrado?
- **Fato:** professor é recurso alocável (RN-02, RF-05) e o Solicitante é descrito como "professor ou coordenador" (seção 10, item 4).
- **Decisão:** professor é recurso alocável e o vínculo com usuário é opcional. O professor pode não ter login.
- **Justificativa:** o catálogo precisa conter docentes que nunca usarão o sistema, e o Solicitante pode ser professor, então o vínculo não pode ser obrigatório nem proibido.
- **Alternativas consideradas:** professor sempre com usuário; professor nunca com usuário (cadastros totalmente separados).
- **Impacto:**
  - RF e RN: RF-01, RF-02, RF-05, RN-02, RN-13.
  - Modelo de dados: relação opcional entre professor (recurso) e usuário.
  - Testes: agenda do professor sem usuário vinculado; vínculo não concede perfil nem permissão.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### A5. Notificação simulada ou API externa?

- **Pergunta:** qual opção a equipe adota e, se for API externa, qual provedor?
- **Fato:** RF-11 aceita "notificação simulada ou integração com API externa" (seção 10, item 5). A especificação exige WireMock para integrações externas (seção 5).
- **Decisão:** porta com adapter HTTP de webhook, configurável por variável de ambiente. Em demonstração aponta para um endpoint de teste; nos testes é WireMock. Eventos: solicitação pendente, reserva aprovada, rejeitada e cancelada. Envio após o commit, com status e tentativas registrados para reenvio. A falha do provedor nunca desfaz a reserva.
- **Justificativa:** satisfaz RF-11 sem depender de provedor real e permite teste com WireMock sem alterar o código de produção. Enviar após o commit mantém a reserva válida mesmo com provedor fora do ar.
- **Alternativas consideradas:** simulação interna apenas com registro em tabela; e-mail; integração com serviço de terceiros específico; envio dentro da transação.
- **Impacto:**
  - RF e RN: RF-11, RN-28.
  - Modelo de dados: registro de notificação com status e número de tentativas.
  - Testes: matriz de respostas do provedor (200, 404, 500, lentidão, JSON inválido) com WireMock; falha do provedor não altera o estado da reserva.
- **Status:** Decidida (equipe), confirmar com o professor.
- **Data:** 12/10/2026. **Responsável:** equipe.
- **Suposição:** o endpoint de teste da demonstração será suficiente como "integração com API externa" para RF-11. Impacto se estiver errada: pode ser exigido um provedor real, com credenciais e contrato.

### A6. Fuso horário e horário de funcionamento

- **Pergunta:** qual fuso vale e existe janela em que uma sala pode ser reservada?
- **Fato:** a especificação não define fuso nem horário de funcionamento (seção 10, item 6).
- **Decisão:** fuso America/Sao_Paulo, configurável, com armazenamento em UTC e conversão apenas na borda. A sala tem hora de abertura e de fechamento, e a reserva precisa caber na janela. Professor e material não têm janela. A reserva não cruza a meia-noite local nesta versão.
- **Justificativa:** o armazenamento em UTC evita ambiguidade entre ambientes; a janela por sala dá base ao cálculo de utilização (B4) e a uma regra de validação objetiva.
- **Alternativas consideradas:** usar o fuso do servidor; gravar horário local sem conversão; fuso por usuário; sala sem janela, aberta o dia todo; permitir reserva que cruza a meia-noite.
- **Impacto:**
  - RF e RN: RF-03, RF-04, RF-12, RN-01, RN-02, RN-04, RN-14, RN-15.
  - Modelo de dados: hora de abertura e de fechamento na sala; fuso em configuração.
  - Testes: reserva dentro, na borda e fora da janela; transição de horário e virada de dia.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.
- **Suposição S3:** reservas que cruzam a meia-noite local não são necessárias nesta versão. Impacto se estiver errada: eventos noturnos ou de madrugada ficam impossíveis de reservar e a regra de janela precisa ser revista.

### A7. Bloqueio de manutenção sobre reservas existentes

- **Pergunta:** o que acontece com as reservas existentes quando um bloqueio é criado sobre elas?
- **Fato:** RN-04 proíbe reservar recurso em manutenção; RN-07 proíbe apagar reservas iniciadas (seção 10, item 7).
- **Decisão:** a criação do bloqueio primeiro responde 409 listando as reservas conflitantes, sem gravar. O Administrador pode confirmar, e então as reservas SOLICITADA e APROVADA conflitantes são canceladas pelo sistema com motivo MANUTENCAO, com auditoria e notificação. Se houver reserva EM_USO no período, o bloqueio é recusado, sem opção de forçar (RN-07).
- **Justificativa:** o Administrador vê o efeito antes de aplicar; nenhuma reserva em uso é interrompida; todo cancelamento fica rastreado.
- **Alternativas consideradas:** recusar o bloqueio sempre que houver reserva; cancelar automaticamente sem confirmação; remanejar reservas para outro recurso.
- **Impacto:**
  - RF e RN: RF-08, RF-10, RF-11, RN-04, RN-07, RN-22 (e RN-05, RN-08 para estados e auditoria).
  - Modelo de dados: motivo de cancelamento MANUTENCAO; ator SISTEMA nas transições automáticas.
  - Testes: 409 sem gravação; confirmação cancela só SOLICITADA e APROVADA; reserva EM_USO impede o bloqueio; uma notificação e um evento de auditoria por reserva cancelada.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### A8. Cancelamento, início de uso e não comparecimento

- **Pergunta:** quem cancela em cada estado, até quando, e qual a janela para marcar não compareceu?
- **Fato:** RN-05 lista os estados; RN-07 proíbe apagar reservas iniciadas (seção 10, item 8).
- **Decisão:**

| Estado | Quem cancela | Condição |
| --- | --- | --- |
| SOLICITADA | O dono, sem motivo; ou o Administrador, com motivo obrigatório | Sem prazo mínimo de antecedência |
| APROVADA | O dono, até o início; ou Responsável ou Administrador, com motivo | Sem prazo mínimo de antecedência |
| EM_USO | Ninguém | Só a conclusão, pelo Responsável |
| CONCLUÍDA, rejeitada, cancelada, não compareceu | Ninguém | Estados terminais |

- **Início de uso:** APROVADA passa a EM_USO quando o Responsável registra o início ou a retirada do primeiro material.
- **Não compareceu:** o Responsável marca a reserva APROVADA que não entrou em uso após o início mais uma tolerância configurável. O job automático é opcional.
- **Justificativa:** limita o cancelamento ao dono e a quem tem autoridade, com motivo quando outra pessoa interfere, e protege o que está em uso (RN-07).
- **Alternativas consideradas:** prazo mínimo de antecedência; qualquer Responsável cancelar qualquer reserva; marcação automática obrigatória de não compareceu.
- **Impacto:**
  - RF e RN: RF-04, RF-09, RF-10, RF-16, RN-05, RN-07, RN-08, RN-18, RN-20, RN-21.
  - Modelo de dados: motivo de cancelamento; tolerância em configuração.
  - Testes: tabela de transição de estados cobrindo as proibidas; cancelamento por perfil e estado; marcação de não compareceu antes e depois da tolerância.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.
- **Suposição S4:** o valor padrão da tolerância fica sem número até validação com o professor ou a coordenação (D1). Impacto se estiver errada: reservas não usadas ficam ocupando o recurso por mais tempo, ou são marcadas cedo demais.

## B. Dúvidas surgidas na redação dos documentos

Não estão na seção 10 da especificação. Foram levantadas ao escrever o PRD e as personas.

### B1. O Responsável também cria reservas?

- **Pergunta:** o Responsável pode solicitar reservas?
- **Fato:** a especificação descreve o Solicitante como quem cria reservas e o Responsável como quem aprova e acompanha. Não diz se o Responsável também solicita.
- **Decisão:** o Responsável também cria reservas e tem as permissões do Solicitante, mas ninguém aprova a própria reserva (segregação de funções, decisão da equipe).
- **Justificativa:** o Responsável também precisa de recursos; a segregação mantém o sentido de RN-06.
- **Alternativas consideradas:** o Responsável não reserva; o Responsável pode auto-aprovar.
- **Impacto:**
  - RF e RN: RF-01, RF-04, RF-07, RN-06, RN-16.
  - Modelo de dados: comparação entre solicitante e aprovador da reserva.
  - Testes: aprovação da própria reserva é recusada; matriz perfil × operação.
  - **Restrição de operação:** são necessários ao menos dois Responsáveis, senão reserva com recurso restrito feita por um Responsável nunca é aprovada.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### B2. O Administrador cria reservas ou as aprova?

- **Pergunta:** quais operações de reserva o Administrador tem?
- **Fato:** a especificação descreve o Administrador como quem gerencia cadastros, usuários e bloqueios. RN-06 diz que somente responsáveis aprovam recursos restritos.
- **Decisão:** o Administrador não aprova (RN-06) e não cria reservas próprias nesta versão. Gerencia cadastros, usuários e bloqueios, vê todas as reservas e a auditoria e pode cancelar com motivo. Cada usuário tem exatamente um perfil.
- **Justificativa:** separa administração de uso e elimina a necessidade de segregação de funções para o Administrador.
- **Alternativas consideradas:** o Administrador reserva; o Administrador aprova como superusuário; usuário com mais de um perfil.
- **Impacto:**
  - RF e RN: RF-01, RF-04, RF-15, RN-06, RN-17.
  - Modelo de dados: um único perfil por usuário.
  - Testes: Administrador recebe 403 ao criar ou aprovar reserva; usuário não acumula perfis.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### B3. Quem enxerga as reservas de outros usuários?

- **Pergunta:** qual a visibilidade de reservas e da auditoria por perfil?
- **Fato:** o Solicitante consulta a disponibilidade e gerencia as suas reservas. A especificação não define visibilidade.
- **Decisão:** o Solicitante vê só as próprias reservas e, na disponibilidade, vê intervalos ocupados sem identificar quem reservou. O Responsável vê todas as reservas, a fila de aprovações, o histórico das reservas e o relatório RF-12. O Administrador vê todas as reservas, toda a auditoria, incluindo cadastro e perfil (atualizado conforme C4), e o relatório RF-12 somente leitura (D5).
- **Justificativa:** o Solicitante precisa saber o que está livre, mas não precisa saber de quem é o horário; quem decide e quem administra precisam de visão completa.
- **Alternativas consideradas:** todas as reservas visíveis a todos; Solicitante vendo o dono de cada reserva.
- **Impacto:**
  - RF e RN: RF-01, RF-03, RF-10, RN-08, RN-26.
  - Modelo de dados: nenhum campo novo; a consulta de disponibilidade devolve apenas intervalos.
  - Testes: resposta da disponibilidade sem identificação; acesso a reserva de outro usuário recusado; matriz de visibilidade por perfil.
  - O Responsável não acessa a auditoria completa (C4).
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### B4. Como se calculam os números do relatório RF-12?

- **Pergunta:** o que são "carga horária alocada", utilização e "conflitos evitados"?
- **Fato:** RF-12 pede relatório de utilização por recurso, carga horária alocada e conflitos evitados, sem definir o cálculo.
- **Decisão:**
  - **Carga horária alocada:** soma das durações das ocupações de reservas em APROVADA, EM_USO e CONCLUÍDA, por recurso e período, contando só a parte interna do período.
  - **Utilização:** horas alocadas dividido pelas horas de funcionamento, calculada só para salas.
  - **Conflitos evitados:** solicitações recusadas por RN-02, RN-03 ou RN-04, registradas como tentativas de conflito, com contagem total e distinta por solicitante, recurso e período.
  - **Filtros:** período, tipo de recurso e recurso.
- **Justificativa:** definições mensuráveis e conferíveis contra os dados. Utilização só para salas porque só elas têm janela de funcionamento (A6).
- **Alternativas consideradas:** contar também reservas SOLICITADA na carga; calcular utilização para todos os tipos; contar conflitos apenas por RN-02.
- **Impacto:**
  - RF e RN: RF-12, RN-02, RN-03, RN-04, RN-30, RN-31.
  - Modelo de dados: tentativas de conflito persistidas, com motivo, recurso, período e solicitante.
  - Testes: dados semeados com resultado esperado conferido contra o banco; parte interna do período nas bordas.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

## C. Decisões sobre as lacunas surgidas ao aplicar A e B

As oito lacunas abaixo surgiram ao aplicar as decisões A e B e foram decididas em 12/10/2026. Os IDs C1 a C8 foram mantidos.

### Regra geral: nenhuma reserva é apagada fisicamente

- **Decisão (equipe):** nenhuma reserva é apagada fisicamente em nenhum estado. Cancelamento, rejeição e demais encerramentos são mudanças de estado com auditoria.
- **Justificativa:** reforça RN-07 (reserva iniciada não é apagada) e RN-08 (toda mudança de estado gera auditoria), e preserva o histórico para RF-10 e RF-12.
- **Alternativas consideradas:** permitir exclusão física de reservas nunca iniciadas.
- **Impacto:** RF-10, RF-12, RN-07, RN-08, RN-27; modelo de dados sem exclusão de reserva; testes de que não existe operação de exclusão.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### C1. Alteração de reserva

- **Pergunta:** em quais estados uma reserva pode ser alterada e uma alteração exige nova aprovação?
- **Decisão:** o dono altera em SOLICITADA e em APROVADA até o início. Mudança de período ou de recurso reavalia RN-01, RN-02 e RN-04 e é atômica: troca as ocupações na mesma transação e, em caso de conflito, responde 409 e nada muda. Se a reserva exigia aprovação, volta a SOLICITADA com nova aprovação e auditoria. Mudança apenas de título ou descrição não reaprova. EM_USO e estados terminais não se alteram.
- **Justificativa:** a alteração não pode abrir brecha para contornar a aprovação (A1) nem deixar a agenda em estado intermediário; a atomicidade evita perder a ocupação anterior em caso de conflito.
- **Alternativas consideradas:** alterar apenas em SOLICITADA; exigir cancelar e criar nova reserva; manter APROVADA após qualquer alteração.
- **Impacto:**
  - RF e RN: RF-04, RF-05, RF-07, RN-01, RN-02, RN-04, RN-05, RN-08, RN-10, RN-19.
  - Modelo de dados: troca de ocupações na mesma transação; evento de auditoria de alteração.
  - Testes: alteração com conflito não muda nada; alteração de reserva que exigia aprovação volta a SOLICITADA; alteração de título não reaprova; alteração em EM_USO e em estado terminal recusada.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### C2. Decisão do Responsável e prazo

- **Pergunta:** a decisão exige motivo? Existe prazo para decidir?
- **Decisão:** rejeitar exige motivo; aprovar tem motivo opcional. Não há prazo para decidir. Reserva SOLICITADA cujo início chega sem decisão é cancelada pelo sistema com motivo SEM_DECISAO.
- **Justificativa:** a rejeição precisa ser compreensível para quem pediu (RF-13); sem prazo a fila não gera obrigação de tempo de resposta que a especificação não prevê; o cancelamento ao chegar o início evita reserva SOLICITADA ocupando um período que já começou.
- **Alternativas consideradas:** motivo sempre obrigatório; prazo máximo para decidir; manter SOLICITADA indefinidamente.
- **Impacto:**
  - RF e RN: RF-07, RF-11, RF-16, RN-05, RN-08, RN-24, RN-25.
  - Modelo de dados: motivo na decisão; motivo SEM_DECISAO; ator SISTEMA.
  - Testes: rejeição sem motivo é recusada; aprovação sem motivo é aceita; SOLICITADA cancelada ao chegar o início.
- **Status:** Decidida (equipe), com uma suposição marcada.
- **Suposição S6:** o cancelamento por SEM_DECISAO está correto como regra. Impacto se estiver errada: reservas legítimas podem ser canceladas por demora do Responsável, ou o regime sem cancelamento deixa períodos presos.
- **Data:** 12/10/2026. **Responsável:** equipe.

### C3. Conclusão e devolução de material

- **Pergunta:** a devolução de material é condição para concluir a reserva?
- **Decisão:** a reserva só vai a CONCLUÍDA quando todo material retirado foi devolvido. Material não retirado não bloqueia. Cobrança de atraso fica fora de escopo.
- **Justificativa:** impede reserva encerrada com material fora; limitar a "material retirado" evita travar a conclusão por um item que nunca saiu.
- **Alternativas consideradas:** concluir sem verificar devolução; exigir devolução de todo material reservado, mesmo o não retirado.
- **Impacto:**
  - RF e RN: RF-09, RF-16, RN-05, RN-08, RN-23.
  - Modelo de dados: registro de retirada e de devolução por unidade.
  - Testes: conclusão recusada com material retirado e não devolvido; conclusão aceita com material não retirado.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### C4. Acesso à auditoria e ao relatório

- **Pergunta:** quem acessa a auditoria (RF-10) e o relatório (RF-12)?
- **Decisão:** o Responsável vê o histórico das reservas e o relatório RF-12. O Administrador vê toda a auditoria, incluindo cadastro e perfil.
- **Justificativa:** o Responsável acompanha o ciclo das reservas e precisa do relatório; a auditoria completa, que inclui usuários e perfis (C7), fica com quem administra.
- **Alternativas consideradas:** auditoria completa também para o Responsável; relatório apenas para o Administrador.
- **Impacto:** RF-10, RF-12, RN-08, RN-26; matriz de visibilidade por perfil; testes de acesso negado à auditoria completa para Responsável e Solicitante. B3 foi atualizada. O acesso do Administrador ao relatório RF-12 foi decidido em D5.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### C5. Janela, dias de funcionamento e relatório

- **Pergunta:** quais são as horas de funcionamento usadas na utilização?
- **Decisão:** a sala tem janela diária e dias da semana de funcionamento. A utilização usa as horas de funcionamento nos dias de funcionamento do período. Feriados ficam fora de escopo. O relatório é paginado.
- **Justificativa:** torna a utilização calculável e conferível sem depender de calendário externo.
- **Alternativas consideradas:** funcionamento todos os dias; calendário de feriados; relatório sem paginação.
- **Impacto:**
  - RF e RN: RF-12, RN-14, RN-31 (decisões A6 e B4).
  - Modelo de dados: dias da semana na sala, além de abertura e fechamento.
  - Testes: utilização em período que inclui dia sem funcionamento; reserva em dia sem funcionamento recusada; paginação do relatório.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### C6. Notificação

- **Pergunta:** qual o contrato do webhook, os destinatários, as tentativas e o reenvio?
- **Decisão:** o webhook recebe POST em JSON com tipo do evento, id da reserva, id do destinatário, instante e chave de idempotência. Destinatários: o Solicitante (aprovada, rejeitada, cancelada) e os Responsáveis (pendente). Status PENDENTE, ENVIADA e FALHA. Reenvio com intervalo crescente e número de tentativas configurável. Sem dados pessoais além do necessário.
- **Justificativa:** a chave de idempotência torna o reenvio seguro; o conteúdo mínimo limita a exposição de dados.
- **Alternativas consideradas:** payload com dados completos da reserva; destinatário único; reenvio em intervalo fixo.
- **Impacto:**
  - RF e RN: RF-11, RN-28 (decisão A5).
  - Modelo de dados: status, tentativas, próximo reenvio e chave de idempotência.
  - Testes: matriz de respostas do provedor com WireMock; reenvio não duplica efeito; payload sem dado pessoal desnecessário.
- **Status:** Decidida (equipe).
- **Suposição S7:** o valor padrão do número de tentativas e do intervalo inicial fica sem número até validação. Impacto se estiver errada: reenvio excessivo ou insuficiente, com notificações perdidas ou carga desnecessária sobre o provedor.
- **Data:** 12/10/2026. **Responsável:** equipe.

### C7. Auditoria ampliada

- **Pergunta:** mudanças de cadastro e de perfil geram auditoria?
- **Decisão:** auditar também criação, alteração e desativação de recursos, usuários, perfis e bloqueios, no mesmo mecanismo (ator, entidade, antes e depois).
- **Justificativa:** são ações que alteram regras de acesso e disponibilidade; RF-10 pede histórico auditável de mudanças, e RN-08 cobre apenas estado de reserva.
- **Alternativas consideradas:** auditar só estado de reserva; mecanismo separado para cadastros.
- **Impacto:** RF-01, RF-02, RF-08, RF-10, RF-15, RN-08, RN-29; um único mecanismo de auditoria; testes de evento para cada operação de cadastro, perfil e bloqueio.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### C8. Vínculo professor e usuário

- **Pergunta:** um professor vinculado a usuário pode reservar a si mesmo como recurso?
- **Decisão:** o vínculo professor e usuário não concede perfil. Para solicitar, é preciso usuário Solicitante. Reservar aula em que o próprio vinculado é o professor alocado é permitido e a agenda continua sob RN-02.
- **Justificativa:** mantém separação entre cadastro do recurso e controle de acesso (A4, B2) sem proibir o caso comum.
- **Alternativas consideradas:** proibir que o próprio professor vinculado seja alocado; vínculo concedendo perfil automaticamente.
- **Impacto:** RF-01, RF-05, RN-02, RN-13 (decisão A4); testes de alocação do próprio professor vinculado, com conflito na própria agenda e de vínculo sem perfil.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

## D. Decisões e lacunas surgidas ao aplicar C

As lacunas D1 a D9 surgiram ao aplicar as decisões C. Em 12/10/2026 a equipe decidiu **D5, D6, D7 e D8**. D10 a D16 foram identificadas na revisão das Fases 0 e 1, também em 12/10/2026; em 15/10/2026 a equipe decidiu **D10 a D16** e **D2**, com as recomendações apresentadas na Fase 2. D17 foi aberta em 15/10/2026. D1, D3, D4, D9 e D17 seguem abertas e sem valor.

### D5. O Administrador acessa o relatório RF-12?

- **Pergunta:** o Administrador acessa o relatório de utilização, carga horária e conflitos evitados?
- **Fato:** RF-12 não nomeia o perfil. C4 atribui o relatório ao Responsável.
- **Decisão:** o Administrador vê o relatório RF-12, apenas leitura.
- **Justificativa:** o Administrador mantém o catálogo e os bloqueios e precisa do uso real dos recursos para fazê-lo; leitura não cria permissão de alteração.
- **Alternativas consideradas:** relatório só para o Responsável; relatório sem restrição de perfil.
- **Impacto:**
  - RF e RN: RF-12, RN-26, RN-31.
  - Modelo de dados: nenhum campo novo.
  - Testes: Administrador obtém o relatório; operações de escrita sobre ele não existem; Solicitante não é citado em C4 nem em D5 e não acessa o relatório (suposição, a confirmar na matriz de autorização).
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### D6. Desativar um recurso com reservas futuras

- **Pergunta:** o que acontece com reservas futuras quando um recurso é desativado?
- **Decisão:** desativar um recurso é recusado com 409, listando as reservas, se houver reservas futuras em SOLICITADA, APROVADA ou EM_USO. Não há cancelamento automático.
- **Justificativa:** desativar não é manutenção programada; recusar evita estado inconsistente (reserva ativa sobre recurso desativado) e não cancela reservas sem decisão humana.
- **Alternativas consideradas:** cancelar automaticamente as reservas afetadas; desativar e manter as reservas; usar apenas bloqueio de manutenção (A7).
- **Impacto:**
  - RF e RN: RF-02, RN-04, RN-29; nova regra RN-32.
  - Modelo de dados: atributo `ativo` no recurso; a consulta considera reservas futuras por estado.
  - Testes: 409 com a lista, sem mudança; sem reservas futuras, desativa e o recurso some das novas buscas; reservas CONCLUÍDA e terminais não impedem.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### D7. Bloqueio sobre reserva com vários recursos

- **Pergunta:** quando o bloqueio atinge um dos recursos de uma reserva com vários recursos, cancela-se a reserva inteira ou só o item?
- **Decisão:** o bloqueio cancela a reserva inteira.
- **Justificativa:** a reserva é a unidade de aprovação, de uso e de auditoria; manter só parte dela deixaria uma reserva aprovada com composição diferente da que foi decidida.
- **Alternativas consideradas:** remover só o item afetado e manter a reserva; manter a reserva e exigir novo recurso.
- **Impacto:**
  - RF e RN: RF-08, RN-04, RN-22 (atualizada); decisão A7.
  - Modelo de dados: o cancelamento libera todas as ocupações da reserva.
  - Testes: reserva com sala e projetor, bloqueio na sala: reserva cancelada com MANUTENCAO e o projetor volta a ficar livre.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### D8. Quem pode rejeitar

- **Pergunta:** quem rejeita e o dono Responsável pode rejeitar a própria reserva?
- **Decisão:** rejeita o Responsável que não é o dono da reserva. O dono Responsável não rejeita a própria reserva: ele a cancela.
- **Justificativa:** estende a segregação de funções (B1) à decisão: quem pede não decide. O dono já tem o cancelamento (A8).
- **Alternativas consideradas:** o Administrador também rejeita; qualquer Responsável, inclusive o dono, rejeita.
- **Impacto:**
  - RF e RN: RF-07, RN-05, RN-06, RN-16, RN-24; nova regra RN-33.
  - Modelo de dados: nenhum campo novo; o ator da decisão é comparado ao solicitante.
  - Testes: rejeição pelo dono, pelo Solicitante ou pelo Administrador recusada com 403; cancelamento pelo dono aceito.
- **Status:** Decidida (equipe). **Data:** 12/10/2026. **Responsável:** equipe.

### D10. Instante exato de "até o início"

- **Pergunta:** às 14:00:00, numa reserva que começa às 14:00, o dono ainda cancela ou altera (A8, C1)?
- **Decisão:** "até o início" significa antes do instante de início. Pela convenção [início, fim) de A2, a reserva já começou às 14:00:00: nesse instante e depois dele o dono não cancela nem altera, e uma reserva SOLICITADA sem decisão passa a ser elegível para SEM_DECISAO (C2).
- **Justificativa:** usa a mesma fronteira semiaberta de A2, sem criar segunda convenção de tempo.
- **Alternativas consideradas:** incluir o instante de início como ainda alterável; tolerância após o início.
- **Impacto:**
  - RF e RN: RF-04, RF-16, RN-18, RN-19, RN-25.
  - Modelo de dados: nenhum campo novo; a comparação usa o relógio da aplicação (UTC).
  - Testes: valor limite em trinca (um instante antes, no instante, um instante depois) para cancelamento, alteração e SEM_DECISAO.
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### D11. O que é "reserva futura" na desativação

- **Pergunta:** em D6, "reserva futura" é a de início posterior ao instante atual ou a de término posterior?
- **Decisão:** reserva futura é a de **término posterior ao instante atual**, nos estados SOLICITADA, APROVADA e EM_USO. Uma reserva EM_USO em curso impede a desativação.
- **Justificativa:** D6 já inclui EM_USO, que por definição já começou; só o término identifica reserva que ainda ocupa o recurso.
- **Alternativas consideradas:** início posterior ao instante atual (deixaria desativar recurso com reserva em curso).
- **Impacto:**
  - RF e RN: RF-02, RN-32.
  - Modelo de dados: a consulta usa o término do período da ocupação.
  - Testes: partição por estado e valor limite no instante do término.
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### D12. Recálculo de "exige aprovação" na alteração

- **Pergunta:** quando a alteração de C1 inclui recurso restrito numa reserva que não exigia aprovação, o campo é recalculado?
- **Decisão:** sempre que a alteração mudar a lista de recursos, "exige aprovação" é recalculado pelo servidor e gravado de novo. Se a reserva passar a exigir aprovação, volta a SOLICITADA, com auditoria. O valor enviado pelo cliente continua ignorado (RN-10). Caso inverso (complemento de 15/10/2026): se a alteração remover o último recurso restrito, o campo passa a falso. Uma reserva SOLICITADA vai a APROVADA pelo ator SISTEMA, como em RN-09, e uma reserva já APROVADA permanece APROVADA, ambas com auditoria da alteração.
- **Justificativa:** fecha a brecha que permitia contornar RN-06 pela alteração de uma reserva já aprovada automaticamente.
- **Alternativas consideradas:** manter o valor gravado na criação (mantém a brecha); proibir adicionar recurso restrito na alteração.
- **Impacto:**
  - RF e RN: RF-04, RF-07, RN-06, RN-10, RN-19.
  - Modelo de dados: nenhum campo novo; a atualização de `exige_aprovacao` entra na transação da alteração.
  - Testes: alteração que adiciona o Projetor P-001 a uma reserva sem recurso restrito volta a SOLICITADA; alteração sem mudar recursos não recalcula.
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### D13. O Responsável dono opera a própria reserva

- **Pergunta:** o Responsável dono registra início, retirada, devolução e conclusão da própria reserva (B1, D8)?
- **Decisão:** sim. A segregação de B1 e D8 trata de aprovar e rejeitar, e continua valendo. Início, retirada, devolução e conclusão da própria reserva são permitidos ao Responsável dono, e o ator de cada registro é auditado.
- **Justificativa:** o Responsável é quem opera a retirada e a devolução (A8); impedi-lo na própria reserva a tornaria inoperável sem outro Responsável presente.
- **Alternativas consideradas:** exigir outro Responsável para toda operação sobre reserva própria.
- **Impacto:**
  - RF e RN: RF-09, RF-16, RN-16, RN-20, RN-23.
  - Modelo de dados: nenhum campo novo; o ator já é gravado na auditoria.
  - Testes: Responsável dono registra retirada, devolução e conclusão; aprovar e rejeitar a própria reserva continua 403.
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### D2. Mecanismo de SEM_DECISAO e de não comparecimento

- **Pergunta:** o cancelamento por SEM_DECISAO e a marcação de não compareceu são feitos por job agendado ou por avaliação sob demanda (C2, A8)?
- **Decisão:** job agendado, idempotente e com trava, **apenas para SEM_DECISAO**. O executor tem ator SISTEMA e, na mesma transação, faz a atualização condicional, grava a auditoria e a notificação PENDENTE. A marcação de não compareceu continua manual, pelo Responsável (A8); o job automático dela fica fora desta versão. A aprovação de reserva cujo início já foi alcançado é recusada com 409, pelo mesmo relógio (D10), para que ninguém aprove no intervalo até a próxima execução. A frequência do job é configuração, sem valor.
- **Justificativa:** RN-25 define SEM_DECISAO como ação do sistema, com auditoria e notificação, o que a avaliação sob demanda não garante. O reenvio de notificações (C6) já exige um executor periódico. A8 declara opcional o job de não comparecimento, e a tolerância (D1) ainda não tem valor.
- **Alternativas consideradas:** avaliação sob demanda; job para as duas transições; marcação manual também para SEM_DECISAO.
- **Impacto:**
  - RF e RN: RF-07, RF-16, RN-21, RN-24, RN-25.
  - Modelo de dados: nenhum campo novo; o índice (`estado`, `inicio`) de `reservas` serve à busca do job.
  - Testes: relógio controlado; duas execuções seguidas geram um único evento; reserva APROVADA não é cancelada; aprovação no instante de início é recusada.
- **Status:** Decidida (equipe), com a suposição S6 mantida. **Data:** 15/10/2026. **Responsável:** equipe.

### D14. Desativação de usuário

- **Pergunta:** o que acontece com reservas e aprovações pendentes quando um usuário é desativado, em especial um Responsável?
- **Decisão:** desativar usuário é recusado com 409, listando as pendências, se (a) a desativação deixar menos de dois Responsáveis ativos (B1) ou (b) o usuário tiver reserva futura em SOLICITADA, APROVADA ou EM_USO, com o mesmo sentido de "futura" de D11. Não há cancelamento automático. Aprovações pendentes não pertencem a um Responsável: a fila é global (B3). A desativação revoga as sessões do usuário e é auditada (C7).
- **Justificativa:** repete o padrão de D6, que recusa em vez de cancelar sem decisão humana, e preserva a restrição de operação de B1.
- **Alternativas consideradas:** cancelar automaticamente as reservas do usuário; desativar e manter as reservas órfãs.
- **Impacto:**
  - RF e RN: RF-15, RF-10, RN-16, RN-29.
  - Modelo de dados: usa `usuarios.ativo` e as sessões revogadas.
  - Testes: desativação do penúltimo Responsável recusada; usuário com reserva futura recusado; usuário sem pendência desativado e sessão revogada.
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### D15. Levantamento de bloqueio de manutenção

- **Pergunta:** como se levanta um bloqueio: quem, quando e o que acontece com o período liberado?
- **Decisão:** o Administrador levanta o bloqueio (`ativo` falso) informando motivo, com auditoria, antes ou depois do início. As ocupações do bloqueio ficam inativas e o período volta a ser reservável. Reservas já canceladas por MANUTENCAO não são restauradas, porque cancelada é estado terminal.
- **Justificativa:** o Administrador é quem gerencia bloqueios (RN-17). O DBML já prevê `ativo` no bloqueio para levantar sem apagar, e C7 cita a desativação de bloqueios.
- **Alternativas consideradas:** restaurar automaticamente as reservas canceladas; levantamento só após o término previsto.
- **Impacto:**
  - RF e RN: RF-08, RF-10, RN-22, RN-29.
  - Modelo de dados: nenhum campo novo.
  - Testes: período volta a aceitar reserva; reserva cancelada continua cancelada; levantamento por não Administrador recusado com 403; evento de auditoria com motivo.
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### D16. Reserva com início no passado

- **Pergunta:** uma reserva pode ter início no passado?
- **Decisão:** não. A criação é recusada, com erro de validação de código estável, quando o início é anterior ou igual ao instante atual. A alteração de período segue a mesma regra.
- **Justificativa:** pela convenção de D10, a reserva que começa no instante atual já começou e não admite cancelamento nem alteração; criar reserva retroativa seria incoerente com RN-18, RN-19 e RN-25. Nenhum RF descreve registro retroativo.
- **Alternativas consideradas:** aceitar reserva retroativa, sem controle; aceitar só para o Administrador (B2 já o impede de reservar).
- **Impacto:**
  - RF e RN: RF-04, RN-01, RN-18, RN-19.
  - Modelo de dados: nenhum campo novo.
  - Testes: valor limite em trinca (um instante antes, no instante, um instante depois do instante atual).
- **Status:** Decidida (equipe). **Data:** 15/10/2026. **Responsável:** equipe.

### Lacunas que seguem abertas

**Nenhuma está decidida e nenhum valor foi inventado.** Cada uma fica registrada, com validação pendente. Responsável pela validação: equipe. Prazo: TODO: a definir pela equipe.

| ID | Pergunta | Afeta | Impacto se assumir errado | Estado |
| --- | --- | --- | --- | --- |
| D1 | Qual o valor padrão da tolerância de não comparecimento (S4)? | A8, RN-21 | Reservas não usadas ocupam o recurso por mais tempo, ou são marcadas cedo demais | Aberta, valor sem definição |
| D3 | Qual o valor padrão de tentativas e de intervalo do reenvio de notificação (S7)? | C6, RF-11, RN-28 | Notificações perdidas ou carga sobre o provedor | Aberta, valor sem definição |
| D4 | Qual o tamanho da página do relatório RF-12? | C5, RF-12, RN-31 | Relatório lento ou incômodo de navegar | Aberta, valor sem definição |
| D9 | Qual a retenção da auditoria e das notificações, e o tratamento de dados pessoais nelas? | RF-10, RF-11, C6, C7 | Dado pessoal guardado além do necessário | Aberta |
| D17 | Qual a duração e a expiração do token de acesso (sessão)? A decisão de token opaco com revogação exige um prazo | RF-01, RN-17, RNF-06 | Sessão que nunca expira, ou que expira cedo demais para o uso | Aberta, valor sem definição |
