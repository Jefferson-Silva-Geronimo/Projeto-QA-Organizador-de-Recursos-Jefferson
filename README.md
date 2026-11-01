# Organização de Recursos

## Objetivo

Aplicação que organiza a alocação de **salas, professores e materiais** sem conflitos de horário.

O foco do projeto é apresentar evidências objetivas de qualidade, segurança, rastreabilidade e desempenho, e não apenas que o sistema funcione. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

Disciplina de Qualidade de Software (TADS, 2026.2). Entrega na semana 46.

## Visão do produto

- **Problema:** evitar que um mesmo recurso seja reservado em horários sobrepostos, inclusive com pedidos simultâneos, e controlar quem aprova, retira e devolve.
- **Stack exigida:** Java 21 e Spring Boot 3.x.
- **Decisões da equipe:** PostgreSQL, Maven e front end React + Vite (a especificação não as exige).
- **Escopo:** os 14 requisitos funcionais (RF-01 a RF-14) e as 8 regras críticas (RN-01 a RN-08) da especificação, mais RF-15 e RF-16 (acréscimos da equipe) e as regras RN-09 a RN-33 (decisões da equipe). Detalhes em [docs/prd.md](docs/prd.md).
- **Decisões e lacunas:** [docs/prd/perguntas-abertas.md](docs/prd/perguntas-abertas.md) registra as decisões da equipe (A1 a A8, B1 a B4, C1 a C8, D2, D5 a D8 e D10 a D16) e as lacunas D1, D3, D4, D9 e D17, todas decididas pela equipe em 24/10/2026, sem validação do professor ([docs/decisoes-equipe.md](docs/decisoes-equipe.md), F7-16 e F7-17). S6 e S7 são suposições a validar. As regras estão em [docs/prd/regras-negocio.md](docs/prd/regras-negocio.md).

## Perfis

| Perfil | Papel | Persona |
| --- | --- | --- |
| Solicitante | Professor ou coordenador que consulta a disponibilidade e cria, altera ou cancela suas reservas | [Solicitante](docs/prd/personas/solicitante.md) |
| Responsável | Aprova solicitações especiais, valida a alocação de docentes e acompanha retiradas e devoluções | [Responsável](docs/prd/personas/responsavel.md) |
| Administrador | Gerencia salas, professores, materiais, usuários, bloqueios e períodos de manutenção | [Administrador](docs/prd/personas/administrador.md) |

## Como subir

Pré-requisitos (instale antes de começar):

- Git, `curl` e um shell Bash: o Git Bash (Git for Windows) no Windows, ou o Bash do sistema no Linux e no macOS. Os comandos abaixo são de Bash.
- Java 21 (Temurin ou equivalente).
- Docker com o Docker Compose v2 (comando `docker compose`), usado sem `sudo`: em Linux, o usuário precisa estar no grupo `docker`.
- `unzip`, em Linux. O Maven vem pelo wrapper (`./mvnw`), que sem `unzip` falha com uma mensagem que parece ataque (veja o passo 3). Em Debian e Ubuntu: `sudo apt install -y unzip`.
- Node 22.12 ou mais novo, só para o front end (passo 6).

**Onde foi verificado:** o fluxo foi verificado em **Windows 11 com Git Bash**, num só computador, e em dois testes manuais do autor em **Ubuntu 24.04 sobre WSL2**, sobre a `main` (o segundo registro anota o commit `b2d6110`) e sem log versionado ([docs/testes/limitadores-de-nota.md](docs/testes/limitadores-de-nota.md), seções 2.5, 2.6 e 2.11). A CI roda os quatro jobs em `ubuntu-24.04` ([ci.yml](.github/workflows/ci.yml)). **macOS e PowerShell não foram testados.**

0. Baixe o código da versão avaliada e entre na pasta clonada (os passos seguintes rodam na raiz dela):

   ```bash
   git clone https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson.git
   cd Projeto-QA-Organizador-de-Recursos-Jefferson
   git checkout --detach v1.0.0-rc5
   ```

   A `main` pode ter commits posteriores à tag; para reproduzir os números deste README, use a tag.
1. Copie `.env.example` para `.env` (`cp .env.example .env`) e preencha **todas** as variáveis que vierem vazias, com valores **locais** (senhas inventadas por você, nunca reais). A `DB_URL` já vem pronta e usa o `POSTGRES_DB` que você preencher: não mude a ordem das linhas. O `.env` é lido no Bash por `. ./.env` (passo 3) e pelo Docker Compose, então **não pode sobrar `<` nem `>` em nenhum valor**. O arquivo `.env` não é versionado e nenhum segredo entra no repositório.

   | Variável | O que colocar |
   | --- | --- |
   | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Nome, usuário e senha do banco local |
   | `DB_URL` | **Já vem preenchida** (`jdbc:postgresql://localhost:5432/${POSTGRES_DB}`) e usa o `POSTGRES_DB`; não precisa editar |
   | `DB_USER`, `DB_PASSWORD` | Os mesmos valores de `POSTGRES_USER` e `POSTGRES_PASSWORD` |
   | `SESSAO_DURACAO` | Duração da sessão em ISO-8601, por exemplo `PT30M` |
   | `LOGIN_TENTATIVAS`, `LOGIN_JANELA` | Já vêm preenchidos (`5` e `PT10M`); mantenha |
   | `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_SENHA` | O primeiro Administrador, criado só se não houver usuário. Sem ele não há como entrar |
   | `CORS_ORIGENS` | `http://localhost:5173` para usar o front em desenvolvimento |
   | `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY` | Só para a análise do SonarCloud; podem ficar vazias para subir e testar localmente |
   | `NOTIFICACAO_URL`, `NOTIFICACAO_TOKEN`, `NOTIFICACAO_TIMEOUT_CONEXAO`, `NOTIFICACAO_TIMEOUT_LEITURA` | **Opcionais**; não vêm no `.env.example`, a aplicação lê de `application.yml`. `NOTIFICACAO_URL` é o endereço do provedor do webhook e `NOTIFICACAO_TOKEN` a credencial enviada como Bearer; vazios (o padrão), o envio fica desligado e as notificações ficam `PENDENTE`. Os dois prazos têm padrão `PT0.5S` (conexão) e `PT1.5S` (leitura), valores iniciais a validar (ADR-007) |

   `SESSAO_DURACAO`, `LOGIN_TENTATIVAS` e `LOGIN_JANELA` não têm valor padrão: sem eles a aplicação não sobe.

   Exemplo de `.env` depois de preenchido, com as mesmas variáveis do `.env.example` (exemplo para teste local; nunca use senhas reais):

   ```bash
   POSTGRES_DB=recursos
   POSTGRES_USER=recursos
   POSTGRES_PASSWORD=senha-local-do-banco
   DB_URL=jdbc:postgresql://localhost:5432/${POSTGRES_DB}
   DB_USER=recursos
   DB_PASSWORD=senha-local-do-banco
   SESSAO_DURACAO=PT30M
   BOOTSTRAP_ADMIN_EMAIL=admin@exemplo.test
   BOOTSTRAP_ADMIN_SENHA=senha-local-do-admin
   SONAR_ORGANIZATION=
   SONAR_PROJECT_KEY=
   CORS_ORIGENS=http://localhost:5173
   LOGIN_TENTATIVAS=5
   LOGIN_JANELA=PT10M
   ```

   A `DB_URL` termina com o `POSTGRES_DB`, e `DB_USER` e `DB_PASSWORD` repetem `POSTGRES_USER` e `POSTGRES_PASSWORD`. Se o seu `.env` veio de uma versão anterior à rc5, a `DB_URL` trazia o texto `<POSTGRES_DB>`: troque-o pelo nome do banco ou use a linha acima.
