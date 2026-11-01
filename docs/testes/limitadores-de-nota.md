# Limitadores de nota: evidência da Fase 7

As quatro condições que a [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html) usa como limitador de nota (seção "Avaliação") precisam estar demonstradas antes da tag ([plano de projeto](../plano-de-projeto.md), seção 11.4). Este documento reúne a evidência de cada uma, **colhida em 24/10/2026**, com o run, o comando ou o arquivo de origem. O que não tem origem está em "Lacunas e limites" (seção 6).

## 1. Resumo

| Limitador | Estado | Evidência |
| --- | --- | --- |
| a) Aplicação que não executa | **Atendido depois de corrigir um defeito.** O README original **não** subia a aplicação num clone limpo (BUG-019, crítico); o README corrigido sobe | Seção 2 |
| b) Pipeline ausente | **Atendido.** Checks obrigatórios `test`, `frontend` e `e2e` lidos da API; runs verdes; um vermelho intencional que bloqueou o merge | Seção 3 |
| c) Falha de autorização | **Atendido.** `AutorizacaoApiIT` verde (141 testes) e a matriz publicada confere com a testada | Seção 4 |
| d) Dupla reserva | **Atendido.** `ConcorrenciaApiIT` verde com a constraint (7 de 7) e vermelho sem ela (6 falhas por asserção e 1 erro) | Seção 5 |

## 2. a) Aplicação executa em clone limpo

Prova repetida na seção 2.5 (execução E-24), na seção 2.6 (execução E-25) e na seção 2.7 (execução E-26); a da revisão da `v1.0.0-rc4` está na seção 2.9, e a da tag publicada, seguindo só o README, na seção 2.10.

### 2.1 Método

- **Clone limpo:** `git clone` do repositório público numa pasta temporária **fora do projeto**, sem nenhum arquivo do ambiente de trabalho.
- **Regra:** seguir **apenas** a seção "Como subir" do README. Os valores do `.env` são fictícios, gerados na hora por script e nunca impressos.
- **Ambiente:** Windows 11, Git Bash, Java 21.0.6, Docker 29.8.2, Node 22.13.1; portas 5432 e 8080 livres; cache do Maven e imagem do PostgreSQL já presentes nesta máquina (**um computador sem cache leva mais tempo; não medido**).

### 2.2 Rodada 1: README original (commit `e6dbc51`, `main`) — FALHOU

| Passo do README | Comando | Resultado |
| --- | --- | --- |
| Clone | `git clone ...` | 18 s |
| 1. `.env` | copiar `.env.example` e preencher valores locais | feito |
| 2. Banco | `docker compose up -d postgres` | 13 s, banco no ar |
| 3. Exportar só `DB_URL`, `DB_USER` e `DB_PASSWORD` e rodar | `./mvnw spring-boot:run` | **`APPLICATION FAILED TO START`**: `Failed to bind properties under 'app.sessao.duracao' to java.time.Duration` |

Causa: `SESSAO_DURACAO`, `LOGIN_TENTATIVAS` e `LOGIN_JANELA` não têm valor padrão em `application.yml` (linhas 17, 20 e 21) e o README só mandava exportar três variáveis. O README também não mencionava o primeiro Administrador (`BOOTSTRAP_ADMIN_*`), sem o qual ninguém consegue entrar. **Defeito de documentação: BUG-019, issue 60, severidade crítica** ([defeitos/README.md](../defeitos/README.md)).

Com o `.env` inteiro exportado (diagnóstico, fora do README): `Started OrganizacaoRecursosApplication in 10,894 seconds`.

### 2.3 Rodada 2: README corrigido (branch da correção, commit `e01da39`) — PASSOU

Novo clone limpo, passos 1 a 5 do README corrigido, script que repete os comandos do README:

| Passo | Resultado |
| --- | --- |
| Clone até a aplicação no ar | **140 s** no total (inclui o clone, o banco em 26 s e a primeira compilação) |
| `./mvnw spring-boot:run` | `Started OrganizacaoRecursosApplication in 23,356 seconds` |
| `GET /actuator/health` | `{"status":"UP"}`, HTTP 200 |
| `POST /api/auth/login` (Administrador do bootstrap) | HTTP 200, perfil `ADMINISTRADOR` |
| `GET /api/auth/eu` com o token | HTTP 200 |

Front end (verificado no clone da rodada 1, passo 6 do README): `npm ci` 302 s, `npm run build` 42 s, `npm run dev` pronto em 1,4 s e `GET http://localhost:5173/` HTTP 200; a API respondeu ao preflight de CORS da origem `http://localhost:5173` com `Access-Control-Allow-Origin` igual a ela.

### 2.4 Fechamento do defeito

PR #61 mesclado (`84c58eb`), run verde da `main` `40102847090` (`test`, `frontend`, `e2e` e `segredos` com sucesso). Issue 60 fechada.

