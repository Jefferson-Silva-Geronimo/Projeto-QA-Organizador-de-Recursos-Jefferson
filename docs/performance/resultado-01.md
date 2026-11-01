# Resultado da rodada 01 (Fase 5)

Executada em 17/10/2026, das 20:31:46Z às 20:37:26Z, contra a aplicação local. Requisito e modelo de carga aprovados por
Jefferson em [rnf.md](rnf.md). Resultado bruto: [perf/resultados/rodada-01.jtl](../../perf/resultados/rodada-01.jtl).
O relatório HTML do JMeter foi gerado e não é versionado.

**Decisão: NÃO ATENDE à hipótese.** A criação de reserva não cumpre o p95 de 300 ms (RNF-08b). Os demais critérios foram
cumpridos. A conclusão vale somente para esta máquina e este commit, e os números continuam sendo hipótese não
validada pelo professor.

## 1. Ambiente

| Item | Valor |
| --- | --- |
| Máquina | Notebook com Intel Core i5-7200U 2,5 GHz (2 núcleos, 4 threads), 19,9 GB de RAM, Windows 11 Home 10.0.26200 |
| Aplicação | `java -jar` do Spring Boot 3.5.16, Java 21.0.6, parâmetros padrão da JVM, porta 18080 |
| Banco | PostgreSQL 17 em contêiner, imagem `postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3`, Docker 29.8.2 |
| Pool de conexões | Padrão do HikariCP, **não configurado no projeto** |
| JMeter | Apache JMeter **5.6.3**, binário oficial, SHA-512 conferido, instalado fora do repositório |
| Commit | `d42be77` (o jar foi gerado do `d8d26af`; a diferença entre os dois é só documentação) |
| Plano | `perf/reservas.jmx`, comando em [perf/README.md](../../perf/README.md) |
| Aquecimento | 1 rodada descartada (20 usuários, 45 s, 737 amostras, outras datas) antes da rodada 01 |
| Limitação do ambiente | **JMeter, aplicação, PostgreSQL e Docker dividem a mesma máquina de 2 núcleos.** Isso distorce o p95 para cima e não pode ser separado nesta rodada |

## 2. Carga aplicada

50 usuários, ramp-up de 30 s, 5 min de regime, pausa de 1 s, mistura de 70% de consulta e 30% de criação, 100 alvos
(5 salas × 20 janelas de 1 hora). Duração observada: 328,7 s. Total de 13.906 amostras (50 logins, 9.704 consultas e
4.152 criações).

## 3. Resultados

Rodada inteira (inclui o ramp-up):

| Operação | n | p50 (ms) | p95 (ms) | p99 (ms) | máx (ms) | vazão | Códigos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| consulta-disponibilidade | 9.704 | 26 | 76 | 588 | 1.663 | 29,5/s | 200: 9.704 |
| criar-reserva | 4.152 | 248 | **664** | 1.517 | 2.266 | 12,6/s | 201: 81; 409: 4.071 |
| login | 50 | 316 | 1.312 | 1.966 | 2.032 | 0,2/s | 200: 50 |

Só o regime (descartados os primeiros 35 s):

| Operação | n | p50 (ms) | p95 (ms) | p99 (ms) |
| --- | --- | --- | --- | --- |
| consulta-disponibilidade | 9.124 | 26 | 72 | 552 |
| criar-reserva | 3.907 | 247 | **622** | 1.441 |

p95 da criação por minuto: 1.228, 1.031, 394, 405, 603 e 474 ms. Ele cai depois do primeiro minuto e **continua acima de
300 ms em todos os minutos**.

## 4. Critérios da proposta

| Critério | Medido | Situação |
| --- | --- | --- |
| RNF-08a: consulta com p95 ≤ 300 ms | 76 ms (72 ms em regime) | **Atende** |
| RNF-08b: criação com p95 ≤ 300 ms | 664 ms (622 ms em regime) | **Não atende** |
| RNF-08c: erro real abaixo de 1% | 0 erros reais em 13.906 amostras (0,00%) | **Atende** |
| RNF-08d: criação nunca responde 500 | 0 respostas 500 | **Atende** |
| RNF-05 (carga): no máximo uma reserva aceita por recurso e intervalo | Ver seção 5 | **Atende** |

"Erro real" segue a definição do `rnf.md`: o 409 esperado não conta.

