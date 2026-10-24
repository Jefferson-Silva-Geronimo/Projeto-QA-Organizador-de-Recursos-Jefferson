# Revisão de segurança (Fase 5)

Revisão do back end contra o **OWASP Top 10:2025**, a edição vigente em outubro de 2026
([top10.owasp.org/2025](https://top10.owasp.org/2025)). Decisão P5-04 em [decisoes-equipe.md](../decisoes-equipe.md):
todas as categorias aplicáveis, cada uma com status, evidência e ação. Feita por revisão assistida (não por par
humano) sobre o código, a configuração, os testes e o SonarCloud. **Nenhuma exploração além de testes automatizados do
próprio projeto foi executada.**

Data: 17/10/2026. Estados: **atendida**, **parcial**, **não aplicável** ou **falha**. Nenhuma categoria ficou como
falha aberta; as lacunas estão em "parcial", com ação.

## Resumo

| Categoria OWASP 2025 | Status |
| --- | --- |
| A01 Broken Access Control | Atendida |
| A02 Security Misconfiguration | Parcial |
| A03 Software Supply Chain Failures | Parcial |
| A04 Cryptographic Failures | Parcial |
| A05 Injection | Atendida |
| A06 Insecure Design | Parcial |
| A07 Authentication Failures | Atendida (SEC-01 tratado) |
| A08 Software or Data Integrity Failures | Parcial |
| A09 Security Logging and Alerting Failures | Parcial |
| A10 Mishandling of Exceptional Conditions | Atendida |

## Detalhe

### A01 Broken Access Control: atendida
- **Evidência:** autorização em duas camadas (ADR-004). Camada 1 na cadeia de segurança, por método e caminho, antes de o
  corpo ser lido: `SegurancaConfig.java:74-94`. Camada 2: `@PreAuthorize` nos controladores. Posse: o Solicitante não
  lê nem altera reserva de outro (`AutorizacaoApiIT#ct118`). Matriz perfil × operação, 137 casos:
  `AutorizacaoApiIT#ct117`, publicada em [matriz-autorizacao.md](matriz-autorizacao.md) e agora conferida por asserção.
  Token ausente, inválido, revogado e expirado: `#ct119`. Mensagem de conflito não identifica terceiros: `#ct121`.
- **Defeito achado e corrigido:** BUG-008.
- **Ação:** nenhuma.

### A02 Security Misconfiguration: parcial
- **Evidência:** erros sem mensagem, pilha nem exceção (`application.yml:41-44`); só `/actuator/health` exposto, sem
  detalhes (`:57-60`); Swagger UI desligada, contrato só autenticado (`DocumentacaoApiIT#ct114_documentacaoExigeAutenticacao`); cabeçalhos
  `X-Content-Type-Options`, `X-Frame-Options` e `Cache-Control: no-store` (`CabecalhosDeSegurancaApiIT`); CORS restrito às
  origens da variável `CORS_ORIGENS`, sem padrão e sem curinga (`CorsComOrigemApiIT`, `CorsSemOrigemApiIT`,
  `CorsPropertiesTest`).
- **Lacunas:** (1) a aplicação fala HTTP; a terminação TLS e o `Strict-Transport-Security` ficam para o ambiente de
  implantação, que não existe neste projeto. (2) O papel de banco que a aplicação usa é o **dono** das tabelas (ver A08 e
  R-23). (3) Não há `Content-Security-Policy`: a API só devolve JSON, mas a Fase 6 deve avaliar a política do front end.
- **Ação:** registrar TLS e papel de banco como pendências de implantação; avaliar CSP na Fase 6.

### A03 Software Supply Chain Failures: parcial
- **Evidência:** Dependabot para Maven (`.github/dependabot.yml`), com o Cucumber fixado por decisão DS-06; alertas de
  dependência do GitHub ativos (0 alertas em 17/10/2026); ações do GitHub fixadas por SHA no `ci.yml`; imagem do
  PostgreSQL fixada por digest; gitleaks instalado por checksum conferido.
- **Atualização da Fase 7 (F7-06, 24/10/2026):** a soma SHA-256 do Maven 3.10.0 está fixada em `.mvn/wrapper/maven-wrapper.properties` e `MavenWrapperTest` exige a soma e a URL do Maven Central. A CI barra soma errada: PR descartável 74, run [`40109437336`](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/actions/runs/40109437336), jobs `test` e `e2e` vermelhos com "Failed to validate Maven distribution SHA-256" e merge `BLOCKED`. **Limites:** o wrapper só valida ao baixar o Maven; com a distribuição já em `~/.m2/wrapper`, não revalida. A soma é a do `.zip`: sem `unzip` na máquina o `mvnw` baixa o `.tar.gz` e falha fechado; o `Dockerfile` da API instala `unzip` no estágio de compilação (F7-14), com o pacote do apt **sem versão fixada** e fora da imagem de execução.
- **Lacunas:** não há SBOM nem verificação de licenças (dívida técnica declarada na F7-06).
- **Ação:** a soma foi implementada; o SBOM (CycloneDX) fica como dívida técnica, com plano de evolução no relatório final. A03 segue "parcial".

### A04 Cryptographic Failures: parcial
- **Evidência:** senhas com BCrypt (`SegurancaConfig.java:105`, `AutenticacaoService`); token opaco de `SecureRandom`
  e só o hash SHA-256 no banco (`AutenticacaoService.java:29,90`); `DocumentacaoApiIT#ct116` confere que o contrato não expõe segredo; senha mínima de 8 caracteres e máxima de 72 bytes (limite do BCrypt).
- **Lacuna:** sem TLS na aplicação (ver A02); dados em repouso dependem do banco.
- **Ação:** nenhuma no código; TLS é pendência de implantação.

### A05 Injection: atendida
- **Evidência:** SQL só com parâmetros nomeados do `JdbcClient`; as concatenações em `repository` são de constantes
  (varredura desta revisão). Injeção em filtros de pesquisa não gera erro nem altera o banco: `AutorizacaoApiIT#ct120`.
  Validação de entrada com `@Valid` e códigos estáveis. Sem renderização de HTML no servidor.
- **Ação:** nenhuma.

### A06 Insecure Design: parcial
- **Evidência:** a garantia contra dupla reserva está no banco (constraint de exclusão, ADR-003) e foi vista falhar sem
  ela (`ConcorrenciaApiIT#ct063`); máquina de estados explícita; auditoria somente inserção; ADR e ATAM (ciclos 00 e 01).
- **Atualização da Fase 7 (F7-07, 24/10/2026):** existe um modelo de ameaças curto (STRIDE) em [modelo-de-ameacas.md](modelo-de-ameacas.md), com 18 ameaças e a evidência de cada uma: 8 cobertas por teste, 6 parciais, 2 de risco aceito e 2 lacunas (TLS e CSP; limitação de taxa e paginação). Ameaça sem evidência está declarada como lacuna, não como mitigada.
- **Lacuna que permanece:** as lacunas do modelo (tempo constante do login sem teste, tentativas negadas sem auditoria, TLS e CSP, limitação de taxa, isolamento da RN-06 no BUG-026, SBOM) seguem abertas.
- **Ação:** nenhuma nova nesta categoria. A06 segue "parcial": o modelo existe, mas as lacunas dele estão abertas.

### A07 Authentication Failures: atendida
- **Evidência:** a resposta de login é a mesma para usuário inexistente e senha errada, com tempo constante (senha-isca
  aleatória, `AutenticacaoService.java:47`); sessão com expiração e revogação testadas (`#ct119`, `AutenticacaoApiIT`).
- **SEC-01 tratado (decisão P5-10):** limite de tentativas por conta, em janela deslizante guardada no banco
  (`LimiteDeLogin`, `AutenticacaoService`, migração V4). A conta bloqueada recebe resposta idêntica à de credencial
  inválida, e a tentativa durante o bloqueio não o estende. Testes: `LimiteDeLoginTest` (unidade, trinca de tempo) e
  `LimiteDeLoginApiIT` (11 casos, provados por mutação).
- **Limites conhecidos:** valor decidido pela equipe em 17/10/2026 (D18): 5 tentativas em 10 minutos;
  um atacante pode bloquear a conta de outra pessoa de propósito; tentativas simultâneas podem passar de N por pouco; o
  e-mail da falha fica guardado durante a janela (lacuna D9).
- **Ação:** nenhuma; os valores estão em `.env.example` e na decisão P5-10.

### A08 Software or Data Integrity Failures: parcial
- **Evidência:** a auditoria é somente inserção por gatilho e um papel que não é dono não consegue alterá-la nem
  desligar o gatilho (`AuditoriaPapelIT`, provado por mutação); migrações versionadas (Flyway); CI sem
  `pull_request_target`.
- **Risco aceito (R-23):** a aplicação roda com o papel **dono** das tabelas, que pode desligar o gatilho. Aceito por
  Jefferson em 17/10/2026, em [decisoes-equipe.md](../decisoes-equipe.md). A opção B, separar o papel de migração do de
  aplicação, vai para a dívida técnica do relatório final.
- **Lacuna:** o artefato não é assinado.
- **Ação:** dívida técnica (opção B); assinatura do artefato fora de escopo.

### A09 Security Logging and Alerting Failures: parcial
- **Evidência:** identificador de correlação por requisição, gerado no servidor, no log e no cabeçalho
  `X-Correlation-Id` (`CorrelacaoFilter`); o log de falha interna traz classe, causa e ponto do código, sem mensagem do
  banco (`LogSeguroApiIT`); o token do cabeçalho `Authorization` não aparece no log; auditoria de transições e cadastros.
- **Lacuna:** não há alerta (por exemplo, para picos de 401, 403 ou 500). A auditoria registra o que mudou, não as
  tentativas negadas.
- **Ação:** definir o que seria alertado e como. Decisão F7-06 (24/10/2026): dívida técnica, sem código; hoje é só log. A09 segue "parcial".

### A10 Mishandling of Exceptional Conditions: atendida
- **Evidência:** `TratadorDeErros` devolve erro genérico com código estável e nunca pilha (`DocumentacaoApiIT`,
  `AutenticacaoApiIT#ct006`); falha ao auditar desfaz a transição (`AuditoriaApiIT#ct097`); impasse do banco tratado
  como conflito (BUG-007); falha ao gravar a tentativa de conflito mantém o 409 (BUG-009); falha do provedor não desfaz a
  reserva (`NotificacaoApiIT#int03`, `NotificacaoTempoLimiteApiIT#int04`).
- **Ação:** nenhuma.

## Achados desta revisão
| ID | Gravidade | Achado | Tratamento |
| --- | --- | --- | --- |
| SEC-01 | Média | Sem limite de tentativas de login (A07) | **Corrigido** (P5-10): limite por conta com janela deslizante; 5 tentativas em 10 minutos (D18) |
| SEC-02 | Baixa | Aplicação roda com o papel dono das tabelas (A02, A08) | Risco aceito R-23; opção B na dívida técnica |
| SEC-03 | Baixa | Sem SBOM nem soma de verificação do Maven no wrapper (A03) | **Soma implementada** (F7-06, `MavenWrapperTest`, prova na CI no PR descartável 74); **SBOM fica como dívida técnica** |
| SEC-04 | Informativo | Sem alerta de segurança (A09) | **Dívida técnica** (F7-06), sem código |

Nenhum achado é falha confirmada nem exige defeito novo em `docs/defeitos/`. Se SEC-01 for implementada, ela entra como
funcionalidade nova, com teste vermelho antes.
