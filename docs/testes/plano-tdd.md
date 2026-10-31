# Plano de TDD: regras de negócio, casos e matriz

Inventário das regras de negócio RN-01 a RN-33, com os casos derivados de cada uma, o resultado esperado e a ligação com o teste que a protege. **Nada aqui é inventado:** as colunas de caso e de resultado esperado vêm de [regras-negocio.md](../prd/regras-negocio.md) (campos *Aceita*, *Rejeita* e *Técnica*) e de [casos-de-teste.md](casos-de-teste.md); a evidência do ciclo vermelho/verde vem de [evidencia-tdd.md](evidencia-tdd.md). Fonte das regras RN-01 a RN-08: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Regras críticas".

Este arquivo é **gerado da documentação existente** e não substitui a RTM ([RTM.md](../../RTM.md)): ele organiza o mesmo conteúdo por regra.

## 1. Como o TDD foi conduzido (declaração)

- O ciclo foi aplicado **por fatias de comportamento**, com commits `test(red)` e `feat(green)` (ou `fix(green)`) e `refactor` quando houve. **Não** se escreveram todos os testes vermelhos de uma vez antes do código: cada fatia teve o seu vermelho visto e o seu verde. As fatias da Fase 4 estão em [evidencia-tdd.md](evidencia-tdd.md), seção "Fatias"; as da Fase 6, nas seções seguintes do mesmo arquivo.
- Contagem no histórico da `main` em `a027e91` (`git log`, 26/10/2026): **98** commits `test(red)`, **98** `feat(green)` ou `fix(green)` e **11** `refactor`.
- **Linhas que nasceram verdes** (o comportamento já existia e o teste foi escrito depois do código, por isso não substituem o ciclo TDD): lacunas de risco da cobertura (`LacunasDeRiscoApiIT`), lacunas do PIT (`HorasDeFuncionamentoTest`, `EventoAuditoriaTest`, `ReservaTest`), os 15 cenários BDD de aprovação e bloqueio, o CT-106 (troca do provedor), os 10 casos de API do limite de login (`LimiteDeLoginApiIT`, tempo em trinca e demais), e na Fase 6 o CT-124, o CT-126 e o CT-135.
- **Testes que passaram de primeira por faltar a classe:** CT-107 a CT-113 e parte de CT-084 a CT-095. O vermelho demonstra ausência, não regressão de regra.
- **`PeriodoTest.ct034` é teste do modelo, não da produção:** a decisão de sobreposição do sistema é SQL (`tstzrange(...,'[)')` e a constraint de exclusão), e `Periodo.sobrepoe` só é chamado pelo teste. A prova de produção de RN-02, RN-11 e RF-05 é `ReservasApiIT`, `EsquemaIT` e `ConcorrenciaApiIT` ([mutacao-manual.md](mutacao-manual.md), seção 5).
- Regra, caso e teste só ficam "verde" aqui quando passaram na execução de referência E-24 (run [`40116523445`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40116523445), `c9240cd`: back end 665 testes, front 910, E2E 5 de 5, 0 falhas; [execucao-e24.md](execucao-e24.md)). "Verde" **não** quer dizer que o teste pega a regra quebrada: isso é medido em [mutacao-manual.md](mutacao-manual.md) só para as regras críticas.

## 2. Inventário das regras e dos casos derivados

Para cada regra: a origem, o caminho feliz (*Aceita*), as recusas (*Rejeita*: entradas inválidas, conflitos e estados proibidos) e a técnica de teste (*Técnica*: valores-limite e partições). O resultado esperado de cada caso está no próprio texto do caso.

### RN-01. O término deve ser posterior ao início

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Tempo e concorrência). Detalhe da fronteira em RN-11. |
| Regra | o término deve ser posterior ao início. |
| Caminho feliz e resultado esperado | Sala A, 20/10/2026, das 14:00 às 16:00. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | das 14:00 às 14:00 (duração zero); das 16:00 às 14:00 (término antes do início). |
| Técnica (valores-limite, partição) | valor limite, com término antes, igual e depois do início. |

### RN-02. Reservas do mesmo recurso não podem se sobrepor

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Tempo e concorrência). |
| Regra | reservas do mesmo recurso não podem se sobrepor (sala, material ou professor). |
| Caminho feliz e resultado esperado | Sala A com reserva das 14:00 às 16:00; nova reserva da mesma sala das 16:00 às 18:00 (fronteira, ver RN-11). |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | nova reserva da Sala A das 15:00 às 17:00. Também rejeita a Sala B das 15:00 às 17:00 com o Professor 1 já alocado das 14:00 às 16:00 em outra sala. |
| Técnica (valores-limite, partição) | valor limite nas fronteiras e partição por tipo de recurso (sala, professor, material). |

### RN-03. Duas solicitações simultâneas produzem uma única reserva aceita

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Tempo e concorrência). |
| Regra | duas solicitações simultâneas devem produzir uma única reserva aceita. |
| Caminho feliz e resultado esperado | Solicitante 1 e Solicitante 2 pedem a Sala A em 20/10/2026, das 14:00 às 16:00, no mesmo instante: um pedido é aceito. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | o outro pedido recebe recusa por conflito (409), e não existem duas reservas ativas para a mesma sala e horário. |
| Técnica (valores-limite, partição) | teste de concorrência com banco real, com repetição. |

### RN-04. Recursos em manutenção não podem ser reservados

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Tempo e concorrência). |
| Regra | recursos em manutenção não podem ser reservados. |
| Caminho feliz e resultado esperado | Sala A bloqueada em 21/10/2026 das 08:00 às 12:00; reserva das 12:00 às 14:00 (fronteira, ver RN-11); reserva das 07:00 às 08:00 também aceita pela fronteira, pois cabe na janela (RN-14). |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | reserva da Sala A em 21/10/2026 das 11:00 às 13:00. |
| Técnica (valores-limite, partição) | valor limite das bordas do período de bloqueio. |

