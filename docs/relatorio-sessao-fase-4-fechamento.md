# Relatório de sessão: fechamento da Fase 4 (17/10/2026)

Branch `fase-4/backend`. Substitui, no que diz respeito a números, o relatório da sessão anterior. Todo número vem
de execução desta sessão. Meta não atingida consta como não atingida.

## 1. Porta de saída da Fase 4

| Item | Situação | Evidência |
| --- | --- | --- |
| RF-01 a RF-14 do back end implementados | **Atingido**, com a ressalva de RF-13 (interface responsiva é da Fase 6) | RTM: 48 linhas "testado" e 1 "parcial" (RF-13), execução E-1 |
| `./mvnw -B verify` verde local | **Atingido** | 468 testes (136 de unidade e arquitetura, 332 de integração e BDD), 0 falhas, `BUILD SUCCESS` |
| `./mvnw -B verify` verde na CI | **Atingido para o PR 2.** Check `test` verde em 5m02s no run `39055557492`, com os commits desta sessão (push `67c2585..8ec54ea`) | `gh pr checks 2` |
| Gate do JaCoCo 80% e 70% | **Atingido e ligado** | 96,7% de linhas (1551/1604) e 84,6% de branches (438/518), "All coverage checks have been met" |
| Quality Gate do SonarCloud sem bug ou vulnerabilidade crítica | **Atingido** no PR 2 (status OK; notas A em confiabilidade, segurança e manutenibilidade; cobertura nova 93,9%). A 1ª análise reprovou por 3 apontamentos (S2699, S6437, S4502), tratados em `docs/decisoes-equipe.md` (SQ-01 a SQ-03) | `sonarcloud.io`, PR 2 |
| Concorrência verde 5 vezes seguidas | **Atingido.** 5 execuções consecutivas verdes de `ConcorrenciaApiIT` (7 testes cada) em 17/10/2026. Antes delas houve falhas intermitentes de **infraestrutura** (o contêiner do PostgreSQL estourou o tempo de inicialização no Docker local, `Timed out waiting for log output`), sem erro de asserção; a classe também passou em todas as execuções completas do `verify` e na CI | Logs `c4-3` a `c4-7` |
| Concorrência vista vermelha sem a constraint | **Atingido** | `ConcorrenciaApiIT#ct063` remove a constraint, mostra a duplicidade e a restaura |
| Matriz de autorização sem falha | **Atingido** | `AutorizacaoApiIT`, 137 casos, verdes (BUG-008 corrigido) |
| `evidencia-tdd.md` com vermelho antes de verde | **Parcial.** Há vermelho antes de verde por fatia e para BUG-007, BUG-008 e BUG-009; BDD, CT-106 e lacunas de risco nasceram verdes e estão declarados assim | [evidencia-tdd.md](testes/evidencia-tdd.md) |
| Toda linha crítica da RTM com teste e execução | **Atingido, com RF-13 parcial** | [RTM.md](../RTM.md) |

## 2. O que foi feito

- **Diagnóstico (Bloco A):** estado do git, PRs e CI; respostas (a) a (f); `verify` completo medido.
- **Arquitetura × código (B):** `arquitetura.md` (seções 10 e 10.3) e ADR-001, ADR-013, ADR-014 alinhados ao MVC e ao JDBC; diagramas renderizados (5 de 5). Imagem do PostgreSQL fixada por digest no `compose.yaml` e no Testcontainers.
- **Qualidade dos testes (C):**
  - Impasse 40P01: conferido contra RN-30 e ADR-003; **não é inflação**, nenhuma correção.
  - PIT configurado só como relatório no pacote `model`: 77% (60/78), 0 sobreviventes; 20 testes de risco novos; código morto removido ([mutacao.md](testes/mutacao.md)).
  - Cucumber 7.23.0: 15 cenários de aprovação e bloqueio, ligados à RTM, executados no failsafe ([bdd-aprovacao-bloqueio.md](testes/bdd-aprovacao-bloqueio.md)).
- **TDD (D):** a janela de não compareceu já existia; usado o CT-106 (troca do provedor), com 5 casos e 1 refactor, todos verdes de primeira e provados por falha injetada.
- **Defeito novo achado e corrigido:** **BUG-009** (falha ao gravar a tentativa de conflito derrubava o 409 em 500), com vermelho `0a80fc7` e verde `61ce37d`.
- **Documentação (E):** RTM preenchida, plano de teste com números medidos, `ciclo-01.md`, causa raiz de BUG-001 a BUG-009, `decisoes-equipe.md`, `perguntas-professor.md`, issues retroativas 3 a 8 abertas e fechadas.

## 3. O que NÃO foi feito

| Item | Motivo |
| --- | --- |
| ~~Quality Gate do SonarCloud~~ | **Feito.** Segredos e variáveis configurados pelo usuário; análise na CI |
| ~~Proteção da `main`~~ **Feita** | O repositório passou a público; proteção aplicada e conferida: check `test` obrigatório, PR obrigatório, 0 aprovações, vale para administrador, sem force push |
| Revisão assistida dos PRs 1 e 2 | **Feita** (comentários de revisão nos dois PRs, identificados como revisão assistida). **Merges feitos com confirmação do usuário**, em merge commit: PR 1 (`12310c3`) e PR 2 (`cd04ee6`), em 17/10/2026. O PR 2 foi atualizado com merge da `main` (sem rebase, para não reescrever o histórico) |
| `tutorial.md` e `update-tutorial` | O arquivo não existe no repositório e a skill `update-tutorial` não foi encontrada em `.aiox-core` nem em `.claude` |
| `analyze-docs` completa | Foram executadas só as verificações mecânicas (links relativos, fences, colunas de tabela, renderização Mermaid). Não foram feitas: ortografia, fidelidade à especificação, IDs cruzados, termos canônicos e números sem origem |
| Desempenho (CEN-04, R-21) | Fase 5 |
| R-23 com papel privilegiado | Teste não escrito |

## 4. Suposições abertas

Registradas em [decisoes-equipe.md](decisoes-equipe.md), seção 4: D1, D3, D4, D9, D17, granularidade em segundos, revisão por pares e as lacunas 1 a 8. Nenhuma bloqueia; todas têm o impacto e o teste que as isola.

## 5. Ações pendentes

**Do usuário:**

1. Ratificar as linhas "aceitas em bloco" de `decisoes-equipe.md`, uma a uma, e SQ-03 (CSRF desligado, aceito com justificativa).
2. Revogar o token do SonarCloud que foi colado na conversa (já substituído por outro no GitHub), se ainda não fez.
3. Responder ao professor (abaixo) e decidir cada lacuna com as alternativas que eu mostrar.

**Do professor:** a mensagem única está em [perguntas-professor.md](perguntas-professor.md) (A1 a A8, D1, D3, D4, D9, D17, revisão por pares e precisão em segundos).

## 6. Próximo passo

Fase 5: carga com JMeter e testes de segurança e robustez, depois Fase 6 (front end React) e Fase 7. Os Blocos F e G estão concluídos.
