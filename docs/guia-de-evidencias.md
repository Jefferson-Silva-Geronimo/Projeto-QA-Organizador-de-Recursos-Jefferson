# Guia: onde achar cada evidência

Guia de apoio à prova oral do projeto **Organização de Recursos**, para os seis exercícios de conferência: o que a banca pode
pedir na hora e o caminho exato até a prova. Fonte da exigência de evidências:
[especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). **Sem
slides.** O roteiro da demonstração está em [roteiro-demonstracao.md](roteiro-demonstracao.md).

**Regra para os exercícios que alteram código:** faça sempre num `git worktree` descartável, nunca na `main` nem com a suíte
rodando em outra janela. Depois, `git worktree remove --force <pasta>`. Os comandos abaixo foram executados em 24/10/2026 para
este guia; onde um resultado vem de execução anterior, está dito.

```bash
git worktree add --detach ../ensaio main     # cria a cópia descartável a partir da main
# ... alterar e rodar dentro de ../ensaio ...
git worktree remove --force ../ensaio        # descarta
```

## 1. Achar o commit vermelho de um cenário escolhido na hora

**O que a banca quer ver:** que o teste foi escrito e visto falhar antes da implementação (TDD).

1. Com o ID do caso de teste dito pela banca (por exemplo CT-081), ache a **fatia** na tabela de
   [evidencia-tdd.md](testes/evidencia-tdd.md), seção "Fatias": cada linha traz os casos, o commit `test(red)`, o `feat(green)` e
   o refactor.
2. Para achar o arquivo do caso, use a tabela CT-arquivo de [casos-de-teste.md](testes/casos-de-teste.md), seção 4.1.
3. Abra o commit: `git show --stat <hash>`. Todos os commits vermelhos seguem o prefixo `test(red)`:

```bash
git log --oneline --grep="test(red)"
git show --stat 4a54c35        # test(red): fase 4 - reservas: criacao, conflito, alteracao e cancelamento
git log --oneline -1 d1b4099   # o commit verde da mesma fatia
```

**Exemplo:** CT-081 (reserva em recurso em manutenção) está na fatia "Reservas: conflito, alteração, cancelamento", vermelho em
`4a54c35`, verde em `d1b4099`.

**Cuidado, para não ser pego:** as linhas de [evidencia-tdd.md](testes/evidencia-tdd.md) marcadas **sem red** (lacunas de risco, PIT, BDD, CT-106 e
parte do limite de login) têm comportamento que já existia: os testes foram escritos depois do código e **não substituem** o
ciclo TDD. A tabela os separa de propósito. Nas telas do front, o vermelho está em commits `test(red): ...` próprios de cada tela.

## 2. Quebrar a regra de manutenção e dizer qual teste falha

**A regra:** reserva de recurso em manutenção é recusada com o motivo `MANUTENCAO` (RN-04, CT-081). A decisão do motivo está em
`src/main/java/br/senac/recursos/service/ReservaService.java`, no método `verificarConflitos`.

**Como quebrar (em worktree descartável):** em `verificarConflitos`, trocar

```java
throw new ConflitoDeAlocacao(d.id(), c.manutencao() ? MotivoConflito.MANUTENCAO : MotivoConflito.SOBREPOSICAO,
```

por `throw new ConflitoDeAlocacao(d.id(), MotivoConflito.SOBREPOSICAO,` (o motivo deixa de distinguir a manutenção) e rodar:

```bash
./mvnw -B verify -Dtest=NenhumTeste -Dsurefire.failIfNoSpecifiedTests=false   -Dit.test='ReservasApiIT,AprovacaoBloqueioApiIT' -Dfailsafe.failIfNoSpecifiedTests=false -Djacoco.skip=true
```

**Resultado observado em 24/10/2026** (sobre a `main` em `53b502b`, só com essa alteração): 53 testes nas duas classes (`ReservasApiIT`, 34, e `AprovacaoBloqueioApiIT`, 19) e
**1 falha**: `ReservasApiIT.ct081_reservaEmRecursoEmManutencaoEhRecusadaComMotivoMANUTENCAO`, na linha 278, por asserção:
`JSON path "$.code" expected:<RECURSO_EM_MANUTENCAO> but was:<CONFLITO_DE_ALOCACAO>`. Nenhum outro teste dessas duas classes falhou.

**O que dizer:** o teste que protege a regra é o CT-081. **Limite:** só rodei essas duas classes de integração; não rodei a suíte
inteira com a regra quebrada, então não afirmo que nenhum outro teste de fora delas falharia.

## 3. Seguir uma linha da RTM até o teste e a execução

**O caminho:** [RTM.md](../RTM.md), linha do requisito → caso de teste (CT) → arquivo e método → execução com o run da CI.

**Exemplo percorrido, RF-05 (detecção de sobreposição, crítico):**

| Passo | Onde | O que se vê |
| --- | --- | --- |
| 1 | [RTM.md](../RTM.md), linha "RF-05" | Regras RN-02, RN-11, RN-13 e RN-30; risco R-02; cenário CEN-03; casos CT-034, CT-035, CT-057, CT-058 e CT-059; evidência `PeriodoTest`, `ReservasApiIT`, execução E-1 e E-24; status `testado` |
| 2 | [casos-de-teste.md](testes/casos-de-teste.md), CT-034 | O caso de trinca nas fronteiras (um instante antes, no instante e um depois) |
| 3 | `src/test/java/br/senac/recursos/model/PeriodoTest.java`, método `ct034_conflitoEmTrincaNasFronteiras` | O teste de unidade |
| 4 | [execucao-e24.md](testes/execucao-e24.md), seção "Back end: classes de unidade e arquitetura" | `PeriodoTest`: 9 testes, 0 falhas, 0 erros, 0 ignorados |
| 5 | Run da CI, link no topo de [execucao-e24.md](testes/execucao-e24.md) | Log do job `test`, com o Surefire e o Failsafe |

