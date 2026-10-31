# ADR-012. Job agendado, idempotente e com trava para SEM_DECISAO

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário). S6 e D1 seguem a validar |
| Data | 15/10/2026 |
| Origem | Decisão D2; [perguntas-abertas.md](../prd/perguntas-abertas.md); [arquitetura.md](../arquitetura.md), seção 13.7 |
| Decisores | Equipe (Jefferson Silva Geronimo, única pessoa do projeto), com aprovação do usuário. |

## Contexto

RN-25 manda cancelar, pelo sistema, a reserva SOLICITADA cujo início chega sem decisão, com auditoria e notificação (C2, suposição S6). A8 manda o Responsável marcar o não compareceu e declara opcional o job automático. A tolerância (D1) ainda não tem valor. O reenvio de notificações (ADR-007) já exige um executor periódico.

## Requisitos e cenários

RF-07, RF-16; RN-21, RN-24, RN-25; CEN-06; R-22; PS-03.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Avaliação sob demanda | O evento de auditoria e a notificação dependem de alguém consultar a reserva. O instante auditado diverge do instante da regra |
| Job para SEM_DECISAO e para não compareceu | Automatiza uma regra cuja tolerância não tem valor (D1) e que A8 deixa ao Responsável |
| Marcação manual também para SEM_DECISAO | Não cobre RN-25, que define a ação como do sistema |

## Decisão

- Job agendado **apenas para SEM_DECISAO**, com ator SISTEMA. Atualização condicional ao estado SOLICITADA e ao início alcançado; auditoria e notificação PENDENTE na mesma transação.
- **Idempotente:** repetir a execução não gera segundo evento.
- **Com trava** contra execução simultânea em mais de uma instância. A técnica de trava é escolhida na Fase 4, com prova de conceito.
- A aprovação de reserva cujo início já foi alcançado é recusada com 409, pelo mesmo relógio (ADR-005).
- O não comparecimento continua manual (A8). Frequência do job: configuração, **sem valor**.

## Fundamentação

| Argumento | Base |
| --- | --- |
| A regra é ação do sistema, com auditoria e notificação | RN-25, RN-08 |
| Executor já existe para o reenvio | C6, ADR-007 |
| Não automatizar o que não tem valor | A8 (job opcional), D1 |
| Ninguém aprova no intervalo até a próxima execução | D10, D2 |
| Idempotência e trava | Tática **Retry** idempotente e **Transactions** (catálogo, seção 4.1) |

## Consequências

- **Positivas:** regra cumprida no instante certo e com rastro; sem automação especulativa.
- **Negativas:** componente periódico a operar; uma reserva vencida fica SOLICITADA até a próxima execução (PS-03).

## Riscos

R-22 (execução em mais de uma instância sem trava eficaz). S6 pode ser invalidada pelo professor.

## Evidência necessária

- Relógio controlado: duas execuções seguidas geram um único evento.
- Duas execuções simultâneas geram um único evento.
- Reserva APROVADA não é cancelada.
- Aprovação no instante de início é recusada.

## Condição de revisão

O professor invalidar S6, ou exigir não comparecimento automático depois que D1 tiver valor.

## Nota de 31/10/2026 (BUG-028)

O job de SEM_DECISAO e o despacho de notificações são agendadores **independentes**, cada um ligado pela sua propriedade `app.jobs.*` e desligado por padrão. Até a versão anterior, `@EnableScheduling` ficava no agendador do SEM_DECISAO, e por isso o despacho de notificações só era agendado quando o SEM_DECISAO também estava ligado ([#111](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/111)); a `v1.0.0-rc4` move a anotação para `AgendamentoConfig`. O texto da decisão acima não foi alterado.
