# Mensagem consolidada ao professor

Uma única mensagem, pronta para envio. Cada pergunta traz a suposição que o projeto adotou enquanto espera a
resposta e o impacto se a suposição estiver errada. O projeto não está bloqueado por nenhuma delas. Os textos de
origem estão em [perguntas-abertas.md](prd/perguntas-abertas.md); o registro de quem aceitou o quê está em
[decisoes-equipe.md](decisoes-equipe.md).

---

**Assunto:** Projeto Organização de Recursos: perguntas sobre pontos em aberto da especificação

Professor, o back end está implementado e testado. Para fechar alguns pontos que a especificação deixa abertos,
adotamos suposições e gostaríamos de confirmá-las. Em cada item abaixo está o que adotamos e o que muda se a
resposta for outra.

## Lacunas da seção 10 da especificação (itens 1 a 8)

| # | Pergunta | Suposição adotada | Impacto se estiver errada |
| --- | --- | --- | --- |
| 1 (A1) | O que torna um recurso "restrito"? | Atributo `restrito` do recurso, definido pelo Administrador; reserva sem recurso restrito é aprovada automaticamente (ator SISTEMA) | O fluxo de aprovação (RF-07) e a aprovação automática mudam; o ator SISTEMA pode deixar de existir |
| 2 (A2) | Uma reserva que termina às 10h conflita com outra que começa às 10h? | Não: períodos semiabertos [início, fim). Os testes de fronteira usam esta regra, inclusive a diferença de um segundo | Troca a fórmula de sobreposição na constraint, em `Periodo.sobrepoe` e nos testes de fronteira |
| 3 (A3) | Material é controlado por unidade identificada ou por quantidade? | Unidade identificada, com código de patrimônio; cada unidade é um recurso | **Maior retrabalho:** o controle por quantidade muda o modelo de dados e a proteção contra dupla reserva dos materiais |
| 4 (A4) | O professor também é usuário do sistema? | Professor é recurso; o vínculo com um usuário é opcional e não concede perfil | O cadastro de professores e a regra de agenda própria mudam |
| 5 (A5) | Notificação simulada ou API externa? | Interface com adaptador HTTP de webhook; na demonstração, um endpoint de teste; nos testes, WireMock | Pode ser exigido provedor real, com credenciais e contrato |
| 6 (A6) | Qual o fuso e existe janela de funcionamento? | America/Sao_Paulo, armazenado em UTC; janela por sala; sem reserva que cruze a meia-noite local | Eventos noturnos ficam impossíveis de reservar e a regra de janela precisa ser revista |
| 7 (A7) | O que ocorre com reservas existentes quando se bloqueia o recurso? | 409 com a lista; o Administrador confirma e o sistema cancela SOLICITADA e APROVADA; EM_USO impede o bloqueio | O fluxo de bloqueio (RF-08) e as notificações de cancelamento mudam |
| 8 (A8) | Quem cancela em cada estado e qual a janela de não comparecimento? | Matriz por estado e perfil, sem antecedência mínima; o Responsável marca não comparecimento após o início mais uma tolerância configurável | Mudam as regras de cancelamento (RN-18) e de não comparecimento (RN-21) |

## Valores que a especificação não define (D1, D3, D4, D9, D17)

Nenhum valor foi inventado. Cada um é configuração, sem valor padrão no código, e os testes usam um valor de teste
marcado como tal.

| ID | Pergunta | Suposição adotada | Impacto se estiver errada |
| --- | --- | --- | --- |
| D1 | Qual a tolerância para marcar "não compareceu"? | Sem valor padrão: enquanto não configurada, a marcação é recusada com `TOLERANCIA_NAO_CONFIGURADA`. Os testes usam 30 minutos, só em teste | Reservas não usadas ocupam o recurso por mais tempo, ou são marcadas cedo demais |
| D3 | Quantas tentativas e qual intervalo no reenvio de notificação? | Sem valor padrão: `tentativas_reenvio` e `intervalo_reenvio_inicial` nulos. Os testes usam 3 tentativas e 1 minuto, só em teste | Notificações perdidas ou carga sobre o provedor |
| D4 | Qual o tamanho da página do relatório de utilização? | Sem valor padrão: o tamanho é parâmetro obrigatório do pedido | Relatório lento ou incômodo de navegar |
| D9 | Qual a retenção da auditoria e das notificações e como tratar dado pessoal nelas? | Nada é apagado nem anonimizado: não há expurgo implementado | Dado pessoal guardado além do necessário; exigiria rotina de expurgo e revisão da auditoria somente inserção |
| D17 | Qual a duração e a expiração da sessão? | Sem valor padrão: a duração é variável de ambiente obrigatória; os testes usam 1 hora, só em teste | Sessão que nunca expira, ou que expira cedo demais para o uso |
| D18 | Quantas tentativas de login erradas e em qual janela bloqueiam uma conta? | Limite por conta em janela deslizante; `LOGIN_TENTATIVAS` e `LOGIN_JANELA` obrigatórios e sem valor padrão; os testes usam 5 tentativas em 10 minutos, só em teste | Conta de usuário legítimo bloqueada cedo demais, ou ataque de adivinhação de senha com janela folgada demais |

## Revisão por pares

| Pergunta | Suposição adotada | Impacto se estiver errada |
| --- | --- | --- |
| A especificação pede "repositório com histórico de trabalho e revisão por pares". Uma equipe de uma pessoa atende a essa exigência? | Não há par humano. Cada pull request recebe revisão crítica assistida por ferramenta, registrada como comentário e identificada como tal; a `main` exige pull request e check obrigatório, com zero aprovações | Se for exigida revisão por outra pessoa, será necessário um revisor externo (por exemplo, o próprio professor ou um colega) nos pull requests abertos |

## Pergunta adicional

| Pergunta | Suposição adotada | Impacto se estiver errada |
| --- | --- | --- |
| Reservas e bloqueios aceitam precisão de segundos? | Sim: o período usa `Instant` sem arredondamento, e os cenários de fronteira incluem a diferença de um segundo | Se a granularidade mínima for o minuto, as duas linhas de um segundo em `bdd-aprovacao-bloqueio.md` mudam e a API passa a recusar segundos |

Obrigado.