### 2.5 Rodada 3: commit da tag `v1.0.0-rc1` (`276224b`), 24/10/2026 — PASSOU na quarta tentativa

**Método:** o mesmo da seção 2.1 (clone do repositório público numa pasta fora do projeto, só a seção "Como subir" do README, `.env` gerado na hora com valores fictícios, nunca impresso), num script que repete os comandos do README. Ambiente: Windows 11, Git Bash, Java 21.0.6, Node 22.13.1, Docker 29.8.2; portas 5432, 8080 e 5173 livres; **cache do Maven presente** (um computador sem cache leva mais tempo; não medido).

**Resultado da tentativa que passou** (tempos acumulados desde o início do script, medidos pelo script):

| Passo do README | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone no commit `276224b` | feito | 24 s |
| 1. `.env` | preenchido; 0 variáveis obrigatórias vazias | 24 s |
| 2. `docker compose up -d postgres` | feito; banco `healthy` | 40 s e 65 s |
| 3 e 4. `./mvnw spring-boot:run` e `GET /actuator/health` | HTTP 200, `{"status":"UP"}`; `Started OrganizacaoRecursosApplication in 11.433 seconds` | **143 s** (clone até a aplicação no ar) |
| 5. `POST /api/auth/login` (Administrador do bootstrap) e `GET /api/auth/eu` | HTTP 200 com perfil `ADMINISTRADOR`; HTTP 200 | 145 s |
| 6. `npm ci` | saiu com 0 | 524 s (**cerca de 380 s** só do `npm ci`) |
| 6. `npm run dev` e `GET http://localhost:5173/` | HTTP 200; preflight de CORS da origem `http://localhost:5173` devolve `Access-Control-Allow-Origin` igual a ela | **528 s** (do clone até o front no ar) |

Ao fim, a API e o Vite foram encerrados pelos PIDs das portas 8080 e 5173, e o banco foi derrubado com `docker compose down -v`; as portas 8080, 5173 e 5432 ficaram livres.

**As três tentativas anteriores falharam por ambiente, antes de chegar à aplicação.** As três pararam no passo 2 do README (`docker compose up -d postgres`) com a mesma mensagem: `error getting credentials - err: exec: "docker-credential-desktop": executable file not found in %PATH%`. O Docker tentou baixar a imagem `postgres:17` fixada por digest e não achou o auxiliar de credenciais:

| Tentativa | Como foi executada | Resultado |
| --- | --- | --- |
| 1 | Pelo shell Git Bash da sessão | Falhou no passo 2 |
| 2 | Pelo mesmo shell, com o diretório `resources/bin` do Docker Desktop acrescentado ao `PATH` | Falhou no passo 2, mesma mensagem |
| 3 | Pelo PowerShell, chamando o Git Bash com o `PATH` acrescentado | Falhou no passo 2, mesma mensagem |
| 4 | Depois de um `docker pull` da imagem fixada por digest feito no PowerShell (resposta: "Image is up to date") | **Passou** (tabela acima) |

**O que isto é e o que não é.** O README não foi alterado entre as tentativas e o passo 2 é o do README; não é defeito do projeto, e sim do ambiente desta máquina. **Lacuna:** não foi investigado por que o auxiliar de credenciais não foi achado no shell da sessão, mesmo com o diretório no `PATH`, nem se uma máquina sem a imagem em cache e sem o auxiliar de credenciais encontraria o mesmo erro. Nas três tentativas que falharam, os passos 3 a 6 **não foram executados**; só a quarta os exercitou. O tempo de 528 s é o da quarta tentativa e não inclui as anteriores.

### 2.6 Rodada 4: commit da tag `v1.0.0-rc2` (`d2b6af1`), 26/10/2026: PASSOU na segunda tentativa

**Método:** o da seção 2.5: clone do repositório público numa pasta temporária fora do projeto, `git checkout --detach v1.0.0-rc2`, só a seção "Como subir" e "Como testar" do README, `.env` gerado na hora com valores fictícios (nunca impresso), num script que mede o tempo acumulado de cada passo. O `CLASSPATH` da máquina foi limpo para o percurso. O `verify` rodou depois de encerrar a aplicação e o banco do "Como subir", como pede "Requisitos para rodar o `verify`".

**Resultado da tentativa que passou** (tempos acumulados desde o início do script):

