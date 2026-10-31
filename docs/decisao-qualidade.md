# Decisão de qualidade

Decisão de qualidade do projeto **Organização de Recursos** para o release candidate. Fonte das metas e dos limitadores: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seções "Metas mensuráveis" e "Avaliação". O relatório [relatorio-qualidade.md](relatorio-qualidade.md) traz os dados e **não repete** esta decisão; o índice das provas está em [evidencias/README.md](evidencias/README.md).

## 1. Decisão

| Item | Valor |
| --- | --- |
| **Decisão** | **LIBERAR COM RESSALVAS** |
| Quem decidiu | Jefferson Silva Geronimo, em 24/10/2026, reafirmada em 31/10/2026 para a `v1.0.0-rc4` (declaração abaixo; reafirmações anteriores em "Histórico da decisão") |
| A que se refere | Release candidate **`v1.0.0-rc4`**, definitivo, a tag avaliada, que corrige o BUG-028 (código e testes) em relação às execuções E-25 e E-26 e traz a documentação verificada; a configuração padrão não muda. O commit se obtém com `git rev-list -n 1 v1.0.0-rc4`; a [Release v1.0.0-rc4](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/releases/tag/v1.0.0-rc4) traz o hash, o run da CI e os números dessa revisão |
| Execução da CI na E-25 | Run [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577): `test`, `frontend`, `e2e` e `segredos` verdes (E-25, [execucao-e25.md](testes/execucao-e25.md)) |
| Quality Gate do SonarCloud na E-25 | **OK**: 0 bugs, 0 vulnerabilidades, 0 code smells |
| Números da `v1.0.0-rc4` | (a registrar no PR B), da execução E-27; as execuções anteriores E-25 e E-26 (código sem a correção do BUG-028) estão em [execucao-e25.md](testes/execucao-e25.md) e [execucao-e26.md](testes/execucao-e26.md) |
| Alcance | **Avaliação da disciplina.** Não é "pronto para produção": os testes e as medições foram feitos em ambiente local e na CI, em um computador de desenvolvimento, sem ambiente de implantação, sem TLS, sem HSTS, sem CSP e sem limitação de taxa ([limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md)) |

**Por que "liberar com ressalvas" e não "liberar" nem "não liberar".** Os quatro limitadores de nota e as quatro metas mensuráveis têm evidência, mas há metas não atingidas e riscos aceitos que um avaliador precisa ver (seção 4). "Liberar" sem ressalvas exigiria o professor validar a hipótese de 300 ms ou o RNF-08b medido em outro ambiente dentro da meta.

**Reafirmação.** "Em 31/10/2026, eu, Jefferson Silva Geronimo, reafirmo a decisão de qualidade LIBERAR COM RESSALVAS para o release candidate v1.0.0-rc4, que corrige o defeito BUG-028 (o agendamento do despacho de notificações dependia do outro agendador), com teste de regressão, e cuja documentação foi corrigida e verificada contra o código, a CI e a aplicação em execução, com as ressalvas e os riscos aceitos desta decisão. A v1.0.0-rc4 é a tag avaliada."

**O que mudaria a decisão para "não liberar":** qualquer limitador deixar de valer (por exemplo, o clone limpo não subir na revisão avaliada), check obrigatório vermelho na `main`, alerta crítico aberto no Maven ou no front, ou uma decisão de alto impacto da equipe (a A3, de maior retrabalho) se mostrar errada.

**Ocorrência de 26/10/2026.** O run `40379344363` (push na `main`, commit `e0ab982`) teve o job `e2e` vermelho por falha temporária de rede no build da imagem, com nenhum teste executado. Os runs seguintes estão verdes. A ocorrência foi avaliada e **não altera a decisão**, porque o critério acima trata de check vermelho persistente ou causado por código ou teste. Registro em [testes/ocorrencias-a-vigiar.md](testes/ocorrencias-a-vigiar.md), ocorrência I-1.

### Histórico da decisão

**Reafirmação para a rc2.** "Em 26/10/2026, eu, Jefferson Silva Geronimo, reafirmo a decisão de qualidade LIBERAR COM RESSALVAS para o release candidate v1.0.0-rc2 (commit d2b6af1), com as ressalvas e os riscos aceitos desta decisão."

**Reafirmação para a rc3.** "Em 28/10/2026, eu, Jefferson Silva Geronimo, reafirmo a decisão de qualidade LIBERAR COM RESSALVAS para o release candidate v1.0.0-rc3, que contém o mesmo código, os mesmos testes e a mesma configuração da v1.0.0-rc2 (d2b6af1) e difere dela apenas pela documentação, com as ressalvas e os riscos aceitos desta decisão. A v1.0.0-rc3 passa a ser a tag avaliada; a v1.0.0-rc2 e a v1.0.0-rc1 permanecem como histórico."

## 2. Critérios e evidência

### 2.1 Limitadores de nota

