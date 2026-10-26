# ADR-009. Migrações versionadas e PostgreSQL real nos testes

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário) |
| Data | 15/10/2026 |
| Origem | Decisão inicial 8 da equipe; [arquitetura.md](../arquitetura.md), seção 12 |
| Decisores | Equipe (Jefferson Silva, única pessoa do projeto), com aprovação do usuário. |

## Contexto

A constraint de exclusão, a extensão `btree_gist`, o gatilho de auditoria e os CHECKs entre tabelas não são expressos em DBML e "serão criados por migração" ([modelo-dados.dbml](../prd/modelo-dados.dbml)). A especificação exige banco containerizado com Testcontainers e permite mocks só em teste unitário isolado (seção 5).

## Requisitos e cenários

RF-06; RN-03; RNF-05; CEN-01; TR-03 em [ciclo-00.md](../avaliacao-arquitetural/ciclo-00.md).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Banco em memória (H2) | Não representa `tstzrange` nem a constraint de exclusão; o teste passaria sem provar RN-03. Contraria a seção 5 |
| Geração automática do esquema pelo ORM | Não cria constraint de exclusão, gatilho nem CHECK entre tabelas |
| Outra ferramenta de migração (Liquibase) | Equivalente para este uso. **Não há requisito que distinga as duas**; a escolha é registrada como sem requisito |

## Decisão

Flyway aplica as migrações em produção e em teste. Os testes de persistência e de concorrência usam PostgreSQL real em container com Testcontainers. A geração automática do esquema fica desligada ou só valida.

## Fundamentação

| Argumento | Base |
| --- | --- |
| Persistência e integrações críticas em ambiente real | Especificação, seção "Estratégia obrigatória de qualidade" |
| A garantia de RN-03 só existe no PostgreSQL | Nota de `ocupacoes` em [modelo-dados.dbml](../prd/modelo-dados.dbml); RN-03 |
| Esquema versionado e reproduzível | Tática **Sandbox** (catálogo, seção 4.6.1) |

## Consequências

- **Positivas:** o teste exercita a mesma constraint da produção.
- **Negativas:** o build depende de Docker; testes mais lentos que em memória.

## Riscos

Falha do ambiente containerizado impede toda a evidência (TR-03). A Fase 3 precisa confirmar que o pipeline roda containers.

## Evidência necessária

- Pipeline com container de banco subindo e migrações aplicadas do zero.
- Teste que verifica a existência da constraint e do gatilho.

## Condição de revisão

O ambiente de integração contínua não suportar containers.
