# ADR-005. Relógio injetável e tempo em UTC

| Campo | Valor |
| --- | --- |
| Status | Proposto, aguardando aceite da equipe |
| Data | 15/10/2026 |
| Origem | Decisões iniciais 3 e 11 da equipe; [arquitetura.md](../arquitetura.md), seções 12 e 13.5 |
| Decisores | Equipe. Nomes: TODO |

## Contexto

Várias regras dependem do instante atual: "até o início" (D10), SEM_DECISAO (RN-25), reserva futura (D11), reserva no passado (D16) e tolerância de não comparecimento (RN-21). Os instantes são gravados em UTC e a janela da sala é em horário local (RN-14, RN-15, A6).

## Requisitos e cenários

RN-01, RN-11, RN-14, RN-15, RN-18, RN-19, RN-25; RNF-11; CEN-07; R-09.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| `Instant.now()` direto nas regras | Não permite testar a trinca de valores limite do instante de início sem espera real nem teste instável |
| Relógio do banco (`now()`) nas regras | Mistura duas fontes de tempo; o teste não controla o instante e a regra fica em SQL |
| Gravar horário local sem conversão | Fronteiras erradas entre ambientes e na virada de horário; contraria RN-15 |

## Decisão

Uma porta de relógio é a **única** fonte de tempo das regras, do agendador e do despachante. Instantes em `timestamptz`, em UTC. A conversão para o fuso configurado (padrão America/Sao_Paulo, A6) ocorre só ao comparar com a janela e os dias de funcionamento da sala. Comparação de instante de início: "instante atual maior ou igual ao início" (D10).

## Fundamentação

| Argumento | Base |
| --- | --- |
| Testar a fronteira sem esperar | CEN-07; táticas **Limit Nondeterminism** e **Abstract Data Sources** (catálogo, seção 4.6) |
| UTC no armazenamento, fuso na borda | RN-15, A6 |
| Instante de início definido | D10, que usa a mesma convenção [início, fim) de A2 |
| Reserva no passado recusada pelo mesmo relógio | D16 |

## Consequências

- **Positivas:** regras de tempo determinísticas e testáveis.
- **Negativas:** o relógio é dependência de todo caso de uso e do job; disciplina para nunca chamar o tempo do sistema direto.

## Riscos

R-09 (erro de fuso, janela ou fronteira). A convenção do dia da semana de `sala_dias_funcionamento` é **proposta do analista, sem requisito**: numeração de segunda a domingo da API de datas do Java.

## Evidência necessária

- Trinca de valores limite com relógio controlado em RN-18, RN-19, RN-25, D16.
- Teste de janela na borda e de virada de dia.
- Teste de arquitetura proibindo chamada direta ao tempo do sistema fora do adaptador do relógio.

## Condição de revisão

Fuso configurado com transição de horário que gere ambiguidade nos testes, ou mudança de S3 (reserva que cruza a meia-noite).
