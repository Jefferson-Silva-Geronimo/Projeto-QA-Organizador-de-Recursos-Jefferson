# Regras de negócio

Fonte das regras RN-01 a RN-08: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção 4. As regras RN-09 em diante são **decisões da equipe** de 12/10/2026, registradas em [perguntas-abertas.md](perguntas-abertas.md), e nunca devem ser confundidas com as da especificação.

## Como ler

| Item | Significado |
| --- | --- |
| RN-01 a RN-08 | Regras críticas da especificação, com texto fiel e numeração preservada |
| RN-09 em diante | Regras que decorrem de decisões da equipe, cada uma com a decisão de origem e a marca **decisão da equipe** |
| Exemplos | Dados fictícios. Nenhum nome, data ou horário é real |
| Técnica | Técnica de teste prevista: valor limite, partição, tabela de decisão ou transição de estados |

### Dados fictícios usados nos exemplos

| Item | Descrição fictícia |
| --- | --- |
| Sala A | Janela de 07:00 às 22:00, de segunda a sexta (valores de exemplo) |
| Sala B | Sala sem restrição, mesma janela da Sala A |
| Professor 1 | Professor sem vínculo com usuário |
| Projetor P-001 | Material com patrimônio, marcado como restrito |
| Notebook N-001 | Material com patrimônio, não restrito |
| Solicitante 1 e Solicitante 2 | Usuários com perfil Solicitante |
| Responsável 1 e Responsável 2 | Usuários com perfil Responsável |
| Administrador 1 | Usuário com perfil Administrador |
| 20/10/2026 | Terça-feira. 24/10/2026 é sábado e 25/10/2026 é domingo |

## 1. Regras da especificação

### RN-01. O término deve ser posterior ao início

- **Texto fiel:** o término deve ser posterior ao início.
- **Origem:** especificação, seção 4 (Tempo e concorrência). Detalhe da fronteira em RN-11.
- **Aceita:** Sala A, 20/10/2026, das 14:00 às 16:00.
- **Rejeita:** das 14:00 às 14:00 (duração zero); das 16:00 às 14:00 (término antes do início).
- **Técnica:** valor limite, com término antes, igual e depois do início.

### RN-02. Reservas do mesmo recurso não podem se sobrepor

- **Texto fiel:** reservas do mesmo recurso não podem se sobrepor (sala, material ou professor).
- **Origem:** especificação, seção 4 (Tempo e concorrência).
- **Aceita:** Sala A com reserva das 14:00 às 16:00; nova reserva da mesma sala das 16:00 às 18:00 (fronteira, ver RN-11).
- **Rejeita:** nova reserva da Sala A das 15:00 às 17:00. Também rejeita a Sala B das 15:00 às 17:00 com o Professor 1 já alocado das 14:00 às 16:00 em outra sala.
- **Técnica:** valor limite nas fronteiras e partição por tipo de recurso (sala, professor, material).

### RN-03. Duas solicitações simultâneas produzem uma única reserva aceita

- **Texto fiel:** duas solicitações simultâneas devem produzir uma única reserva aceita.
- **Origem:** especificação, seção 4 (Tempo e concorrência).
- **Aceita:** Solicitante 1 e Solicitante 2 pedem a Sala A em 20/10/2026, das 14:00 às 16:00, no mesmo instante: um pedido é aceito.
- **Rejeita:** o outro pedido recebe recusa por conflito (409), e não existem duas reservas ativas para a mesma sala e horário.
- **Técnica:** teste de concorrência com banco real, com repetição.

### RN-04. Recursos em manutenção não podem ser reservados

- **Texto fiel:** recursos em manutenção não podem ser reservados.
- **Origem:** especificação, seção 4 (Tempo e concorrência).
- **Aceita:** Sala A bloqueada em 21/10/2026 das 08:00 às 12:00; reserva das 12:00 às 14:00 (fronteira, ver RN-11); reserva das 07:00 às 08:00 também aceita pela fronteira, pois cabe na janela (RN-14).
- **Rejeita:** reserva da Sala A em 21/10/2026 das 11:00 às 13:00.
- **Técnica:** valor limite das bordas do período de bloqueio.

