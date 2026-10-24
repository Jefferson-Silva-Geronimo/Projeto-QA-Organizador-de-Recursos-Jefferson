# Registro das decisões sobre os pontos em aberto da especificação

Este arquivo guardava a mensagem consolidada ao professor. Em **24/10/2026** Jefferson decidiu que as 18 perguntas viram
**decisões da equipe, não validadas com o professor**, com o impacto já declarado. **A mensagem deixou de existir e nada é
enviado a ninguém.** O nome do arquivo foi mantido para não quebrar links. Cada decisão tem o teste que a isola (ou a
lacuna, quando não há teste) em [decisoes-equipe.md](decisoes-equipe.md), bloco **F7-16**; a interpretação de que, para a
seção 10 da especificação, a validação é da equipe está em **F7-17** e **não é validação externa**. Os textos de origem estão
em [perguntas-abertas.md](prd/perguntas-abertas.md).

## Lacunas da seção 10 da especificação (itens 1 a 8)

Decisão da equipe (Jefferson), 24/10/2026, não validada com o professor.

| # | Ponto em aberto | Decisão da equipe | Impacto se estiver errada | Registro |
| --- | --- | --- | --- | --- |
| 1 (A1) | O que torna um recurso "restrito"? | Atributo `restrito` do recurso, definido pelo Administrador; reserva sem recurso restrito é aprovada automaticamente (ator SISTEMA) | O fluxo de aprovação (RF-07) e a aprovação automática mudam; o ator SISTEMA pode deixar de existir | F7-16-01 |
| 2 (A2) | Uma reserva que termina às 10h conflita com outra que começa às 10h? | Não: períodos semiabertos [início, fim). Os testes de fronteira usam esta regra, inclusive a diferença de um segundo | Troca a fórmula de sobreposição na constraint, em `Periodo.sobrepoe` e nos testes de fronteira | F7-16-02 |
| 3 (A3) | Material é controlado por unidade identificada ou por quantidade? | Unidade identificada, com código de patrimônio; cada unidade é um recurso | **Maior retrabalho:** o controle por quantidade muda o modelo de dados e a proteção contra dupla reserva dos materiais | F7-16-03 |
| 4 (A4) | O professor também é usuário do sistema? | Professor é recurso; o vínculo com um usuário é opcional e não concede perfil | O cadastro de professores e a regra de agenda própria mudam | F7-16-04 |
| 5 (A5) | Notificação simulada ou API externa? | Interface com adaptador HTTP de webhook; na demonstração, um endpoint de teste; nos testes, WireMock | Pode ser exigido provedor real, com credenciais e contrato | F7-16-05 |
| 6 (A6) | Qual o fuso e existe janela de funcionamento? | America/Sao_Paulo, armazenado em UTC; janela por sala; sem reserva que cruze a meia-noite local | Eventos noturnos ficam impossíveis de reservar e a regra de janela precisa ser revista | F7-16-06 |
| 7 (A7) | O que ocorre com reservas existentes quando se bloqueia o recurso? | 409 com a lista; o Administrador confirma e o sistema cancela SOLICITADA e APROVADA; EM_USO impede o bloqueio | O fluxo de bloqueio (RF-08) e as notificações de cancelamento mudam | F7-16-07 |
| 8 (A8) | Quem cancela em cada estado e qual a janela de não comparecimento? | Matriz por estado e perfil, sem antecedência mínima; o Responsável marca não comparecimento após o início mais uma tolerância configurável | Mudam as regras de cancelamento (RN-18) e de não comparecimento (RN-21) | F7-16-08 |

## Valores que a especificação não define (D1, D3, D4, D9, D17)

Nenhum valor foi inventado. Cada um é configuração, sem valor padrão no código, e os testes usam um valor de teste
marcado como tal. Decisão da equipe (Jefferson), 24/10/2026, não validada com o professor.

