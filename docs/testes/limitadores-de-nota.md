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

Prova repetida no commit da tag `v1.0.0-rc1` (`276224b`) na seção 2.5.

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
| README restante | Pendência | Roadmap, proteção da `main` e outros trechos seguem desatualizados; ficam para o item 2.7 |
| Prova a repetir | Pendência | O clone limpo (seção 2) será refeito no commit da tag `v1.0.0-rc1` |
| Quebra sem a constraint | Limite | Feita uma vez, em uma máquina; sem repetição para medir variação. A falha é determinística nos seis testes de reserva (asserção `expected: 1L`) |