### RN-05. Estados da reserva

- **Texto fiel:** fluxo principal `SOLICITADA → APROVADA → EM_USO → CONCLUÍDA`. Estados alternativos: rejeitada, cancelada e não compareceu.
- **Origem:** especificação, seção 4 (Estados e auditoria). Quem faz cada transição e sob que condição está na seção 3 deste documento.
- **Aceita:** reserva APROVADA vai a EM_USO quando o Responsável registra o início do uso.
- **Rejeita:** reserva CONCLUÍDA volta a EM_USO; reserva SOLICITADA vai direto a CONCLUÍDA.
- **Técnica:** tabela de transição de estados, cobrindo as transições proibidas.

### RN-06. Somente responsáveis aprovam recursos restritos

- **Texto fiel:** somente responsáveis aprovam recursos restritos.
- **Origem:** especificação, seção 4 (Estados e auditoria). Segregação em RN-16.
- **Aceita:** Responsável 1 aprova a reserva do Solicitante 1 que inclui o Projetor P-001.
- **Rejeita:** Solicitante 1 ou Administrador 1 tenta aprovar a mesma reserva (403, sem mudança de estado).
- **Técnica:** tabela de decisão perfil × tipo de recurso × restrito (seção 4).

### RN-07. Reservas iniciadas não podem ser apagadas

- **Texto fiel:** reservas iniciadas não podem ser apagadas.
- **Origem:** especificação, seção 4 (Estados e auditoria). Reforçada por RN-27.
- **Aceita:** reserva SOLICITADA do Solicitante 1 é cancelada (mudança de estado, sem apagar).
- **Rejeita:** qualquer tentativa de apagar ou cancelar uma reserva EM_USO.
- **Técnica:** partição por estado (não iniciada e iniciada).

### RN-08. Toda mudança de estado gera auditoria

- **Texto fiel:** toda mudança de estado deve gerar auditoria.
- **Origem:** especificação, seção 4 (Estados e auditoria). Ampliada por RN-29.
- **Aceita:** a transição de APROVADA para EM_USO grava um evento com estado anterior, novo estado, ator e instante.
- **Rejeita:** transição gravada sem o evento correspondente é defeito.
- **Técnica:** teste de integração com banco real, conferindo o evento de cada transição.

## 2. Regras decorrentes das decisões da equipe

Todas as regras desta seção são **decisão da equipe**.

### RN-09. Aprovação automática sem recurso restrito

- **Marca:** decisão da equipe. **Origem:** A1.
- **Texto:** reserva sem nenhum recurso restrito passa de SOLICITADA para APROVADA automaticamente, com auditoria cujo ator é SISTEMA.
- **Aceita:** Solicitante 1 reserva Sala A e Notebook N-001, nenhum restrito: vai a SOLICITADA e em seguida a APROVADA, ator SISTEMA.
- **Rejeita:** reserva com o Projetor P-001 não é aprovada automaticamente.
- **Técnica:** tabela de decisão (seção 4).

### RN-10. Aprovação exigida e valor gravado na criação

- **Marca:** decisão da equipe. **Origem:** A1.
- **Texto:** reserva com ao menos um recurso restrito exige aprovação de um Responsável. O campo "exige aprovação" é calculado pelo servidor e gravado na reserva no momento da criação. Mudar o atributo "restrito" depois não altera reservas existentes.
- **Aceita:** reserva criada em 12/10/2026 com o Projetor P-001 (restrito) exige aprovação; o Administrador 1 desmarca o projetor em 13/10/2026 e a reserva continua exigindo aprovação.
- **Rejeita:** requisição que envia "exige aprovação" falso: o valor do cliente é ignorado.
- **Técnica:** partição (com e sem recurso restrito) e teste de que a mudança do atributo não afeta reserva existente.

### RN-11. Intervalos semiabertos [início, fim)

