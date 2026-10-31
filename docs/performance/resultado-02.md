# Resultado das rodadas 02, 03 e 04 (Fase 5)

Executadas em 17/10/2026 (22:00Z a 22:24Z), contra a aplicação local, para separar o efeito da máquina do custo por
requisição, como decidido em F5-01 ([decisoes-equipe.md](../decisoes-equipe.md)). Requisito e modelo de carga em
[rnf.md](rnf.md); rodada 01 em [resultado-01.md](resultado-01.md). Resultados brutos em `perf/resultados/` e análise
reprodutível com `perf/analisar_rodada.py`.

**Decisão:** o requisito RNF-08b (criação com p95 de até 300 ms) **continua NÃO ATENDIDO na configuração padrão desta
máquina**, em todas as rodadas válidas. A causa foi localizada: o **custo de gravar no disco (`fsync`) do PostgreSQL em
Docker neste notebook**, não o código. Os números seguem sendo hipótese não validada pelo professor, e a conclusão vale só
para esta máquina e este commit.

## 1. O que mudou entre as rodadas

Uma variável por vez em relação à anterior, exceto a rodada 02, que corrige o sorteio dos alvos:

| Rodada | Usuários | Alvos | PostgreSQL | Métricas | O que testa |
| --- | --- | --- | --- | --- | --- |
| 01 | 50 | Sequencial (81 de 100 disputados) | Padrão | Não | Linha de base |
| 02 | 50 | **Sorteados** (100 de 100) | Padrão | **Sim** | Corrige a cobertura dos alvos; mede CPU e pool |
| 03 | **25** | Sorteados | Padrão | Sim | Separa saturação de custo por requisição |
| 04 | 25 | Sorteados | **`fsync=off`, `synchronous_commit=off`, `full_page_writes=off`** | Sim | **Diagnóstico**: quanto pesa o disco |

A rodada 04 é **só diagnóstico**. Desligar o `fsync` é inseguro para dados reais (perde-se dado em queda), então ela **não**
vale como resultado do requisito e a aplicação não foi alterada.

## 2. Ambiente

Igual ao da rodada 01 (notebook Intel Core i5-7200U, 2 núcleos e 4 threads, 19,9 GB de RAM, Windows 11; Java 21.0.6;
PostgreSQL 17 em contêiner por digest, Docker 29.8.2; JMeter 5.6.3; pool padrão do HikariCP com 10 conexões). Commit: `main`
em `0f5bef3` mais a branch de fechamento (só documentação e scripts de carga). Cada rodada partiu de **banco e
aplicação novos**, com uma rodada de aquecimento descartada (20 usuários, 45 s).

## 3. Resultados

Só o regime (descartados os primeiros 35 s), que é o que compara com o requisito:

| Rodada | Operação | n | p50 (ms) | p95 (ms) | p99 (ms) | Vazão |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | consulta | 9.124 | 26 | 72 | 552 | 31,1/s |
| 01 | criação | 3.907 | 247 | **622** | 1.441 | 13,3/s |
| 02 | consulta | 8.942 | 17 | 152 | 583 | 30,4/s |
| 02 | criação | 3.832 | 289 | **886** | 1.699 | 13,0/s |
| 03 | consulta | 4.639 | 16 | 55 | 80 | 15,8/s |
| 03 | criação | 1.987 | 238 | **568** | 867 | 6,8/s |
| 04 (diagnóstico) | consulta | 4.929 | 25 | 76 | 130 | 16,8/s |
| 04 (diagnóstico) | criação | 2.112 | **31** | **87** | 149 | 7,2/s |

A vazão é a do recorte do regime: amostras depois dos primeiros 35 s divididas pela duração observada menos 35 s (`perf/analisar_rodada.py`; as rodadas 01 e 02 duraram 328,7 s cada, ou seja, 293,7 s de regime). Recalculada do `rodada-01.jtl`, a rodada 01 dá 31,1/s na consulta e 13,3/s na criação; as edições anteriores traziam 30,4/s e 13,0/s, que não conferem com esse arquivo, e a origem desses dois valores não foi identificada. As rodadas 02 a 04 conferem com o recálculo. Percentis e contagens da rodada 01 não mudam.

Em todas as rodadas: **0 erro real, 0 resposta 500, 0 sobreposição no banco, 0 par duplicado**, e cada recusa 409 gerou
exatamente uma linha em `tentativas_conflito` (as contagens batem com as respostas 409).

