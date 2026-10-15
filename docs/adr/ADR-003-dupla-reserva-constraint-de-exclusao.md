# ADR-003. Dupla reserva barrada por constraint de exclusão

| Campo | Valor |
| --- | --- |
| Status | Proposto. A decisão sobre a tentativa de conflito foi aprovada em 15/10/2026 |
| Data | 15/10/2026 |
| Origem | Decisão inicial 2 da equipe; [arquitetura.md](../arquitetura.md), seções 12 e 13.1 |
| Decisores | Equipe. Nomes: TODO |

## Contexto

"Possibilidade de dupla reserva" é limitador de nota (especificação, seção 8) e a seção 5 exige teste automatizado de concorrência com banco real. RN-03 exige uma única reserva aceita entre solicitações simultâneas. A fronteira é semiaberta [início, fim) (A2, RN-11). Reserva e bloqueio disputam o mesmo período (RN-04, RN-22).

## Requisitos e cenários

RF-05, RF-06, RF-08; RN-02, RN-03, RN-04, RN-11, RN-30; CEN-01, CEN-03, CEN-07; RNF-05.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Lock pessimista por recurso | Funciona, mas serializa todas as reservas do recurso, mesmo de períodos distintos. Depende de todo caminho de escrita (API, job, bloqueio) lembrar de travar: um caminho sem lock quebra RN-03 sem erro visível |
| Controle de versão otimista | A reserva ainda não existe, então não há linha a versionar. Versionar a linha do recurso serializa do mesmo modo e transfere o conflito para repetição de tentativa |
| Fila por recurso | Exige infraestrutura nova sem requisito que a peça e adiciona um ponto de falha |
| Verificação só em código, antes de gravar | Há janela de corrida entre a leitura e a gravação. Não prova RN-03 em teste de concorrência |

## Decisão

Constraint de exclusão no PostgreSQL: `EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)` em `ocupacoes`, com a extensão `btree_gist`.

- A violação é traduzida em 409 com código estável. O recurso em conflito é identificado por consulta **depois** do desfazer.
- Em reserva com vários recursos, as ocupações são inseridas ordenadas por `recurso_id`. Impasse detectado pelo banco é tratado como conflito, sem repetição automática.
- A verificação prévia em código existe só para mensagem clara; **a garantia é a constraint**.
- **Decisão aprovada em 15/10/2026:** a tentativa de conflito (RN-30) é gravada em transação separada, depois do desfazer. Se essa gravação falhar, o 409 é mantido e a perda vai para o log.

## Fundamentação

| Argumento | Base |
| --- | --- |
| A garantia vale para qualquer caminho de escrita, inclusive job e bloqueio | RN-03, RN-04; tática **Transactions** (catálogo, seção 4.1.4) |
| Teste de concorrência com banco real é exigido | Especificação, seção 5; RNF-05 |
| A mesma garantia cobre a fronteira [início, fim) | A2, RN-11; operador `&&` sobre `tstzrange` com limites `[)` (nota de `ocupacoes` em [modelo-dados.dbml](../prd/modelo-dados.dbml)) |
| Tentativa de conflito não pode ser gravada na transação que é desfeita | RN-30 e RN-03: a transação da reserva recusada termina em desfazer |
| O índice da constraint serve à consulta de disponibilidade | Nota de `ocupacoes` em [modelo-dados.dbml](../prd/modelo-dados.dbml); RF-03 |

## Consequências

- **Positivas:** integridade provada no banco, independente do código da aplicação.
- **Negativas:** latência sob contenção (TO-01); tradução de erro necessária; a tentativa de conflito pode se perder (R-19, risco aceito por decisão de 15/10/2026).

## Riscos

R-17 (impasse em reserva com vários recursos), R-18 (divergência de `ativa`), R-19.

## Evidência necessária

- Teste de concorrência com Testcontainers, repetido (CEN-01). Quantidade de solicitações e de repetições: **hipótese**, validação pendente.
- Teste de reserva com sala e projetor em ordens opostas.
- Trinca de valores limite com relógio controlado (CEN-07).
- Relatório JMeter comparando latência com e sem contenção (CEN-04, hipótese).

## Condição de revisão

Medição mostrar a constraint como causa de violação do p95 acordado, ou resposta de A3 mudar o controle de material.