- **Marca:** decisão da equipe. **Origem:** A2.
- **Texto:** o período é um intervalo semiaberto. Há conflito se e somente se `inicioA < fimB` e `inicioB < fimA`. Duração zero é inválida (RN-01). A convenção vale também para bloqueios de manutenção.
- **Aceita:** 14:00–16:00 e 16:00–18:00 no mesmo recurso não conflitam.
- **Rejeita:** 14:00–16:00 e 15:59–18:00 conflitam; 14:00–14:00 é inválida.
- **Técnica:** valor limite em trinca (um instante antes, no limite, um instante depois), parametrizado.

### RN-12. Material é unidade identificada

- **Marca:** decisão da equipe. **Origem:** A3.
- **Texto:** cada material é uma unidade identificada por código de patrimônio e cada unidade é um recurso. Controle por quantidade e consumíveis estão fora de escopo.
- **Aceita:** Notebook N-001 reservado das 14:00 às 16:00; Notebook N-002, outra unidade, reservado no mesmo horário.
- **Rejeita:** cadastro de material sem código de patrimônio; segunda reserva do Notebook N-001 no mesmo horário.
- **Técnica:** partição por unidade e valor limite de sobreposição (RN-02).

### RN-13. Professor é recurso; vínculo com usuário é opcional

- **Marca:** decisão da equipe. **Origem:** A4 e C8.
- **Texto:** professor é recurso alocável e pode não ter login. O vínculo com usuário, quando existe, não concede perfil. Para solicitar, é preciso um usuário Solicitante. Reservar aula em que o próprio vinculado é o professor alocado é permitido, e a agenda continua sob RN-02.
- **Aceita:** Professor 1 sem login alocado a uma aula; Solicitante 1, vinculado ao Professor 1, reserva uma aula com ele alocado.
- **Rejeita:** a mesma reserva se o Professor 1 já está alocado das 14:00 às 16:00 em outra sala.
- **Técnica:** partição (com e sem vínculo) e valor limite na agenda.

### RN-14. Janela e dias de funcionamento da sala

- **Marca:** decisão da equipe. **Origem:** A6 e C5.
- **Texto:** a sala tem hora de abertura e de fechamento e dias da semana de funcionamento. A reserva precisa caber na janela e em um dia de funcionamento, e não cruza a meia-noite local nesta versão (suposição S3). Professor e material não têm janela.
- **Aceita:** Sala A em 20/10/2026 (terça), das 07:00 às 22:00.
- **Rejeita:** Sala A em 20/10/2026 das 21:00 às 23:00 (fora da janela); em 24/10/2026 (sábado, dia sem funcionamento); das 23:00 às 01:00 (cruza a meia-noite).
- **Técnica:** valor limite das bordas da janela e partição por dia da semana.

### RN-15. Tempo em UTC com fuso configurável

- **Marca:** decisão da equipe. **Origem:** A6.
- **Texto:** o fuso é America/Sao_Paulo e configurável. O armazenamento é em UTC e a conversão ocorre apenas na borda.
- **Aceita:** reserva criada às 14:00 locais é armazenada como o instante UTC correspondente e exibida às 14:00 locais.
- **Rejeita:** gravação de horário local sem conversão.
- **Técnica:** partição por fuso configurado e valor limite na virada de dia.

### RN-16. Segregação de funções

- **Marca:** decisão da equipe. **Origem:** B1.
- **Texto:** o Responsável também cria reservas, com as permissões do Solicitante, mas ninguém aprova a própria reserva. Restrição de operação: são necessários ao menos dois Responsáveis.
- **Aceita:** Responsável 1 cria reserva com o Projetor P-001 e o Responsável 2 a aprova.
- **Rejeita:** Responsável 1 aprova a própria reserva (403).
- **Técnica:** tabela de decisão aprovador × dono da reserva.

### RN-17. Administrador não reserva nem aprova; um perfil por usuário

