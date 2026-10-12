# Registro de decisões e lacunas

Registro único das lacunas da [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html) e das dúvidas surgidas na redação dos documentos de produto, com a decisão da equipe para cada uma.

O nome do arquivo foi mantido (`perguntas-abertas.md`) para não quebrar links. Os IDs A1 a A8 e B1 a B4 também foram mantidos.

## Como ler

| Termo | Significado |
| --- | --- |
| **Fato** | Está na especificação |
| **Decisão** | Escolha da equipe, aprovada em 12/10/2026, que não está na especificação |
| **Suposição** | Premissa adotada sem confirmação, com o impacto se estiver errada |
| **Lacuna** | Ponto ainda sem decisão (seção C) |

Observações importantes:

- As **decisões e os status** vêm da equipe. As **justificativas e as alternativas consideradas** foram redigidas a partir das decisões e do texto da especificação; a equipe deve revisá-las e corrigir onde não refletirem o que foi discutido.
- "Decidida (equipe), confirmar com o professor" significa que a decisão vale para o projeto, mas a especificação deixa o ponto em aberto e o professor ainda não a validou. Se ele discordar, o impacto descrito em cada item mostra o que muda.
- Data de todas as decisões: 12/10/2026. Responsável: equipe.

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

## A. Lacunas da seção 10 da especificação

### A1. O que torna um recurso restrito?

- **Pergunta:** quem define que um recurso é restrito e por qual critério? Vale para sala, professor e material?
- **Fato:** RF-07 exige aprovação para recursos restritos e RN-06 diz que somente responsáveis os aprovam. A especificação não define o critério (seção 10, item 1).
- **Decisão:** a restrição é o atributo "restrito" no cadastro do recurso, definido pelo Administrador, válido para sala, professor e material. Reserva com ao menos um recurso restrito exige aprovação de um Responsável. Reserva sem recurso restrito passa de SOLICITADA para APROVADA automaticamente, com auditoria cujo ator é SISTEMA. A reserva guarda "exige aprovação" no momento da criação; mudar o atributo depois não altera reservas existentes.
- **Justificativa:** mantém a regra num só lugar (o cadastro), sob controle do Administrador, e dá previsibilidade ao Solicitante. Guardar o valor na reserva evita que uma mudança de cadastro invalide ou reabra aprovações já dadas.
- **Alternativas consideradas:** restrição por tipo de recurso (por exemplo, todo material); restrição escolhida pelo Solicitante na reserva; todas as reservas passarem por aprovação.
- **Impacto:**
  - RF e RN: RF-02, RF-07, RN-05, RN-06, RN-08.
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
  - RF e RN: RN-01, RN-02, RN-04, RF-05, RF-06.
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
  - RF e RN: RF-02, RF-09, RN-02, RN-03.
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
  - RF e RN: RF-01, RF-02, RF-05, RN-02.
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
  - RF e RN: RF-11, RN-05, RN-08.
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
- **Alternativas consideradas:** usar o fuso do servidor; gravar horário local sem conversão; fuso por usuário; sala sem janela (24 horas); permitir reserva que cruza a meia-noite.
- **Impacto:**
  - RF e RN: RF-03, RF-04, RN-01, RN-02, RN-04, RF-12.
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
  - RF e RN: RF-08, RN-04, RN-05, RN-07, RN-08, RF-10, RF-11.
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
  - RF e RN: RF-04, RF-09, RF-10, RN-05, RN-07, RN-08.
  - Modelo de dados: motivo de cancelamento; tolerância em configuração.
  - Testes: tabela de transição de estados cobrindo as proibidas; cancelamento por perfil e estado; marcação de não compareceu antes e depois da tolerância.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.
- **Suposição S4:** o valor padrão da tolerância fica sem número até validação com o professor ou a coordenação. Impacto se estiver errada: reservas não usadas ficam ocupando o recurso por mais tempo, ou são marcadas cedo demais.

## B. Dúvidas surgidas na redação dos documentos

Não estão na seção 10 da especificação. Foram levantadas ao escrever o PRD e as personas.

### B1. O Responsável também cria reservas?