| Passo do README | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone no commit `d2b6af1` (tag `v1.0.0-rc2`) | feito | 12 s |
| 1. `.env` | preenchido; sobraram `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY`, que o README declara opcionais | 13 s |
| 2. `docker compose up -d postgres` | feito; banco `healthy` | 23 s e 40 s |
| 3 e 4. `./mvnw spring-boot:run` e `GET /actuator/health` | HTTP 200, `{"status":"UP"}`; `Started OrganizacaoRecursosApplication in 21.199 seconds` | **150 s** (clone até a aplicação no ar) |
| 5. `POST /api/auth/login` (Administrador do bootstrap) e `GET /api/auth/eu` | login com token; HTTP 200 com perfil `ADMINISTRADOR` | 152 s |
| 6. `npm ci` | saiu com 0 | 359 s (cerca de **207 s** só do `npm ci`) |
| 6. `npm run dev` e `GET http://localhost:5173/` | HTTP 200; preflight de CORS devolve `Access-Control-Allow-Origin: http://localhost:5173` | **366 s** (do clone até o front no ar) |
| Aplicação e banco encerrados | feito | 379 s |
| `./mvnw -B verify` ("Como testar") | **Passou:** 231 testes de unidade e arquitetura e 434 de integração e BDD, 0 falhas, "All coverage checks have been met", `BUILD SUCCESS` | **539 s** (de 379 s a 918 s) |

**A primeira tentativa falhou por ambiente, antes de chegar à aplicação.** Parou no passo 2 (`docker compose up -d postgres`, saída 1 em 15 s) com `error getting credentials - err: exec: "docker-credential-desktop": executable file not found in %PATH%`, a mesma mensagem das tentativas 1 a 3 da seção 2.5: o Git Bash não encontra o auxiliar de credenciais do Docker Desktop quando o compose consulta o registro para a imagem fixada por digest. Depois de um `docker pull` da imagem fixada feito no PowerShell (resposta: "Image is up to date"), a segunda tentativa passou, **sem alterar nenhum arquivo do repositório**.

**O que isto é e o que não é.** O README não foi alterado entre as tentativas e o passo 2 é o do README; a falha é do ambiente desta máquina, não do projeto. **Lacuna:** não foi investigado por que o auxiliar não está no `PATH` do Git Bash. Uma só máquina e uma só conferência; outros computadores e sistemas operacionais não foram provados.

### 2.7 Rodada 5: commit da tag `v1.0.0-rc3` (`005c7af`), 28/10/2026: PASSOU

**Método:** o da seção 2.6: clone do repositório público numa pasta temporária fora do projeto, `git checkout --detach v1.0.0-rc3`, a seção "Como subir" e a "Como testar" do README, `.env` gerado na hora com valores fictícios (nunca impresso), num script que mede o tempo acumulado de cada passo. O `CLASSPATH` da máquina foi limpo. O `verify` rodou depois de encerrar a aplicação e o banco. **Não foi feito:** o passo 6 do README (front end, `npm ci` e `npm run dev`) e o `GET /api/auth/eu`; o front desta tag tem a CI como evidência (910 testes em 56 arquivos na E-26).

**Resultado** (tempos acumulados desde o início do script, da execução que vale):

| Passo do README | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone no commit `005c7af` (tag `v1.0.0-rc3`) | feito; `git rev-parse HEAD` = `005c7afc88c155a3d0d6f0cf64d369f43f882636` | 17 s |
| 1. `.env` | preenchido com valores fictícios; `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY` vazias, opcionais no README | 17 s |
| 2. `docker compose up -d postgres` | feito; banco pronto | 38 s |
| 3 e 4. `./mvnw spring-boot:run` e `GET /actuator/health` | HTTP 200, `{"status":"UP"}` | **90 s** (clone até a aplicação no ar; 52 s desde o início do `spring-boot:run`) |
| 5. `POST /api/auth/login` (Administrador do bootstrap) | HTTP 200, token não impresso | 91 s |
| Aplicação e banco encerrados (`docker compose down`, sem `-v`) | feito; porta 8080 livre | 107 s |
| `./mvnw -B verify` ("Como testar") | **Passou:** 231 testes de unidade e arquitetura e 434 de integração e BDD, 0 falhas, "All coverage checks have been met", `BUILD SUCCESS`, 10 min 43 s no Maven | **654 s** (de 107 s a 761 s) |

O JaCoCo local do `verify` deu linhas 1753 de 1805 e branches 523 de 602 (SHA-256 do `jacoco.xml` `1eb5f44198d95a0301051a2ad7c818df82b5d39e5526edbe0f472d9116845985`); o da CI no mesmo commit deu 1751 de 1805 e 521 de 602 ([jacoco-resumo.md](jacoco-resumo.md), seção 5). Os três valores de branches (523 local e na rc2, 521 na CI da rc3) e os dois de linhas (1751 e 1753) vêm do mesmo código; a variação de branches da CI está explicada em [leitura-final-cobertura.md](leitura-final-cobertura.md), seção 8, e a diferença de 2 linhas do `verify` local (1753 contra 1751) **não foi investigada**.

**O que deu errado antes da execução que vale (declarado, sem alterar o repositório):**

