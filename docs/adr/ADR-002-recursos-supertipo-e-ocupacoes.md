# ADR-002. Recursos como supertipo e tabela `ocupacoes`

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário). A3 decidida pela equipe em 24/10/2026, não validada com o professor (F7-16) |
| Data | 15/10/2026 |
| Origem | Decisão inicial 1 da equipe; [modelo-dados.dbml](../prd/modelo-dados.dbml); [arquitetura.md](../arquitetura.md), seção 12 |
| Decisores | Equipe (Jefferson Silva, única pessoa do projeto), com aprovação do usuário. |

## Contexto

RN-02 proíbe sobreposição para sala, material e professor, e RN-04 proíbe reservar recurso em manutenção ([regras-negocio.md](../prd/regras-negocio.md)). Material é unidade identificada (A3) e professor é recurso com vínculo opcional a usuário (A4). A reserva pode ocupar vários recursos (D7).

## Requisitos e cenários

RF-02, RF-03, RF-05, RF-06, RF-08; RN-02, RN-04, RN-11; CEN-01, CEN-03, CEN-07.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Tabelas separadas por tipo, cada uma com a própria agenda | Três garantias idênticas a manter e a testar. A consulta de agenda por reserva com vários recursos precisaria unir três tabelas. Nada se ganha: as três regras são a mesma |
| Ocupação com `origem` e `origem_id` polimórficos | Já descartada na revisão das Fases 0 e 1: não tinha integridade referencial. Foi trocada por `reserva_id` e `bloqueio_id` com CHECK de exatamente uma origem |

## Decisão

`recursos` é o supertipo, com `salas`, `professores` e `materiais` como especializações. Cada ocupação é uma linha de `ocupacoes`, com `recurso_id`, período `tstzrange` e exatamente uma origem entre `reserva_id` e `bloqueio_id`. **Refinamento proposto:** chave composta (`id`, `tipo`) nas especializações, para o banco impedir uma sala apontar para recurso do tipo PROFESSOR, questão registrada no próprio DBML.

## Fundamentação

| Argumento | Base |
| --- | --- |
| Uma única garantia vale para os três tipos | RN-02 e RN-04 (especificação, seção 4 e decisões da equipe) |
| Material por unidade se comporta como sala e professor | A3, RN-12 |
| Reserva e bloqueio disputam o mesmo período | A7, RN-22, RF-08 |
| Cancelar a reserva libera todas as ocupações | D7 |
| Modelo já validado por parser e por esquema aplicado | Revisão das Fases 0 e 1; cabeçalho de [modelo-dados.dbml](../prd/modelo-dados.dbml) |

## Consequências

- **Positivas:** uma constraint e um conjunto de testes; consulta de disponibilidade em uma tabela.
- **Negativas:** a chave composta não é expressa em DBML e exige migração; `ocupacoes.ativa` é derivada do estado e pode divergir (R-18).

## Riscos

A3 contestada pelo professor muda o modelo para controle por quantidade. É a decisão de maior retrabalho. R-18 (divergência de `ativa`).

## Evidência necessária

- Teste de integração por tipo de recurso, com banco real.
- Teste que tenta inserir sala apontando para recurso PROFESSOR e espera falha.
- Teste de cada transição de estado verificando `ativa` na mesma transação.

## Condição de revisão

Resposta do professor sobre A3 diferente da decisão da equipe.
