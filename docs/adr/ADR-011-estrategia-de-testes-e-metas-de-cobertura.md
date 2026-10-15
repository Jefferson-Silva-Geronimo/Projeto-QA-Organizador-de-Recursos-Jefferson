# ADR-011. Estratégia de testes e metas de cobertura

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário) |
| Data | 15/10/2026 |
| Origem | Especificação, seções 5 e 6; [plano-de-teste.md](../plano-de-teste.md), seção 4; [arquitetura.md](../arquitetura.md), seção 5 |
| Decisores | Equipe, com aprovação do usuário. Nomes: TODO |

## Contexto

A especificação fixa os níveis de teste, a regra de uso de mocks e as metas: 80% de linhas, 70% de branches, 100% dos requisitos críticos na RTM e 0 bugs ou vulnerabilidades críticos. Ela avisa que cobertura alta, sozinha, não garante qualidade e que testes triviais não asseguram pontuação máxima (seção 6).

## Requisitos e cenários

RNF-01, RNF-02, RNF-03, RNF-04; todos os CEN; TR-03.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Apenas testes unitários com mocks | Viola a seção 5 e não prova a constraint, a auditoria nem a concorrência |
| Perseguir a cobertura como objetivo | A seção 6 desqualifica testes escritos só para subir o percentual |

## Decisão

Níveis: unitário com JUnit 5 e testes parametrizados no domínio; integração com Testcontainers; API em caixa-preta com matriz perfil × operação; ponta a ponta; concorrência com banco real; integração externa com WireMock; carga com JMeter. Mocks só em teste unitário isolado. Metas como as da especificação. Uma funcionalidade nova com TDD ou BDD, conforme o cronograma da especificação (regras de aprovação e bloqueio, semana 41). Cada requisito crítico termina na RTM ligado a cenário, caso de teste e evidência. **Gate de cobertura:** o JaCoCo roda e publica relatório desde a Fase 3, sem barrar o build. O gate de 80% de linhas e 70% de branches liga na primeira fatia de domínio da Fase 4, quando já existe código de regra para medir.

## Fundamentação

| Argumento | Base |
| --- | --- |
| Níveis e uso de mocks | Especificação, seção 5 |
| Metas | Especificação, seção 6; RNF-01 a RNF-04 |
| A cobertura não substitui o teste de regra | Especificação, seção 6 |
| Suíte determinística, repetida | Tática **Limit Nondeterminism** (catálogo, seção 4.6.2) |
| Gate depois de existir regra de domínio | Especificação, seção 9 (semana 38: cobertura de ramo nas regras de sobreposição) |

## Consequências

- **Positivas:** cada garantia tem teste no nível que a prova.
- **Negativas:** build mais lento por causa dos containers; risco de testes instáveis na concorrência.

## Riscos

Testes instáveis em concorrência. Prazo para cobrir todos os níveis.

## Evidência necessária

JaCoCo, SonarCloud, relatório de testes e a RTM com evidência por requisito crítico.

## Condição de revisão

Tempo de pipeline inviável, ou mudança das metas pelo professor.
