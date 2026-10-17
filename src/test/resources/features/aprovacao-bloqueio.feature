# language: pt
Funcionalidade: Aprovação de reservas, estados e bloqueio por manutenção
  Regras RN-04, RN-05, RN-06, RN-11, RN-16, RN-17 e RN-33. Cenários de docs/testes/bdd-aprovacao-bloqueio.md.

  Contexto:
    Dado o usuário "solicitante 1" com perfil SOLICITANTE
    E o usuário "responsável 1" com perfil RESPONSAVEL
    E o usuário "responsável 2" com perfil RESPONSAVEL
    E o usuário "administrador" com perfil ADMINISTRADOR
    E a "Sala A" sem restrição e o "Projetor P-001" restrito

  @BDD-01 @RF-07 @RN-06 @CT-066
  Cenário: Responsável aprova a reserva de outro usuário
    Dado uma reserva SOLICITADA de "solicitante 1" para a "Sala A" e o "Projetor P-001" em 21/10/2026 das 14:00 às 16:00
    Quando "responsável 2" aprova a reserva
    Então a reserva fica APROVADA

  @BDD-02 @RN-06 @RN-16 @CT-067
  Esquema do Cenário: Quem não pode aprovar a reserva
    Dado uma reserva SOLICITADA de "<dono>" para a "Sala A" e o "Projetor P-001" em 21/10/2026 das 14:00 às 16:00
    Quando "<ator>" aprova a reserva
    Então o pedido é recusado com 403 e a reserva permanece SOLICITADA

    Exemplos:
      | dono           | ator           |
      | solicitante 1  | solicitante 1  |
      | solicitante 1  | administrador  |
      | responsável 1  | responsável 1  |

  @BDD-03 @RN-33 @CT-068
  Cenário: Rejeição exige motivo
    Dado uma reserva SOLICITADA de "solicitante 1" para a "Sala A" e o "Projetor P-001" em 21/10/2026 das 14:00 às 16:00
    Quando "responsável 2" rejeita a reserva sem informar o motivo
    Então o pedido é recusado com 400 e o código MOTIVO_OBRIGATORIO

  @BDD-04 @RN-33 @CT-069
  Cenário: O dono Responsável não rejeita a própria reserva
    Dado uma reserva SOLICITADA de "responsável 1" para a "Sala A" e o "Projetor P-001" em 21/10/2026 das 14:00 às 16:00
    Quando "responsável 1" rejeita a reserva com o motivo "Quero desistir"
    Então o pedido é recusado com 403 e a reserva permanece SOLICITADA

  @BDD-05 @RN-04 @CT-081
  Cenário: Recurso em manutenção não pode ser reservado
    Dado um bloqueio da "Sala A" em 21/10/2026 das 08:00 às 12:00
    Quando "solicitante 1" reserva a "Sala A" em 21/10/2026 das 09:00 às 10:00
    Então o pedido é recusado com 409 e o código RECURSO_EM_MANUTENCAO

  @BDD-06 @RN-04 @RN-11 @CT-080
  Esquema do Cenário: Fronteiras do bloqueio
    Dado um bloqueio da "Sala A" em 21/10/2026 das 08:00 às 12:00
    Quando "solicitante 1" reserva a "Sala A" em 21/10/2026 das <inicio> às <fim>
    Então o pedido recebe o status <status>

    Exemplos:
      | inicio   | fim      | status |
      | 07:00    | 08:00    | 201    |
      | 12:00    | 13:00    | 201    |
      | 07:00    | 08:00:01 | 409    |
      | 11:59:59 | 13:00    | 409    |
      | 11:00    | 13:00    | 409    |

  @BDD-07 @RN-17 @RF-08 @CT-083
  Esquema do Cenário: Só o Administrador cria bloqueio
    Quando "<ator>" cria um bloqueio da "Sala A" em 21/10/2026 das 08:00 às 12:00
    Então o pedido é recusado com 403

    Exemplos:
      | ator          |
      | solicitante 1 |
      | responsável 1 |

  @BDD-08 @RN-05 @RF-16 @CT-075
  Cenário: Reserva aprovada não pode ser concluída sem ter sido iniciada
    Dado uma reserva APROVADA de "solicitante 1" para a "Sala A" em 21/10/2026 das 14:00 às 16:00
    Quando "responsável 1" conclui a reserva
    Então o pedido é recusado com 409 e o código TRANSICAO_PROIBIDA, e a reserva permanece APROVADA
