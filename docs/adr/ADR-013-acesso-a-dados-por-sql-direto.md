# ADR-013. Acesso a dados por SQL direto parametrizado (Spring JDBC)

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026, por decisão do analista dentro da delegação do usuário; a equipe pode revisar |
| Data | 15/10/2026 |
| Origem | Pergunta em aberto de [arquitetura.md](../arquitetura.md), seções 14 e 15 ("acesso a dados") |
| Decisores | Equipe, com delegação do usuário. Nomes: TODO |

## Contexto

A arquitetura deixou em aberto a escolha entre mapeamento objeto-relacional e SQL direto, com o critério "suporte a `tstzrange`, a SQL nativo e a teste com banco real" e a pendência de uma prova de conceito. A casca da Fase 3 trouxe `spring-boot-starter-data-jpa` por herança da lista do Initializr, sem nenhuma entidade.

O esquema depende de recursos que o PostgreSQL expõe e que um mapeamento objeto-relacional não representa bem: período `tstzrange`, constraint de exclusão com `btree_gist`, gatilho de auditoria, tipos enumerados, `INSERT ... RETURNING` e consultas agregadas do relatório (RF-12).

## Requisitos e cenários

RF-03, RF-06, RF-12; RN-02, RN-03, RN-11, RN-31; RNF-05, RNF-07; CEN-01, CEN-07; ADR-002, ADR-003, ADR-009.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Spring Data JPA com Hibernate | Exige tipo customizado para `tstzrange` e SQL nativo para a constraint, o período e o relatório. As entidades gerenciadas escondem quando a escrita ocorre, o que atrapalha a ordem de inserção por `recurso_id` (ADR-003) e a transação separada da tentativa de conflito. O ganho de mapeamento é pequeno: o domínio não usa entidades gerenciadas (ADR-001) |
| JPA para cadastros e SQL para reservas | Duas formas de acessar o mesmo banco, com regras de transação e de cache diferentes. Sem requisito que pague a complexidade |

## Decisão

Repositórios (pacote `repository`; no texto original, `infra`) usam `JdbcClient` do Spring, com SQL parametrizado e nomeado. Nenhuma concatenação de texto em consulta (ADR-008). Os tipos enumerados são convertidos por `CAST` explícito. O domínio continua sem dependência de Spring ou de persistência.

O starter de JPA é **removido** da casca e o `spring-boot-starter-jdbc` é adicionado. A regra do ArchUnit que proíbe `jakarta.persistence` e `org.hibernate` no domínio permanece, porque continua valendo como proteção.

## Fundamentação

| Argumento | Base |
| --- | --- |
| `tstzrange`, `EXCLUDE` e gatilho são recursos do banco, usados diretamente | [modelo-dados.dbml](../prd/modelo-dados.dbml); ADR-003, ADR-006 |
| A ordem das escritas precisa ser explícita | ADR-003 (inserção ordenada por `recurso_id`) |
| Consultas parametrizadas | Especificação, seção 5 (validação de entrada); ADR-008; RNF-07 |
| Persistência verificada com banco real | Especificação, seção 5; ADR-009 |
| Sem entidade gerenciada no domínio | ADR-001 |

## Consequências

- **Positivas:** SQL visível e testável; a garantia no banco aparece no código; menos dependências.
- **Negativas:** mapeamento linha a objeto escrito à mão; sem geração de consulta pelo framework.

## Riscos

Divergência entre o SQL e as migrações. Mitigada por teste de integração contra o banco real em toda fatia.

## Evidência necessária

CT-007 a CT-011 (esquema) e CT-060 a CT-065 (concorrência), todos com PostgreSQL real.

## Condição de revisão

Se o volume de consultas de cadastro tornar o mapeamento manual um custo maior que o ganho, reavaliar JPA só para o catálogo, sem tocar nas reservas.