- **Marca:** decisão da equipe. **Origem:** B2.
- **Texto:** o Administrador não aprova (RN-06) e não cria reservas próprias nesta versão. Cada usuário tem exatamente um perfil.
- **Aceita:** Administrador 1 cria bloqueio de manutenção e cancela reserva com motivo.
- **Rejeita:** Administrador 1 cria reserva (403); atribuição de dois perfis ao mesmo usuário.
- **Técnica:** tabela de decisão perfil × operação (matriz de autorização).

### RN-18. Cancelamento por estado e perfil

- **Marca:** decisão da equipe. **Origem:** A8.
- **Texto:** SOLICITADA é cancelada pelo dono, sem motivo, ou pelo Administrador, com motivo obrigatório. APROVADA é cancelada pelo dono até o início, ou por Responsável ou Administrador, com motivo. EM_USO não é cancelada por ninguém; só é concluída pelo Responsável. Estados terminais não são cancelados. Não há antecedência mínima.
- **Aceita:** Solicitante 1 cancela a própria reserva APROVADA em 20/10/2026 às 13:00, para início às 14:00; Responsável 2 cancela a mesma reserva com motivo.
- **Rejeita:** Solicitante 1 cancela a reserva às 14:00 em ponto, após o início; Responsável 1 cancela reserva SOLICITADA de outro usuário; qualquer cancelamento de EM_USO.
- **Técnica:** tabela de decisão estado × perfil e valor limite no instante de início.

### RN-19. Alteração por estado e perfil

- **Marca:** decisão da equipe. **Origem:** C1.
- **Texto:** o dono altera em SOLICITADA e em APROVADA até o início. Mudança de período ou de recurso reavalia RN-01, RN-02 e RN-04 e é atômica: troca as ocupações na mesma transação e, em caso de conflito, responde 409 e nada muda. Se a reserva exigia aprovação, volta a SOLICITADA com nova aprovação e auditoria. Mudança apenas de título ou descrição não reaprova. EM_USO e estados terminais não se alteram.
- **Aceita:** reserva APROVADA com o Projetor P-001 muda de 14:00–16:00 para 15:00–17:00 sem conflito: volta a SOLICITADA e gera evento de auditoria.
- **Rejeita:** mudança para 15:00–17:00 com a Sala A ocupada nesse horário (409, ocupação anterior preservada); alteração de reserva EM_USO.
- **Técnica:** transição de estados, partição por tipo de mudança (título versus período ou recurso) e teste de atomicidade com banco real.

### RN-20. Início de uso

- **Marca:** decisão da equipe. **Origem:** A8.
- **Texto:** APROVADA passa a EM_USO quando o Responsável registra o início ou a retirada do primeiro material.
- **Aceita:** Responsável 1 registra a retirada do Projetor P-001 e a reserva vai a EM_USO.
- **Rejeita:** Solicitante 1 tenta registrar o início; registro de início em reserva SOLICITADA.
- **Técnica:** transição de estados e tabela de decisão por perfil.

### RN-21. Não compareceu

- **Marca:** decisão da equipe. **Origem:** A8.
- **Texto:** o Responsável marca como não compareceu a reserva APROVADA que não entrou em uso após o início mais uma tolerância configurável. O job automático é opcional. O valor padrão da tolerância segue como suposição S4 (lacuna D1).
- **Aceita:** reserva com início às 14:00, sem uso, marcada pelo Responsável depois de passada a tolerância configurada.
- **Rejeita:** marcação antes de terminar a tolerância; marcação de reserva SOLICITADA ou EM_USO.
- **Técnica:** valor limite no fim da tolerância e transição de estados.

### RN-22. Bloqueio de manutenção sobre reservas existentes