### RN-05. Estados da reserva

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Estados e auditoria) |
| Regra | fluxo principal `SOLICITADA → APROVADA → EM_USO → CONCLUÍDA`. Estados alternativos: rejeitada, cancelada e não compareceu. |
| Caminho feliz e resultado esperado | reserva APROVADA vai a EM_USO quando o Responsável registra o início do uso. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | reserva CONCLUÍDA volta a EM_USO; reserva SOLICITADA vai direto a CONCLUÍDA. |
| Técnica (valores-limite, partição) | tabela de transição de estados, cobrindo as transições proibidas. |

### RN-06. Somente responsáveis aprovam recursos restritos

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Estados e auditoria). Segregação em RN-16. |
| Regra | somente responsáveis aprovam recursos restritos. |
| Caminho feliz e resultado esperado | Responsável 1 aprova a reserva do Solicitante 1 que inclui o Projetor P-001. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Solicitante 1 ou Administrador 1 tenta aprovar a mesma reserva (403, sem mudança de estado). |
| Técnica (valores-limite, partição) | tabela de decisão perfil × tipo de recurso × restrito (seção 4). |

### RN-07. Reservas iniciadas não podem ser apagadas

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Estados e auditoria). Reforçada por RN-27. |
| Regra | reservas iniciadas não podem ser apagadas. |
| Caminho feliz e resultado esperado | reserva SOLICITADA do Solicitante 1 é cancelada (mudança de estado, sem apagar). |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | qualquer tentativa de apagar uma reserva EM_USO ou CONCLUÍDA, ou de cancelar uma reserva EM_USO. |
| Técnica (valores-limite, partição) | partição por estado (não iniciada e iniciada). |

### RN-08. Toda mudança de estado gera auditoria

| Item | Conteúdo |
| --- | --- |
| Origem | especificação, seção "Regras críticas" (Estados e auditoria). Ampliada por RN-29. |
| Regra | toda mudança de estado deve gerar auditoria. |
| Caminho feliz e resultado esperado | a transição de APROVADA para EM_USO grava um evento com estado anterior, novo estado, ator e instante. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | transição gravada sem o evento correspondente é defeito. |
| Técnica (valores-limite, partição) | teste de integração com banco real, conferindo o evento de cada transição. |

### RN-09. Aprovação automática sem recurso restrito

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A1) |
| Regra | reserva sem nenhum recurso restrito passa de SOLICITADA para APROVADA automaticamente, com auditoria cujo ator é SISTEMA. |
| Caminho feliz e resultado esperado | Solicitante 1 reserva Sala A e Notebook N-001, nenhum restrito: vai a SOLICITADA e em seguida a APROVADA, ator SISTEMA. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | reserva com o Projetor P-001 não é aprovada automaticamente. |
| Técnica (valores-limite, partição) | tabela de decisão (seção 4). |

### RN-10. Aprovação exigida e valor gravado na criação

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A1) |
| Regra | reserva com ao menos um recurso restrito exige aprovação de um Responsável. O campo "exige aprovação" é calculado pelo servidor e gravado na reserva no momento da criação. Mudar o atributo "restrito" depois não altera reservas existentes. Quando a alteração da reserva muda a lista de recursos, o campo é recalculado e a reserva que passa a exigir aprovação volta a SOLICITADA (D12). |
| Caminho feliz e resultado esperado | reserva criada em 12/10/2026 com o Projetor P-001 (restrito) exige aprovação; o Administrador 1 desmarca o projetor em 13/10/2026 e a reserva continua exigindo aprovação. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | requisição que envia "exige aprovação" falso: o valor do cliente é ignorado. |
| Técnica (valores-limite, partição) | partição (com e sem recurso restrito) e teste de que a mudança do atributo não afeta reserva existente. |

### RN-11. Intervalos semiabertos [início, fim)

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A2) |
| Regra | o período é um intervalo semiaberto. Há conflito se e somente se `inicioA < fimB` e `inicioB < fimA`. Duração zero é inválida (RN-01). A convenção vale também para bloqueios de manutenção. |
| Caminho feliz e resultado esperado | 14:00–16:00 e 16:00–18:00 no mesmo recurso não conflitam. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | 14:00–16:00 e 15:59–18:00 conflitam; 14:00–14:00 é inválida. |
| Técnica (valores-limite, partição) | valor limite em trinca (um instante antes, no limite, um instante depois), parametrizado. |

### RN-12. Material é unidade identificada

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A3) |
| Regra | cada material é uma unidade identificada por código de patrimônio único, e cada unidade é um recurso. Controle por quantidade e consumíveis estão fora de escopo. |
| Caminho feliz e resultado esperado | Notebook N-001 reservado das 14:00 às 16:00; Notebook N-002, outra unidade, reservado no mesmo horário. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | cadastro de material sem código de patrimônio; cadastro com código de patrimônio já existente; segunda reserva do Notebook N-001 no mesmo horário. |
| Técnica (valores-limite, partição) | partição por unidade e valor limite de sobreposição (RN-02). |

### RN-13. Professor é recurso; vínculo com usuário é opcional

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A4 e C8) |
| Regra | professor é recurso alocável e pode não ter login. O vínculo com usuário, quando existe, não concede perfil. Para solicitar, é preciso um usuário Solicitante. Reservar aula em que o próprio vinculado é o professor alocado é permitido, e a agenda continua sob RN-02. |
| Caminho feliz e resultado esperado | Professor 1, sem login, alocado a uma aula; Solicitante 1, vinculado ao Professor 2, reserva uma aula com o Professor 2 alocado. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | a mesma reserva se o Professor 2 já está alocado das 14:00 às 16:00 em outra sala. |
| Técnica (valores-limite, partição) | partição (com e sem vínculo) e valor limite na agenda. |

### RN-14. Janela e dias de funcionamento da sala

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A6 e C5) |
| Regra | a sala tem hora de abertura e de fechamento e dias da semana de funcionamento. A reserva precisa caber na janela e em um dia de funcionamento, e não cruza a meia-noite local nesta versão (suposição S3). Professor e material não têm janela. |
| Caminho feliz e resultado esperado | Sala A em 20/10/2026 (terça), das 07:00 às 22:00. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Sala A em 20/10/2026 das 06:00 às 08:00 (começa antes da abertura) e das 21:00 às 23:00 (termina depois do fechamento); em 24/10/2026 (sábado, dia sem funcionamento); das 23:00 às 01:00 (cruza a meia-noite). |
| Técnica (valores-limite, partição) | valor limite das bordas da janela e partição por dia da semana. |

