# Mutação manual: quebrar a regra e ver qual teste falha

Teste que continua verde com a regra quebrada não protege a regra. Cada experimento abaixo quebra uma regra de negócio de propósito, numa cópia descartável do repositório, e registra qual teste falhou. Nunca se altera a `main`, e nenhum teste existente é alterado, desativado ou enfraquecido.

**Como se faz:**

```bash
git worktree add --detach ../ensaio main     # cópia descartável a partir da main
# ... quebrar a regra e rodar as classes de teste afetadas dentro de ../ensaio ...
git worktree remove --force ../ensaio        # descarta
```

Fonte das regras: [regras-negocio.md](../prd/regras-negocio.md) e a seção "Regras críticas" da [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

## 1. Experimentos registrados

| Regra | Quebra feita | Teste que falhou | Resultado | Data e commit | Detalhe |
| --- | --- | --- | --- | --- | --- |
| RN-04 (manutenção) | Em `ReservaService.verificarConflitos`, o motivo do conflito deixa de distinguir a manutenção (`MotivoConflito.SOBREPOSICAO` no lugar de `c.manutencao() ? MANUTENCAO : SOBREPOSICAO`) | `ReservasApiIT.ct081_reservaEmRecursoEmManutencaoEhRecusadaComMotivoMANUTENCAO` | 1 falha em 53 testes das duas classes executadas (`ReservasApiIT`, 34; `AprovacaoBloqueioApiIT`, 19), por asserção | 24/10/2026, `main` em `53b502b` | Seção 2 |
| RN-03 (dupla reserva) | Remoção da constraint `ocupacoes_sem_sobreposicao` (`EXCLUDE USING gist`) de `V2__esquema.sql` | `ConcorrenciaApiIT` | 7 falhas em 7 testes, todas por asserção | 24/10/2026, `main` em `53b502b` | Seção 3 |

## 2. RN-04: reserva de recurso em manutenção

**A regra:** reserva de recurso em manutenção é recusada com o motivo `MANUTENCAO` (RN-04, CT-081). A decisão do motivo está em `src/main/java/br/senac/recursos/service/ReservaService.java`, no método `verificarConflitos`.

**A quebra:** trocar

```java
throw new ConflitoDeAlocacao(d.id(), c.manutencao() ? MotivoConflito.MANUTENCAO : MotivoConflito.SOBREPOSICAO,
```

por `throw new ConflitoDeAlocacao(d.id(), MotivoConflito.SOBREPOSICAO,`, e rodar:

```bash
./mvnw -B verify -Dtest=NenhumTeste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test='ReservasApiIT,AprovacaoBloqueioApiIT' -Dfailsafe.failIfNoSpecifiedTests=false -Djacoco.skip=true
```

**Resultado observado em 24/10/2026** (sobre a `main` em `53b502b`, só com essa alteração): 53 testes nas duas classes e **1 falha**: `ReservasApiIT.ct081_reservaEmRecursoEmManutencaoEhRecusadaComMotivoMANUTENCAO`, na linha 278, por asserção: `JSON path "$.code" expected:<RECURSO_EM_MANUTENCAO> but was:<CONFLITO_DE_ALOCACAO>`. Nenhum outro teste dessas duas classes falhou.

**Limite:** só essas duas classes de integração foram executadas; a suíte inteira não foi executada com a regra quebrada, então não se afirma que nenhum outro teste de fora delas falharia.

## 3. RN-03: proteção de dupla reserva

**A proteção:** `EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)`, a constraint `ocupacoes_sem_sobreposicao` em `src/main/resources/db/migration/V2__esquema.sql` ([ADR-003](../adr/ADR-003-dupla-reserva-constraint-de-exclusao.md)).

**A quebra:** apagar de `V2__esquema.sql` as três linhas da constraint (o comentário `-- Dupla reserva barrada...`, `CONSTRAINT ocupacoes_sem_sobreposicao` e o `EXCLUDE USING gist ...`) e tirar a vírgula que sobra na linha anterior. Depois:

```bash
./mvnw -B verify -Dtest=NenhumTeste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=ConcorrenciaApiIT -Dfailsafe.failIfNoSpecifiedTests=false -Djacoco.skip=true
```

**Resultado observado em 24/10/2026** (sobre a `main` em `53b502b`): `ConcorrenciaApiIT` com **7 testes e 7 falhas, todas por asserção**, nas linhas 115 (`ct060`, 20 solicitações para a mesma sala), 135 (`ct061`, mesmo professor), 156 (`ct062`, rodada 1), 179 e 197 (`ct064`), 210 (`ct065`) e 226 (`ct063`, que falha na pré-condição "a constraint de exclusão existe"). **Com a constraint**, a mesma classe tem 7 testes e 0 falhas (runs `40102847090` e `40099032564`, e a execução E-24).

**Registro anterior:** em [limitadores-de-nota.md](limitadores-de-nota.md), seção 5, o mesmo experimento sobre `e6dbc51` deu 6 falhas e 1 erro; o erro era do `ct063`, corrigido depois pelo BUG-023. A diferença para os 7 de agora é essa correção.