- **Marca:** decisão da equipe. **Origem:** A7 e D7.
- **Texto:** a criação do bloqueio primeiro responde 409 listando as reservas conflitantes, sem gravar. O Administrador pode confirmar, e então as reservas SOLICITADA e APROVADA conflitantes são canceladas pelo sistema com motivo MANUTENCAO, com auditoria e notificação. Reserva com vários recursos é cancelada por inteiro, não apenas o item afetado (D7). Se houver reserva EM_USO, o bloqueio é recusado, sem opção de forçar (RN-07).
- **Aceita:** bloqueio da Sala A em 21/10/2026, das 08:00 às 12:00, com duas reservas APROVADA, uma delas com a Sala A e o Projetor P-001: 409 com a lista; após confirmar, ambas são canceladas por inteiro com motivo MANUTENCAO, e o Projetor P-001 volta a ficar livre.
- **Rejeita:** o mesmo bloqueio com uma reserva EM_USO no período; confirmação sem ter recebido a lista.
- **Técnica:** partição por estado das reservas conflitantes e transição de estados.

### RN-23. Conclusão condicionada à devolução

- **Marca:** decisão da equipe. **Origem:** C3.
- **Texto:** a reserva só vai a CONCLUÍDA quando todo material retirado foi devolvido. Material não retirado não bloqueia. Cobrança de atraso fica fora de escopo.
- **Aceita:** reserva com Projetor P-001 e Notebook N-001, ambos retirados e devolvidos, é concluída; reserva com o projetor reservado e nunca retirado é concluída.
- **Rejeita:** conclusão com o projetor retirado e não devolvido.
- **Técnica:** tabela de decisão (retirado × devolvido) e transição de estados.

### RN-24. Decisão do Responsável

- **Marca:** decisão da equipe. **Origem:** C2.
- **Texto:** rejeitar exige motivo; aprovar tem motivo opcional. Não há prazo para decidir.
- **Aceita:** rejeição com motivo informado; aprovação sem motivo.
- **Rejeita:** rejeição sem motivo.
- **Técnica:** partição (aprovar e rejeitar × motivo informado e ausente).

### RN-25. Cancelamento por falta de decisão

- **Marca:** decisão da equipe. **Origem:** C2 (suposição S6, a validar).
- **Texto:** reserva SOLICITADA cujo início chega sem decisão é cancelada pelo sistema com motivo SEM_DECISAO, com auditoria e notificação.
- **Aceita:** reserva SOLICITADA para 20/10/2026 às 14:00, sem decisão até as 14:00, é cancelada pelo sistema.
- **Rejeita:** cancelamento por SEM_DECISAO de reserva já APROVADA ou antes do início.
- **Técnica:** valor limite no instante de início e transição de estados. O mecanismo está em aberto (D2).

### RN-26. Visibilidade por perfil

- **Marca:** decisão da equipe. **Origem:** B3, C4 e D5.
- **Texto:** o Solicitante vê só as próprias reservas e, na disponibilidade, vê intervalos ocupados sem identificar quem reservou. O Responsável vê todas as reservas, a fila de aprovações, o histórico das reservas e o relatório RF-12. O Administrador vê todas as reservas, toda a auditoria, incluindo cadastro e perfil, e o relatório RF-12, somente leitura.
- **Aceita:** a consulta de disponibilidade devolve o intervalo 14:00–16:00 ocupado, sem o dono.
- **Rejeita:** Solicitante 2 abre a reserva do Solicitante 1; Responsável abre a auditoria completa; Solicitante abre o relatório RF-12 (suposição, ver D5).
- **Técnica:** tabela de decisão perfil × dado (matriz de visibilidade).

### RN-27. Nenhuma reserva é apagada fisicamente

- **Marca:** decisão da equipe. **Origem:** regra geral das decisões C.
- **Texto:** nenhuma reserva é apagada fisicamente em nenhum estado. Cancelamento, rejeição e demais encerramentos são mudanças de estado com auditoria.
- **Aceita:** reserva cancelada continua consultável com estado cancelada e motivo.
- **Rejeita:** qualquer operação que remova a reserva do armazenamento.
- **Técnica:** partição por estado e verificação de ausência de operação de exclusão.

### RN-28. Notificação