Para conferir a cadeia inteira de uma vez, [auditoria-rtm.md](testes/auditoria-rtm.md) mostra como cada linha foi auditada e o
que a auditoria corrigiu (BUG-020 a BUG-027).

## 4. Remover a proteção de dupla reserva e rodar o teste de concorrência

**A proteção:** `EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)`, a constraint `ocupacoes_sem_sobreposicao` em
`src/main/resources/db/migration/V2__esquema.sql` ([ADR-003](adr/ADR-003-dupla-reserva-constraint-de-exclusao.md)).

**Como remover (em worktree descartável):** apagar de `V2__esquema.sql` as três linhas da constraint (o comentário
`-- Dupla reserva barrada...`, `CONSTRAINT ocupacoes_sem_sobreposicao` e o `EXCLUDE USING gist ...`) e tirar a vírgula que sobra na linha
anterior. Depois:

```bash
./mvnw -B verify -Dtest=NenhumTeste -Dsurefire.failIfNoSpecifiedTests=false   -Dit.test=ConcorrenciaApiIT -Dfailsafe.failIfNoSpecifiedTests=false -Djacoco.skip=true
```

**Resultado observado em 24/10/2026** (sobre a `main` em `53b502b`): `ConcorrenciaApiIT` com **7 testes e 7 falhas, todas por
asserção**, nas linhas 115 (`ct060`, 20 solicitações para a mesma sala), 135 (`ct061`, mesmo professor), 156 (`ct062`, rodada 1),
179 e 197 (`ct064`), 210 (`ct065`) e 226 (`ct063`, que agora falha na pré-condição "a constraint de exclusão existe").
**Com a constraint** a mesma classe tem 7 testes e 0 falhas (runs `40102847090` e `40099032564`, e o E-24).

**Registro anterior:** em [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 5, o mesmo experimento sobre `e6dbc51` deu 6 falhas e
1 erro; o erro era do `ct063`, corrigido depois pelo BUG-023. A diferença para os 7 de agora é essa correção.

## 5. Explicar de onde saiu o p95 e abrir o arquivo `.jtl`

**De onde saiu:** o JMeter registra uma linha por requisição em `perf/resultados/rodada-0N.jtl`; o script
`perf/analisar_rodada.py` calcula os percentis **só do regime** (depois dos primeiros 35 s de aquecimento).

```bash
python -I perf/analisar_rodada.py perf/resultados/rodada-02.jtl
```

No Windows, defina `PYTHONIOENCODING=utf-8` para ver os acentos. Resultado lido em 24/10/2026 (regime da rodada 02): criação
**n=3832, p50=289 ms, p95=886 ms**, p99=1699 ms; consulta p95=152 ms; **0 erros reais e 0 respostas 500**. É o mesmo número de
[resultado-02.md](performance/resultado-02.md).

| Coluna do `.jtl` | Uso |
| --- | --- |
| `timeStamp` | Instante da requisição, em milissegundos; o script descarta os primeiros 35 s depois do início |
| `elapsed` | Tempo de resposta em ms; é o valor de que se tira o percentil |
| `label` | `login`, `consulta-disponibilidade` ou `criar-reserva` |
| `responseCode` | 200, 201 ou 409 |
| `success` | Se a asserção do JMeter passou |

**O que dizer sobre o resultado:** RNF-08b **não foi atendido** nesta máquina (p95 de 568 a 886 ms contra 300 ms nas rodadas
01 a 03); a causa foi localizada no `fsync` do PostgreSQL em Docker (a rodada 04, de diagnóstico sem `fsync`, deu p95 de 87 ms e
**não vale como resultado**). Cada rodada foi executada uma vez; a variação é desconhecida. Os 300 ms são hipótese da aula, não
validada pelo professor.

## 6. Mostrar que o 409 esperado não foi contado como erro

**Três pontos de prova, nesta ordem:**

1. **O requisito** diz que 409 não é erro: [rnf.md](performance/rnf.md), RNF-08c ("Erro real é: consulta diferente de 200; criação diferente de 201 e de 409").
2. **O plano de carga** aceita 409: em `perf/reservas.jmx`, a asserção "criação só 201 ou 409" usa a expressão `^(201|409)$`.
3. **O arquivo** mostra o efeito. Contagem por `label`, `responseCode` e `success` na rodada 02, lida em 24/10/2026:

```bash
awk -F, 'NR>1{c[$3","$4","$8]++} END{for(k in c)print k, c[k]}' perf/resultados/rodada-02.jtl | sort
```

| `label` | `responseCode` | `success` | Linhas |
| --- | --- | --- | --- |
| `consulta-disponibilidade` | 200 | true | 9529 |
| `criar-reserva` | 201 | true | 100 |
| `criar-reserva` | 409 | true | 3979 |
| `login` | 200 | true | 50 |

As 3979 recusas 409 estão marcadas `success=true` e o script soma **0 erros reais**. Elas são a disputa esperada: 100 pares
(recurso e intervalo) para 100 reservas aceitas, e cada 409 gerou exatamente uma linha em `tentativas_conflito`
([resultado-02.md](performance/resultado-02.md), seção 3). O script `perf/analisar_rodada.py` só conta como erro a consulta diferente
de 200 e a criação diferente de 201 ou 409.

**Limite honesto:** a prova de que "cada 409 gerou uma tentativa de conflito" é a conferência no banco registrada em
[resultado-02.md](performance/resultado-02.md); o `.jtl` sozinho não a mostra.