2. Suba o banco e **espere ele ficar saudável**: `docker compose up -d --wait postgres` (Docker Compose v2). O comando só termina quando o teste de saúde do `compose.yaml` (`pg_isready`) passa; sem a espera, o `docker compose up -d postgres` retorna antes de o PostgreSQL aceitar conexões, e o passo 3, logo em seguida, pode falhar com `Unable to obtain connection from database` (`FlywaySqlException`). A primeira vez baixa a imagem do PostgreSQL.
3. Exporte as variáveis do `.env` e rode a aplicação: `set -a && . ./.env && set +a && ./mvnw spring-boot:run`.
   - Esse comando **fica em primeiro plano e ocupa o terminal** enquanto a aplicação roda: use um terminal para ele e outro para os passos 4 a 6. Na primeira execução o Maven baixa muitas dependências e a aplicação demora a ficar pronta. Para parar, `Ctrl+C` nesse terminal.
   - Se o `. ./.env` mostrar `syntax error`, procure `<` ou `>` no `.env` (`grep -n '[<>]' .env`).
   - Em Linux **sem `unzip`**, o `./mvnw` termina com `Error: Failed to validate Maven distribution SHA-256, your Maven distribution might be compromised`. Isso **não indica ataque**: sem `unzip` o wrapper baixa o `.tar.gz` do Maven, cuja soma não confere com a do `.zip` fixada em `.mvn/wrapper/maven-wrapper.properties` (F7-06, F7-14). Instale o `unzip` (`sudo apt install -y unzip` em Debian e Ubuntu) e rode de novo.
4. Em outro terminal, na raiz do repositório, verifique a saúde: `curl -s http://localhost:8080/actuator/health` deve responder `{"status":"UP"}`.
5. Entre com o Administrador do passo 1. O corpo é JSON (`Content-Type: application/json`) com `email` e `senha`, e a resposta traz `token`, `perfil` e `expiraEm`. No mesmo terminal do passo 4:

   ```bash
   set -a && . ./.env && set +a
   API=http://localhost:8080
   TOKEN=$(curl -s -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
     -d "{\"email\":\"$BOOTSTRAP_ADMIN_EMAIL\",\"senha\":\"$BOOTSTRAP_ADMIN_SENHA\"}" \
     | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
   echo "$TOKEN"
   ```

   As demais operações exigem `Authorization: Bearer <token>` (ADR-004; aqui, `-H "Authorization: Bearer $TOKEN"`). Se a senha tiver `"` ou `\`, escape-os no JSON.
6. Front end (opcional), em outro terminal, a partir da raiz do repositório:

   ```bash
   cd frontend
   npm ci
   cp .env.example .env     # ajuste VITE_API_URL se a API não estiver em http://localhost:8080
   npm run gerar:api        # regenera src/api/schema.d.ts a partir de ../docs/api/openapi.json
   npm run lint
   npm run typecheck
   npm test
   npm run build
   npm run dev
   ```

   `gerar:api`, `lint`, `typecheck`, `test` e `build` são conferências, na ordem da CI (seção "Front end"); para só usar a tela bastam `npm ci`, o `.env` e `npm run dev`. No Windows, o `git status` pode listar `frontend/src/api/schema.d.ts` depois do `gerar:api` só por causa do fim de linha; o conteúdo não muda. O `npm run dev` também ocupa o terminal (`Ctrl+C` para parar). Abra o endereço que o Vite mostrar (por padrão `http://localhost:5173`) e entre com o mesmo Administrador.

### Primeiro uso pela API (fluxo mínimo)

Com a aplicação no ar e o `TOKEN` do passo 5 (na mesma sessão do Bash, com `API` definida), o Administrador cadastra um Solicitante e uma sala, e o **Solicitante** reserva a sala; o Administrador recebe 403 em reservas. Cada chamada mostra o código HTTP esperado, e o `id` da sala é extraído da resposta, sem `jq`. Os corpos seguem o contrato [docs/api/openapi.json](docs/api/openapi.json): na sala, `horaAbertura` e `horaFechamento` são `HH:mm` e `diasFuncionamento` usa 1 (segunda) a 7 (domingo); o fuso é `America/Sao_Paulo` (RN-15), então `13:00Z` é 10:00 local; a reserva precisa estar no futuro, dentro do horário da sala e sem cruzar a meia-noite. **A data do exemplo pode já ter passado: troque `2027-03-16` por uma data futura.** `tipoSala` é livre (`AULA` é só exemplo).