### RN-15. Tempo em UTC com fuso configurável

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A6) |
| Regra | o fuso é America/Sao_Paulo e configurável. O armazenamento é em UTC e a conversão ocorre apenas na borda. |
| Caminho feliz e resultado esperado | reserva criada às 14:00 locais é armazenada como o instante UTC correspondente e exibida às 14:00 locais. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | gravação de horário local sem conversão. |
| Técnica (valores-limite, partição) | partição por fuso configurado e valor limite na virada de dia. |

### RN-16. Segregação de funções

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (B1) |
| Regra | o Responsável também cria reservas, com as permissões do Solicitante, mas ninguém aprova a própria reserva. Restrição de operação: são necessários ao menos dois Responsáveis. O Responsável dono registra início, retirada, devolução e conclusão da própria reserva, com o ator auditado (D13); aprovar e rejeitar a própria reserva continua proibido. A desativação de usuário é recusada com 409 se deixar menos de dois Responsáveis ativos ou se o usuário tiver reserva futura em SOLICITADA, APROVADA ou EM_USO, e revoga as sessões (D14). |
| Caminho feliz e resultado esperado | Responsável 1 cria reserva com o Projetor P-001 e o Responsável 2 a aprova. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Responsável 1 aprova a própria reserva (403). |
| Técnica (valores-limite, partição) | tabela de decisão aprovador × dono da reserva. |

### RN-17. Administrador não reserva nem aprova; um perfil por usuário

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (B2) |
| Regra | o Administrador não aprova (RN-06) e não cria reservas próprias nesta versão. Cada usuário tem exatamente um perfil. |
| Caminho feliz e resultado esperado | Administrador 1 cria bloqueio de manutenção e cancela reserva com motivo. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Administrador 1 cria reserva (403); atribuição de dois perfis ao mesmo usuário. |
| Técnica (valores-limite, partição) | tabela de decisão perfil × operação (matriz de autorização). |

### RN-18. Cancelamento por estado e perfil

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A8) |
| Regra | SOLICITADA é cancelada pelo dono, sem motivo, ou pelo Administrador, com motivo obrigatório. APROVADA é cancelada pelo dono até o início (antes do instante de início, D10), ou por Responsável ou Administrador, com motivo. EM_USO não é cancelada por ninguém; só é concluída pelo Responsável. Estados terminais não são cancelados. Não há antecedência mínima. |
| Caminho feliz e resultado esperado | Solicitante 1 cancela a própria reserva APROVADA em 20/10/2026 às 13:00, para início às 14:00; em outra reserva APROVADA, Responsável 2 cancela com motivo informado. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Solicitante 1 cancela a própria reserva às 14:01 de 20/10/2026, depois do início das 14:00; Responsável 1 cancela reserva SOLICITADA de outro usuário; qualquer cancelamento de EM_USO. Às 14:00:00 a reserva já começou e o cancelamento pelo dono é recusado (D10). |
| Técnica (valores-limite, partição) | tabela de decisão estado × perfil e valor limite no instante de início. |

### RN-19. Alteração por estado e perfil

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (C1) |
| Regra | o dono altera em SOLICITADA e em APROVADA até o início (antes do instante de início, D10). Mudança de período ou de recurso reavalia RN-01, RN-02 e RN-04 e é atômica: troca as ocupações na mesma transação e, em caso de conflito, responde 409 e nada muda. Se a reserva exigia aprovação, volta a SOLICITADA com nova aprovação e auditoria. Quando a alteração muda a lista de recursos, "exige aprovação" é recalculado e a reserva que passa a exigir aprovação volta a SOLICITADA (D12). Mudança apenas de título ou descrição não reaprova. EM_USO e estados terminais não se alteram. |
| Caminho feliz e resultado esperado | reserva APROVADA com o Projetor P-001 muda de 14:00–16:00 para 15:00–17:00 sem conflito: volta a SOLICITADA e gera evento de auditoria. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | mudança para 15:00–17:00 com a Sala A ocupada nesse horário (409, ocupação anterior preservada); alteração de reserva EM_USO. |
| Técnica (valores-limite, partição) | transição de estados, partição por tipo de mudança (título versus período ou recurso) e teste de atomicidade com banco real. |

### RN-20. Início de uso

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A8) |
| Regra | APROVADA passa a EM_USO quando o Responsável registra o início ou a retirada do primeiro material. |
| Caminho feliz e resultado esperado | Responsável 1 registra a retirada do Projetor P-001 e a reserva vai a EM_USO. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Solicitante 1 tenta registrar o início; registro de início em reserva SOLICITADA. |
| Técnica (valores-limite, partição) | transição de estados e tabela de decisão por perfil. |

### RN-21. Não compareceu

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A8) |
| Regra | o Responsável marca como não compareceu a reserva APROVADA que não entrou em uso após o início mais uma tolerância configurável. A marcação automática por job fica fora desta versão (D2). O valor padrão da tolerância segue como suposição S4 (lacuna D1). |
| Caminho feliz e resultado esperado | reserva com início às 14:00, sem uso, marcada pelo Responsável depois de passada a tolerância configurada. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | marcação antes de terminar a tolerância; marcação de reserva SOLICITADA ou EM_USO. |
| Técnica (valores-limite, partição) | valor limite no fim da tolerância e transição de estados. |
| Depende de lacuna aberta | D1 (valor da tolerância). |