- O `docker pull` da imagem fixada, chamado de dentro do Git Bash, terminou com `error getting credentials - err: exec: "docker-credential-desktop": executable file not found in %PATH%`, a mesma mensagem das seções 2.5 e 2.6. O `docker pull` pelo PowerShell respondeu "Image is up to date" e o fluxo seguiu.
- Uma primeira execução do script foi **descartada**: a interrupção do primeiro script não encerrou os processos filhos, e dois scripts rodaram ao mesmo tempo no mesmo banco, na mesma porta e na mesma pasta, e o `verify` de um deles saiu com 1. Isso foi falha do procedimento de medição, não do projeto. Os recursos Docker criados por essas execuções (contêineres, volume `rc3clone_pgdata`) foram removidos, e a execução acima foi feita uma vez, depois de a máquina ficar sem script rodando. Por isso a rodada vale como uma execução limpa, e não como "primeira tentativa".

**O que isto é e o que não é.** Uma só máquina e uma só conferência limpa; outros computadores e sistemas operacionais não foram provados. O front end não foi repetido nesta rodada.

### 2.8 Erro de credencial do Docker no Git Bash: observado em 30/10/2026, não reproduzido em 31/10/2026

Na auditoria de 30/10/2026, o `docker compose up -d postgres` chamado de dentro do Git Bash voltou a falhar com `error getting credentials - err: exec: "docker-credential-desktop": executable file not found in %PATH%` ao baixar a imagem fixada por digest, e passou quando o comando Docker foi rodado pelo PowerShell (mesma falha de ambiente das seções 2.5 e 2.6). Em 31/10/2026, no clone de verificação, o mesmo comando passou no Git Bash **sem erro porque a imagem do PostgreSQL já estava no cache local**; portanto o erro **não foi reproduzido** e esta seção não registra nova verificação do contorno. O README mantém a frase condicional: se o erro ocorrer, rode o comando Docker pelo PowerShell.

### 2.9 Rodada 6: execução E-27, commit `b5e9bbd`, 31/10/2026: PASSOU

**Método:** o da seção 2.6: clone do repositório público numa pasta temporária fora do projeto, `git checkout --detach b5e9bbd`, as seções "Como subir" e "Como testar" do README, `.env` gerado na hora com valores fictícios (senhas aleatórias, não impressas), projeto Compose exclusivo `rc4`. O tempo é acumulado desde o início do script e a máquina estava mais lenta que nas rodadas anteriores: o banco levou 262 s para ficar saudável (a inicialização do PostgreSQL em volume novo no Docker Desktop foi a parte lenta).

| Passo | Resultado | Tempo acumulado |
| --- | --- | --- |
| Clone no commit `b5e9bbd` e `.env` | feito; `git rev-parse HEAD` = `b5e9bbd5f68ba01c0dfbb40e16e8a552848348ac` | 30 s |
| `docker compose up -d postgres` | banco saudável (o erro de credencial do Docker não ocorreu, imagem em cache; ver a seção 2.8) | 262 s |
| `./mvnw spring-boot:run` e `GET /actuator/health` | HTTP 200, `{"status":"UP"}` | 337 s |
| Login do Administrador e `GET /api/auth/eu` | HTTP 200, perfil `ADMINISTRADOR` | 340 s |
| Front end: `npm ci`, `npm run dev`, `GET http://localhost:5173/` | `npm ci` saiu com 0 (cerca de 520 s); HTTP 200; preflight de CORS devolve `Access-Control-Allow-Origin: http://localhost:5173` | 867 s |
| `./mvnw -B verify` (aplicação e Vite encerrados antes) | **Passou:** 231 testes de unidade e arquitetura e 439 de integração e BDD, 0 falhas, "All coverage checks have been met", `BUILD SUCCESS`; JaCoCo local: linhas 1767 de 1806 e branches 525 de 602, os mesmos números da CI | **480 s** (duração do comando) |
| `npm run gerar:api` | saída 0; `git diff --ignore-space-at-eol` do schema vazio (o `git status` acusa só o fim de linha do Windows) | 3 s |
| `npm run lint`, `typecheck`, `test`, `build` | saída 0 nos quatro; `test`: 910 testes em 56 arquivos | 40 s, 13 s, 220 s e 13 s |

**Quatro cenários dos agendadores** (variáveis de ambiente, sem alterar arquivo; banco reiniciado entre os grupos; `NOTIFICACAO_URL=http://127.0.0.1:9999/hook` e `NOTIFICACAO_TOKEN` fictício apontando para um servidor local de teste que registra o caminho, a presença do `Authorization: Bearer` e do `Idempotency-Key` e o corpo; uma reserva SOLICITADA sem decisão e outra aprovada automaticamente, com início 2 minutos depois da criação; leitura 75 s depois do início). O mesmo roteiro foi rodado antes no commit do PR 112 (`9e1cabf`), com os mesmos resultados.