- **Marca:** decisão da equipe. **Origem:** A5 e C6.
- **Texto:** os eventos são solicitação pendente, reserva aprovada, rejeitada e cancelada. O webhook recebe POST em JSON com tipo do evento, id da reserva, id do destinatário, instante e chave de idempotência, sem dados pessoais além do necessário. Destinatários: o Solicitante (aprovada, rejeitada, cancelada) e os Responsáveis (pendente). O envio ocorre após o commit, com status PENDENTE, ENVIADA ou FALHA e reenvio em intervalo crescente, com número de tentativas configurável (valor padrão em S7, lacuna D3). A falha do provedor nunca desfaz a reserva.
- **Aceita:** reserva aprovada gera notificação ENVIADA ao Solicitante; provedor com erro 500 deixa a notificação PENDENTE para reenvio e a reserva permanece APROVADA.
- **Rejeita:** falha do provedor que reverte a reserva; reenvio sem a mesma chave de idempotência.
- **Técnica:** partição por resposta do provedor (200, 404, 500, lentidão, JSON inválido), com WireMock.

### RN-29. Auditoria ampliada

- **Marca:** decisão da equipe. **Origem:** C7.
- **Texto:** além das mudanças de estado (RN-08), são auditadas a criação, a alteração e a desativação de recursos, usuários, perfis e bloqueios, no mesmo mecanismo, com ator, entidade, antes e depois.
- **Aceita:** o Administrador 1 altera o perfil de um usuário e um evento registra ator, entidade, valor anterior e valor novo.
- **Rejeita:** alteração de cadastro sem evento.
- **Técnica:** teste de integração com banco real, um caso por tipo de entidade.

### RN-30. Conflitos evitados são registrados

- **Marca:** decisão da equipe. **Origem:** B4.
- **Texto:** toda solicitação recusada por RN-02, RN-03 ou RN-04 é registrada como tentativa de conflito, com solicitante, recurso, período e motivo.
- **Aceita:** o pedido perdedor de uma disputa simultânea (RN-03) gera uma tentativa de conflito.
- **Rejeita:** recusa por conflito sem registro.
- **Técnica:** integração com banco real e partição por motivo (RN-02, RN-03, RN-04).

### RN-31. Cálculos do relatório RF-12

- **Marca:** decisão da equipe. **Origem:** B4 e C5.
- **Texto:**
  - **Carga horária alocada:** soma das durações das ocupações de reservas em APROVADA, EM_USO e CONCLUÍDA, por recurso e período, contando só a parte interna do período.
  - **Utilização:** horas alocadas dividido pelas horas de funcionamento nos dias de funcionamento do período; calculada só para salas. Feriados ficam fora de escopo.
  - **Conflitos evitados:** contagem total e distinta por solicitante, recurso e período, das tentativas de RN-30.
  - **Filtros:** período, tipo de recurso e recurso. O relatório é paginado.
- **Aceita:** reserva APROVADA das 14:00 às 16:00 em 20/10/2026 conta 2 horas no período de 20/10/2026.
- **Rejeita:** reserva SOLICITADA contada na carga; reserva que atravessa o início do período contada por inteiro.
- **Técnica:** valor limite nas bordas do período e dados semeados com resultado conferido contra o banco.

### RN-32. Desativação de recurso

- **Marca:** decisão da equipe. **Origem:** D6.
- **Texto:** desativar um recurso é recusado com 409, listando as reservas, se houver reservas futuras em SOLICITADA, APROVADA ou EM_USO. Não há cancelamento automático. Sem reservas futuras nesses estados, o recurso é desativado e deixa de aparecer em novas buscas.
- **Aceita:** Notebook N-001 sem reservas futuras é desativado em 13/10/2026; o histórico de reservas CONCLUÍDA continua consultável.
- **Rejeita:** desativar a Sala A com uma reserva APROVADA em 20/10/2026: 409 com a lista, e o recurso permanece ativo.
- **Técnica:** partição por estado das reservas futuras (SOLICITADA, APROVADA, EM_USO, terminais) e valor limite na data de início da reserva.

### RN-33. Quem rejeita uma solicitação