### RN-22. Bloqueio de manutenção sobre reservas existentes

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A7 e D7) |
| Regra | a criação do bloqueio primeiro responde 409 listando as reservas conflitantes, sem gravar. O Administrador pode confirmar, e então as reservas SOLICITADA e APROVADA conflitantes são canceladas pelo sistema com motivo MANUTENCAO, com auditoria e notificação. Reserva com vários recursos é cancelada por inteiro, não apenas o item afetado (D7). Se houver reserva EM_USO, o bloqueio é recusado, sem opção de forçar (RN-07). |
| Caminho feliz e resultado esperado | bloqueio da Sala A em 21/10/2026, das 08:00 às 12:00, com duas reservas APROVADA, uma delas com a Sala A e o Projetor P-001: 409 com a lista; após confirmar, ambas são canceladas por inteiro com motivo MANUTENCAO, e o Projetor P-001 volta a ficar livre. Reserva da Sala A das 07:00 às 08:00 não conflita com o bloqueio e não entra na lista (RN-11). |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | o mesmo bloqueio com uma reserva EM_USO no período; confirmação sem ter recebido a lista. |
| Técnica (valores-limite, partição) | partição por estado das reservas conflitantes e transição de estados. |

### RN-23. Conclusão condicionada à devolução

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (C3) |
| Regra | a reserva só vai a CONCLUÍDA quando todo material retirado foi devolvido. Material não retirado não bloqueia. Cobrança de atraso fica fora de escopo. |
| Caminho feliz e resultado esperado | reserva com Projetor P-001 e Notebook N-001, ambos retirados e devolvidos, é concluída; reserva com o projetor reservado e nunca retirado é concluída. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | conclusão com o projetor retirado e não devolvido. |
| Técnica (valores-limite, partição) | tabela de decisão (retirado × devolvido) e transição de estados. |

### RN-24. Decisão do Responsável

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (C2) |
| Regra | rejeitar exige motivo; aprovar tem motivo opcional. Não há prazo para decidir. |
| Caminho feliz e resultado esperado | rejeição com motivo informado; aprovação sem motivo. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | rejeição sem motivo. |
| Técnica (valores-limite, partição) | partição (aprovar e rejeitar × motivo informado e ausente). |

### RN-25. Cancelamento por falta de decisão

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (C2 (suposição S6, a validar)) |
| Regra | reserva SOLICITADA cujo início chega sem decisão (a partir do instante de início, D10) é cancelada pelo sistema com motivo SEM_DECISAO, com auditoria e notificação. |
| Caminho feliz e resultado esperado | reserva SOLICITADA para 20/10/2026 às 14:00, sem decisão até as 14:00, é cancelada pelo sistema. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | cancelamento por SEM_DECISAO de reserva já APROVADA ou antes do início. |
| Técnica (valores-limite, partição) | valor limite no instante de início e transição de estados. O mecanismo é um job agendado, idempotente e com trava (D2). |

### RN-26. Visibilidade por perfil

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (B3, C4 e D5) |
| Regra | o Solicitante vê só as próprias reservas e, na disponibilidade, vê intervalos ocupados sem identificar quem reservou. O Responsável vê todas as reservas, a fila de aprovações, o histórico das reservas e o relatório RF-12. O Administrador vê todas as reservas, toda a auditoria, incluindo cadastro e perfil, e o relatório RF-12, somente leitura. |
| Caminho feliz e resultado esperado | a consulta de disponibilidade devolve o intervalo 14:00–16:00 ocupado, sem o dono. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Solicitante 2 abre a reserva do Solicitante 1; Responsável abre a auditoria completa; Solicitante abre o relatório RF-12 (suposição, ver D5). |
| Técnica (valores-limite, partição) | tabela de decisão perfil × dado (matriz de visibilidade). |

### RN-27. Nenhuma reserva é apagada fisicamente

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (regra geral das decisões C) |
| Regra | nenhuma reserva é apagada fisicamente em nenhum estado. Cancelamento, rejeição e demais encerramentos são mudanças de estado com auditoria. |
| Caminho feliz e resultado esperado | reserva cancelada continua consultável com estado cancelada e motivo. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | qualquer operação que remova a reserva do armazenamento. |
| Técnica (valores-limite, partição) | partição por estado e verificação de ausência de operação de exclusão. |

### RN-28. Notificação

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (A5 e C6) |
| Regra | os eventos são solicitação pendente, reserva aprovada, rejeitada e cancelada. O webhook recebe POST em JSON com tipo do evento, id da reserva, id do destinatário, instante e chave de idempotência, sem dados pessoais além do necessário. Destinatários: o Solicitante (aprovada, rejeitada, cancelada) e os Responsáveis (pendente). O envio ocorre após o commit, com status PENDENTE, ENVIADA ou FALHA e reenvio em intervalo crescente, com número de tentativas configurável (valor padrão em S7, lacuna D3). A falha do provedor nunca desfaz a reserva. |
| Caminho feliz e resultado esperado | reserva aprovada gera notificação ENVIADA ao Solicitante; provedor com erro 500 deixa a notificação PENDENTE para reenvio e a reserva permanece APROVADA. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | falha do provedor que reverte a reserva; reenvio sem a mesma chave de idempotência. |
| Técnica (valores-limite, partição) | partição por resposta do provedor (200, 404, 500, lentidão, JSON inválido), com WireMock. |
| Depende de lacuna aberta | D3 (tentativas e intervalo de reenvio) e D9 (retenção e dados pessoais). |

### RN-29. Auditoria ampliada

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (C7) |
| Regra | além das mudanças de estado (RN-08), são auditadas a criação, a alteração e a desativação de recursos, usuários, perfis e bloqueios, no mesmo mecanismo, com ator, entidade, antes e depois. |
| Caminho feliz e resultado esperado | o Administrador 1 altera o perfil de um usuário e um evento registra ator, entidade, valor anterior e valor novo. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | alteração de cadastro sem evento. |
| Técnica (valores-limite, partição) | teste de integração com banco real, um caso por tipo de entidade. |
| Depende de lacuna aberta | D9 (retenção). |

### RN-30. Conflitos evitados são registrados

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (B4) |
| Regra | toda solicitação recusada por RN-02, RN-03 ou RN-04 é registrada como tentativa de conflito, com solicitante, recurso, período e motivo. |
| Caminho feliz e resultado esperado | o pedido perdedor de uma disputa simultânea (RN-03) gera uma tentativa de conflito. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | recusa por conflito sem registro. |
| Técnica (valores-limite, partição) | integração com banco real e partição por motivo (RN-02, RN-03, RN-04). |