```bash
JSON='Content-Type: application/json'
# postar CAMINHO TOKEN CORPO: faz o POST e mostra o corpo da resposta e, na linha seguinte, o código HTTP
postar() { curl -s -w '\nHTTP %{http_code}\n' -X POST "$API$1" -H "Authorization: Bearer $2" -H "$JSON" -d "$3"; }
# pegar_id: lê o corpo da resposta e imprime o primeiro "id" (o "id" é o primeiro campo do JSON)
pegar_id() { sed -n 's/^{"id":\([0-9]*\).*/\1/p'; }

# 1. Solicitante (como Administrador): HTTP 201 e o "id" do usuário
R=$(postar /api/usuarios "$TOKEN" '{"nome":"Professora Teste","email":"solicitante@exemplo.test","senha":"senha-local-1234","perfil":"SOLICITANTE"}'); echo "$R"

# 2. Sala (como Administrador): HTTP 201; o "id" da sala vai para SALA_ID
R=$(postar /api/salas "$TOKEN" '{"nome":"Sala 101","capacidade":30,"localizacao":"Bloco A","tipoSala":"AULA","horaAbertura":"07:00","horaFechamento":"22:00","diasFuncionamento":[1,2,3,4,5,6,7],"restrito":false}'); echo "$R"
SALA_ID=$(echo "$R" | pegar_id); echo "SALA_ID=$SALA_ID"

# 3. Entrar como Solicitante (se TOKEN2 ficar vazio, o login falhou)
TOKEN2=$(curl -s -X POST "$API/api/auth/login" -H "$JSON" \
  -d '{"email":"solicitante@exemplo.test","senha":"senha-local-1234"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# 4. Reservar a sala (como Solicitante): HTTP 201 e "estado":"APROVADA" (sala não restrita)
postar /api/reservas "$TOKEN2" "{\"titulo\":\"Aula de teste\",\"inicio\":\"2027-03-16T13:00:00Z\",\"fim\":\"2027-03-16T14:00:00Z\",\"recursoIds\":[$SALA_ID]}"

# 5. Repetir com uma janela que se sobrepõe: HTTP 409 com o código CONFLITO_DE_ALOCACAO
postar /api/reservas "$TOKEN2" "{\"titulo\":\"Outra aula\",\"inicio\":\"2027-03-16T13:30:00Z\",\"fim\":\"2027-03-16T14:30:00Z\",\"recursoIds\":[$SALA_ID]}"

# 6. O Administrador não reserva: HTTP 403
postar /api/reservas "$TOKEN" "{\"titulo\":\"Teste do Administrador\",\"inicio\":\"2027-03-17T13:00:00Z\",\"fim\":\"2027-03-17T14:00:00Z\",\"recursoIds\":[$SALA_ID]}"
```

### Parar e limpar

`Ctrl+C` na API e no Vite. `docker compose down` derruba o banco e **mantém os dados** no volume; `docker compose down -v` também **apaga o volume e todos os dados do banco local**. O `.env` e a pasta clonada ficam até você apagá-los.

## Configuração opcional

A aplicação sobe e funciona sem esta configuração, mas quatro comportamentos vêm desligados ou sem valor, porque a especificação não define os valores (lacunas D1, D2 e D3; [docs/decisoes-equipe.md](docs/decisoes-equipe.md), F7-16). Cada um liga sozinho.

| O que | Sem a configuração | Como ligar |
| --- | --- | --- |
| Despacho de notificações (RF-11) | A notificação nasce `PENDENTE` na transação da reserva e permanece assim, mesmo com `NOTIFICACAO_URL` preenchida | Variáveis de ambiente `APP_JOBS_NOTIFICACOES_HABILITADO=true` e `APP_JOBS_NOTIFICACOES_INTERVALO` (por exemplo `PT30S`), mais `NOTIFICACAO_URL` e `NOTIFICACAO_TOKEN` |
| Cancelamento por SEM_DECISAO (RN-25) | A reserva SOLICITADA sem decisão continua SOLICITADA depois do início | `APP_JOBS_SEM_DECISAO_HABILITADO=true` e `APP_JOBS_SEM_DECISAO_INTERVALO` (por exemplo `PT1M`) |
| Reenvio de notificação que falhou (D3) | A primeira falha de envio deixa a notificação `PENDENTE` para sempre, sem nova tentativa | Colunas `tentativas_reenvio` e `intervalo_reenvio_inicial` da tabela `configuracao` (só por SQL) |
| Tolerância de não comparecimento (D1) | `POST /api/reservas/{id}/nao-comparecimento` responde 409 `TOLERANCIA_NAO_CONFIGURADA` | Coluna `tolerancia_nao_comparecimento` da tabela `configuracao` (só por SQL) |

Os agendadores se ligam exportando as variáveis no mesmo terminal do passo 3 de "Como subir", antes de `./mvnw spring-boot:run`:

```bash
export APP_JOBS_NOTIFICACOES_HABILITADO=true APP_JOBS_NOTIFICACOES_INTERVALO=PT30S
export APP_JOBS_SEM_DECISAO_HABILITADO=true APP_JOBS_SEM_DECISAO_INTERVALO=PT1M
```

O destinatário da notificação recebe um `POST` em JSON com `evento`, `reservaId`, `destinatarioId`, `instante` e `chaveIdempotencia`, o cabeçalho `Idempotency-Key` e, se `NOTIFICACAO_TOKEN` estiver definido, `Authorization: Bearer`. Para um teste local, o destinatário pode ser um servidor HTTP qualquer em `127.0.0.1` (use o endereço numérico: `localhost` pode resolver para IPv6).

Os valores de D1 e D3 não têm rota na API; só existe o SQL. Com o banco do `compose.yaml` no ar, a partir da raiz do repositório:

