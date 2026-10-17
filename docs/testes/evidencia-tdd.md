# Evidência de TDD — Fase 4

Este documento liga cada fatia de comportamento aos commits do ciclo red → green → refactor, para que a
afirmação "desenvolvido com TDD" possa ser conferida no histórico (`git log fase-4/backend`).

## Como ler

- **Red**: commit `test(red)` que adiciona os testes de uma fatia e que, ao ser aplicado sozinho, falha.
- **Green**: commit `feat(green)` ou `fix(green)` com a menor implementação que passa a fatia.
- **Refactor**: commit `refactor` com a suíte verde antes e depois.
- Os commits `test:` sem `(red)` corrigem o **cenário do teste**, nunca a regra. Cada um está listado como
  erro de cenário na seção de limites.

## Granularidade

O ciclo foi aplicado por **fatia de comportamento** (um grupo de casos de teste relacionados por regra), não
por caso individual. Isso é uma escolha de custo: um commit red por caso multiplicaria o histórico sem
aumentar a evidência. A rastreabilidade por caso está na RTM (`RTM.md`) e em `casos-de-teste.md`.

## Fatias

| Fatia | Casos | Red | Green | Refactor |
|---|---|---|---|---|
| Esquema, exclusão e auditoria | CT-007 a CT-011 | `9d4d6d9` | `dadb272` | — |
| Autenticação e erros padronizados | CT-001 a CT-006 | `6a9f4d9` | `030aa5e` | — |
| Usuários e perfis | CT-005, CT-012 a CT-016 | `c49f13c` | `de67a8a` | — |
| Primeiro Administrador | CT-122 | `00127d1` | `0d27444` | — |
| Cadastro e pesquisa de recursos | CT-017 a CT-029, CT-031, CT-032 | `24c7364` | `18c614b` | `bec334d` |
| Domínio: período, janela, passado, políticas | CT-033 a CT-037, CT-039, CT-051 a CT-053 | `af25ff4` | `bcfc704` | — |
| Reservas: conflito, alteração, cancelamento | CT-030, CT-038 a CT-050, CT-054 a CT-058 | `4a54c35` | `d1b4099` | — |
| Concorrência (sala, professor, vários recursos) | CT-060 a CT-065 | `5d570f8` | `eb7f5b1` (BUG-007) | — |
| Máquina de estados, aprovação, SEM_DECISAO, bloqueio | CT-066 a CT-083 | `7b4219d` | `d1f0245` | `3aa1f77`, `217e99f` (MVC) |
| Uso, retirada, devolução, conclusão | CT-084 a CT-095 | `9fb060a` | `61b5c71` | — |
| Auditoria consultável | CT-096 a CT-101 | `4b5551f` | `866d323` | — |
| Notificação por webhook | CT-102 a CT-105, INT-01 a INT-06 | `5462457` | `5d19b07` | — |
| Relatório | CT-107 a CT-113 | `4b3a176` | `ea43349` | — |
| Documentação da API | CT-114 a CT-116 | `54c1ddf` | `eea2581` | — |
| Matriz de autorização e entrada inválida | CT-117 a CT-121 | `d793879` | `73488e5` (BUG-008) | — |
| Falha ao gravar a tentativa de conflito (BUG-009) | `FalhaNaTentativaApiIT` | `0a80fc7` | `61ce37d` | — |
| Lacunas de risco da cobertura | LacunasDeRiscoApiIT | — | — | — |
| Limite de tentativas de login (SEC-01): contagem de falhas | `LimiteDeLoginTest` | `test(red)` desta sessão | `feat(green)` | — |
| Limite de login: janela deslizante em trinca (599999, 600000, 600001 ms) | `LimiteDeLoginTest` | `test(red)` desta sessão | `feat(green)` | — |
| Limite de login: configuração inválida recusada | `LimiteDeLoginTest` | `test(red)` desta sessão | `feat(green)` | — |
| Limite de login: bloqueio por API com a senha correta | `LimiteDeLoginApiIT` | `test(red)` desta sessão (esperado 401, obtido 200) | `feat(green)` | — |
| Limite de login: 10 casos de API (tempo em trinca, zera no sucesso, resposta idêntica, não estende, conta inexistente, normalização, limpeza) | `LimiteDeLoginApiIT` | — (nasceram verdes) | — | — |
| Lacunas de risco do PIT (horas de funcionamento, eventos de auditoria, período da reserva) | `HorasDeFuncionamentoTest`, `EventoAuditoriaTest`, `ReservaTest` | — | — | `721180b` (código morto removido) |
| Cenários BDD de aprovação e bloqueio (BDD-01 a BDD-08, 15 cenários) | `aprovacao-bloqueio.feature`, `CucumberIT` | — | — | — |
| Troca do provedor (CT-106) | `TrocaDeProvedorTest`, `TrocaDeProvedorApiIT`, `ProvedorIsoladoArquiteturaTest` | — (5 casos, `40834ed`, `638687d`, `ee0df5e`, `aa7cf1f`, `8632606`) | — | `da77cb6` |

