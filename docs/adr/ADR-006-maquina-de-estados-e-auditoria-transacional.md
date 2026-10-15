# ADR-006. Máquina de estados e auditoria transacional somente inserção

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário) |
| Data | 15/10/2026 |
| Origem | Decisão inicial 4 da equipe; [arquitetura.md](../arquitetura.md), seções 12, 12.1 e 13.2 |
| Decisores | Equipe, com aprovação do usuário. Nomes: TODO |

## Contexto

RN-05 define os estados e RN-08 exige auditoria de toda mudança de estado. RN-29 estende a auditoria a cadastros, usuários, perfis e bloqueios. RN-07 e RN-27 proíbem apagar reserva. O ator pode ser SISTEMA (A1, A7, C2, D2).

## Requisitos e cenários

RF-10, RF-04, RF-07, RF-08, RF-15, RF-16; RN-05, RN-07, RN-08, RN-27, RN-29; RNF-09; CEN-06; R-06, R-07, R-23.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Evento de auditoria assíncrono | Falha no canal deixa transição sem evento, contrariando "toda mudança" (RN-08) |
| Biblioteca de versionamento de entidades | Registra campos, mas não carrega ator SISTEMA, motivo nem os nomes de evento definidos. Não há requisito que a favoreça |
| Regras de estado em `if` espalhados | Transição proibida passaria despercebida; R-06 sem lugar único para testar |

## Decisão

- **Máquina de estados** explícita no domínio. A transição usa guarda condicional: atualiza só se o estado ainda é o esperado.
- **Auditoria** gravada na **mesma transação** da mudança. Falha ao auditar desfaz a transição.
- `auditoria_eventos` é **somente inserção**: um **gatilho** recusa atualização e exclusão, e as permissões de atualização e exclusão são revogadas do papel da aplicação como reforço. *(Aprovado em 15/10/2026.)*
- `correlacao_id` liga eventos da mesma operação, como o bloqueio e os cancelamentos em cascata.

## Fundamentação

| Argumento | Base |
| --- | --- |
| Transição sem evento é proibida | RN-08, RN-29; tática **Audit** (catálogo, seção 4.5.4) |
| Atomicidade entre mudança e registro | Tática **Transactions** e **Rollback** (catálogo, seção 4.1) |
| Gatilho vale também para o dono do esquema, permissão é reforço | RN-08 pede trilha confiável; o gatilho não depende do papel de conexão |
| Guarda condicional evita corrida entre aprovar e cancelar | RN-05, RN-18 |
| Nenhuma exclusão física | RN-27 |

## Consequências

- **Positivas:** trilha completa e à prova de edição comum; um lugar para testar transições.
- **Negativas:** escrita extra por transição; falha de auditoria derruba a operação, aceito por RN-08.

## Riscos

R-23 (papel com privilégio, por exemplo o da migração, altera a trilha). Retenção e dado pessoal: lacuna D9.

## Evidência necessária

- Falha injetada na gravação da auditoria e verificação do desfazer (CEN-06).
- Tentativa de UPDATE e DELETE com cada papel.
- Tabela de transição de estados com as proibidas.

## Condição de revisão

D9 definir retenção que exija arquivamento ou particionamento, ou volume que torne a escrita síncrona inviável.