```bash
echo "update configuracao set tolerancia_nao_comparecimento = interval '30 minutes', tentativas_reenvio = 3, intervalo_reenvio_inicial = interval '30 seconds'" | docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Os valores acima são **exemplos**, não uma decisão. A tolerância passa a valer na hora (antes do fim dela a resposta é 409 `TOLERANCIA_NAO_ENCERRADA`, depois dela é 200 e a reserva vai a `NAO_COMPARECEU`); o intervalo dobra a cada tentativa, até o número de tentativas (pelo código, a notificação que passar do limite vai a `FALHA`). O comando acima foi executado como está escrito, e o efeito de D1 e de D3 foi observado ao vivo em 31/10/2026 ([docs/testes/limitadores-de-nota.md](docs/testes/limitadores-de-nota.md), seção 2.9).

## Como testar

```bash
./mvnw -B verify
```

Roda os testes de unidade e de arquitetura (`*Test`, Surefire) e os de integração com PostgreSQL real em container (`*IT`, Failsafe e Testcontainers; o Docker precisa estar ativo). Os relatórios ficam em `target/surefire-reports`, `target/failsafe-reports` e `target/site/jacoco`.

| Teste | O que prova |
| --- | --- |
| `ArquiteturaTest` | Seis regras de camada MVC: o model não depende de Spring, persistência nem das outras camadas, o controller não acessa repository, o service não depende de controller nem de DTO (ADR-014) |
| `ContextoIT` | A aplicação sobe com PostgreSQL real, o Flyway aplica a baseline e o relógio é UTC (ADR-005, ADR-009) |

O `verify` roda também o gate de cobertura do JaCoCo, que reprova abaixo de 80% de linhas ou de 70% de branches (`pom.xml`, ADR-011). Na execução E-25 (run [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577)) o back end tem 665 testes, o front 910 e o E2E 5; o resultado por classe está em [docs/testes/execucao-e25.md](docs/testes/execucao-e25.md). A tag avaliada é a `v1.0.0-rc5` (`git checkout --detach v1.0.0-rc5`; commit em `git rev-list -n 1 v1.0.0-rc5`; [Release](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/releases/tag/v1.0.0-rc5)). O código, os testes, as dependências, os workflows e a configuração de build da rc5 são idênticos aos da `v1.0.0-rc4`: a rc5 muda a documentação e o `.env.example` (F7-31). Na E-26 (run [`40790098761`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40790098761)) a contagem é a mesma: 665 testes no back end, 910 no front e 5 no E2E; resultado por classe em [docs/testes/execucao-e26.md](docs/testes/execucao-e26.md). O código dessas execuções é o da versão anterior, sem a correção do BUG-028. Na execução E-27 (run [`41238067466`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/41238067466), commit `b5e9bbd`, que só difere da tag em arquivos `.md`: `git diff --stat b5e9bbd v1.0.0-rc4`) o back end tem 670 testes (231 de unidade e arquitetura e 439 de integração e BDD, com os 5 novos CT-168 a CT-170), o front 910 e o E2E 5; resultado por classe em [docs/testes/execucao-e27.md](docs/testes/execucao-e27.md).

### Requisitos para rodar o `verify`

O `verify` sobe um PostgreSQL real em contêiner (Testcontainers). Antes de rodar:

1. **Docker Desktop aberto e pronto**: `docker info` precisa responder.
2. **Imagem do PostgreSQL já baixada** (recomendado: evita esperar o download dentro do teste e, no Windows com Git Bash, evitou a falha descrita abaixo): `docker pull postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3`. O digest é o mesmo de `BancoRealIT`.

   **Problema observado no Windows com Git Bash:** nas quatro primeiras tentativas de clone limpo registradas (três na seção 2.5 e uma na seção 2.6 de [docs/testes/limitadores-de-nota.md](docs/testes/limitadores-de-nota.md)), o `docker compose up -d postgres` terminou com `error getting credentials - err: exec: "docker-credential-desktop": executable file not found in %PATH%`, ao tentar baixar a imagem `postgres:17` fixada por digest. Acrescentar o diretório `resources/bin` do Docker Desktop ao `PATH` não resolveu (tentativa 2 da seção 2.5). O fluxo passou depois de um `docker pull` da imagem fixada executado pelo PowerShell (resposta: "Image is up to date"), sem alterar nenhum arquivo do repositório. A causa não foi investigada (fonte: [docs/testes/limitadores-de-nota.md](docs/testes/limitadores-de-nota.md), seções 2.5 e 2.6).
3. **Aplicação do "Como subir" parada** (`Ctrl+C` na API e no Vite, e `docker compose down`). Nas medições abaixo, o `verify` com a aplicação no ar passou do mesmo jeito; parar a aplicação é só para não dividir a máquina.
4. **Outros programas pesados fechados.** Durante a compilação e o `npm ci`, o antivírus do Windows (`MsMpEng`) chegou a usar mais de 100% de CPU nesta máquina.

**O que foi medido** (todas as medidas são de **um** computador: notebook Intel Core i5-7200U, 2 núcleos e 4 threads, 19,9 GB de RAM, Windows 11, Docker Desktop com 4 CPUs e 9,65 GiB; **não são mínimos**, são as configurações com que passou):

| Situação | Execuções | Duração do `verify` |
| --- | --- | --- |
| Clone limpo, aplicação parada, imagem já baixada | 3 de 3 passaram | 475 s a 490 s |
| Clone limpo, aplicação do README no ar, imagem já baixada | 3 de 3 passaram | 478 s a 519 s |
| Logo depois do fluxo completo do README, com o front (`npm ci` e Vite) | 2 de 2 passaram | 772 s e 904 s |
| Clone limpo, imagem ausente (o Testcontainers baixou 159 MB em 94 s) | 1 de 1 passou | 938 s |
| Commit da correção (`523849f`), 5 execuções consecutivas, aplicação parada, imagem já baixada | 5 de 5 passaram | 519 s a 1522 s (933, 1522, 867, 717 e 519 s) |
| Clone limpo da execução E-25, depois do fluxo do "Como subir" (aplicação no ar em 150 s e front em 366 s desde o clone), aplicação encerrada, imagem já baixada | Passou na 2ª tentativa (a 1ª falhou por ambiente, ver o problema acima) | 539 s (231 + 434 testes, 0 falhas) |
| Clone limpo da execução E-27 (commit `b5e9bbd`), depois do fluxo do "Como subir" (banco saudável em 262 s, aplicação no ar em 337 s e front no ar em 867 s desde o clone), aplicação encerrada, imagem já baixada | Passou | 480 s (231 + 439 testes, 0 falhas) |

No fluxo completo do clone limpo, o **`npm ci` do front é a parte mais demorada** e pode levar vários minutos: cerca de 207 s na prova da seção 2.6, cerca de 380 s na da seção 2.5 e cerca de 520 s na da execução E-27 (de 340 s a 860 s desde o clone, com a máquina mais lenta), na mesma máquina (fonte: [docs/testes/limitadores-de-nota.md](docs/testes/limitadores-de-nota.md), seções 2.5 e 2.6).

O tempo esperado, com a máquina livre, é de **cerca de 8 minutos** (475 s a 519 s); com a máquina ocupada chegou a 1522 s (25 minutos), então não pare o comando antes de 30 minutos. O PostgreSQL do teste ficou pronto em 10 a 15 s nessas execuções. O prazo de início do banco no `BancoRealIT` é de 180 s (o padrão do Testcontainers, 60 s, estourou duas vezes em clone limpo, em 24/10/2026, numa máquina ocupada; ver F7-19 em [docs/decisoes-equipe.md](docs/decisoes-equipe.md)).

### Front end

Pré-requisito: Node 22.12 ou mais novo (veja os pré-requisitos de "Como subir"). Os comandos do passo 6, em detalhe; tudo roda em `frontend/`.

```bash
cd frontend
npm ci                  # instala as versões exatas do package-lock.json
npm run gerar:api       # regenera src/api/schema.d.ts a partir de ../docs/api/openapi.json
npm run lint            # ESLint, inclusive regras de acessibilidade (jsx-a11y)
npm run typecheck       # tsc --noEmit
npm test                # Vitest e Testing Library: componente, contraste dos tokens e regras do ADR-015
npm run build           # tipos e build de produção
npm run dev             # servidor de desenvolvimento; copie .env.example para .env e ajuste VITE_API_URL
```

O contrato da API é a fonte dos tipos: o CI regenera `schema.d.ts` e falha se o arquivo versionado divergir do contrato.
Os testes de contraste leem `src/estilo/tokens.css` de verdade e exigem WCAG AA nos dois temas.

## Documentação da API

O contrato da API é o arquivo versionado [docs/api/openapi.json](docs/api/openapi.json) (OpenAPI), conferido contra o contrato da aplicação em execução pelo teste `DocumentacaoApiIT` (`ct115`). Os fluxos públicos estão em [docs/prd/fluxos-sequencia.md](docs/prd/fluxos-sequencia.md) (14 diagramas de sequência). A documentação servida pela própria aplicação em execução exige autenticação (`DocumentacaoApiIT`, `ct114`; verificado em 26/10/2026 com a aplicação do "Como subir": sem token, as URLs de documentação responderam 401), por isso este README não cita uma URL para ela; use o arquivo versionado.

## Integração contínua

O workflow [ci.yml](.github/workflows/ci.yml), chamado `qualidade`, roda quatro jobs em todo pull request e em push na `main`: `test` (`./mvnw -B verify` com PostgreSQL real, JaCoCo e análise do SonarCloud), `frontend` (`npm ci`, tipos da API conferidos contra o contrato, lint, tipos, testes e build), `e2e` (PostgreSQL, API e front reais por `compose.e2e.yaml` e testes Playwright) e `segredos` (varredura com gitleaks). Permissões mínimas (`contents: read`), ações fixadas por SHA, cancelamento de execuções obsoletas, sem `continue-on-error` e sem `pull_request_target`; o único segredo é o `SONAR_TOKEN` do passo do SonarCloud. Publica os relatórios do Surefire, do Failsafe e do JaCoCo como artifact.

### Execuções registradas

| Run | Resultado | O que mostra |
| --- | --- | --- |
| `38785819928` | Vermelho, defeito real | `mvnw` sem permissão de execução, exit 126 (BUG-006) |
| `38786037634` | Verde | Build verde depois da correção |
| `38786300308` | Vermelho, intencional | Asserção de `ContextoIT` quebrada de propósito (commit `test(red)`) |
| `38786508100` | Verde | Recuperação depois do `revert` |
| `38786781324` | Verde | JaCoCo publicado e SonarCloud ignorado com aviso, por falta do token |
| `40099734514` | Vermelho, intencional | Asserção de `PeriodoTest` invertida num PR descartável, com o check obrigatório `test` barrando o merge (F7-04); PR fechado sem mesclar |
| `40109437336` | Vermelho, intencional | Soma SHA-256 do Maven errada num PR descartável, com `test` e `e2e` barrando (F7-06); PR fechado sem mesclar |
| [`40116523445`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40116523445) | Verde | `main` em `c9240cd`: back end 665 testes, front 910 e E2E 5 (E-24) |
| [`40373624577`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40373624577) | Verde | `main` em `d2b6af1`, execução E-25: back end 665 testes, front 910 e E2E 5; JaCoCo 97,01% e 86,88%; Quality Gate OK (E-25) |
| [`40790098761`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40790098761) | Verde | `main` em `005c7af`, execução E-26: back end 665 testes, front 910 e E2E 5; JaCoCo 97,01% e 86,54%; Quality Gate OK (E-26) |
| [`41238067466`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/41238067466) | Verde | `main` em `b5e9bbd`, execução E-27: back end 670 testes, front 910 e E2E 5; JaCoCo 97,84% e 87,21%; Quality Gate OK |

### SonarCloud (passos da equipe)

O token não é versionado nem gravado em arquivo. Quem administra a organização faz:

1. Importar o repositório em https://sonarcloud.io e anotar o identificador da organização e a chave do projeto.
2. No GitHub, em *Settings → Secrets and variables → Actions*, cadastrar o secret `SONAR_TOKEN` e as variáveis `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY`.
3. Abrir ou atualizar um pull request: o passo "Análise do SonarCloud" passa a executar e a esperar o Quality Gate.

Estado atual (24/10/2026): configurado. O Quality Gate roda dentro do job `test` (`-Dsonar.qualitygate.wait=true`) e reprova o job. Sem os segredos (PRs do Dependabot), o passo apenas avisa e o build segue.

### Proteção da `main` (passos de quem administra o repositório)

Em *Settings → Branches → Add branch ruleset* (ou regra de proteção) para `main`:

1. Exigir pull request antes do merge, com **0 aprovações**: a equipe é uma pessoa e a revisão é assistida (veja "Limitações conhecidas").
2. Exigir os checks de status `test`, `frontend`, `e2e` e `segredos` do workflow `qualidade`, com a branch atualizada (`strict`).
3. Bloquear push direto, force push e a exclusão da branch.
4. Valer também para administrador (sem merge administrativo).

**Estado atual**, lido pela API do GitHub em 24/10/2026 (F6-21 e F7-10): é exatamente isso. SonarCloud verde segue como regra de trabalho (o Quality Gate já reprova o job `test`); o check externo "SonarCloud Code Analysis" não é obrigatório porque não roda nos PRs do Dependabot.

## Estrutura de pastas

Todos os itens abaixo existem no repositório (conferido em 01/11/2026).

```text
README.md              visão do projeto
CHANGELOG.md           mudanças por versão
RTM.md                 matriz de rastreabilidade: uma linha por RF, por RN e por RNF, com caso de teste, evidência e status
AGENTS.md              regras do projeto para agentes
docs/
  prd.md               visão, escopo, restrições e métricas
  plano-de-teste.md    plano de teste e riscos R-xx
  prd/
    personas/          Solicitante, Responsável e Administrador
    perguntas-abertas.md   registro de decisões e lacunas
    regras-negocio.md      RN-01 a RN-33 e transições de estado
    requisitos-funcionais.md   RF-01 a RF-16 e matrizes RN-RF
    modelo-dados.dbml      modelo de dados, importável no dbdiagram.io
    fluxos-sequencia.md    14 diagramas de sequência
    navegacao-telas.md     mapa de navegação, 11 telas e mapa dos códigos de erro do front end
  arquitetura.md       drivers, C4, painel, matriz e porta de saída da Fase 2
  taticas-arquiteturais-len-bass.md   catálogo de táticas usado no ATAM
  api/                 openapi.json: contrato OpenAPI da API, conferido por teste (`DocumentacaoApiIT`)
  adr/                 ADR-001 a ADR-015 (decisões de arquitetura)
  avaliacao-arquitetural/   ciclo-00.md (ATAM, CEN-01 a CEN-11) e ciclo-01.md (código de pé)
  testes/              casos de teste, plano de TDD, matriz de autorização, BDD, evidência de TDD, mutação (PIT e manual), revisão de segurança, modelo de ameaças, limitadores de nota, auditoria da RTM, execuções E-24 a E-27, alertas do Dependabot, revisão assistida do front, ocorrências a vigiar, o E2E e o roteiro de verificação em navegador real
  defeitos/            README.md: processo, labels e índice BUG-xxx; analise-causa-raiz.md
  decisoes-equipe.md   decisões e suposições aceitas, com quem e quando
  limitacoes-e-divida-tecnica.md   o que está aberto ou declarado: risco aceito, limitação, suposição e dívida técnica
  evidencias/          índice das evidências do pacote de entrega
  decisao-qualidade.md   decisão de qualidade, critérios, riscos aceitos e declaração de autoria
  entrega/             checklist do avaliador externo sobre os entregáveis
  status-requisitos.md   situação dos 14 RF obrigatórios e das regras críticas, com evidência e prova de mutação
  rtm.md               aponta para a RTM.md da raiz
  seguranca/           aponta para a matriz de autorização em testes/
  perguntas-professor.md   registro das decisões sobre as lacunas
  performance/         rnf.md (requisito e modelo de carga), resultado-01.md e resultado-02.md
