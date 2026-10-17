# Análise de causa raiz: BUG-001 a BUG-008

Complementa o índice de [README.md](README.md). Cada defeito traz o que aconteceu, a causa raiz, como corrigir, o
teste de regressão e o commit. As fontes são as mensagens e os arquivos dos commits de correção; onde a causa é uma
inferência, ela está marcada como **inferência**. Nenhum dado de pessoa, token ou segredo consta aqui.

BUG-001 a BUG-005 nasceram em documentação e foram achados em revisão; BUG-006, na casca do projeto, achado na CI;
BUG-007 e BUG-008, em código, achados por teste. Os seis primeiros foram achados e corrigidos antes de existir o
processo de issues; a abertura retroativa de issues para BUG-001 a BUG-006 depende de aceite do usuário
(ver [decisoes-equipe.md](../decisoes-equipe.md)).

## BUG-001: chave estrangeira invertida nas relações um-para-um

- **O que aconteceu:** ao aplicar o esquema em PostgreSQL, as relações um-para-um do DBML geraram a chave estrangeira
  no sentido contrário (`recursos.id` referenciando `salas`).
- **Causa raiz:** a tabela especializada ficou do lado errado do `Ref`; a correção foi colocá-la à direita, como o
  commit descreve. **Inferência:** o modelo ainda não tinha sido validado por parser nem por banco real.
- **Como corrigir:** inverter o sentido das relações e validar com `dbml2sql` e PostgreSQL 17. O mesmo commit trocou
  `origem` e `origem_id` polimórficos de `ocupacoes` por `reserva_id` e `bloqueio_id` com chave estrangeira real e
  `CHECK` de exatamente uma origem.
- **Teste de regressão:** parser `@dbml/cli` e esquema aplicado, com as 23 chaves estrangeiras conferidas (índice).
  Em código, `EsquemaIT` aplica a migração no PostgreSQL real a cada execução.
- **Commit:** `8bf9d40`.

## BUG-002: diagrama de cancelamento contra RN-18

- **O que aconteceu:** o diagrama 7 de [fluxos-sequencia.md](../prd/fluxos-sequencia.md) permitia ao Responsável
  cancelar uma reserva SOLICITADA de outro usuário.
- **Causa raiz:** o diagrama foi desenhado sem conferência contra RN-18, que reserva o cancelamento de SOLICITADA ao
  dono ou ao Administrador. **Inferência:** a regra e o diagrama foram escritos em momentos diferentes.
- **Como corrigir:** alinhar o diagrama à regra e conferir todos os diagramas contra as RN; os 14 diagramas foram
  renderizados com mermaid-cli 10.9.1.
- **Teste de regressão:** cobertura RF → diagrama e conferência dos fluxos contra RN-18. Em código, o cancelamento por
  estado e perfil é CT-052 (`PoliticasDeReservaTest`).
- **Commit:** `4a78280`.

## BUG-003: dado fictício contraditório

- **O que aconteceu:** o Professor 1 era "sem vínculo" na tabela de dados e aparecia vinculado a um Solicitante no
  exemplo de RN-13.
- **Causa raiz:** o mesmo dado fictício foi descrito em dois lugares sem fonte única. **Inferência**, a partir do tipo
  de correção feita.
- **Como corrigir:** ajustar os exemplos de [regras-negocio.md](../prd/regras-negocio.md) para um único estado do
  Professor 1 e definir a convenção de nomes (texto versus identificador técnico).
- **Teste de regressão:** conferência dos exemplos de RN-13.
- **Commit:** `5034b76`.

## BUG-004: aprovação contornada pela alteração da reserva

- **O que aconteceu:** uma alteração que incluía recurso restrito numa reserva já aprovada automaticamente mantinha a
  reserva APROVADA, contornando RN-06 (só o Responsável aprova recurso restrito).
- **Causa raiz:** "exige aprovação" era calculado apenas na criação; faltava regra para recalcular o valor quando a
  alteração acrescenta ou remove recurso restrito. Era uma lacuna de especificação, resolvida como decisão D12.
- **Como corrigir:** decidir D12 (recalcular "exige aprovação" a cada alteração, incluindo o caso inverso) e refletir
  nas RN-10, RN-16, RN-18, RN-19, RN-21, RN-22, RN-25 e RN-32.