- **Marca:** decisão da equipe. **Origem:** D8.
- **Texto:** rejeita o Responsável que não é o dono da reserva. O dono Responsável não rejeita a própria reserva: ele a cancela (RN-18). Solicitante e Administrador não rejeitam.
- **Aceita:** Responsável 2 rejeita, com motivo, a reserva do Solicitante 1; Responsável 1 cancela a própria reserva SOLICITADA.
- **Rejeita:** Responsável 1 rejeita a própria reserva (403); Administrador 1 rejeita qualquer reserva (403).
- **Técnica:** tabela de decisão ator × dono da reserva (seção 4.3).

## 3. Transições de estado

Os nomes dos eventos de auditoria são **propostas** a confirmar na Fase 2. As regras que sustentam cada linha estão entre parênteses.

### 3.1 Transições permitidas

| Origem | Destino | Quem pode | Condição | Evento de auditoria |
| --- | --- | --- | --- | --- |
| (nova) | SOLICITADA | Solicitante ou Responsável (dono) | RN-01, RN-02, RN-04 e RN-14 atendidas | RESERVA_CRIADA |
| SOLICITADA | APROVADA | SISTEMA | Nenhum recurso restrito (RN-09) | RESERVA_APROVADA, ator SISTEMA |
| SOLICITADA | APROVADA | Responsável que não é o dono | Reserva exige aprovação (RN-06, RN-10, RN-16) | RESERVA_APROVADA |
| SOLICITADA | rejeitada | Responsável que não é o dono (RN-33) | Motivo informado (RN-24) | RESERVA_REJEITADA |
| SOLICITADA | cancelada | Dono, sem motivo; Administrador, com motivo (RN-18) | Reserva ainda não decidida | RESERVA_CANCELADA |
| SOLICITADA | cancelada | SISTEMA | Início chegou sem decisão, motivo SEM_DECISAO (RN-25) | RESERVA_CANCELADA, ator SISTEMA |
| SOLICITADA | cancelada | SISTEMA | Bloqueio confirmado, motivo MANUTENCAO (RN-22) | RESERVA_CANCELADA, ator SISTEMA |
| SOLICITADA | SOLICITADA | Dono | Alteração com RN-01, RN-02 e RN-04 reavaliadas (RN-19) | RESERVA_ALTERADA |
| APROVADA | SOLICITADA | Dono | Alteração de período ou recurso em reserva que exigia aprovação, até o início (RN-19) | RESERVA_ALTERADA e novo pedido de aprovação |
| APROVADA | APROVADA | Dono | Alteração de título ou descrição, ou de reserva que não exigia aprovação, até o início (RN-19) | RESERVA_ALTERADA |
| APROVADA | EM_USO | Responsável | Registra o início ou a retirada do primeiro material (RN-20) | RESERVA_INICIADA |
| APROVADA | cancelada | Dono, até o início; Responsável ou Administrador, com motivo (RN-18) | Antes do início para o dono | RESERVA_CANCELADA |
| APROVADA | cancelada | SISTEMA | Bloqueio confirmado, motivo MANUTENCAO (RN-22) | RESERVA_CANCELADA, ator SISTEMA |
| APROVADA | não compareceu | Responsável | Início mais tolerância sem uso (RN-21) | RESERVA_NAO_COMPARECEU |
| EM_USO | CONCLUÍDA | Responsável | Todo material retirado foi devolvido (RN-23) | RESERVA_CONCLUIDA |

### 3.2 Transições proibidas

