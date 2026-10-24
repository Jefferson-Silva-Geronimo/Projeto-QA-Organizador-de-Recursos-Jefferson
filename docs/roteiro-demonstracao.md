# Roteiro da demonstração de dez minutos

Roteiro de apoio à prova oral e à demonstração do projeto **Organização de Recursos**. Fonte do que se espera mostrar:
[especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). **Sem
slides**: a apresentação é de Jefferson; este arquivo só diz o que abrir, em que ordem e o que dizer em cada passo. Os tempos
são um **alvo de ensaio, não uma medição**: ninguém cronometrou a demonstração. Equipe de uma pessoa: quem apresenta explica
todas as partes. O guia para os seis exercícios de conferência está em [guia-de-evidencias.md](guia-de-evidencias.md).

## 1. Preparação (antes de começar a contar os dez minutos)

Tudo com dados fictícios (e-mails `@exemplo.test`); nenhuma senha vai para o repositório. O passo a passo completo e a
explicação de cada peça estão em [roteiro-navegador-real/README.md](testes/roteiro-navegador-real/README.md).

| # | O que fazer | Comando ou arquivo | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Ligar o Docker | Docker Desktop ativo | `docker info` responde |
| 2 | Gerar credenciais descartáveis em `docs/testes/roteiro-navegador-real/local/proto.env` (a pasta `local/` é ignorada pelo Git) | Passo 1 do README do roteiro | Arquivo criado; **não abrir na frente da banca** |
| 3 | Subir o PostgreSQL descartável e a API | Passos 2 e 3 do README do roteiro | `GET http://localhost:8080/actuator/health` responde `{"status":"UP"}` |
| 4 | Subir o front de produção | Passo 4 do README do roteiro | `http://localhost:4173` abre a tela de Login (use `localhost`, não `127.0.0.1`, por causa do CORS) |
| 5 | Semear os dados fictícios | `python docs/testes/roteiro-navegador-real/semear.py` | 4 usuários, 4 salas, 3 materiais, 2 professores e 1 reserva existente |
| 6 | Abrir em abas: o repositório no GitHub, a página de Actions, o painel do SonarCloud e este roteiro | Links da seção 4 | Abas prontas |
| 7 | Ter à mão, **sem depender de rede**, o relatório da última execução E2E e as capturas do roteiro | Artefato `relatorio-e2e` do run da `main` | Plano B se a demonstração ao vivo falhar |

## 2. Os dez minutos

