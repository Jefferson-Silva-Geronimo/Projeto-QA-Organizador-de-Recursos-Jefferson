# Relatório de sessão: fechamento da Fase 5 (17/10/2026)

Fase 5 do plano mestre (não funcionais: carga, segurança e robustez). Todo número vem de execução desta sessão. Meta não
atingida consta como não atingida. Estado do repositório: `main` com todos os pull requests da fase mesclados e as branches
de fase apagadas.

## 1. Porta de saída da Fase 5 (plano mestre, seção 9)

| Item | Situação | Evidência |
| --- | --- | --- |
| O requisito de desempenho foi escrito e marcado como proposta antes da primeira rodada | **Atingido** | [rnf.md](performance/rnf.md): proposta commitada às 16:24 (`a20f489`), aprovada por Jefferson, rodada 01 às 17:39 (`3d032d5`) |
| Existe `rodada-01` com resultado, decisão e limite da conclusão escritos, e a criação de reserva não respondeu 500 | **Atingido** | [resultado-01.md](performance/resultado-01.md): 0 resposta 500, 0 erro real. A decisão é **não atende** à hipótese, e o limite (esta máquina) está escrito |
| O banco confirma no máximo uma reserva aceita por recurso e intervalo depois da carga | **Atingido** | Rodadas 01 a 04: 0 sobreposição e 0 par duplicado; reservas aceitas = respostas 201; tentativas gravadas = respostas 409 |
| `revisao-seguranca.md` sem falha aberta e SonarCloud sem vulnerabilidade crítica | **Atingido** | [revisao-seguranca.md](testes/revisao-seguranca.md): 0 falha (OWASP Top 10:2025); Quality Gate do SonarCloud OK em todos os pull requests da fase |
| As linhas de RNF-05 a RNF-09 da RTM apontam para teste e execução | **Atingido** | Tabela de RNF em [RTM.md](../RTM.md): 5 testadas e RNF-08 medida |

**Meta da hipótese não atingida:** RNF-08b (criação de reserva com p95 de até 300 ms) **não é atendido** nesta máquina em
configuração durável (p95 de 568 a 886 ms). Os demais critérios de RNF-08 (consulta, erro real, zero 500) e RNF-05 são
atendidos. A hipótese de 300 ms vem da Aula 10 e **não foi validada pelo professor**.

## 2. O que foi feito

- **Carga (P5-01 a P5-03, F5-01):** requisito e modelo de carga aprovados; JMeter 5.6.3 com SHA-512 conferido; plano
  `perf/reservas.jmx`; rodadas 01 a 04. A rodada 04 é diagnóstico (PostgreSQL sem `fsync`) e **não vale como resultado**.
  Causa do p95 acima de 300 ms: o `fsync` do PostgreSQL em Docker nesta máquina (mediana da criação de 241 ms para 31 ms sem
  `fsync`). A hipótese de saturação do pool, levantada na rodada 01, foi **refutada**. Nenhuma otimização de código foi feita
  ([resultado-02.md](performance/resultado-02.md)).
- **Segurança (P5-04 a P5-10):**
  - revisão pelo OWASP Top 10:2025 (3 atendidas e 7 parciais, sem falha aberta);
  - CORS restrito por variável, sem padrão e sem curinga;
  - correlação de logs e log de falha interna sem a mensagem do banco;
  - gitleaks na CI com checksum conferido;
  - secret scanning e alertas do GitHub ativos;
  - Dependabot (Maven) que ignora saltos de versão do Spring Boot e do springdoc;
  - teste do papel de banco que não é dono da tabela (R-23);
  - **limite de tentativas de login** (SEC-01): 5 tentativas em 10 minutos por conta.
- **Defeito achado e corrigido:** BUG-009 (falha ao gravar a tentativa de conflito derrubava o 409), na Fase 4.
- **Qualidade documental (F5-02):** `analyze-docs` completo; CT-122 definido; 19 diagramas Mermaid renderizados; DBML no parser;
  RF-01 a RF-14 e RN-01 a RN-08 idênticos à especificação; `TODO` sem motivo resolvidos.
- **Processo:** 4 pull requests de dependência tratados sem violar a especificação (Spring Boot 4.x e springdoc 3.x recusados);
  branches mescladas apagadas (F5-03).

## 3. Números desta fase

| Medida | Valor |
| --- | --- |
| Testes (última execução completa do `verify`) | 506: 154 de unidade e arquitetura e 352 de integração e BDD, 0 falhas |
| Cobertura | 96,0% de linhas (1568/1633) e 84,9% de branches (460/542); gate de 80% e 70% cumprido |
| Pull requests da fase mesclados | #10, #11, #12, #15 e #17 (merge commit, sem rebase) |
| Pull requests de dependência fechados sem mesclar | #13, #14 e #16 |

## 4. O que NÃO foi feito, ou ficou limitado

| Item | Motivo |
| --- | --- |
| Validar a hipótese de 300 ms com o professor | Depende dele |
| Repetir a carga em outra máquina ou em disco rápido | O projeto não tem outro ambiente; não bloqueia a Fase 6 |
| Repetição de cada rodada | Cada rodada foi executada uma vez; a variação é desconhecida |
| SBOM e soma de verificação do Maven no wrapper (SEC-03) | Previsto para a Fase 7 |
| Alerta de segurança além do log (SEC-04) | Previsto para a Fase 7 |
| Modelo de ameaças formal (A06) | Opcional, Fase 7 |
| `tutorial.md` | Não se aplica a esta fase (decisão F5-04) |
| Revisão por pares | Projeto de uma pessoa; substituída por autorrevisão e revisão assistida (P5-09). A pergunta ao professor segue em [perguntas-professor.md](perguntas-professor.md) |

## 5. Suposições e riscos abertos

- **R-23 aceito por Jefferson:** a aplicação usa o papel dono das tabelas, que pode desligar o gatilho da auditoria. A opção
  B (papéis separados de migração e de aplicação) está na dívida técnica do relatório final.
- **Limite de login:** um atacante pode bloquear a conta de outra pessoa de propósito; tentativas simultâneas podem passar de N
  por pouco. O e-mail da falha fica guardado durante a janela (lacuna D9).
- **Lacunas sem resposta do professor** (sem bloqueio): A1 a A8, D1, D3, D4, D9 e D17, com a suposição de cada uma em
  [decisoes-equipe.md](decisoes-equipe.md).

## 6. Ações pendentes

**Do usuário:**
1. Revogar o token do SonarCloud que foi colado na conversa, se ainda não o fez (já foi substituído no GitHub).
2. Responder ao professor, se quiser; para cada ponto, as alternativas são mostradas conforme a especificação e a decisão é sua.

**Do professor:** as perguntas estão prontas em [perguntas-professor.md](perguntas-professor.md).

## 7. Próximo passo: Fase 6 (front end React + Vite)

As pré-condições do plano mestre estão cumpridas: contrato OpenAPI estável (`docs/api/openapi.json`, conferido por teste),
códigos de erro padronizados (ADR-008), CORS configurado (variável `CORS_ORIGENS`, sem padrão) e autorização testada
(matriz com 137 casos). A Fase 6 constrói as telas das jornadas das personas, fecha o RF-13 (hoje "parcial" na RTM, porque a
interface responsiva ainda não existe) e o teste ponta a ponta em viewport de celular (RNF-10). Ao criar `frontend/`, incluir
o ecossistema npm no `dependabot.yml` e a origem do Vite no `.env.example` e no compose, conforme a decisão P5-06.