| Origem | Destino ou ação | Motivo |
| --- | --- | --- |
| EM_USO | cancelada, por qualquer perfil | RN-18 e RN-07: só a conclusão encerra a reserva em uso |
| EM_USO | alteração, por qualquer perfil | RN-19 |
| EM_USO | bloqueio de manutenção que a atinge | RN-22 e RN-07: bloqueio recusado |
| CONCLUÍDA, rejeitada, cancelada, não compareceu | qualquer outro estado | Estados terminais (RN-18, RN-19) |
| SOLICITADA | EM_USO ou CONCLUÍDA | Faltam aprovação e início (RN-05) |
| APROVADA | CONCLUÍDA | Falta passar por EM_USO (RN-05) |
| APROVADA | rejeitada | Reserva já aprovada só encerra por cancelamento ou não comparecimento (RN-05) |
| SOLICITADA | não compareceu | Só reserva APROVADA que não entrou em uso (RN-21) |
| SOLICITADA | APROVADA pelo próprio dono | RN-16 |
| SOLICITADA | APROVADA por Solicitante ou Administrador | RN-06, RN-17 |
| SOLICITADA | rejeitada sem motivo | RN-24 |
| SOLICITADA | rejeitada pelo dono, por Solicitante ou por Administrador | RN-33 |
| EM_USO | CONCLUÍDA com material retirado e não devolvido | RN-23 |
| qualquer estado | exclusão física | RN-07 e RN-27 |

## 4. Tabela de decisão da aprovação

A reserva exige aprovação se **ao menos um** dos recursos é restrito (RN-10). O resultado independe do tipo do recurso restrito, mas a tabela mostra as combinações para tornar os casos de teste explícitos.

### 4.1 Perfil do dono × tipo de recurso × restrito

| Tipo do recurso | Restrito | Dono: Solicitante | Dono: Responsável | Dono: Administrador |
| --- | --- | --- | --- | --- |
| Sala | Não | APROVADA automática (SISTEMA) | APROVADA automática (SISTEMA) | Não cria reserva (RN-17) |
| Sala | Sim | SOLICITADA; aprova um Responsável | SOLICITADA; aprova outro Responsável | Não cria reserva (RN-17) |
| Professor | Não | APROVADA automática (SISTEMA) | APROVADA automática (SISTEMA) | Não cria reserva (RN-17) |
| Professor | Sim | SOLICITADA; aprova um Responsável | SOLICITADA; aprova outro Responsável | Não cria reserva (RN-17) |
| Material | Não | APROVADA automática (SISTEMA) | APROVADA automática (SISTEMA) | Não cria reserva (RN-17) |
| Material | Sim | SOLICITADA; aprova um Responsável | SOLICITADA; aprova outro Responsável | Não cria reserva (RN-17) |

### 4.2 Quem pode aprovar uma reserva SOLICITADA que exige aprovação

| Quem tenta aprovar | Resultado | Regra |
| --- | --- | --- |
| Responsável que não é o dono | Permitido | RN-06 |
| Responsável que é o dono | Recusado (403) | RN-16 |
| Solicitante | Recusado (403) | RN-06 |
| Administrador | Recusado (403) | RN-06, RN-17 |
| SISTEMA | Só se não há recurso restrito | RN-09 |

### 4.3 Quem pode rejeitar uma reserva SOLICITADA

| Quem tenta rejeitar | Resultado | Regra |
| --- | --- | --- |
| Responsável que não é o dono | Permitido, com motivo obrigatório | RN-33, RN-24 |
| Responsável que é o dono | Recusado (403); ele cancela a própria reserva | RN-33, RN-18 |
| Solicitante | Recusado (403) | RN-33 |
| Administrador | Recusado (403) | RN-33 |

## 5. Lacunas que continuam abertas

Detalhe em [perguntas-abertas.md](perguntas-abertas.md), seção D. **Nenhuma foi decidida e nenhum valor foi inventado.** D5, D6, D7 e D8 foram decididas em 12/10/2026 e deram origem a RN-32 e RN-33 e às atualizações de RN-22 e RN-26.

| ID | Lacuna | Regra afetada |
| --- | --- | --- |
| D1 | Valor padrão da tolerância de não comparecimento (S4) | RN-21 |
| D2 | Mecanismo do cancelamento por SEM_DECISAO e da marcação automática: job agendado ou avaliação sob demanda (S6) | RN-21, RN-25 |
| D3 | Valor padrão de tentativas e de intervalo de reenvio da notificação (S7) | RN-28 |
| D4 | Tamanho da página do relatório | RN-31 |
| D9 | Retenção da auditoria e das notificações e tratamento de dados pessoais | RN-28, RN-29 |