| Cenário | Variáveis | Reserva sem decisão | Notificações | Threads `scheduling-*` |
| --- | --- | --- | --- | --- |
| (a) sem `APP_JOBS_*` | nenhuma | continua SOLICITADA | `PENDENTE` com 0 tentativas; 0 chamadas ao servidor | 0 |
| (b) só notificações | `APP_JOBS_NOTIFICACOES_HABILITADO=true`, `APP_JOBS_NOTIFICACOES_INTERVALO=PT30S` | continua SOLICITADA (o job de SEM_DECISAO não existe) | `ENVIADA` em 1 tentativa; 1 chamada, com `Authorization: Bearer`, `Idempotency-Key` e corpo `evento`, `reservaId`, `destinatarioId`, `instante`, `chaveIdempotencia` | 1 |
| (c) só SEM_DECISAO | `APP_JOBS_SEM_DECISAO_HABILITADO=true`, `APP_JOBS_SEM_DECISAO_INTERVALO=PT1M` | CANCELADA com motivo `SEM_DECISAO`; a aprovada fica intacta | `PENDENTE` (2), 0 chamadas | 1 |
| (d) os dois | os quatro acima | CANCELADA com motivo `SEM_DECISAO` | `ENVIADA` (2): `RESERVA_APROVADA` e `RESERVA_CANCELADA` | 1 |

O cenário (b) é o que o BUG-028 impedia: antes da correção, com só o agendador de notificações ligado, as notificações ficavam com 0 tentativas e nenhuma thread `scheduling-*` existia.

**Configuração opcional (D1 e D3), no commit do PR 112:** o comando SQL do README foi executado como está escrito num banco temporário e o efeito foi observado ao vivo. Reenvio (D3): com `tentativas_reenvio = 3` e `intervalo_reenvio_inicial = 30 s`, o servidor de teste parado deixou a notificação `PENDENTE` com 2 tentativas e próxima tentativa agendada (backoff); religado, a notificação foi a `ENVIADA` na 3ª tentativa. Tolerância (D1): sem valor, `nao-comparecimento` respondeu 409 `TOLERANCIA_NAO_CONFIGURADA`; com `tolerancia_nao_comparecimento = 1 minuto`, respondeu 409 `TOLERANCIA_NAO_ENCERRADA` 20 s depois do início e 200 (`NAO_COMPARECEU`) 70 s depois. Não há rota da API para esses valores.

**Calibração curta do JMeter** (5 usuários, rampa de 5 s, 45 s, banco e aplicação à parte em portas locais, plano `perf/reservas.jmx` sem alterar o arquivo; resultado fora do repositório): 190 amostras, **0 erros reais e 0 respostas 500**, 55 criações (30 aceitas, 25 recusadas com 409), nenhum par (recurso, intervalo) com mais de uma ocupação ativa; p95 de 68 ms na consulta e 221 ms na criação nessa carga pequena. **Não substitui** `resultado-01.md` e `resultado-02.md` e não é comparável com as rodadas de 50 usuários.

**Rotas do front no navegador real:** não foram repetidas nesta rodada; a comparação de `telas.ts` com [navegacao-telas.md](../prd/navegacao-telas.md) é estática e os testes de rotas (`Rotas.test.tsx`) estão entre os 910 do front.

**O que isto é e o que não é.** Uma só máquina e uma só conferência limpa; outros computadores e sistemas operacionais não foram provados. Os quatro cenários rodaram uma vez em cada commit, sem repetição para medir variação.

### 2.10 Clone limpo da `v1.0.0-rc4` seguindo só o README (31/10/2026): PASSOU depois de uma lacuna do README

**Método:** clone do repositório público numa pasta temporária fora do projeto, `git checkout --detach v1.0.0-rc4` (`git rev-parse HEAD` = `10e83439fae622b74e25444e9abd24e031e142d4`), seguindo só o README da tag, `.env` criado a partir do `.env.example` com valores fictícios, projeto Compose exclusivo, um computador (o mesmo das seções anteriores).

| Passo do README | Resultado | Tempo |
| --- | --- | --- |
| Pré-requisitos (Java 21.0.6, Node 22.13.1, Docker 29.8.2) | ok | |
| Clone e checkout | ok | 12 s |
| 1. `.env` a partir do `.env.example`, preenchendo as variáveis vazias | **falhou no passo 3**: a `DB_URL` não vem vazia, vem com o texto `<POSTGRES_DB>`; o `. ./.env` do passo 3 deu `syntax error near unexpected token 'newline'` e a aplicação não subiu | |
| 2. `docker compose up -d postgres` | ok (o `docker compose` faz o próprio parse do `.env` e não reclama do `<POSTGRES_DB>`) | banco saudável em 43 s |
| 3 e 4. `spring-boot:run` e `/actuator/health` (depois de trocar o `<POSTGRES_DB>` na `DB_URL` pelo nome do banco) | `{"status":"UP"}`; "Started ... in 22,6 s" | 102 s |
| 5. Login do Administrador | HTTP 200, token recebido; `/api/auth/eu` com perfil `ADMINISTRADOR` | 110 s |
| 6. `npm ci`, `cp .env.example .env`, `npm run dev` | `npm ci` saiu com 0 em 127 s numa execução limpa; página em http://localhost:5173/ com HTTP 200; login pela página com o Chromium do Playwright levou ao menu do Administrador | |