Conferência no banco (rodadas 02 a 04): 100 reservas aceitas em 100 pares disputados; 3.979, 1.999 e 2.155 recusas
(02, 03 e 04). Na rodada 02 apareceram 4 recusas por `CONCORRENCIA` e na 04 uma: é a **primeira vez que o caminho do
impasse (40P01, BUG-007) é exercido sob carga**, e o sistema respondeu 409.

## 4. Métricas da aplicação

Coletadas a cada 5 s por `perf/coletar_metricas.py`:

| Rodada | CPU da máquina (média / máx) | CPU da JVM (média / máx) | Pool ativo (média / máx) | Pool pendente (média / máx) |
| --- | --- | --- | --- | --- |
| 02 (50 usuários) | 52% / 88% | 6% / 38% | 5,0 / 10 | 0,9 / **30** |
| 03 (25 usuários) | 42% / 71% | 5% / 13% | 2,0 / 9 | **0 / 0** |
| 04 (25, sem `fsync`) | 38% / 84% | 5% / 59% | 0,7 / 9 | 0 / 0 |

Na rodada 02, 26 das 84 linhas do arquivo de métricas foram **descartadas**: duas tentativas anteriores da rodada (falhas do
roteiro, sem dado de carga) deixaram coletores vivos que escreveram linhas vazias no mesmo arquivo. As 58 linhas válidas
são consistentes. O roteiro passou a encerrar coletores antigos antes de cada rodada.

## 5. Leitura

1. **A hipótese da rodada 01 (saturação do pool) está refutada como causa principal.** Com 25 usuários o pool não teve
   nenhuma espera, mas a mediana da criação praticamente não mudou (241 ms contra 289 ms com 50 usuários) e o p95 do regime
   seguiu em 568 ms. O custo é por requisição, não de concorrência. O pool chega a ter espera com 50 usuários (pico de 30
   threads), o que agrava a cauda, mas não explica a mediana.
2. **A CPU da aplicação é baixa** (média de 5% a 6%), então não é o código que consome o tempo.
3. **A rodada 04 localiza a causa:** sem esperar o disco, a mediana cai de 241 ms para 31 ms e o p95 de 568 ms para 87 ms,
   com a mesma carga e o mesmo código. O tempo está na confirmação de gravação (`fsync`) do PostgreSQL em Docker nesta
   máquina. A consulta, que só lê, quase não mudou (p95 de 55 para 76 ms, dentro do ruído).
4. **Consequência para o requisito:** na configuração padrão (durável) desta máquina, RNF-08b não é atendido. Em disco mais
   rápido a mesma aplicação ficaria bem abaixo de 300 ms, mas isso é uma **inferência da rodada de diagnóstico, não um
   resultado**: ela usou uma configuração insegura e não foi repetida em outra máquina.
5. **Não há otimização de código justificada pelos dados** (F5-01 só admitia otimização se o dado apontasse o código).
   Nenhuma alteração de produção foi feita.

## 6. Limites desta análise

- Cada rodada foi executada **uma vez**. Não se conhece a variação entre execuções.
- O JMeter, a aplicação, o PostgreSQL e o Docker dividem a mesma máquina de 2 núcleos; o sorteio em Groovy e o coletor de
  métricas consomem um pouco dela.
- A atribuição ao `fsync` vem de **uma** comparação (rodada 03 contra 04), com uma única variável alterada. Ela não mede o
  disco diretamente (por exemplo, com `pg_test_fsync`).
- A rodada 04 não vale como resultado do requisito.

## 7. Próximo passo possível

Para fechar RNF-08b com evidência de que o limite é do ambiente, repetir a rodada de 50 usuários em **outra máquina ou em
disco rápido**, em configuração durável. Isso depende de ambiente que o projeto não tem e **não bloqueia** a Fase 6. Até lá, o
relatório final declara: "RNF-08b não atendido nesta máquina; causa atribuída ao `fsync` do PostgreSQL em Docker; hipótese de
300 ms não validada pelo professor".

## 8. Ligações

- Requisito: [rnf.md](rnf.md), RNF-08a a RNF-08d e RNF-05.
- Rodada anterior: [resultado-01.md](resultado-01.md) (a hipótese de saturação do pool, da seção 7 dela, foi refutada aqui).
- Cenários: CEN-01 (cumprido sob carga, inclusive pelo caminho do impasse) e CEN-04, em
  [ciclo-01.md](../avaliacao-arquitetural/ciclo-01.md).
