# ADR-001. Monólito modular hexagonal em Spring Boot 3.x e Java 21

| Campo | Valor |
| --- | --- |
| Status | **Aceito, emendado** (decisão da equipe, Jefferson, 17/10/2026). Vale: monólito de um único artefato, Spring Boot 3.x, transação local, domínio sem Spring e portas só onde há troca ou substituição em teste. **Emendado** pelo [ADR-014](ADR-014-estrutura-mvc.md) (estrutura de pacotes: `api/aplicacao/dominio/infra` viram MVC) e pelo [ADR-013](ADR-013-acesso-a-dados-por-sql-direto.md) (acesso a dados por JDBC, sem JPA). A palavra "hexagonal" do título descreve a versão original e não a estrutura atual |
| Data | 15/10/2026 |
| Origem | Decisão inicial 10 da equipe, revisada em [arquitetura.md](../arquitetura.md), seções 10 e 12 |
| Decisores | Equipe (Jefferson Silva, única pessoa do projeto), com aprovação do usuário. |

## Contexto

A especificação exige Java 21 e Spring Boot 3.x e a entrega na semana 46 ([especificação](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção 1). A mesma especificação cobra testes unitários isolados, integração com banco real e cobertura de 80% de linhas e 70% de branches (seções 5 e 6). Uma reserva grava reserva, ocupações, auditoria e notificação de forma atômica (RN-03, RN-08, RN-28).

## Emenda de 17/10/2026

Na Fase 4 a estrutura de pacotes passou a MVC ([ADR-014](ADR-014-estrutura-mvc.md)) e o acesso a dados a JDBC ([ADR-013](ADR-013-acesso-a-dados-por-sql-direto.md)). Onde a seção "Decisão" abaixo cita `api`, `aplicacao`, `dominio` e `infra`, leia `controller`/`dto`, `service`, `model`/`model.regra` e `repository`/`config`/`integration`. As portas de relógio e de notificação continuam: o relógio é o `Clock` injetado e a notificação é a interface `NotificadorExterno`. O texto original foi mantido para preservar o histórico.

## Requisitos e cenários

RNF-01, RNF-02, RNF-11; RN-03, RN-08, RN-28; CEN-08 em [ciclo-00.md](../avaliacao-arquitetural/ciclo-00.md).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Camadas simples (controlador, serviço, repositório) | Menor custo inicial, mas a regra de domínio fica presa ao framework e ao mapeamento de persistência. Isso dificulta o teste unitário isolado exigido na seção 5 e a troca do provedor (CEN-08) |
| Microsserviços | Nenhum requisito pede distribuição. A reserva com vários recursos exige uma transação única (RN-03, D7); separar serviços a transformaria em transação distribuída, com custo e sem requisito que o pague |

## Decisão

**Versão:** Spring Boot 3.5.16, a última versão 3.x estável publicada no Maven Central em 15/10/2026. A especificação exige 3.x (seção 1) e o Spring Initializr passou a oferecer apenas 4.x, então o projeto é criado à mão a partir do `spring-boot-starter-parent` 3.5.16.

Um único artefato implantável, dividido em módulos por área, com quatro camadas que espelham o C4: `api`, `aplicacao`, `dominio` e `infra`. O domínio não depende de Spring. Portas existem **só onde há substituição em teste ou troca prevista**: relógio, notificação e repositórios.

## Fundamentação

| Argumento | Base |
| --- | --- |
| Uma transação local cobre reserva, ocupações, auditoria e notificação | RN-03, RN-08, RN-28; tática **Transactions** do catálogo (seção 4.1.4) |
| Domínio testável sem contexto do framework | Especificação, seção 5 (unitários isolados, mocks só em unitário) e RNF-01, RNF-02 |
| Trocar o provedor altera um componente | CEN-08; táticas **Use an Intermediary**, **Encapsulate**, **Restrict Dependencies** (catálogo, seção 4.3) |
| Um único artefato cabe no prazo | Especificação, seção 1 (entrega na semana 46) |
| Spring Boot 3.x, e não 4.x | Especificação, seção 1 ("Java 21 e Spring Boot 3.x") |

## Consequências

- **Positivas:** transação local simples; domínio coberto por teste rápido; troca de adaptador sem tocar o domínio.
- **Negativas:** custo de mapeamento entre camadas (TO-05 em [ciclo-00.md](../avaliacao-arquitetural/ciclo-00.md)); disciplina de dependências exige verificação automática.

## Riscos

Excesso de cerimônia para o tamanho do projeto e o prazo. O custo de mapeamento não foi medido.

## Evidência necessária

- Teste de arquitetura que falha se `dominio` importar Spring ou `infra`.
- Cobertura do módulo de domínio por testes unitários sem container.

## Condição de revisão

Revisar após a Fase 4 se o custo de mapeamento atrasar fatias, ou se surgir requisito de escalar partes de forma independente.
