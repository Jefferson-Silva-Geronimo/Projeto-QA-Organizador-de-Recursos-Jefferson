# Requisito de desempenho e modelo de carga (Fase 5)

**Estado: PROPOSTA, aguardando aprovação de Jefferson antes da primeira rodada.** Nenhum número abaixo foi validado
pelo professor. A especificação não define critério de desempenho: ela pede "plano e resultado do teste de carga" e,
no cronograma, "reservas simultâneas do mesmo recurso sob carga" (semana 42). Decisões de origem: P5-01 e P5-02 em
[decisoes-equipe.md](../decisoes-equipe.md).

Classificação de cada afirmação:

| Rótulo | Significado |
| --- | --- |
| Fato | Está na especificação ou no código, com a fonte |
| Hipótese | Valor de exemplo da [Aula 10](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/material/material_testes-carga-jmeter.html), herdado de RNF-08 e CEN-04, sem validação |
| Proposta | Valor sugerido nesta fase para o grupo aprovar; sem origem em requisito |

## 1. Requisito proposto

| ID | Requisito | Rótulo | Origem |
| --- | --- | --- | --- |
| RNF-08a | A consulta de disponibilidade responde com p95 de até 300 ms com 50 usuários simultâneos | Hipótese | RNF-08, CEN-04, Aula 10 |
| RNF-08b | A criação de reserva responde com p95 de até 300 ms com 50 usuários simultâneos | Hipótese | RNF-08, CEN-04, Aula 10 |
| RNF-08c | A taxa de erro real fica abaixo de 1%. **Erro real** é: consulta diferente de 200; criação diferente de 201 e de 409. O 409 esperado não conta como erro | Hipótese | RNF-08 |
| RNF-08d | A criação de reserva **nunca** responde 500 | Proposta | Plano mestre, 9.1; RF-06 |
| RNF-05 (carga) | Depois da rodada, o banco tem no máximo **uma** reserva aceita por recurso e intervalo disputado | Fato | RN-03, RF-06 (a verificação por SQL é nova) |

Decisão da rodada: **atende** se RNF-08a a RNF-08d e RNF-05 valerem; **não atende** se qualquer um falhar;
**inconclusivo** se a rodada for interrompida ou o ambiente variar. O resultado final dirá "atende" ou "não atende"
**à hipótese**, e o relatório declara que o professor ainda não a validou.

## 2. Modelo de carga proposto

| Parâmetro | Valor proposto | Rótulo | Observação |
| --- | --- | --- | --- |
| Usuários simultâneos | 50 | Hipótese | Valor de RNF-08 |
| Ramp-up | 30 s, até os 50 usuários | Proposta | Evita medir a partida fria como regime |
| Duração em regime | 5 min (300 s) depois do ramp-up | Proposta | Cerca de 250 a 300 iterações por usuário com a pausa abaixo |
| Pausa entre iterações | 1 s fixa | Proposta | Simula uso humano mínimo |
| Mistura por iteração | 70% consulta de disponibilidade, 30% criação de reserva | Proposta | Mais leitura que escrita; a criação é a operação crítica |
| Alvos disputados | 5 salas × 20 janelas de 1 hora = 100 pares (recurso, intervalo); cada criação sorteia um par | Proposta | Garante disputa real: no máximo 100 reservas aceitas; o resto deve dar 409 |
| Usuários | 50 Solicitantes fictícios (`perf/usuarios.csv`), um login por thread | Proposta | Nunca dados reais |
| Modo | CLI (`jmeter -n`), contra a aplicação local | Fato | Plano mestre, 9.1: nunca contra ambiente compartilhado |
| Aquecimento | 1 rodada curta descartada antes da rodada 01 | Proposta | Elimina o efeito da JVM fria |

### Operações

| Operação | Chamada | Asserção |
| --- | --- | --- |
| Login | `POST /api/auth/login`, extrai `token` do JSON | 200 |
| Consulta de disponibilidade | `GET /api/recursos?tipo=SALA&inicio=<UTC>&fim=<UTC>` com `Authorization: Bearer` | 200 |
| Criação de reserva | `POST /api/reservas` com `titulo`, `inicio`, `fim` e `recursoIds` de uma sala sorteada | 201 **ou** 409; nunca 500 |

As janelas ficam em dias úteis futuros, dentro do horário de funcionamento das salas (RN-14), para que a recusa seja
por sobreposição (409) e não por janela (400).

## 3. Ambiente e limites da conclusão

- Máquina local de Jefferson, PostgreSQL 17 em contêiner (imagem por digest), aplicação em `java -jar`.
- Pool de conexões: padrão do HikariCP (**não configurado no projeto**; ponto de sensibilidade PS-01 do ciclo 00).
- **A conclusão vale somente para esta máquina e este commit.** Nada se afirma sobre produção nem sobre outro hardware.
- O JMeter consome a mesma máquina da aplicação. Isso pode distorcer o p95 e será declarado no resultado.
- A rodada registra: máquina, versão do JMeter, commit, data e carga aplicada.

## 4. Verificações depois da rodada

1. Por operação: p50, p95, p99, vazão e taxa de erro; 409 separado do erro real.
2. SQL no banco: nenhum par (recurso, intervalo) com mais de uma ocupação ativa; contagem de reservas aceitas.
3. Contagem de tentativas de conflito (`tentativas_conflito`) comparada com o número de 409.
4. Zero respostas 500.

## 5. Itens que dependem de aprovação

| # | Pergunta | Proposta | Sua decisão |
| --- | --- | --- | --- |
| 1 | Usuários, ramp-up e duração | 50 usuários, 30 s, 5 min | Aprovar ou alterar |
| 2 | Mistura de operações | 70% consulta, 30% criação | Aprovar ou alterar |
| 3 | Alvos disputados | 5 salas × 20 janelas | Aprovar ou alterar |
| 4 | Critérios RNF-08a a RNF-08d | p95 de 300 ms, erro abaixo de 1%, zero 500 | Aprovar ou alterar |