Depois, com a aplicação e o Vite parados e o banco no ar: `./mvnw -B verify` saiu com 0 em **747 s**, **231 testes de unidade e arquitetura e 439 de integração e BDD (670), 0 falhas**, "All coverage checks have been met", `BUILD SUCCESS`; JaCoCo local: linhas **1767 de 1806** e branches **525 de 602**. Front: `gerar:api` (sem diferença de conteúdo no schema; o `git status` acusa só o fim de linha do Windows), `lint`, `typecheck` e `build` com saída 0; `npm test`: **56 arquivos e 910 testes**.

Fluxo curto pela API, sem nenhuma variável `APP_JOBS_*`: criar Solicitante (201) e sala livre (201); reserva das 14 às 16 com 201 `APROVADA`; reserva sobreposta das 15 às 17 com 409 `CONFLITO_DE_ALOCACAO`; a notificação ficou `PENDENTE` com 0 tentativas, como o README diz.

**O que falhou e a correção.** A única falha foi a do passo 1 (`DB_URL` com placeholder). O texto do README ("preencha todas as variáveis que vierem vazias") não cobria a variável que vem preenchida com `<POSTGRES_DB>`. O README da `main` passou a dizer que a `DB_URL` também precisa ser editada, que o `.env` é lido por `. ./.env` e não pode ter `<` nem `>`, traz um exemplo de `.env` completo com as variáveis do `.env.example` e uma verificação de uma linha depois do passo 3 (decisão F7-30). A tag `v1.0.0-rc4` continua com o texto anterior. O texto novo foi validado num clone da `main` com o README corrigido: `.env` montado a partir do bloco de exemplo, `. ./.env` sem erro, `/actuator/health` UP em 80 s e login do Administrador com HTTP 200; nessa validação o `docker compose up -d postgres` falhou no Git Bash com `error getting credentials - err: exec: "docker-credential-desktop"` e passou com o remédio do README (`docker pull` da imagem fixada pelo PowerShell, "Image is up to date", e o `up` repetido).

**Limites:** uma só máquina e uma só conferência; o `verify` levou mais que os "cerca de 8 minutos" do README, dentro do aviso de que pode chegar a 25 minutos.

## 3. b) Pipeline: check obrigatório na `main`, runs verdes e um vermelho intencional

### 3.1 Proteção da `main` (lida da API em 24/10/2026)

`gh api repos/<dono>/<repositório>/branches/main/protection`:

| Campo | Valor |
| --- | --- |
| Checks obrigatórios | `test`, `frontend`, `e2e` |
| Branch atualizada antes de mesclar (`strict`) | sim |
| Aprovações exigidas | 0 (o PR é obrigatório) |
| Vale para administrador | sim |
| Force push / exclusão da branch | não / não |

`segredos` e SonarCloud não são obrigatórios da proteção (F6-21).

### 3.2 Runs verdes

| Run | Commit | Resultado |
| --- | --- | --- |
| [`40102847090`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40102847090) | `84c58eb`, `main` (push) | `test`, `frontend`, `e2e` e `segredos` verdes |
| [`40099032564`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40099032564) | `e6dbc51`, `main` (push) | verde |
| [`40098612143`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40098612143) | `189a627`, PR #58 | `test` 226 + 433, `frontend` 910 em 56 arquivos, `e2e` 5 de 5; SonarCloud verde |

### 3.3 Vermelho intencional (F7-04, decisão de Jefferson em 24/10/2026)

PR descartável **#59**, "teste(descartavel): quebra intencional para provar o check obrigatorio (NAO MESCLAR)", no branch `descartavel/quebra-intencional-periodo` (commit `f19d3e0`), aberto a partir da `main` em `e6dbc51`.

**Asserção invertida**, `src/test/java/br/senac/recursos/model/PeriodoTest.java`, linha 34, em `ct034_conflitoEmTrincaNasFronteiras` (existente 14:00 a 16:00; o novo começa onde o existente termina, "encosta no fim", RN-11, intervalo [início, fim)):