| Alvo | Parte | O que fazer na tela | O que dizer | Onde está a prova |
| --- | --- | --- | --- | --- |
| 0:00 a 1:00 | **Login por perfil** (T01) | Entrar como Solicitante; sair; entrar como Responsável; sair; entrar como Administrador. Mostrar que o menu muda por perfil | Três perfis, cada um com o que a especificação permite (RF-01). A autorização é conferida no servidor, não no menu | Matriz de autorização verde: [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 4; [matriz-autorizacao.md](testes/matriz-autorizacao.md) |
| 1:00 a 2:00 | **Busca** (T02) | Como Solicitante, buscar salas livres num período, filtrando por tipo e capacidade | A busca mostra só o intervalo ocupado, sem o dono da reserva (RF-03). Fronteira semiaberta: terminar às 10h não conflita com começar às 10h (A2, decisão da equipe) | RF-03 na [RTM.md](../RTM.md); CT-027 a CT-032 |
| 2:00 a 3:00 | **Reserva** (T03) | Reservar uma sala livre | Sem recurso restrito, a reserva nasce SOLICITADA e vira APROVADA pelo sistema, com ator SISTEMA (A1, decisão da equipe, não validada com o professor) | CT-040 e CT-041; [decisoes-equipe.md](decisoes-equipe.md), F7-16-01 |
| 3:00 a 4:00 | **Conflito de horário** | Tentar reservar a mesma sala no mesmo horário | A tela mostra o conflito em linguagem comum, sem código técnico. A garantia é a constraint de exclusão do banco, não a verificação prévia (ADR-003); 20 solicitações simultâneas resultam em 1 aceita e 19 recusadas | CT-060; E2E CT-162; [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 5 |
| 4:00 a 5:00 | **Aprovação** (T05) | Reservar um recurso restrito como Solicitante; entrar como Responsável e aprovar. Voltar ao Solicitante e mostrar a reserva aprovada | Recurso restrito exige aprovação de um Responsável; quem pediu não aprova a própria reserva; o Solicitante nem vê a ação | CT-066, CT-067; E2E CT-163 e CT-164 |
| 5:00 a 6:30 | **Retirada e devolução** (T06) | Como Responsável, iniciar o uso de uma reserva aprovada, retirar um material e devolvê-lo | A primeira retirada inicia o uso; a conclusão só acontece com a devolução; cada movimentação guarda o nome de quem registrou (RF-09) | CT-084 a CT-095; as cinco jornadas E2E não passam por esta tela ([e2e/README.md](testes/e2e/README.md)) |
| 6:30 a 7:30 | **Histórico de auditoria** (T09) | Como Administrador, abrir o histórico da reserva usada na demonstração | Cada transição tem ator, data e motivo, inclusive as automáticas (ator SISTEMA). A tabela de auditoria é somente inserção, por gatilho do banco (CT-011) | CT-096 a CT-101; CT-098 |
| 7:30 a 8:15 | **Relatório** (T10) | Gerar o relatório de um período | Os números são os do servidor (RN-31); utilização só para sala; 409 esperado não conta como erro nas medições de carga | CT-107 a CT-113; [resultado-02.md](performance/resultado-02.md) |
| 8:15 a 10:00 | **CI, SonarCloud e JaCoCo** | Abrir a página de Actions e o último run verde da `main`; abrir o painel do SonarCloud; mostrar o artefato `relatorio-jacoco` | Quatro checks obrigatórios na `main` (`test`, `frontend`, `e2e`, `segredos`) mais o SonarCloud, e um vermelho intencional que barrou o merge. Cobertura de linhas 97,01% e de branches 86,88%, contra metas de 80% e 70% | [execucao-e24.md](testes/execucao-e24.md); [leitura-final-cobertura.md](testes/leitura-final-cobertura.md); [limitadores-de-nota.md](testes/limitadores-de-nota.md), seção 3 |

## 3. Perguntas que a banca pode fazer, com a resposta honesta

| Pergunta | Resposta, com a origem |
| --- | --- |
| O desempenho atende à meta? | **Não, nesta máquina.** RNF-08b (criação de reserva com p95 de até 300 ms): medido de 568 a 886 ms. A consulta atende. A meta de 300 ms é hipótese da aula, não validada pelo professor. [resultado-02.md](performance/resultado-02.md) |
| Há teste intermitente? | Sim: `NotificacaoApiIT.int01ECt103`, causa desconhecida, risco aceito R-25 (issue 39 aberta); BUG-017 está mitigado, não corrigido. [decisoes-equipe.md](decisoes-equipe.md) |
| O front tem cobertura medida? | Não. O JaCoCo e o SonarCloud medem só o Java; o front tem 910 testes, sem número de cobertura. [leitura-final-cobertura.md](testes/leitura-final-cobertura.md), seção 6 |
| Quem validou as lacunas da especificação? | A equipe, sem validação do professor: F7-16 e F7-17 em [decisoes-equipe.md](decisoes-equipe.md). A decisão de maior retrabalho se estiver errada é a A3 (material por unidade identificada) |
| Houve revisão por pares? | Não: a equipe é uma pessoa. Foi revisão **assistida**, registrada em cada pull request, e é limitação declarada do entregável |
| O que está conhecidamente errado? | A troca de perfil não é recusada pelo mínimo de Responsáveis (D14): o Administrador pode deixar um só Responsável. Brecha funcional declarada, sem teste que a afirme |
| Há risco de privacidade? | Sim: nada é apagado nem anonimizado, sem expurgo da auditoria e das notificações (D9) |

## 4. Links

| O quê | Onde |
| --- | --- |
| Repositório | `https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson` |
| Execuções da CI | `https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions` |
| SonarCloud | `https://sonarcloud.io/dashboard?id=Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson` |
| JaCoCo | Artefato `relatorio-jacoco` de cada run do job `test`; localmente, `target/site/jacoco/index.html` depois de `./mvnw -B verify` |
| Relatório final de qualidade | [relatorio-qualidade.md](relatorio-qualidade.md) |
| Rastreabilidade | [RTM.md](../RTM.md) |