| ID | Ponto em aberto | Decisão da equipe | Impacto se estiver errada | Registro |
| --- | --- | --- | --- | --- |
| D1 | Qual a tolerância para marcar "não compareceu"? | Sem valor padrão: enquanto não configurada, a marcação é recusada com `TOLERANCIA_NAO_CONFIGURADA`. Os testes usam 30 minutos, só em teste | Reservas não usadas ocupam o recurso por mais tempo, ou são marcadas cedo demais | F7-16-09 |
| D3 | Quantas tentativas e qual intervalo no reenvio de notificação? | Sem valor padrão: `tentativas_reenvio` e `intervalo_reenvio_inicial` nulos. Os testes usam 3 tentativas e 1 minuto, só em teste | Notificações perdidas ou carga sobre o provedor | F7-16-10 |
| D4 | Qual o tamanho da página do relatório de utilização? | No servidor, o tamanho é parâmetro obrigatório do pedido. No front, 20, por decisão da equipe | Relatório lento ou incômodo de navegar | F7-16-11 |
| D9 | Qual a retenção da auditoria e das notificações e como tratar dado pessoal nelas? | Nada é apagado nem anonimizado: não há expurgo implementado. **Risco de privacidade declarado** | Dado pessoal guardado além do necessário; exigiria rotina de expurgo e revisão da auditoria somente inserção | F7-16-12 |
| D17 | Qual a duração e a expiração da sessão? | Sem valor padrão: `SESSAO_DURACAO` é definida na implantação; o `PT30M` do README é só exemplo; os testes usam 1 hora, só em teste | Sessão que nunca expira, ou que expira cedo demais para o uso | F7-16-13 |

## Revisão por pares

Decisão da equipe (Jefferson), 24/10/2026, **não validada com o professor e declarada como limitação do entregável**.

| Ponto em aberto | Decisão da equipe | Impacto se estiver errada | Registro |
| --- | --- | --- | --- |
| A especificação pede "repositório com histórico de trabalho e revisão por pares". Uma equipe de uma pessoa atende a essa exigência? | Não há par humano. Cada pull request recebe revisão crítica assistida por ferramenta, registrada como comentário e identificada como tal ("revisão assistida", nunca "revisão por pares"); a `main` exige pull request e checks obrigatórios, com zero aprovações | Se for exigida revisão por outra pessoa, será necessário um revisor externo nos pull requests abertos | F7-16-14 |

## Precisão de segundos

| Ponto em aberto | Decisão da equipe | Impacto se estiver errada | Registro |
| --- | --- | --- | --- |
| Reservas e bloqueios aceitam precisão de segundos? | Sim: o período usa `Instant` sem arredondamento, e os cenários de fronteira incluem a diferença de um segundo | Se a granularidade mínima for o minuto, as duas linhas de um segundo em `bdd-aprovacao-bloqueio.md` mudam e a API passa a recusar segundos | F7-16-15 |

## Rejeição depois do início da reserva

| Ponto em aberto | Decisão da equipe | Impacto se estiver errada | Registro |
| --- | --- | --- | --- |
| O Responsável pode rejeitar uma reserva SOLICITADA depois do horário de início? A aprovação já para no início (D2 e D10), mas a especificação não diz nada sobre a rejeição | Sim, sem limite de horário: o `AprovacaoService` já funciona assim e a fila (F6-15) devolve `podeRejeitar` verdadeiro mesmo depois do início | Se a rejeição também parar no início, o servidor precisa recusá-la (código de erro a definir) e `podeRejeitar` passa a ser falso no início e depois; os testes CT-146 e CT-147 mudam | F7-16-16 |

## Início do uso antes do horário da reserva

| Ponto em aberto | Decisão da equipe | Impacto se estiver errada | Registro |
| --- | --- | --- | --- |
| O Responsável pode registrar o início do uso (ou a primeira retirada de material) antes do horário de início da reserva APROVADA? RN-20 não fala de horário | Sim, sem limite de horário: o `UsoService` só confere o estado e a resposta da reserva (F6-16) devolve `podeIniciar` verdadeiro em reserva APROVADA mesmo antes do início | Se o início só valer a partir do horário, o servidor precisa recusá-lo (código de erro a definir) e `podeIniciar` passa a ser falso antes dele; os testes CT-150 e CT-152 mudam | F7-16-17 |

## Troca de perfil de um Responsável e mínimo de Responsáveis (D14)

Decisão da equipe (Jefferson), 24/10/2026, não validada com o professor. **Esta é uma brecha funcional conhecida.**

| Ponto em aberto | Decisão da equipe | Risco declarado | Registro |
| --- | --- | --- | --- |
| Trocar o perfil de um Responsável também deve ser recusado quando deixar menos de dois Responsáveis ativos? A D14 só fala da desativação | Não: o servidor só aplica o mínimo na desativação, e a tela de Usuários (T11) mostra qualquer recusa que o servidor devolver | O Administrador pode deixar o sistema com um só Responsável, e então reserva de Responsável em recurso restrito nunca é aprovada (B1). Se a equipe mudar a decisão, o servidor passa a recusar com `MINIMO_DE_RESPONSAVEIS` (a mensagem e a ação já estão na tabela de erros e a T11 já as mostra). Nenhum teste afirma que a troca não é recusada; só a rodada manual E-19 viu | F7-16-18 |
