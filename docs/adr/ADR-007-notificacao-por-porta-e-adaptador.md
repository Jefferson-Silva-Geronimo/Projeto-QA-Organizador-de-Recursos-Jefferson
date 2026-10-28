# ADR-007. Notificação por porta e adaptador, gravada na transação e enviada depois do commit

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário). A5 decidida pela equipe em 24/10/2026, não validada com o professor (F7-16) |
| Data | 15/10/2026 |
| Origem | Decisão inicial 6 da equipe; A5, C6; [arquitetura.md](../arquitetura.md), seções 12, 12.1 e 13.4 |
| Decisores | Equipe (Jefferson Silva Geronimo, única pessoa do projeto), com aprovação do usuário. |

## Contexto

RF-11 aceita notificação simulada ou integração externa. A5 decidiu um webhook configurável, com WireMock nos testes, e o envio depois do commit. C6 definiu o contrato, a idempotência e o reenvio. A falha do provedor nunca desfaz a reserva (RN-28).

## Requisitos e cenários

RF-11; RN-28; RNF-07, RNF-11, RNF-12; CEN-05, CEN-08, CEN-09; R-10, R-12, R-20.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Chamada ao provedor dentro da transação | Segura conexão e transação durante a chamada e reverte a reserva se o provedor falhar, o que RN-28 proíbe |
| Evento em memória disparado após o commit | Uma queda entre o commit e o envio perde a notificação sem rastro (R-20) |
| Só registro em tabela, sem chamada externa | Atende "simulada" de RF-11, mas A5 decidiu o webhook para exercitar WireMock e a integração isolada exigida na seção "Estratégia obrigatória de qualidade" |

## Decisão

- Porta de notificação no domínio; adaptador de webhook em `infra`. Endereço e token por variável de ambiente.
- A linha de `notificacoes` nasce PENDENTE **na mesma transação** da mudança. O **despachante** envia depois do commit e atualiza o status. O reenvio usa a mesma `chave_idempotencia`.
- O corpo de erro do provedor é descartado; só o status é registrado.
- Tempo limite do envio e valores de reenvio: configuração, **sem valor** (D3 e pergunta 5 da seção 8.5).

## Fundamentação

| Argumento | Base |
| --- | --- |
| A reserva não depende do provedor | RN-28, A5 |
| Nenhuma notificação se perde entre commit e envio | RN-28 (status PENDENTE e reenvio); tática **Retry** idempotente (catálogo, seção 4.1.2) |
| Isolar o provedor facilita troca e teste | CEN-08; **Tailor Interface**, **Use an Intermediary** (catálogo, seções 4.2 e 4.3) |
| WireMock para a integração | Especificação, seção "Estratégia obrigatória de qualidade" |
| Segredo do provedor não atravessa a API | CEN-09, RNF-07 |

## Consequências

- **Positivas:** reserva válida com provedor fora do ar; envio rastreável; teste isolado.
- **Negativas:** tabela e executor de reenvio (compartilha o executor com o job, ADR-012); uma escrita a mais na transação (TO-02).

## Riscos

R-20 (perda, duplicação ou reenvio que nunca executa). S5 (o endpoint de teste basta como API externa) e A5 dependem do professor.

## Evidência necessária

- Matriz WireMock: 200, 404, 500, lentidão e JSON inválido (RN-28).
- Falha injetada entre o commit e o envio, com reenvio posterior.
- Reenvio com a mesma chave não duplica efeito.
- Teste de log sem o segredo do provedor.

## Condição de revisão

O professor exigir provedor real; D3 e D9 definirem valores e retenção.