perf/                  testes de carga com JMeter: plano, usuários fictícios, resultado bruto e README
frontend/              React + Vite + TypeScript (ADR-015): cliente gerado do OpenAPI, sessão, tema, rotas por perfil, as 11 telas (T01 a T11), testes de componente e `e2e/` (Playwright)
pom.xml, mvnw          projeto Maven, Java 21 e Spring Boot 3.5.16, com o wrapper
compose.yaml           PostgreSQL local; credenciais pelo arquivo .env (modelo em .env.example)
compose.e2e.yaml, Dockerfile   PostgreSQL, API e front reais para o E2E; o Dockerfile é o da API (frontend/Dockerfile é o do front)
src/main/java/br/senac/recursos/   MVC (ADR-014): controller, dto, service, repository, model, exception, config, security
src/main/resources/    application.yml (só variáveis de ambiente) e db/migration (Flyway)
src/test/java/         testes de unidade, de arquitetura, de API (MockMvc + PostgreSQL real) e Cucumber (bdd/)
src/test/resources/features/   cenários BDD de aprovação e bloqueio
.github/               ISSUE_TEMPLATE/defeito.md, pull_request_template.md, dependabot.yml e workflows/ci.yml (jobs test, frontend, e2e e segredos)
.aiox-core/            framework de agentes, instalado, com as skills do projeto
.claude/               configuração do Claude Code (CLAUDE.md, regras, hooks e skills); .github/agents/ tem agentes do GitHub Copilot, que não foi usado
```

## Roadmap por fases

| Fase | Foco | Estado |
| --- | --- | --- |
| 0 | Preparação do ambiente e regras do projeto | Concluída |
| 1 | Requisitos funcionais: contexto, personas, regras, RF, modelo de dados, fluxos, RTM e plano de teste em esqueleto | Concluída e revisada; lacunas D1, D3, D4, D9 e D17 decididas pela equipe em 24/10/2026, sem validação do professor |
| 2 | Requisitos não funcionais, arquitetura e ATAM | Concluída em 15/10/2026; ADR aceitos. A1 a A8 decididas pela equipe em 24/10/2026, sem validação do professor |
| 3 | Casca Maven, integração contínua e processo de defeitos | Concluída; PR 1 mesclado na `main` em 17/10/2026 |
| 4 | Back end guiado por testes (TDD e BDD) | Concluída; PR 2 mesclado na `main` em 17/10/2026 (468 testes, 96,7% de linhas, 84,6% de branches, Quality Gate do SonarCloud aprovado). Lacunas decididas pela equipe em 24/10/2026, sem validação do professor |
| 5 | Testes de carga, segurança e robustez (JMeter) | Concluída em 17/10/2026. Carga: rodadas 01 a 04; a criação de reserva **não atende** a hipótese de p95 de 300 ms nesta máquina, com causa localizada no `fsync` do PostgreSQL em Docker; consulta, 0 erro real, 0 resposta 500 e 0 dupla reserva atendem. Segurança: revisão OWASP Top 10:2025, CORS, correlação de logs, varredura de segredos, Dependabot e limite de tentativas de login (5 em 10 minutos) |
| 6 | Front end | Concluída em 22/10/2026: as 11 telas do mapa de telas (T01 a T11), cada uma com teste de componente, verificação em navegador real e documentação, e 5 testes E2E na CI. RF-11 e RF-14 não têm tela, por interpretação declarada (F6-20). Ver o [relatório de qualidade](docs/relatorio-qualidade.md) e o [mapa de telas](docs/prd/navegacao-telas.md) |
| 7 | Fechamento e relatório de qualidade | **Concluída.** Feitos: revisão assistida do front, limitadores de nota, auditoria da RTM e correção dos defeitos achados, soma do Maven, modelo de ameaças, leitura final de cobertura e do SonarCloud, [relatório final de qualidade](docs/relatorio-qualidade.md) e [decisão de qualidade](docs/decisao-qualidade.md) (**liberar com ressalvas**, Jefferson Silva Geronimo), decisões F7-01 a F7-31, `verify` robusto, os três PRs do Dependabot do front mesclados, 22 de 22 requisitos críticos com prova de mutação e [limitações e dívida técnica](docs/limitacoes-e-divida-tecnica.md). Tag `v1.0.0-rc5` (as anteriores ficam como histórico); o histórico de versões está no [CHANGELOG.md](CHANGELOG.md). Pacote de entrega: [índice de evidências](docs/evidencias/README.md), [CHANGELOG.md](CHANGELOG.md), [status dos requisitos](docs/status-requisitos.md) e [checklist do avaliador](docs/entrega/checklist.md) |

## Pacote de evidências (release candidate)

A tag avaliada é a **`v1.0.0-rc5`**. Em relação à `v1.0.0-rc4`, que fica como histórico, ela muda só a documentação e o `.env.example` (a `DB_URL` passa a vir pronta, sem `<` nem `>`; F7-31); o código, os testes, as dependências, os workflows e a configuração de build são os mesmos. Em relação às execuções E-25 e E-26, o código corrige o defeito BUG-028 (o agendamento do despacho de notificações dependia do agendador de SEM_DECISAO; [#111](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/issues/111)), com teste de regressão (CT-168 a CT-170); a configuração padrão não muda. O commit da tag é o que `git rev-list -n 1 v1.0.0-rc5` imprime, e a [Release v1.0.0-rc5](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/releases/tag/v1.0.0-rc5) traz o hash, o run da CI e os números dessa revisão. Os números abaixo são os da execução E-27, medida no commit `b5e9bbd` sobre o código da rc4 (o mesmo da rc5); os de E-25 e E-26 são históricos ([docs/testes/execucao-e25.md](docs/testes/execucao-e25.md), [docs/testes/execucao-e26.md](docs/testes/execucao-e26.md)). A decisão de qualidade é **liberar com ressalvas** (Jefferson Silva Geronimo, 24/10/2026), reafirmada para a `v1.0.0-rc5`, e as ressalvas estão no [relatório final](docs/relatorio-qualidade.md).

| Evidência | Resultado | Onde |
| --- | --- | --- |
| Testes na CI | Back end 670 (231 de unidade e arquitetura, 439 de integração e BDD), front 910 em 56 arquivos, E2E 5 de 5, 0 falhas (E-27) | [docs/testes/execucao-e27.md](docs/testes/execucao-e27.md); histórico: [docs/testes/execucao-e25.md](docs/testes/execucao-e25.md) e [docs/testes/execucao-e26.md](docs/testes/execucao-e26.md) |
| JaCoCo | Linhas 97,84% (1767 de 1806; meta 80%) e branches 87,21% (525 de 602; meta 70%) na E-27. Os branches variam entre execuções de código idêntico (de 519 a 523 de 602 antes da rc4) | Artefato `relatorio-jacoco` do run da E-27 (expira em 30/11/2026) e resumo em [docs/testes/jacoco-resumo.md](docs/testes/jacoco-resumo.md); [docs/testes/leitura-final-cobertura.md](docs/testes/leitura-final-cobertura.md) |
| SonarCloud | Quality Gate aprovado na E-27, 0 bugs, 0 vulnerabilidades, 0 issues abertas; cobertura geral 95,2% | [Painel do projeto](https://sonarcloud.io/dashboard?id=Jefferson-Silva-Geronimo_Projeto-QA-Organizador-de-Recursos-Jefferson) |
| Rastreabilidade | 55 linhas na RTM, 100% das linhas críticas com teste e execução verde | [RTM.md](RTM.md); [docs/testes/auditoria-rtm.md](docs/testes/auditoria-rtm.md) |
| Limitadores de nota | Clone limpo da execução E-27 (banco saudável em 262 s, aplicação no ar em 337 s e front no ar em 867 s desde o clone; `verify` em 480 s), os quatro cenários dos agendadores, pipeline com vermelho intencional barrado, matriz de autorização (141 testes), dupla reserva barrada | [docs/testes/limitadores-de-nota.md](docs/testes/limitadores-de-nota.md) |
| Defeitos | 28 registrados: 27 fechados e 1 mitigado (BUG-017) | [docs/defeitos/README.md](docs/defeitos/README.md) |
| Desempenho | RNF-08b **não atendido** (p95 de 568 a 886 ms contra 300 ms) | [docs/performance/resultado-02.md](docs/performance/resultado-02.md) |
| Índice | Onde achar cada evidência | [docs/evidencias/README.md](docs/evidencias/README.md) |
| Decisão de qualidade | Liberar com ressalvas, critérios, riscos aceitos e declaração de autoria | [docs/decisao-qualidade.md](docs/decisao-qualidade.md) |
| Situação dos requisitos | 14 RF e regras críticas, com prova de mutação em 22 de 22 críticos | [docs/status-requisitos.md](docs/status-requisitos.md); [docs/testes/mutacao-manual.md](docs/testes/mutacao-manual.md) |
| Mudanças por versão | O que entra em cada release candidate | [CHANGELOG.md](CHANGELOG.md) |

## Metas de qualidade

Fonte: especificação, seção "Metas mensuráveis".

| Meta | Valor |
| --- | --- |
| Cobertura de linhas | 80% |
| Cobertura de branches | 70% |
| Requisitos críticos na RTM | 100% |
| Bugs ou vulnerabilidades críticos | 0 |

## Limitações conhecidas

- **Revisão por pares:** a equipe é uma pessoa, então não há revisão por par humano. No lugar, cada pull request
  recebe uma revisão crítica assistida, registrada como comentário e identificada como tal, e a `main` deve exigir pull
  request e check obrigatório com zero aprovações (o autor não pode aprovar o próprio PR). **Estado atual:** proteção
  PR obrigatório com 0 aprovações e checks `test`, `frontend`, `e2e` e `segredos` obrigatórios (veja "Proteção da `main`"). A decisão da equipe sobre
  essa exigência está em [docs/perguntas-professor.md](docs/perguntas-professor.md) (F7-16, item 14).
- **Histórico de trabalho:** está no `git log` e nos pull requests do GitHub, cada um com os checks e a revisão assistida registrados.
- **Valores sem valor padrão (D1, D3, D4, D9, D17):** decididos pela equipe em 24/10/2026, sem valor padrão no código; ver [docs/decisoes-equipe.md](docs/decisoes-equipe.md).
- **SonarCloud:** análise ligada na CI, com o Quality Gate reprovando o job `test`. Os números lidos no fechamento estão em [docs/testes/leitura-final-cobertura.md](docs/testes/leitura-final-cobertura.md) (run `40373624577`, execução E-25); o SonarCloud e o JaCoCo medem só o Java, e o front não tem cobertura medida.
- **Os dois agendadores vêm desligados por padrão:** o job que cancela a reserva SOLICITADA sem decisão (RN-25, D2) e o despacho de notificações (RF-11) só ligam com `app.jobs.sem-decisao.habilitado=true` e `app.jobs.notificacoes.habilitado=true`, cada um de forma independente, e exigem a frequência em `.intervalo` (ISO-8601, sem valor padrão); o `application.yml` não tem `app.jobs.*`. Sem eles, uma reserva SOLICITADA sem decisão continua SOLICITADA (só a rejeição ou o cancelamento manual a encerram) e a notificação nasce `PENDENTE` e permanece assim. Até a versão anterior o despacho só era agendado com o job de SEM_DECISAO também ligado (BUG-028, corrigido na rc4). Como ligar: seção "Configuração opcional"; detalhe em [docs/limitacoes-e-divida-tecnica.md](docs/limitacoes-e-divida-tecnica.md).
- **Alertas do Dependabot:** todos no framework `.aiox-core/`, nenhum no Maven nem no front (F7-08). Número, manifestos, severidades e justificativa em [docs/testes/alertas-dependabot.md](docs/testes/alertas-dependabot.md). Isso vale para o **Dependabot**; o `npm audit` do front é outra base de avisos e acusa 14 vulnerabilidades `moderate`, todas em dependências de desenvolvimento (0 com `npm audit --omit=dev`), que a equipe aceitou como risco (F7-31; [docs/limitacoes-e-divida-tecnica.md](docs/limitacoes-e-divida-tecnica.md)).
- **Maven Wrapper e `unzip` (F7-06, F7-14):** `.mvn/wrapper/maven-wrapper.properties` fixa a soma SHA-256 do `apache-maven-3.10.0-bin.zip`. Em Linux **sem `unzip`**, o `mvnw` baixa o `.tar.gz` do Maven, cuja soma não confere com a do `.zip`, e termina com "Failed to validate Maven distribution SHA-256, your Maven distribution might be compromised" (não indica ataque): instale `unzip` (`sudo apt install -y unzip` em Debian e Ubuntu). No `Dockerfile` da API, o estágio de compilação instala `unzip` com `apt-get` **sem versão do pacote fixada** (as imagens-base seguem fixadas por digest, e o `unzip` não vai para a imagem de execução). Quem subir a versão do Maven deve atualizar a soma junto com a URL.

## Convenções

- **Documentação:** português do Brasil com acentuação completa; a especificação é citada sempre pelo endereço público, nunca por caminho local; classificação de cada afirmação como fato, lacuna, suposição ou decisão; identificadores RF, RN, RNF, CEN, ADR, CT, INT, BUG, R e S nunca são renumerados. Convenção de nomes em [docs/prd/regras-negocio.md](docs/prd/regras-negocio.md).
  - **Limites conhecidos do `analyze-docs`:** (1) só analisa o que está **commitado** em relação a `origin/main`; com a documentação ainda sem commit ele analisa 0 arquivos, e um resultado vazio não vale como aprovação. Faça o commit antes e confira que a lista de arquivos analisados não veio vazia. (2) A checagem de ortografia é heurística, por lista de palavras sem acento, e ignora nomes de arquivo e identificadores; não substitui a leitura. (3) Não renderiza de novo os diagramas Mermaid de arquivos que não mudaram.
- **Verificação:** a skill `analyze-docs` (em `.aiox-core/development/skills/`) roda ao fim de toda edição de documentação.
- **Commits:** convencionais (`test(red)`, `feat(green)`, `refactor`, `docs`, `ci`, `chore`), com `git add` por caminho explícito, sem `git add .` nem `git add -A`. O arquivo `.env` e o material de apoio ignorado pelo Git nunca entram no índice.
- **Regras completas para agentes:** [AGENTS.md](AGENTS.md).