- **Pergunta:** o Responsável pode solicitar reservas?
- **Fato:** a especificação descreve o Solicitante como quem cria reservas e o Responsável como quem aprova e acompanha. Não diz se o Responsável também solicita.
- **Decisão:** o Responsável também cria reservas e tem as permissões do Solicitante, mas ninguém aprova a própria reserva (segregação de funções, decisão da equipe).
- **Justificativa:** o Responsável também precisa de recursos; a segregação mantém o sentido de RN-06.
- **Alternativas consideradas:** o Responsável não reserva; o Responsável pode auto-aprovar.
- **Impacto:**
  - RF e RN: RF-01, RF-04, RF-07, RN-06.
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
  - RF e RN: RF-01, RF-04, RN-06.
  - Modelo de dados: um único perfil por usuário.
  - Testes: Administrador recebe 403 ao criar ou aprovar reserva; usuário não acumula perfis.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

### B3. Quem enxerga as reservas de outros usuários?

- **Pergunta:** qual a visibilidade de reservas e da auditoria por perfil?
- **Fato:** o Solicitante consulta a disponibilidade e gerencia as suas reservas. A especificação não define visibilidade.
- **Decisão:** o Solicitante vê só as próprias reservas e, na disponibilidade, vê intervalos ocupados sem identificar quem reservou. O Responsável vê todas as reservas e a fila de aprovações. O Administrador vê todas as reservas e a auditoria.
- **Justificativa:** o Solicitante precisa saber o que está livre, mas não precisa saber de quem é o horário; quem decide e quem administra precisam de visão completa.
- **Alternativas consideradas:** todas as reservas visíveis a todos; Solicitante vendo o dono de cada reserva.
- **Impacto:**
  - RF e RN: RF-01, RF-03, RF-10, RN-08.
  - Modelo de dados: nenhum campo novo; a consulta de disponibilidade devolve apenas intervalos.
  - Testes: resposta da disponibilidade sem identificação; acesso a reserva de outro usuário recusado; matriz de visibilidade por perfil.
  - **Fica em aberto** o acesso do Responsável à auditoria (C4).
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
  - RF e RN: RF-12, RN-02, RN-03, RN-04.
  - Modelo de dados: tentativas de conflito persistidas, com motivo, recurso, período e solicitante.
  - Testes: dados semeados com resultado esperado conferido contra o banco; parte interna do período nas bordas.
- **Status:** Decidida (equipe).
- **Data:** 12/10/2026. **Responsável:** equipe.

## C. Lacunas remanescentes

Surgiram ao aplicar as decisões acima. **Nenhuma está decidida.** Responsável: equipe. Prazo: TODO.

| ID | Pergunta | Afeta | Impacto se assumir errado | Status |
| --- | --- | --- | --- | --- |
| C1 | Em quais estados uma reserva pode ser alterada e uma alteração exige nova aprovação? A decisão A1 guarda "exige aprovação" na criação, mas a alteração de recursos pode mudá-la | RF-04, RN-05, A1 | Uma alteração pode contornar a aprovação ou reabri-la sem necessidade | Aberta |
| C2 | A decisão do Responsável (aprovar ou rejeitar) exige motivo? Existe prazo para decidir? | RF-07, RN-05, RN-08 | Rejeição sem motivo gera recusa incompreensível; sem prazo, a fila pode parar | Aberta |
| C3 | A devolução de material é condição para concluir a reserva? | RF-09, RN-05 | Reserva concluída com material fora, ou presa em EM_USO por esquecimento | Aberta |
| C4 | Quem acessa a auditoria (RF-10) e o relatório (RF-12)? B3 só define a auditoria para o Administrador | RF-10, RF-12, B3 | Responsável sem visão necessária para acompanhar, ou exposição excessiva | Aberta |
| C5 | Quais são as horas de funcionamento para a utilização (B4)? A janela é diária; dias da semana, feriados e períodos de vários dias não foram definidos | RF-12, A6, B4 | Percentual de utilização sem significado ou comparável entre salas | Aberta |
| C6 | Quais são o contrato do webhook, destinatários de cada evento, número de tentativas e política de reenvio (A5)? | RF-11, A5 | Matriz de testes de integração sem expectativa definida | Aberta |
| C7 | Mudanças de cadastro e de perfil de usuário geram auditoria? RN-08 trata de mudança de estado | RN-08, RF-10, RF-01 | Troca de perfil ou de atributo "restrito" sem rastro | Aberta |
| C8 | Um professor vinculado a usuário (A4) pode reservar a si mesmo como recurso? | RF-05, A4 | Autoalocação sem controle, ou impedimento indevido | Aberta |