## 5. Conferência no banco

Consultas ao PostgreSQL depois da rodada:

| Verificação | Resultado |
| --- | --- |
| Pares (recurso, intervalo) com mais de uma ocupação ativa idêntica | 0 |
| Pares de ocupações ativas que se sobrepõem no mesmo recurso | 0 |
| Reservas aceitas na semana da rodada | 81, igual ao número de respostas 201 |
| Tentativas de conflito (`SOBREPOSICAO`) na semana da rodada | 4.071, igual ao número de respostas 409 |
| Reservas por estado | 114 APROVADA (81 da rodada e 33 do aquecimento) |

Nenhuma reserva duplicada sob 50 usuários disputando 100 pares. Cada recusa gravou exatamente uma tentativa de conflito
(RN-30). Nenhum motivo `CONCORRENCIA` apareceu: a verificação prévia em código barrou todas as recusas antes da
constraint, então esta rodada **não exerceu** o caminho do impasse (BUG-007).

## 6. Limites e observações da rodada

- **Cobertura dos alvos: 81 dos 100 pares receberam alguma reserva aceita.** O arquivo `alvos.csv` é lido de forma
  compartilhada e sequencial por todos os usuários, e a mistura 70/30 do Throughput Controller é periódica; juntos,
  deixam algumas linhas do CSV sem uma criação. Isso não invalida os resultados, mas a disputa não foi uniforme. A rodada
  02 deve sortear a linha em vez de percorrê-la em ordem.
- 98,0% das criações terminaram em 409 (4.071 de 4.152). A rodada mede sobretudo o **caminho de recusa**, não a criação
  bem-sucedida.
- O ambiente de 2 núcleos compartilhado com o JMeter e o Docker pode explicar parte do p95. Não há métrica de CPU nem do
  pool nesta rodada para separar as causas.

## 7. Hipótese de gargalo

> **Atualização (rodadas 02 a 04, [resultado-02.md](resultado-02.md)):** a hipótese abaixo, de saturação do pool de conexões, foi
> **refutada como causa principal**. Com 25 usuários o pool não teve espera e a mediana da criação quase não mudou; a rodada
> de diagnóstico localizou o custo no `fsync` do PostgreSQL em Docker. O texto original é mantido como registro.

**Hipótese (não confirmada):** a criação é cerca de 10 vezes mais lenta que a consulta (mediana de 247 ms contra 26 ms)
porque, no caminho de recusa que domina a rodada, cada pedido executa a verificação de conflito, a inserção que falha
na constraint, o desfazer da transação e uma **segunda transação** que grava a tentativa de conflito
(`ReservaService#registrarEConverter`), disputando as conexões do pool padrão do HikariCP com 50 usuários e uma CPU
compartilhada.

**Dado que a sustenta:** a diferença entre as medianas; o número de tentativas gravadas (4.071) igual ao de recusas, o que
mostra uma escrita extra por recusa; e o p95 estável entre 394 e 603 ms depois do aquecimento, o que indica custo por
requisição, e não só partida fria.

**O que a contradiz ou limita:** não há medição de CPU, de uso do pool nem de tempo no banco. A causa pode ser só a
saturação da CPU de 2 núcleos.

## 8. Próximo experimento

Rodada 02, **mudando uma variável por vez**:

1. Mesma carga, mas com **25 usuários**, para separar saturação (o p95 cairia muito) de custo por requisição (o p95
   cairia pouco).
2. Sortear a linha do `alvos.csv` em vez de percorrê-la, para que os 100 pares sejam disputados.
3. Expor as métricas do pool e medir a CPU durante a rodada.

Nenhuma mudança de código foi feita nem proposta como correção antes de medir, para não otimizar sem evidência.

## 9. Ligações

- Requisito: [rnf.md](rnf.md), RNF-08a a RNF-08d e RNF-05.
- Cenários: CEN-01 (cumprido sob carga) e CEN-04 (medido, não atende à hipótese), em
  [ciclo-01.md](../avaliacao-arquitetural/ciclo-01.md).
- Decisões: P5-01 a P5-03 em [decisoes-equipe.md](../decisoes-equipe.md).
- Ordem dos commits: o requisito foi commitado às 16:24 (`a20f489`), aprovado por Jefferson, e a rodada 01 foi feita às 17:39 (`3d032d5`).