As linhas sem red (lacunas de risco, PIT, BDD e CT-106) têm comportamento que **já existia**: os testes foram escritos depois do código, por indicação
do relatório de cobertura (Prompt 4.C). Passaram na primeira execução e não substituem o ciclo TDD. Estão
marcados à parte para não inflar a evidência.

## Limites e correções honestas

- **Testes que passaram de primeira.** CT-107 a CT-113 e parte de CT-084 a CT-095 não falharam por defeito de
  regra no red, e sim por faltar a classe. O red demonstra ausência, não regressão de comportamento.
- **Erros de cenário corrigidos sem mudar a regra:** CT-016 (`5e86204`), CT-049 (`7b09e2a`), CT-071 e CT-080
  (`aea94dd`), CT-110 (`c64e8f9`), `DocumentacaoApiIT` (`ffba98e`) e a limpeza do CT-063 (`7ba9894`).
- **Defeitos achados pelos testes:** BUG-007 (impasse 40P01 tratado como conflito) e BUG-008 (autorização
  depois da validação do corpo). Ambos têm commit red anterior ao green e estão em `docs/defeitos/README.md`.
- **Refactors estruturais** (`e1b737e` JDBC, `3aa1f77` e `217e99f` MVC) rodaram com a suíte verde antes e
  depois (220 testes), sem alterar comportamento.

## Cobertura e gate

O gate do JaCoCo roda em `verify`: mínimo de 80% de linhas e 70% de branches no conjunto (ADR-011). A
suíte completa é executada com `./mvnw clean verify`; o relatório fica em `target/site/jacoco/`.

Medição desta sessão (17/10/2026, `./mvnw -B clean verify`, após BUG-009): **468 testes**, sendo 136 de unidade e
arquitetura (surefire) e 332 de integração e BDD (failsafe), 0 falhas; **96,7% de linhas** (1551/1604) e **84,6% de
branches** (438/518). O relatório anterior citava "313 testes": esse número era só a fase de integração.

## Sessão de fechamento (17/10/2026): o que cada nova evidência prova

### BUG-009: vermelho antes de verde, com trecho da saída

```text
[ERROR] FalhaNaTentativaApiIT.bug009_seAGravacaoDaTentativaFalharOConflitoContinuaSendo409:66
        Status expected:<409> but was:<500>
```

Commit `test(red)` `0a80fc7`; `fix(green)` `61ce37d`, com a suíte inteira verde (468 testes). O segundo caso (log) nasceu
verde porque o log foi implementado junto: não conta como vermelho.

### Testes que passaram de primeira, e a prova de que protegem

Não há vermelho possível para código que já existia; em vez dele, uma falha foi injetada na regra, a suíte rodou e a
fonte foi restaurada (nada disso foi commitado).

| Teste | Falha injetada | Resultado |
| --- | --- | --- |
| BDD-02 (dono Responsável), BDD-04 e BDD-08 | Aprovação do dono desligada em `AprovacaoService` e `CONCLUIDA` permitida a partir de APROVADA em `MaquinaDeEstados` | 3 cenários vermelhos: `expected: 403` (2) e `expected: 409` (1); 12 verdes |
| `TrocaDeProvedorTest` (3 casos) | `ENVIADA`, `RECUSADA` e `FALHA_TEMPORARIA` mapeados para o status errado em `DespachoDeNotificacoesService` | 3 vermelhos: `expected: PENDENTE but was: FALHA`, `expected: FALHA but was: PENDENTE`, `expected: ENVIADA but was: PENDENTE` |
| `HorasDeFuncionamentoTest`, `EventoAuditoriaTest` | PIT (mutantes gerados pela ferramenta) | 0 sobreviventes entre os mutantes cobertos ([mutacao.md](mutacao.md)) |

### Limites desta sessão

- BDD e CT-106 não são TDD: o código existia. Valem como evidência de comportamento especificado e verificado.
- `ProvedorIsoladoArquiteturaTest` é redundante com a visibilidade do pacote (`WebhookNotificador` não é público) e
  vale como documentação executável.
