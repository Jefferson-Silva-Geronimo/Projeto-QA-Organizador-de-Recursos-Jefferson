# Índice de evidências

Onde achar cada prova do produto **Organização de Recursos**. Fonte da exigência de evidências: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Entregáveis".

## 0. Pacote de entrega

Cada linha diz o que provar e onde está. O commit avaliado é o da tag **`v1.0.0-rc3`** (publicada em 28/10/2026, com o mesmo código da rc2; o commit se obtém com `git rev-list -n 1 v1.0.0-rc3`). Até a execução da rc3 ser registrada em `docs/testes/execucao-e26.md`, depois da tag, os números abaixo são os da E-25, do commit da `v1.0.0-rc2` (`d2b6af1`, publicada em 26/10/2026), que permanece como histórico, assim como a `v1.0.0-rc1` (`276224b`, run [`40128131459`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40128131459), verde) permanece como histórico. Os documentos de evidência entram depois da tag e só mudam documentação.

| Evidência | Onde |
| --- | --- |
| Execução da CI na E-25, commit da `v1.0.0-rc2` (`test`, `frontend`, `e2e` e `segredos`) | Run [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577), verde; resumo por classe em [execucao-e25.md](../testes/execucao-e25.md) (E-25) |
| Relatório do JaCoCo | Artefato `relatorio-jacoco` do run `40373624577` (retenção de 30 dias, **expira em 25/11/2026**); resumo versionado em [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md), seção 7: linhas 97,01% (1751 de 1805) e branches 86,88% (523 de 602); totais e cobertura por pacote extraídos do `jacoco.xml` em [jacoco-resumo-rc2.md](../testes/jacoco-resumo-rc2.md) |
| Quality Gate do SonarCloud | **OK** na E-25, commit da `v1.0.0-rc2` (0 bugs, 0 vulnerabilidades, 0 code smells); [Painel do projeto](https://sonarcloud.io/dashboard?id=Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson); leitura em [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) |
| Ocorrência de 26/10/2026 na `main` | O run `40379344363` (push na `main`, commit `e0ab982`, depois da tag) teve o job `e2e` vermelho por falha temporária de rede no build da imagem, sem teste executado. **O commit da tag `v1.0.0-rc2` está verde** (run `40373624577`): [ocorrencias-a-vigiar.md](../testes/ocorrencias-a-vigiar.md), ocorrência I-1 |
| Clone limpo no commit da `v1.0.0-rc2` | Aplicação no ar em 150 s, front em 366 s e `./mvnw -B verify` verde em 539 s (231 + 434 testes); a primeira tentativa falhou por ambiente (Docker), sem alterar o repositório: [limitadores-de-nota.md](../testes/limitadores-de-nota.md), seção 2.6 |
| Rastreabilidade | [rtm.md](../rtm.md) (aponta para a [RTM.md](../../RTM.md)); auditoria em [auditoria-rtm.md](../testes/auditoria-rtm.md) |
| Plano e resultado da carga | [rnf.md](../performance/rnf.md), [resultado-01.md](../performance/resultado-01.md) e [resultado-02.md](../performance/resultado-02.md) |
| Defeitos | [defeitos/README.md](../defeitos/README.md) e [analise-causa-raiz.md](../defeitos/analise-causa-raiz.md) |
| Relatório e decisão de qualidade | [relatorio-qualidade.md](../relatorio-qualidade.md) e [decisao-qualidade.md](../decisao-qualidade.md) |
| Limitadores de nota | [limitadores-de-nota.md](../testes/limitadores-de-nota.md) |
| Situação dos requisitos | [status-requisitos.md](../status-requisitos.md) |
| Plano de TDD (regras, casos e matriz) | [plano-tdd.md](../testes/plano-tdd.md) |
| Mutação manual (regra quebrada, teste que falha) | [mutacao-manual.md](../testes/mutacao-manual.md) |
| Conferência dos entregáveis como avaliador externo | [checklist.md](../entrega/checklist.md) |
| Limitações e dívida técnica | [limitacoes-e-divida-tecnica.md](../limitacoes-e-divida-tecnica.md) |
| Histórico de mudanças por versão | [CHANGELOG.md](../../CHANGELOG.md) |

## 1. Do requisito ao teste e à execução

O caminho é: [RTM.md](../../RTM.md), linha do requisito, caso de teste (CT), arquivo e método, execução com o run da CI.

Exemplo, RF-05 (detecção de sobreposição, crítico):

| Passo | Onde | O que se vê |
| --- | --- | --- |
| 1 | [RTM.md](../../RTM.md), linha "RF-05" | Regras RN-02, RN-11, RN-13 e RN-30; risco R-02; cenário CEN-03; casos CT-034, CT-035, CT-057, CT-058 e CT-059; evidência `PeriodoTest`, `ReservasApiIT`, execução E-1 e E-24; status `testado` |
| 2 | [casos-de-teste.md](../testes/casos-de-teste.md), CT-034 | O caso de trinca nas fronteiras (um instante antes, no instante e um depois) |
| 3 | `src/test/java/br/senac/recursos/model/PeriodoTest.java`, método `ct034_conflitoEmTrincaNasFronteiras` | O teste de unidade |
| 4 | [execucao-e24.md](../testes/execucao-e24.md), seção "Back end: classes de unidade e arquitetura" | `PeriodoTest`: 9 testes, 0 falhas, 0 erros, 0 ignorados |
| 5 | Run da CI, link no topo de [execucao-e24.md](../testes/execucao-e24.md) | Log do job `test`, com o Surefire e o Failsafe |

[auditoria-rtm.md](../testes/auditoria-rtm.md) mostra como cada linha da RTM foi auditada e o que a auditoria corrigiu (BUG-020 a BUG-027).

## 2. Do caso de teste ao commit vermelho (TDD)

1. Com o ID do caso (por exemplo CT-081), ache a fatia na tabela "Fatias" de [evidencia-tdd.md](../testes/evidencia-tdd.md): cada linha traz os casos, o commit `test(red)`, o `feat(green)` e o refactor.
2. O arquivo do caso está na tabela CT-arquivo de [casos-de-teste.md](../testes/casos-de-teste.md), seção 4.1.
3. Os commits vermelhos seguem o prefixo `test(red)`:

```bash
git log --oneline --grep="test(red)"
git show --stat 4a54c35        # test(red): fase 4 - reservas: criacao, conflito, alteracao e cancelamento
git log --oneline -1 d1b4099   # o commit verde da mesma fatia
```

CT-081 (reserva em recurso em manutenção) está na fatia "Reservas: conflito, alteração, cancelamento", vermelho em `4a54c35`, verde em `d1b4099`.

**Limite:** as linhas de [evidencia-tdd.md](../testes/evidencia-tdd.md) marcadas **sem red** (lacunas de risco, PIT, BDD, CT-106 e parte do limite de login) têm comportamento que já existia: os testes foram escritos depois do código e não substituem o ciclo TDD. Nas telas do front, o vermelho está em commits `test(red): ...` próprios de cada tela.

## 3. Regra quebrada de propósito

Experimentos de mutação manual (RN-04 e RN-03, entre outros), com a quebra feita, o teste que falhou e o resultado: [mutacao-manual.md](../testes/mutacao-manual.md). Os quatro limitadores de nota estão em [limitadores-de-nota.md](../testes/limitadores-de-nota.md).

## 4. Desempenho: o p95 e o arquivo `.jtl`

O JMeter registra uma linha por requisição em `perf/resultados/rodada-0N.jtl`; o script `perf/analisar_rodada.py` calcula os percentis **só do regime** (depois dos primeiros 35 s de aquecimento).

```bash
python -I perf/analisar_rodada.py perf/resultados/rodada-02.jtl
```

No Windows, defina `PYTHONIOENCODING=utf-8` para ver os acentos. Regime da rodada 02: criação **n=3832, p50=289 ms, p95=886 ms**, p99=1699 ms; consulta p95=152 ms; **0 erros reais e 0 respostas 500**, o mesmo número de [resultado-02.md](../performance/resultado-02.md).

| Coluna do `.jtl` | Uso |
| --- | --- |
| `timeStamp` | Instante da requisição, em milissegundos; o script descarta os primeiros 35 s depois do início |
| `elapsed` | Tempo de resposta em ms; é o valor de que se tira o percentil |
| `label` | `login`, `consulta-disponibilidade` ou `criar-reserva` |
| `responseCode` | 200, 201 ou 409 |
| `success` | Se a asserção do JMeter passou |

RNF-08b **não foi atendido** nesta máquina (p95 de 568 a 886 ms contra 300 ms nas rodadas 01 a 03). A causa foi localizada no `fsync` do PostgreSQL em Docker; a rodada 04, de diagnóstico sem `fsync`, deu p95 de 87 ms e **não vale como resultado**. Cada rodada foi executada uma vez, e os 300 ms são hipótese da aula, não validada pelo professor.

## 5. O 409 esperado não conta como erro

1. **O requisito:** [rnf.md](../performance/rnf.md), RNF-08c ("Erro real é: consulta diferente de 200; criação diferente de 201 e de 409").
2. **O plano de carga:** em `perf/reservas.jmx`, a asserção "criação só 201 ou 409" usa `^(201|409)$`.
3. **O arquivo:** contagem por `label`, `responseCode` e `success` na rodada 02:

```bash
awk -F, 'NR>1{c[$3","$4","$8]++} END{for(k in c)print k, c[k]}' perf/resultados/rodada-02.jtl | sort
```

| `label` | `responseCode` | `success` | Linhas |
| --- | --- | --- | --- |
| `consulta-disponibilidade` | 200 | true | 9529 |
| `criar-reserva` | 201 | true | 100 |
| `criar-reserva` | 409 | true | 3979 |
| `login` | 200 | true | 50 |

As 3979 recusas 409 estão marcadas `success=true` e o script soma **0 erros reais**: são a disputa esperada, com 100 pares (recurso e intervalo) para 100 reservas aceitas, e cada 409 gerou uma linha em `tentativas_conflito` ([resultado-02.md](../performance/resultado-02.md), seção 3). A prova de que "cada 409 gerou uma tentativa de conflito" é a conferência no banco registrada em [resultado-02.md](../performance/resultado-02.md); o `.jtl` sozinho não a mostra.

## 6. Integração contínua, análise estática e cobertura

| O quê | Onde |
| --- | --- |
| Execuções da CI | `https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions` |
| SonarCloud | `https://sonarcloud.io/dashboard?id=Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson` |
| JaCoCo | Artefato `relatorio-jacoco` de cada run do job `test`; localmente, `target/site/jacoco/index.html` depois de `./mvnw -B verify`. Leitura versionada em [leitura-final-cobertura.md](../testes/leitura-final-cobertura.md) |
| E2E | Artefato `relatorio-e2e`; passos em [e2e/README.md](../testes/e2e/README.md) |
| Relatório final de qualidade | [relatorio-qualidade.md](../relatorio-qualidade.md) |
| Roteiro de navegador real | [roteiro-navegador-real/README.md](../testes/roteiro-navegador-real/README.md) |