- **Teste de regressão:** CT-048 (`ReservasApiIT#ct048_acrescentarRecursoRestritoRecalculaEReaprova`) e CT-049
  (remoção do último restrito), cenário CEN-11. O índice dizia "a executar na Fase 4"; os dois testes existem e
  passam na execução de 17/10/2026.
- **Commit:** `d843f34` (decisão D12).

## BUG-005: diagrama de componentes sem aresta do agendador

- **O que aconteceu:** o diagrama de componentes não ligava o agendador à auditoria e à persistência, divergindo do
  texto da seção 13.7 de [arquitetura.md](../arquitetura.md).
- **Causa raiz:** o texto foi atualizado sem atualizar o diagrama. **Inferência**, a partir da correção.
- **Como corrigir:** acrescentar as arestas e renderizar o diagrama de novo. Na Fase 4 o diagrama foi redesenhado
  para a estrutura MVC e mantém as arestas do agendador (commit `1a5b5bd`).
- **Teste de regressão:** diagrama renderizado de novo e revisão pelo facilitador ATAM; renderização conferida com
  mermaid-cli 10.9.1 em 17/10/2026 (5 de 5 diagramas).
- **Commit:** `beb9fa1`.

## BUG-006: `mvnw` sem permissão de execução

- **O que aconteceu:** o primeiro run da CI falhou com exit 126, porque o `mvnw` foi commitado sem permissão de
  execução.
- **Causa raiz:** o arquivo foi commitado no Windows sem o bit de execução e o runner Linux não o executa (exit 126,
  registrado na mensagem do commit).
- **Como corrigir:** corrigir o modo do arquivo no índice do Git. O mesmo commit migrou `setup-java` para v5 e fixou o runner
  em `ubuntu-24.04`.
- **Teste de regressão:** run da CI `38786037634` verde, que executa `./mvnw -B verify` (o run vermelho foi
  `38785819928`).
- **Commit:** `af89f13`. Registro no [PR 1](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/pull/1).

## BUG-007: impasse do PostgreSQL tratado como erro interno

- **O que aconteceu:** duas reservas simultâneas para o mesmo recurso e horário podiam terminar em
  `deadlock detected` (SQLState 40P01), e a API respondia com erro interno em vez de 409.
- **Causa raiz:** na constraint de exclusão, cada transação insere a entrada do índice antes de verificar o conflito;
  se cada uma encontra a outra em andamento, o banco derruba uma por impasse. O código só traduzia o SQLState 23P01
  (violação de exclusão). O ADR-003 já previa o tratamento; faltava implementá-lo.
- **Como corrigir:** tratar 40P01 como 23P01: a alocação perdedora recebe 409 e a tentativa de conflito é gravada
  com motivo `CONCORRENCIA`, sem repetição automática (ADR-003). Hoje em `ReservaService#ehConflitoDeConcorrencia`.
- **Teste de regressão:** CT-064 e CT-060 a CT-062 em `ConcorrenciaApiIT`, vermelho em `5d570f8` (`test(red)`) e
  verde em `eb7f5b1` (`fix(green)`).
- **Commit:** `eb7f5b1`.
- **Verificação posterior (17/10/2026):** a pergunta "o impasse infla *conflitos evitados*?" foi respondida contra a
  fonte. RN-30 manda gravar uma tentativa para "o pedido perdedor de uma disputa simultânea" e o CT-060 exige
  exatamente `SOLICITACOES - 1` tentativas para as recusas. O impasse recusa um pedido, então conta uma vez; não há
  inflação e nenhum defeito novo foi aberto.

## BUG-008: validação do corpo antes da autorização por perfil

- **O que aconteceu:** com corpo inválido, um perfil sem permissão recebia 400 em vez de 403 e via as regras de
  validação. A matriz perfil × operação expôs 18 casos assim.
- **Causa raiz:** `@Valid` do controlador roda antes de `@PreAuthorize`, e a autorização por perfil só existia na
  anotação do método. A camada 1 do ADR-004 (cadeia de segurança decide o perfil antes de o controlador ler o corpo)
  não estava implementada.
- **Como corrigir:** a cadeia de segurança passa a decidir o perfil por método e caminho; `@PreAuthorize` permanece
  como segunda camada e como fonte dos perfis do contrato. Publicada a
  [matriz de autorização](../testes/matriz-autorizacao.md).
- **Teste de regressão:** CT-117 a CT-121 em `AutorizacaoApiIT` (137 casos), vermelho em `d793879` e verde em
  `73488e5`.
- **Commit:** `73488e5`.