### RN-31. Cálculos do relatório RF-12

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (B4 e C5) |
| Regra | ver [regras-negocio.md](../prd/regras-negocio.md), a regra tem itens em lista |
| Caminho feliz e resultado esperado | reserva APROVADA das 14:00 às 16:00 em 20/10/2026 conta 2 horas no período de 20/10/2026. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | reserva SOLICITADA contada na carga; reserva que atravessa o início do período contada por inteiro. |
| Técnica (valores-limite, partição) | valor limite nas bordas do período e dados semeados com resultado conferido contra o banco. |
| Depende de lacuna aberta | D4 (tamanho da página). |

### RN-32. Desativação de recurso

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (D6) |
| Regra | desativar um recurso é recusado com 409, listando as reservas, se houver reservas futuras em SOLICITADA, APROVADA ou EM_USO, entendida como reserva futura a de término posterior ao instante atual, o que inclui EM_USO em curso (D11). Não há cancelamento automático. Sem reservas futuras nesses estados, o recurso é desativado e deixa de aparecer em novas buscas. |
| Caminho feliz e resultado esperado | Notebook N-001 sem reservas futuras é desativado em 13/10/2026; o histórico de reservas CONCLUÍDA continua consultável. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | desativar a Sala A com uma reserva APROVADA em 20/10/2026: 409 com a lista, e o recurso permanece ativo. |
| Técnica (valores-limite, partição) | partição por estado das reservas futuras (SOLICITADA, APROVADA, EM_USO, terminais) e valor limite na data de início da reserva. |

### RN-33. Quem rejeita uma solicitação

| Item | Conteúdo |
| --- | --- |
| Origem | decisão da equipe (D8) |
| Regra | rejeita o Responsável que não é o dono da reserva. O dono Responsável não rejeita a própria reserva: ele a cancela (RN-18). Solicitante e Administrador não rejeitam. |
| Caminho feliz e resultado esperado | Responsável 2 rejeita, com motivo, a reserva do Solicitante 1; Responsável 1 cancela a própria reserva SOLICITADA. |
| Recusas, conflitos, estados proibidos e entradas inválidas, com o resultado esperado | Responsável 1 rejeita a própria reserva (403); Administrador 1 rejeita qualquer reserva (403). |
| Técnica (valores-limite, partição) | tabela de decisão ator × dono da reserva (seção 4.3). |

## 3. Ambiguidades e lacunas (à parte)

Nenhum valor foi inventado para elas. Os casos que dependem delas usam **valor de teste** e verificam que o valor é configurável, não o valor ([casos-de-teste.md](casos-de-teste.md), seção 5).

| Lacuna | Regra afetada | Estado |
| --- | --- | --- |
| D1: tolerância de não comparecimento | RN-21 | Decidida pela equipe sem valor padrão, não validada com o professor ([limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md)) |
| D3: tentativas e intervalo de reenvio da notificação | RN-28 | Idem |
| D4: tamanho da página do relatório (20 no front, configurável) | RN-31 | Idem |
| D9: retenção da auditoria e das notificações, dados pessoais | RN-28, RN-29 | Idem; nada é apagado nem anonimizado (risco de privacidade declarado) |
| D14: mínimo de Responsáveis não é aplicado na troca de perfil | RN-16 | Brecha funcional conhecida, declarada |
| D17: duração da sessão | CT-004 | Sem valor padrão; o teste usa valor de teste |
| S4, S6, S7 e outras suposições citadas nas regras (RN-21, RN-25, RN-28) | RN-21, RN-25, RN-28 | Suposições com impacto declarado em [regras-negocio.md](../prd/regras-negocio.md) e [decisoes-equipe.md](../decisoes-equipe.md) |
| 20 solicitações e 5 repetições na concorrência; 300 ms e 50 usuários | RN-03 | Hipóteses da Aula 10, não validadas; marcadas como hipótese no CT-060 e no CT-062 |

## 4. Matriz regra, caso, teste e status

Os casos de cada regra são os CT cuja coluna *Rastreio* de [casos-de-teste.md](casos-de-teste.md) cita a regra. A coluna *TDD* diz se o vermelho foi visto (hash do `test(red)` da fatia) ou se o teste nasceu verde. A coluna *Status* é o resultado na execução E-24.

