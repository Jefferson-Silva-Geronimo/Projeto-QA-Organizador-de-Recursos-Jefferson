# Teste de carga (Fase 5)

Requisito e modelo de carga: [docs/performance/rnf.md](../docs/performance/rnf.md) (**proposta**, a aprovar antes da primeira
rodada). Decisões P5-01 a P5-03 em [decisoes-equipe.md](../docs/decisoes-equipe.md).

| Arquivo | Conteúdo | Versionado |
| --- | --- | --- |
| `reservas.jmx` | Plano: login, 70% consulta de disponibilidade, 30% criação de reserva (só 201 ou 409) | Sim |
| `usuarios.csv` | 50 e-mails fictícios `cargaNN@exemplo.test`; a senha **não** está no arquivo | Sim |
| `preparar_dados.py` | Cria 5 salas e 50 usuários pela API local e gera `alvos.csv` | Sim |
| `alvos.csv` | 100 pares sala × janela de 1 hora (gerado) | Não |
| `resultados/rodada-01.jtl` | Resultado bruto da rodada | Sim |
| `relatorio-01/` | Relatório HTML do JMeter | Não |

## Pré-requisitos

- JMeter 5.6.3 (binário oficial da Apache, SHA-512 conferido) **fora do repositório**. Versão usada: registrada em
  `docs/performance/resultado-01.md`.
- Java 21, Docker e Python 3.
- Aplicação **local** e banco **limpo** a cada rodada. O plano e o script recusam outro destino que não `localhost`.

## Passos

```bash
# 1. Banco limpo (senha aleatória, só no ambiente)
docker run -d --name pg-carga -e POSTGRES_PASSWORD="$PGPW" -e POSTGRES_DB=carga \
  -p 127.0.0.1:55432:5432 postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3

# 2. Aplicação local
./mvnw -B -DskipTests package
DB_URL=jdbc:postgresql://127.0.0.1:55432/carga DB_USER=postgres DB_PASSWORD="$PGPW" SESSAO_DURACAO=PT2H LOGIN_TENTATIVAS=1000 LOGIN_JANELA=PT1M \
  BOOTSTRAP_ADMIN_EMAIL=admin.carga@exemplo.test BOOTSTRAP_ADMIN_SENHA="$ADMPW" SERVER_PORT=18080 \
  java -jar target/organizacao-recursos-0.0.1-SNAPSHOT.jar

# 3. Dados fictícios
BASE_URL=http://127.0.0.1:18080 ADMIN_EMAIL=admin.carga@exemplo.test ADMIN_SENHA="$ADMPW" CARGA_SENHA="$CARGAPW" \
  python perf/preparar_dados.py

# 4. Rodada (modo CLI, parâmetros por -J)
jmeter -n -t perf/reservas.jmx -l perf/resultados/rodada-01.jtl -e -o perf/relatorio-01 \
  -Jhost=127.0.0.1 -Jporta=18080 -Jsenha="$CARGAPW"
```

`LOGIN_TENTATIVAS` e `LOGIN_JANELA` são obrigatórios (SEC-01, lacuna D18). Na carga os usuários só fazem login com a
senha correta, então o limite não interfere; os valores acima são de teste e não são recomendação.

Senhas (`PGPW`, `ADMPW`, `CARGAPW`) são geradas na hora, ficam só no ambiente e nunca entram em arquivo versionado.
Parâmetros do plano: `usuarios` (50), `rampup` (30 s), `duracao` (330 s, ramp-up mais 5 min de regime), `pausa` (1000 ms).

Depois da rodada: conferir no banco que não há mais de uma ocupação ativa por (recurso, intervalo) e analisar o `.jtl`
separando o 409 esperado do erro real.