| Critério | Resultado | Evidência |
| --- | --- | --- |
| Aplicação que não executa | **Atendido** | Clone limpo da execução E-25 sobe seguindo só o README, com o `verify` passando em 539 s ([limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 2.6; a primeira tentativa falhou por ambiente, sem alterar o repositório); a prova anterior está na seção 2.5; `./mvnw -B verify` com 5 execuções consecutivas verdes em clone novo (F7-19); defeito real BUG-019 achado e corrigido |
| Pipeline ausente | **Atendido** | [ci.yml](../.github/workflows/ci.yml); `main` protegida com `test`, `frontend`, `e2e` e `segredos` obrigatórios e SonarCloud verde como regra de trabalho; vermelho intencional que barrou o merge ([limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 3) |
| Falha de autorização | **Atendido** | `AutorizacaoApiIT.ct117` (141 casos) contra [matriz-autorizacao.md](testes/matriz-autorizacao.md); matriz fica vermelha quando a autorização é quebrada ([mutacao-manual.md](testes/mutacao-manual.md), experimentos 11 e 12) |
| Possibilidade de dupla reserva | **Atendido** | `ConcorrenciaApiIT` verde (7 de 7) e vermelho sem a constraint (7 de 7 falhas por asserção) |

### 2.2 Metas mensuráveis

| Meta | Valor | Resultado | Evidência |
| --- | --- | --- | --- |
| Cobertura de linhas, 80% | (a registrar no PR B) | Meta a cumprir | JaCoCo da execução E-27; [leitura-final-cobertura.md](testes/leitura-final-cobertura.md) |
| Cobertura de branches, 70% | (a registrar no PR B); varia entre execuções de código idêntico (de 519 a 523 de 602 antes da rc4) | Meta a cumprir | JaCoCo da execução E-27 |
| Requisitos críticos na RTM, 100% | 22 de 22 linhas críticas com teste e execução verde; 22 de 22 com prova de que o teste falha quando a regra quebra | Atingida quanto à presença, ao status e à execução verde; a prova de mutação cobre 22 de 22 | [auditoria-rtm.md](testes/auditoria-rtm.md), seção 8; [mutacao-manual.md](testes/mutacao-manual.md), seção 10; [status-requisitos.md](status-requisitos.md) |
| Bugs ou vulnerabilidades críticos, 0 | 0 bugs, 0 vulnerabilidades e 0 issues abertas no SonarCloud (Quality Gate aprovado); 0 alertas do Dependabot no Maven e 0 no front; nenhum defeito aberto de severidade crítica ou alta | Atingida | [leitura-final-cobertura.md](testes/leitura-final-cobertura.md); [alertas-dependabot.md](testes/alertas-dependabot.md); [defeitos/README.md](defeitos/README.md) |

A cobertura alta não prova qualidade dos testes (a própria especificação avisa); por isso a prova de mutação foi feita nas regras críticas.

### 2.3 Entregáveis

Os 12 entregáveis da seção "Entregáveis" da especificação estão conferidos, um a um, em [entrega/checklist.md](entrega/checklist.md), com os bloqueadores. A apresentação e a demonstração são feitas pelo autor, fora do repositório.

## 3. Estado dos testes

Back end, front e E2E na revisão avaliada: (a registrar no PR B); 0 falhas é a condição para a tag. Históricos: [execucao-e25.md](testes/execucao-e25.md) e [execucao-e26.md](testes/execucao-e26.md). O `./mvnw -B verify` leva de 519 s a 1522 s na máquina de desenvolvimento, conforme a carga. Todos os números vêm de execuções da CI ou de logs citados nos documentos de origem.

## 4. Riscos aceitos

Todos têm como responsável **Jefferson Silva Geronimo**, autor e único integrante da equipe. A lista completa, com origem de cada item, está em [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md).

| Risco aceito | Impacto | Justificativa |
| --- | --- | --- |
| **RNF-08b não atendido**: criação de reserva com p95 de 568 a 886 ms contra 300 ms com 50 usuários | Lentidão sob carga; meta de desempenho não cumprida | Causa atribuída ao `fsync` do PostgreSQL em Docker (sem `fsync`, p95 de 87 ms, rodada de diagnóstico que não vale como resultado); um só ambiente; a hipótese de 300 ms é da Aula 10 e não foi validada pelo professor ([resultado-02.md](performance/resultado-02.md)) |
| **R-25 aberto**: `NotificacaoApiIT.int01ECt103` falhou 3 vezes de forma intermitente | A CI pode ficar vermelha sem defeito real; regra de repetir o job uma única vez | Causa não encontrada; BUG-017 mitigado pelo R-26, não corrigido; a notificação em si funciona (INT-01 a INT-06). A issue 39 foi fechada como "not planned" em 26/10/2026 (F7-20), com estas evidências: 114 runs do workflow `qualidade` desde 22/10/2026 sem falha de `NotificacaoApiIT` e 10 execuções consecutivas verdes das duas classes de notificação; a causa continua desconhecida e o BUG-017 segue "mitigado, não corrigido". A regra de repetir o job uma única vez continua para falha desse teste |
| **Intermitência de rede no build do e2e** | CI vermelha sem defeito do produto (um run, 26/10/2026) | Ocorrência única, recuperada no push seguinte, de causa de rede; sem alteração do `Dockerfile`; dívida declarada em [limitacoes-e-divida-tecnica.md](limitacoes-e-divida-tecnica.md). Responsável: Jefferson Silva Geronimo |
| **Agendadores desligados por padrão e configuração opcional por SQL** (RF-11, RN-25, D1, D3) | Sem as propriedades `app.jobs.*` a notificação fica PENDENTE e a reserva sem decisão não é cancelada sozinha; sem a tolerância e o intervalo de reenvio na tabela `configuracao`, o não comparecimento é recusado (`TOLERANCIA_NAO_CONFIGURADA`) e uma notificação que falha não é reenviada | Os valores não têm origem na especificação (lacunas D1 e D3); cada agendador liga sozinho depois da correção do BUG-028; os comandos estão no README, seção "Configuração opcional", e foram verificados ao vivo ([limitadores-de-nota.md](testes/limitadores-de-nota.md)) |
| **Variação de branches no JaCoCo entre execuções de código idêntico** | A cobertura de branches mudou até 4 entre execuções do mesmo código (de 519 a 523 de 602 antes da rc4), em `JdbcConfiguracaoRepository` e em `ReservaService` | A meta de 70% é atendida em todas as medidas; causa em hipótese (ordem das classes e estado compartilhado entre testes), dívida técnica declarada ([leitura-final-cobertura.md](testes/leitura-final-cobertura.md), seção 9) |
| **Front sem cobertura medida** | Regressão no front não aparece em número | 910 testes de componente, 5 E2E e `lint` e `typecheck` na CI; medir é evolução |
| **Lacunas decididas pela equipe, sem validação externa** (A1 a A8, D1, D3, D4, D9, D17, entre outras); a maior em retrabalho é a A3; a D14 é brecha funcional conhecida; a D9 é risco de privacidade | Retrabalho se a decisão estiver errada; troca de perfil pode deixar um só Responsável; nada é apagado nem anonimizado | Sem resposta do professor, a equipe decidiu com impacto e teste declarados ([decisoes-equipe.md](decisoes-equipe.md), F7-16 e F7-17) |
| **"Revisão por pares" é revisão assistida** | Nenhum segundo humano revisou o código | Equipe de uma pessoa; cada pull request teve checks obrigatórios e revisão assistida registrada |
| **RF-13 parcial** | Responsividade provada por uma jornada E2E no Chromium; o resto por roteiro manual | Limitação declarada ([status-requisitos.md](status-requisitos.md)) |
| **R-23**: a aplicação usa o papel dono das tabelas, que poderia desligar o gatilho da auditoria | Auditoria alterável por quem tem privilégio de banco | Separar os papéis de migração e de aplicação é dívida técnica; o gatilho bloqueia `UPDATE` e `DELETE` (`EsquemaIT.ct011`) |
| **Alertas do Dependabot** em `.aiox-core/` (framework), 0 no Maven e 0 no front; o número está em [alertas-dependabot.md](testes/alertas-dependabot.md) | Dependências com alerta no painel de diagnóstico do framework, fora das imagens e da CI do produto | [alertas-dependabot.md](testes/alertas-dependabot.md) |
| **SBOM e alerta de segurança além do log (SEC-03, SEC-04)**; `unzip` sem versão fixada no `Dockerfile`; **TLS, HSTS, CSP e limitação de taxa** sem ambiente de implantação | Superfície de segurança menor do que a de um sistema em produção | Dívida técnica declarada; o produto é avaliado, não implantado |
| **Desempenho do `verify`** e outros computadores | O `verify` passou em um computador; outros sistemas não foram provados | Medido em 5 execuções consecutivas verdes (F7-19); tempo varia de 519 s a 1522 s |

## 5. Declaração de autoria

**Nome completo do autor:** Jefferson Silva Geronimo

Jefferson Silva Geronimo é o único integrante da equipe e autor do projeto. Definiu o escopo, tomou as decisões da equipe (lacunas A1 a A8, decisões B, C e D, e as decisões de cada fase), aceitou os riscos residuais listados neste documento, autorizou cada merge e a tag do release candidate e tomou a decisão de qualidade. O desenvolvimento (código, testes, documentação e análises) foi feito com o Claude Code (Anthropic), agente de código que foi a base de todo o trabalho, sob a direção, a revisão e a aprovação do autor. O GitHub Copilot não foi usado. Por ser uma equipe de uma pessoa, não houve revisão por par humano: cada pull request recebeu revisão assistida, registrada como tal.