| Regra | Caso | Título | Nível | Teste | TDD | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RN-01 | CT-010 | CHECKs do esquema | integração | `EsquemaIT` | red `9d4d6d9` | verde (E-24) |
| RN-01 | CT-033 | Término posterior ao início | unidade | `PeriodoTest`, `ReservasApiIT` | red `af25ff4` | verde (E-24) |
| RN-01 | CT-039 | Início no passado em trinca | unidade | `PoliticasDeReservaTest`, `ReservasApiIT` | red `af25ff4`, `4a54c35` | verde (E-24) |
| RN-02 | CT-034 | Conflito em trinca | unidade | `PeriodoTest` (teste do modelo: `Periodo.sobrepoe` não é chamado pela produção; a produção é SQL e constraint, coberta por `ReservasApiIT`, `EsquemaIT` e `ConcorrenciaApiIT`) | red `af25ff4` | verde (E-24) |
| RN-02 | CT-035 | Conflito por tipo de recurso | unidade | `ReservasApiIT` | red `af25ff4` | verde (E-24) |
| RN-02 | CT-057 | Professor ocupado | integração | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-02 | CT-061 | Simultâneas para o mesmo professor | concorrência | `ConcorrenciaApiIT` | red `5d570f8` | verde (E-24) |
| RN-03 | CT-007 | Constraint de exclusão impede sobreposição | integração | `EsquemaIT` | red `9d4d6d9` | verde (E-24) |
| RN-03 | CT-009 | Ocupação inativa não conflita | integração | `EsquemaIT` | red `9d4d6d9` | verde (E-24) |
| RN-03 | CT-060 | Solicitações simultâneas para a mesma sala | concorrência | `ConcorrenciaApiIT` | red `5d570f8` | verde (E-24) |
| RN-03 | CT-061 | Simultâneas para o mesmo professor | concorrência | `ConcorrenciaApiIT` | red `5d570f8` | verde (E-24) |
| RN-03 | CT-062 | Estabilidade em repetição | concorrência | `ConcorrenciaApiIT` | red `5d570f8` | verde (E-24) |
| RN-03 | CT-063 | Prova de que o teste protege | concorrência | `ConcorrenciaApiIT` | red `5d570f8` | verde (E-24) |
| RN-04 | CT-029 | Bloqueio cobre o intervalo | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-04 | CT-076 | Bloqueio sem reservas | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-04 | CT-080 | Bordas do bloqueio | unidade | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-04 | CT-081 | Nova reserva em recurso bloqueado | API | `ReservasApiIT` | red `7b4219d` | verde (E-24) |
| RN-05 | CT-075 | Transições proibidas | unidade | `MaquinaDeEstadosTest` | red `7b4219d` | verde (E-24) |
| RN-05 | CT-096 | Um evento por transição | integração | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-06 | CT-066 | Responsável aprova reserva de outro | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-06 | CT-067 | Quem não pode aprovar | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-06 | CT-117 | Matriz perfil × operação | API | `AutorizacaoApiIT` | red `d793879` | verde (E-24) |
| RN-06 | CT-146 | Permissões de decisão da fila (regra pura) | front/regra pura | `PermissoesDeDecisaoTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-06 | CT-148 | Fila de aprovações (T05) | front/regra pura | `Rotas.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.acoes.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.decisao.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-07 | CT-056 | Não existe exclusão de reserva | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-07 | CT-079 | Bloqueio com reserva EM_USO | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-07 | CT-142 | Reservas (T04) | front/regra pura | `Rotas.test.tsx`, `paginas/reservas/PaginaDeReservas.acaoAusente.test.tsx`, `paginas/reservas/PaginaDeReservas.cancelamento.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-07 | CT-144 | Permissões da reserva (regra pura) | front/regra pura | `PermissoesDaReservaTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-07 | CT-145 | Permissões da reserva na API | front/regra pura | `PermissoesDaReservaApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-08 | CT-011 | Auditoria somente inserção | integração | `EsquemaIT` | red `9d4d6d9` | verde (E-24) |
| RN-08 | CT-096 | Um evento por transição | integração | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-08 | CT-097 | Falha ao auditar desfaz a transição | integração | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-08 | CT-155 | Histórico de auditoria com o nome de quem agiu | front/regra pura | `AtorDoHistoricoApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-09 | CT-040 | Reserva sem recurso restrito | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-09 | CT-041 | Reserva com recurso restrito | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-09 | CT-049 | Remoção do último restrito (D12) | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-09 | CT-070 | Fila de aprovações | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-09 | CT-098 | Ator SISTEMA | integração | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-10 | CT-022 | Alterar "restrito" não altera reservas | integração | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-10 | CT-041 | Reserva com recurso restrito | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-10 | CT-042 | Valor do cliente é ignorado | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-10 | CT-048 | Alteração com recurso restrito (D12) | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-11 | CT-007 | Constraint de exclusão impede sobreposição | integração | `EsquemaIT` | red `9d4d6d9` | verde (E-24) |
| RN-11 | CT-008 | Fronteira semiaberta no banco | integração | `EsquemaIT` | red `9d4d6d9` | verde (E-24) |
| RN-11 | CT-028 | Disponibilidade na fronteira | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-11 | CT-034 | Conflito em trinca | unidade | `PeriodoTest` (teste do modelo: `Periodo.sobrepoe` não é chamado pela produção; a produção é SQL e constraint, coberta por `ReservasApiIT`, `EsquemaIT` e `ConcorrenciaApiIT`) | red `af25ff4` | verde (E-24) |
| RN-11 | CT-080 | Bordas do bloqueio | unidade | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-12 | CT-019 | Material exige patrimônio único | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-13 | CT-020 | Professor sem usuário | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-13 | CT-021 | Vínculo não altera perfil | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-13 | CT-058 | Professor vinculado alocado por si | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-14 | CT-017 | Sala exige todos os campos | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-14 | CT-030 | Janela e dia de funcionamento | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-14 | CT-036 | Janela da sala | unidade | `JanelaDeFuncionamentoTest`, `ReservasApiIT` | red `af25ff4` | verde (E-24) |
| RN-14 | CT-037 | Dia sem funcionamento | unidade | `JanelaDeFuncionamentoTest` | red `af25ff4` | verde (E-24) |
| RN-15 | CT-038 | Armazenamento em UTC | integração | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-16 | CT-014 | Dois Responsáveis cadastráveis | API | `UsuariosApiIT` | red `c49f13c` | verde (E-24) |
| RN-16 | CT-015 | Desativação de usuário com restrições | API | `UsuariosApiIT` | red `c49f13c` | verde (E-24) |
| RN-16 | CT-044 | Responsável também reserva | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-16 | CT-066 | Responsável aprova reserva de outro | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-16 | CT-067 | Quem não pode aprovar | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-16 | CT-092 | Responsável dono opera a própria reserva | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-16 | CT-117 | Matriz perfil × operação | API | `AutorizacaoApiIT` | red `d793879` | verde (E-24) |
| RN-16 | CT-146 | Permissões de decisão da fila (regra pura) | front/regra pura | `PermissoesDeDecisaoTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-16 | CT-147 | Permissões de decisão da fila na API | front/regra pura | `PermissoesDaFilaApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-16 | CT-148 | Fila de aprovações (T05) | front/regra pura | `Rotas.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.acoes.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.decisao.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-16 | CT-163 | Responsável aprova recurso restrito (E2E) | E2E | `frontend/e2e/jornadas.spec.ts` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-17 | CT-001 | Login válido abre sessão com um perfil | API | `AutenticacaoApiIT` | red `6a9f4d9` | verde (E-24) |
| RN-17 | CT-012 | Usuário com exatamente um perfil | API | `UsuariosApiIT` | red `c49f13c` | verde (E-24) |
| RN-17 | CT-013 | Só o Administrador gere usuários | API | `UsuariosApiIT` | red `c49f13c` | verde (E-24) |
| RN-17 | CT-043 | Administrador não reserva | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-17 | CT-067 | Quem não pode aprovar | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-17 | CT-083 | Só o Administrador gere bloqueio | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-17 | CT-117 | Matriz perfil × operação | API | `AutorizacaoApiIT` | red `d793879` | verde (E-24) |
| RN-17 | CT-122 | Primeiro Administrador | integração | `PrimeiroAdministradorIT` | red `00127d1` | verde (E-24) |
| RN-17 | CT-132 | Telas e acesso por perfil iguais à matriz | front/regra pura | `Rotas.test.tsx`, `rotas/RotaProtegida.test.tsx`, `rotas/destino.test.ts` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-17 | CT-143 | Alteração de reserva (T03) | front/regra pura | `Rotas.test.tsx`, `paginas/reserva/PaginaDeAlteracao.test.tsx` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-17 | CT-144 | Permissões da reserva (regra pura) | front/regra pura | `PermissoesDaReservaTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-18 | CT-052 | Cancelamento por estado e perfil | unidade | `PoliticasDeReservaTest`, `ReservasApiIT` | red `af25ff4` | verde (E-24) |
| RN-18 | CT-053 | Cancelamento pelo dono em trinca | unidade | `PoliticasDeReservaTest` | red `af25ff4` | verde (E-24) |
| RN-18 | CT-054 | Cancelamento exige motivo de terceiros | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-18 | CT-069 | Quem pode rejeitar | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-18 | CT-142 | Reservas (T04) | front/regra pura | `Rotas.test.tsx`, `paginas/reservas/PaginaDeReservas.acaoAusente.test.tsx`, `paginas/reservas/PaginaDeReservas.cancelamento.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-18 | CT-144 | Permissões da reserva (regra pura) | front/regra pura | `PermissoesDaReservaTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-18 | CT-145 | Permissões da reserva na API | front/regra pura | `PermissoesDaReservaApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-19 | CT-045 | Alteração só de título | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-19 | CT-046 | Alteração de período reaprova | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-19 | CT-047 | Alteração com conflito não muda nada | integração | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-19 | CT-050 | Alteração em EM_USO ou terminal | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-19 | CT-051 | Alteração só pelo dono, até o início | unidade | `PoliticasDeReservaTest` | red `af25ff4` | verde (E-24) |
| RN-19 | CT-143 | Alteração de reserva (T03) | front/regra pura | `Rotas.test.tsx`, `paginas/reserva/PaginaDeAlteracao.test.tsx` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-19 | CT-144 | Permissões da reserva (regra pura) | front/regra pura | `PermissoesDaReservaTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-19 | CT-145 | Permissões da reserva na API | front/regra pura | `PermissoesDaReservaApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-20 | CT-084 | Primeira retirada leva a EM_USO | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-20 | CT-085 | Início de uso sem material | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-20 | CT-086 | Início só em APROVADA | unidade | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-20 | CT-087 | Quem registra o início | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-20 | CT-144 | Permissões da reserva (regra pura) | front/regra pura | `PermissoesDaReservaTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-20 | CT-150 | Permissões de uso da reserva (regra pura) | front/regra pura | `PermissoesDeUsoTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-20 | CT-152 | Permissões de uso da reserva na API | front/regra pura | `PermissoesDeUsoApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-20 | CT-154 | Retirada e devolução (T06) | front/regra pura | `Rotas.test.tsx`, `datas/fuso.test.ts`, `paginas/retiradas/PaginaDeRetiradas.acoes.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-21 | CT-093 | Não compareceu em trinca | unidade | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-21 | CT-094 | Não compareceu em outros estados | unidade | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-21 | CT-150 | Permissões de uso da reserva (regra pura) | front/regra pura | `PermissoesDeUsoTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-21 | CT-152 | Permissões de uso da reserva na API | front/regra pura | `PermissoesDeUsoApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-21 | CT-154 | Retirada e devolução (T06) | front/regra pura | `Rotas.test.tsx`, `datas/fuso.test.ts`, `paginas/retiradas/PaginaDeRetiradas.acoes.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-22 | CT-077 | Bloqueio sobre reservas pede confirmação | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-22 | CT-078 | Confirmação cancela por inteiro | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-22 | CT-079 | Bloqueio com reserva EM_USO | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-22 | CT-082 | Levantar bloqueio | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-22 | CT-124 | Listagem de bloqueios | API | `ListagemDeBloqueiosApiIT` | nasceu verde | verde (E-24) |
| RN-22 | CT-160 | Bloqueios de manutenção (T08) | front/regra pura | `Rotas.test.tsx`, `paginas/bloqueios/PaginaDeBloqueios.criar.test.tsx`, `paginas/bloqueios/PaginaDeBloqueios.lista.test.tsx` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-22 | CT-167 | Servidor recusa sem motivo como o contrato diz | API | `ContratoDeRequisicoesApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-23 | CT-088 | Devolução sem retirada | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-23 | CT-089 | Conclusão com material pendente | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-23 | CT-090 | Conclusão com tudo devolvido | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-23 | CT-091 | Conclusão sem material retirado | API | `UsoMaterialApiIT` | red `9fb060a` | verde (E-24) |
| RN-23 | CT-150 | Permissões de uso da reserva (regra pura) | front/regra pura | `PermissoesDeUsoTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-23 | CT-152 | Permissões de uso da reserva na API | front/regra pura | `PermissoesDeUsoApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-23 | CT-154 | Retirada e devolução (T06) | front/regra pura | `Rotas.test.tsx`, `datas/fuso.test.ts`, `paginas/retiradas/PaginaDeRetiradas.acoes.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-24 | CT-068 | Rejeição exige motivo | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-24 | CT-148 | Fila de aprovações (T05) | front/regra pura | `Rotas.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.acoes.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.decisao.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-25 | CT-071 | Aprovação no instante de início | unidade | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-25 | CT-072 | SEM_DECISAO no instante de início | integração | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-25 | CT-073 | Job idempotente | integração | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-25 | CT-074 | Job não toca reserva APROVADA | integração | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-25 | CT-098 | Ator SISTEMA | integração | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-26 | CT-031 | Disponibilidade sem identificar o dono | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-26 | CT-100 | Visibilidade da auditoria | API | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-26 | CT-113 | Acesso ao relatório | API | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-26 | CT-117 | Matriz perfil × operação | API | `AutorizacaoApiIT` | red `d793879` | verde (E-24) |
| RN-26 | CT-118 | Reserva de outro usuário | API | `AutorizacaoApiIT` | red `d793879` | verde (E-24) |
| RN-26 | CT-125 | Fila com o nome do solicitante | API | `FilaComSolicitanteApiIT` | red `83e7a24` | verde (E-24) |
| RN-26 | CT-142 | Reservas (T04) | front/regra pura | `Rotas.test.tsx`, `paginas/reservas/PaginaDeReservas.acaoAusente.test.tsx`, `paginas/reservas/PaginaDeReservas.cancelamento.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-26 | CT-145 | Permissões da reserva na API | front/regra pura | `PermissoesDaReservaApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-26 | CT-153 | Histórico de movimentações com nome e movimentação atual | front/regra pura | `HistoricoDeMovimentacoesApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-27 | CT-055 | Cancelada continua consultável | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-27 | CT-056 | Não existe exclusão de reserva | API | `ReservasApiIT` | red `4a54c35` | verde (E-24) |
| RN-27 | CT-101 | Histórico de reserva encerrada | API | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-27 | CT-142 | Reservas (T04) | front/regra pura | `Rotas.test.tsx`, `paginas/reservas/PaginaDeReservas.acaoAusente.test.tsx`, `paginas/reservas/PaginaDeReservas.cancelamento.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-28 | INT-01 | Resposta 200 válida | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | INT-02 | Resposta 404 | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | INT-03 | Resposta 500 | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | INT-04 | Resposta mais lenta que o limite | integração | `NotificacaoTempoLimiteApiIT` | red `5462457` | verde (E-24) |
| RN-28 | INT-05 | JSON inválido ou campo ausente | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | CT-102 | Destinatários por evento | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | CT-103 | Corpo mínimo | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | CT-104 | Envio depois do commit | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | CT-105 | Reenvio com a mesma chave | integração | `NotificacaoApiIT` | red `5462457` | verde (E-24) |
| RN-28 | CT-168 | Despacho agendado com só o agendador de notificações ligado (BUG-028) | integração | `AgendamentoDeNotificacoesIT` | red `1aa8939` | verde (CI do PR C, issue 111) |
| RN-29 | CT-005 | Sessão revogada deixa de valer | API | `AutenticacaoApiIT`, `UsuariosApiIT` | red `6a9f4d9`, `c49f13c` | verde (E-24) |
| RN-29 | CT-016 | Auditoria de usuários e perfis | integração | `UsuariosApiIT` | red `c49f13c` | verde (E-24) |
| RN-29 | CT-026 | Auditoria de cadastro | integração | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-29 | CT-099 | Auditoria de cadastros, usuários e bloqueios | integração | `AuditoriaApiIT` | red `4b5551f` | verde (E-24) |
| RN-29 | CT-122 | Primeiro Administrador | integração | `PrimeiroAdministradorIT` | red `00127d1` | verde (E-24) |
| RN-30 | CT-059 | Recusa gera tentativa de conflito | integração | `ReservasApiIT` | ver [evidencia-tdd.md](evidencia-tdd.md) | verde (E-24) |
| RN-30 | CT-065 | Tentativa gravada fora da transação desfeita | integração | `ConcorrenciaApiIT` | red `5d570f8` | verde (E-24) |
| RN-30 | CT-081 | Nova reserva em recurso bloqueado | API | `ReservasApiIT` | red `7b4219d` | verde (E-24) |
| RN-30 | CT-111 | Conflitos evitados | integração | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-31 | CT-107 | Carga horária | integração | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-31 | CT-108 | Estados que contam | integração | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-31 | CT-109 | Parte interna do período | integração | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-31 | CT-110 | Utilização só de salas | integração | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-31 | CT-111 | Conflitos evitados | integração | `RelatorioApiIT` | red `4b3a176` | verde (E-24) |
| RN-31 | CT-157 | Relatórios (T10) | front/regra pura | `Rotas.test.tsx`, `paginas/relatorios/PaginaDeRelatorios.filtros.test.tsx`, `paginas/relatorios/PaginaDeRelatorios.resultado.test.tsx` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-32 | CT-023 | Desativar recurso com reserva futura | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-32 | CT-024 | "Reserva futura" é término posterior ao instante | unidade | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-32 | CT-025 | Desativar recurso sem reserva futura | API | `CatalogoApiIT` | red `24c7364` | verde (E-24) |
| RN-32 | CT-156 | Catálogo de recursos (T07) | front/regra pura | `Rotas.test.tsx`, `paginas/catalogo/PaginaDoCatalogo.admin.test.tsx`, `paginas/catalogo/PaginaDoCatalogo.cadastro.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-33 | CT-069 | Quem pode rejeitar | API | `AprovacaoBloqueioApiIT` | red `7b4219d` | verde (E-24) |
| RN-33 | CT-146 | Permissões de decisão da fila (regra pura) | front/regra pura | `PermissoesDeDecisaoTest` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-33 | CT-147 | Permissões de decisão da fila na API | front/regra pura | `PermissoesDaFilaApiIT` | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |
| RN-33 | CT-148 | Fila de aprovações (T05) | front/regra pura | `Rotas.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.acoes.test.tsx`, `paginas/aprovacoes/PaginaDeAprovacoes.decisao.test.tsx` e outros | Fase 6 (ver [evidencia-tdd.md](evidencia-tdd.md)) | verde (E-24) |