```text
antes:  "2026-10-20T19:00:00Z, 2026-10-20T21:00:00Z, false",  // 16:00-18:00, encosta no fim
depois: "2026-10-20T19:00:00Z, 2026-10-20T21:00:00Z, true",   // 16:00-18:00, encosta no fim
```

| Evidência | Valor |
| --- | --- |
| Vermelho local antes de publicar | `PeriodoTest`: 9 testes, 1 falha, por asserção (`expected: true`, `PeriodoTest.java:45`) |
| Run vermelho | [`40099734514`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40099734514), job [`test`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40099734514/job/120889234250) em **falha** (25 s); `frontend`, `e2e` e `segredos` verdes. O log do job repete a falha em `PeriodoTest.ct034_conflitoEmTrincaNasFronteiras[1]`, `PeriodoTest.java:45`, 9 testes e 1 falha |
| Leitura do estado de merge | `gh pr view 59 --json mergeStateStatus,mergeable,isDraft` devolveu `"mergeStateStatus":"BLOCKED"`, `"mergeable":"MERGEABLE"`, `"isDraft":false`; a API REST (`pulls/59`, `mergeable_state`) devolveu `blocked`. (O PR foi aberto como rascunho e marcado como pronto antes da leitura, para o estado refletir só o check.) |
| Fechamento | PR #59 `CLOSED`, `mergedAt` nulo, **fechado sem mesclar** |
| Branch | Apagada no local e no remoto (`git ls-remote --heads origin` lista só `main`) |
| Efeito na `main` | Nenhum: a `main` seguiu em `e6dbc51` e nunca recebeu a quebra |

A quebra é do tipo oposto ao proibido pelo AGENTS.md (regra 6): o teste foi **enfraquecido de propósito, só num branch descartável**, para provar que o check barra. Nada disso foi para a `main`. Não se tentou clicar em "mesclar" no PR vermelho; a prova é a leitura do estado `BLOCKED`.

### 3.4 Ocorrência anterior

O README ([Execuções registradas](../../README.md)) já listava um run vermelho intencional da Fase 3: [`38786300308`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/38786300308) (asserção de `ContextoIT` quebrada de propósito) e o verde de recuperação [`38786508100`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/38786508100). A API confirma: `failure` no commit `9639533` e `success` no commit `1131a3c`, ambos em `pull_request` da Fase 3. Ele **antecede** a proteção atual (`test`, `frontend`, `e2e`) e não foi lido pelo relatório de continuidade; por isso o vermelho de 24/10/2026 é a evidência com os três checks obrigatórios. O run do BUG-006 (`38785819928`) foi acidental.

## 4. c) Autorização: matriz perfil × operação

[matriz-autorizacao.md](matriz-autorizacao.md) lista **34 operações** em 3 perfis. `AutorizacaoApiIT` (`src/test/java/br/senac/recursos/controller/`) executa a mesma lista contra a API real e, no caso `ct117_matrizPublicadaCorrespondeAAutorizacaoTestada` (linhas 173 a 209), **falha se o documento divergir** da lista testada.

| Evidência | Valor |
| --- | --- |
| CI, `main` | Run [`40102847090`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40102847090), job `test`: `AutorizacaoApiIT`, **141 testes, 0 falhas** (84,45 s) |
| Local, 24/10/2026 | `./mvnw -B verify -Dit.test=AutorizacaoApiIT` (sem `-Dgerar.matriz`): **141 testes, 0 falhas**, `BUILD SUCCESS`; `git status` sem alteração em `matriz-autorizacao.md` |
| Casos da matriz | `ct117_matrizPerfilXOperacao`, uma combinação por operação e perfil: 34 x 3 = 102 (conta do autor sobre as 34 operações do arquivo; o log da CI não lista os casos um a um) |
| Outros casos da classe | `ct118` (posse: o Solicitante não lê nem altera reserva de outro), `ct119` (token ausente, inválido, revogado e expirado, 401), e os demais da classe, somando 141 |
| Operações cobertas | As 34 de [matriz-autorizacao.md](matriz-autorizacao.md), de `POST /api/auth/logout` a `GET /api/relatorios/utilizacao`, mais a pública `POST /api/auth/login` |

Defeito já achado e corrigido por essa matriz: BUG-008. Nota: [revisao-seguranca.md](revisao-seguranca.md) e a RTM diziam "137 casos" (valor da época) e foram corrigidos pelo BUG-022; o número atual da classe, na CI e no local, é 141.

## 5. d) Dupla reserva: verde com a constraint, vermelho sem ela

Garantia: `EXCLUDE USING gist (recurso_id WITH =, periodo WITH &&) WHERE (ativa)` em `ocupacoes` (constraint `ocupacoes_sem_sobreposicao`, `src/main/resources/db/migration/V2__esquema.sql`, linhas 151 e 152), conforme [ADR-003](../adr/ADR-003-dupla-reserva-constraint-de-exclusao.md).

