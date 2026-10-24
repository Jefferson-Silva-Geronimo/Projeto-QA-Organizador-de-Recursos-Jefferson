# Cenários BDD: aprovação, estados e bloqueio por manutenção

Fatia 4.5 (RF-07, RF-08, RF-16; RN-04, RN-05, RN-06, RN-11, RN-16, RN-33). Cada cenário tem um único Quando e um
Então observável. As regras vêm de [regras-negocio.md](../prd/regras-negocio.md); nenhuma regra nova foi inventada.
A versão executável, com as mesmas palavras, está em
[aprovacao-bloqueio.feature](../../src/test/resources/features/aprovacao-bloqueio.feature).

## Contexto comum

Usuários: Solicitante 1 e 2 (SOLICITANTE), Responsável 1 e 2 (RESPONSAVEL), Administrador (ADMINISTRADOR). Recursos:
Sala A (sem restrição, 07:00 às 22:00, segunda a sexta) e Projetor P-001 (restrito). O relógio do teste marca
20/10/2026, 14:00 em America/Sao_Paulo; as datas dos cenários são posteriores.

## Cenários

| ID | Regra | Caso de teste | Dado | Quando | Então | Nível |
| --- | --- | --- | --- | --- | --- | --- |
| BDD-01 | RN-06, RF-07 | CT-066 | Reserva SOLICITADA do Solicitante 1 com Sala A e Projetor P-001 em 21/10/2026, 14:00 às 16:00 | O Responsável 2 aprova a reserva | A reserva fica APROVADA | API |
| BDD-02 | RN-06, RN-16 | CT-067 | Reserva SOLICITADA do dono indicado em cada exemplo | O ator do exemplo aprova a reserva | Pedido recusado com 403 e a reserva permanece SOLICITADA | API |
| BDD-03 | RN-33 | CT-068 | Reserva SOLICITADA do Solicitante 1 | O Responsável 2 rejeita sem informar o motivo | Pedido recusado com 400 e código MOTIVO_OBRIGATORIO | API |
| BDD-04 | RN-33 | CT-069 | Reserva SOLICITADA do Responsável 1 | O Responsável 1 rejeita a própria reserva com motivo | Pedido recusado com 403 e a reserva permanece SOLICITADA | API |
| BDD-05 | RN-04 | CT-081 | Bloqueio da Sala A em 21/10/2026, 08:00 às 12:00 | O Solicitante 1 reserva a Sala A em 21/10/2026, 09:00 às 10:00 | Pedido recusado com 409 e código RECURSO_EM_MANUTENCAO | API |
| BDD-06 | RN-04, RN-11 | CT-080 | Bloqueio da Sala A em 21/10/2026, 08:00 às 12:00 | O Solicitante 1 reserva a Sala A no intervalo do exemplo | O pedido recebe o status do exemplo | API |
| BDD-07 | RN-17, RF-08 | CT-083 | Nenhum bloqueio | O ator do exemplo cria um bloqueio da Sala A | Pedido recusado com 403 | API |
| BDD-08 | RN-05, RF-16 | CT-075 | Reserva APROVADA do Solicitante 1 com a Sala A | O Responsável 1 conclui a reserva sem tê-la iniciado | Pedido recusado com 409 e código TRANSICAO_PROIBIDA, e a reserva permanece APROVADA | API |

### Tabela de exemplos de BDD-06 (fronteiras do bloqueio 08:00 às 12:00, período semiaberto [início, fim), RN-11)

| Reserva | Posição em relação ao bloqueio | Status esperado |
| --- | --- | --- |
| 07:00 às 08:00 | termina exatamente no início do bloqueio | 201 |
| 12:00 às 13:00 | começa exatamente no fim do bloqueio | 201 |
| 07:00 às 08:00:01 | cruza o início por um segundo | 409 |
| 11:59:59 às 13:00 | cruza o fim por um segundo | 409 |
| 11:00 às 13:00 | cruza o fim | 409 |

As duas primeiras linhas e a última são os valores de CT-080 (a coluna "12:00 às 14:00" de CT-080 foi trocada por
"12:00 às 13:00", que prova a mesma fronteira). As linhas de um segundo não estavam em CT-080; vêm do pedido de
fronteira "cruza por um segundo" do [plano de projeto](../plano-de-projeto.md) (Prompt 4.E).

### Tabela de exemplos de BDD-02 e BDD-07

| Cenário | Dono ou ator | Resultado |
| --- | --- | --- |
| BDD-02 | Dono Solicitante 1, ator Solicitante 1 | 403 |
| BDD-02 | Dono Solicitante 1, ator Administrador | 403 |
| BDD-02 | Dono Responsável 1, ator Responsável 1 | 403 |
| BDD-07 | Ator Solicitante 1 | 403 |
| BDD-07 | Ator Responsável 1 | 403 |

## O que vira teste de unidade e o que vira teste de API

| Cenário | Unidade | API (Cucumber, este documento) |
| --- | --- | --- |
| BDD-01 a BDD-04 | Política de aprovação em `PoliticasDeReservaTest` | Sim |
| BDD-05 e BDD-06 | `Periodo.sobrepoe` em `PeriodoTest` (CT-034, CT-080) | Sim, contra a constraint do banco |
| BDD-07 | Não há regra em unidade; autorização é do controller | Sim |
| BDD-08 | `MaquinaDeEstadosTest` (CT-075) | Sim |

## Perguntas em aberto

Nenhuma fronteira ficou sem regra neste conjunto: RN-11 define o período semiaberto e CT-080 fixa os valores.
A granularidade em segundos é uma **suposição**: o período usa `Instant` sem arredondamento, portanto um segundo
conta. Se o professor definir granularidade mínima de minuto, as duas linhas de um segundo mudam para o
valor definido. A decisão da equipe (24/10/2026) consta em [perguntas-professor.md](../perguntas-professor.md).