### 5.1 Verde com a constraint

| Onde | Resultado |
| --- | --- |
| CI, `main`, run [`40102847090`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40102847090) | `ConcorrenciaApiIT`: **7 testes, 0 falhas** (21,76 s) |
| CI, `main`, run [`40099032564`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40099032564) | `ConcorrenciaApiIT`: 7 testes, 0 falhas |
| Local (controle, worktree da `main` em `e6dbc51`), 24/10/2026 | `-Dit.test=ConcorrenciaApiIT`: **7 testes, 0 falhas**, `BUILD SUCCESS` |

### 5.2 Vermelho sem a constraint

Reproduzido em **worktree descartável** (`git worktree add --detach`, fora do projeto, a partir de `e6dbc51`), removendo da migração `V2__esquema.sql` as linhas da constraint. A `main` não foi tocada; o worktree foi removido depois e a `main` segue com 1 ocorrência de `ocupacoes_sem_sobreposicao` na migração.

`ConcorrenciaApiIT` sem a constraint: **7 testes, 6 falhas e 1 erro**, `BUILD FAILURE`.

| Teste | Resultado | Onde |
| --- | --- | --- |
| `ct060` 20 solicitações para a mesma sala | **Falha por asserção** (`expected: 1L`: mais de uma reserva aceita) | `ConcorrenciaApiIT.java:115` |
| `ct061` mesmo professor em salas diferentes | Falha por asserção (`expected: 1L`) | `:135` |
| `ct062` resultado repetido em execuções sucessivas | Falha por asserção (`expected: 1L`, rodada 1) | `:156` |
| `ct064` ordens opostas, vários recursos | Falha por asserção (`expected: 1L`) | `:179` |
| `ct064` conjuntos que só se cruzam no projetor | Falha por asserção (`expected: 1L`) | `:197` |
| `ct065` a tentativa persiste mesmo se a reserva é desfeita | Falha por asserção (`expected: 1L`) | `:210` |
| `ct063` sem a constraint a reserva duplica | **Erro, não asserção:** o teste tenta remover (`alter table ... drop constraint`) uma constraint que já não existe. Em condições normais, ele faz sozinho, dentro do teste, a prova de duplicidade (`:220` a `:247`) | `ConcorrenciaApiIT.java:223` |

**Atualização (BUG-023, F7-05, 24/10/2026):** depois da correção, sem a constraint o `ct063` também falha por asserção (pré-condição "a constraint de exclusão existe", linha 226), e não mais por erro de SQL; a tabela acima registra o estado de `e6dbc51`, anterior à correção.

O `expected: 1L` mostra que a contagem verificada (a asserção em cada linha citada) deixou de ser 1 sem a constraint. O valor obtido em cada linha não foi lido um a um; só o `ct060` (linha 115) confere diretamente as reservas aceitas (`contarStatus(respostas, 201)`).

### 5.3 Histórico

O ciclo de TDD que criou o teste e a constraint está no histórico: `9d4d6d9` (`test(red)`: esquema e constraint de exclusão), `dadb272` (`feat(green)`: migração do esquema com a constraint), `5d570f8` (`test(red)`: concorrência em sala, professor e vários recursos), `eb7f5b1` (`fix(green)`: impasse tratado como conflito, BUG-007), `7ba9894` (limpeza do CT-063 restaura a constraint) e `e265ec0` (concorrência 5 vezes seguidas verde). A prova de que o teste protege (CT-063) também consta de [revisao-seguranca.md](revisao-seguranca.md) (A06).

## 6. Lacunas e limites

| Item | Tipo | Detalhe |
| --- | --- | --- |
| Tempo do clone limpo | Limite | Medido num computador com cache do Maven e do Docker. Máquina sem cache leva mais tempo; não medido |
| Sistemas além do Windows com Git Bash | Lacuna | Os comandos do README foram executados só em Git Bash no Windows; Linux, macOS e PowerShell **não foram verificados** |
| Login pela tela do front | Lacuna | O front foi verificado até o Vite no ar e o CORS; o login pela interface no navegador **não foi refeito** nesta prova (os roteiros em navegador real da Fase 6 e o E2E cobrem a tela) |
| Valores do `.env` | Suposição | Gerados por script a partir das dicas do `.env.example`; uma pessoa poderia escolher outros valores válidos. Impacto: se um valor válido for recusado, o README fica incompleto |
| README restante | Resolvida | Roadmap, proteção da `main` e outros trechos estavam desatualizados em 24/10/2026; foram atualizados nas fases seguintes |
| Prova a repetir | Resolvida | O clone limpo foi refeito nas seções 2.5 a 2.8 |
| Quebra sem a constraint | Limite | Feita uma vez, em uma máquina; sem repetição para medir variação. A falha é determinística nos seis testes de reserva (asserção `expected: 1L`) |
