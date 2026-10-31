# Análise de causa raiz: BUG-001 a BUG-014

Complementa o índice de [README.md](README.md). Cada defeito traz o que aconteceu, a causa raiz, como corrigir, o
teste de regressão e o commit. As fontes são as mensagens e os arquivos dos commits de correção; onde a causa é uma
inferência, ela está marcada como **inferência**. Nenhum dado de pessoa, token ou segredo consta aqui.

BUG-001 a BUG-005 nasceram em documentação e foram achados em revisão; BUG-006, na casca do projeto, achado na CI;
BUG-007 e BUG-008, em código, achados por teste; BUG-009, em código, achado pela avaliação arquitetural e confirmado por teste; BUG-010 a BUG-014, no front, achados pelo roteiro em navegador real. Os seis primeiros foram achados e corrigidos antes de existir o
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
- **Teste de regressão:** CT-117 a CT-121 em `AutorizacaoApiIT` (137 casos; hoje 141 testes, BUG-022), vermelho em `d793879` e verde em
  `73488e5`.
- **Commit:** `73488e5`.

## BUG-009: falha ao gravar a tentativa de conflito derrubava o 409

- **O que aconteceu:** quando a gravação da tentativa de conflito (RN-30) falhava, o solicitante recebia 500 em vez
  do 409 de conflito. Achado ao comparar a decisão de 15/10/2026 com o código no
  [ciclo-01.md](../avaliacao-arquitetural/ciclo-01.md) (DV-01) e confirmado por teste com falha injetada.
- **Causa raiz:** a tentativa é gravada em transação separada, depois do desfazer (ADR-003). A decisão previa que,
  se essa gravação falhasse, "o 409 é mantido e a perda vai para o log", mas `registrarEConverter` chamava
  `tentativas.registrar(...)` sem tratar a exceção e a classe não tinha `Logger`. Era uma decisão aprovada e não
  implementada, a mesma classe de causa de BUG-007.
- **Como corrigir:** envolver a gravação em `try/catch` de `RuntimeException`, registrar a perda em nível ERROR com
  recurso e motivo (sem dado pessoal) e devolver o 409 normalmente.
- **Teste de regressão:** `FalhaNaTentativaApiIT`, dois casos. O primeiro (409 mantido) foi visto vermelho em
  `0a80fc7` (esperado 409, obtido 500). O segundo (log sem dado pessoal) nasceu verde porque o log foi implementado
  junto com a correção.
- **Commit:** `61ce37d`.

## BUG-010: Foco do teclado se perde ao trocar de tela

- **O que aconteceu:** Depois de ativar o link "Reservar" da Busca só com o teclado, o foco ficava no corpo da página e o Tab seguinte recomeçava do topo.
- **Causa raiz:** Numa aplicação de página única o navegador não move o foco ao trocar de rota, e a estrutura da aplicação não tratava isso. **Inferência:** o desenho da estrutura previa o link "Pular para o conteúdo", mas não a troca de tela.
- **Como corrigir:** A estrutura move o foco para o `main` quando o caminho muda. Não move na abertura da página nem quando só os filtros do endereço mudam.
- **Teste de regressão:** `Rotas.test.tsx`: "ao trocar de tela pelo menu o foco vai para o conteúdo" (vermelho), mais dois testes que nasceram verdes: o foco não é roubado na abertura nem ao mudar só os filtros.
- **Commits:** `test(red)` `0f0c8c7` e `feat(green)` `8ad762c`.

## BUG-011: Todas as telas tinham o mesmo título de página

- **O que aconteceu:** O título da aba era sempre "Organização de Recursos", sem indicar a tela.
- **Causa raiz:** O título foi definido uma vez no `index.html` e a troca de rota não o atualizava.
- **Como corrigir:** O conjunto de rotas atualiza o título para "<tela> · Organização de Recursos" a cada caminho.
- **Teste de regressão:** `Rotas.test.tsx`: 5 casos de título (Buscar, Nova reserva, Aprovações, página não encontrada e Entrar), vermelhos antes da correção.
- **Commits:** `test(red)` `0f0c8c7` e `feat(green)` `8ad762c`.

## BUG-012: Ícone do calendário dos campos de data sem foco visível

- **O que aconteceu:** Cada campo de data e hora tem 6 paradas de Tab; na sexta, o ícone do calendário, não aparecia nenhum anel de foco.
- **Causa raiz:** O ícone é um botão interno do navegador dentro do campo; a regra de foco do projeto só cobria o campo.
- **Como corrigir:** Regra própria para o ícone, com área e raio. **Observado no Chromium:** o anel desenhado é o do navegador (preto no tema claro, branco no escuro) e ignora a cor do sistema; é visível nos dois temas.
- **Teste de regressão:** `foco-do-calendario.test.ts` confere que a regra existe e usa a cor de foco do tema. O jsdom não calcula o pseudo-elemento interno, então a prova visual é o roteiro em navegador real, com captura nos dois temas.
- **Commits:** `test(red)` `f05435b` e `feat(green)` `fbc40e3`.

## BUG-013: Confirmação da reserva mostrava "Recurso 2" no lugar do nome da sala

- **O que aconteceu:** Depois de reservar a Sala 203, a confirmação listava "Recurso 2" em vez do nome.
- **Causa raiz:** Os nomes eram procurados na lista de recursos livres, e essa lista é refeita depois da reserva, quando o recurso reservado já não está livre. **Inferência:** os testes usavam uma lista fixa, que não reproduz o refazer da consulta.
- **Como corrigir:** Os recursos escolhidos são guardados no instante do envio e a confirmação usa essa cópia.
- **Teste de regressão:** `PaginaDeNovaReserva.envio.test.tsx`: "a confirmação mostra os nomes dos recursos mesmo que o servidor já não os liste como livres", com a segunda consulta sem a sala.
- **Commits:** `test(red)` `59ce6f2` e `feat(green)` `22ef543`.

## BUG-014: Sala já ocupada continuava listada como livre depois de um conflito

- **O que aconteceu:** Depois da recusa por CONFLITO_DE_ALOCACAO, a sala continuava na lista de recursos livres e marcada.
- **Causa raiz:** A consulta de recursos livres só era refeita quando a pessoa mudava o período.
- **Como corrigir:** Recusas que mudam o que está livre (conflito, manutenção e recurso inativo) refazem a lista de recursos.
- **Teste de regressão:** `PaginaDeNovaReserva.erros.test.tsx`: "refaz a lista de recursos livres e avisa que o recurso escolhido deixou de estar livre" (vermelho); "outras recusas não refazem a lista" nasceu verde.
- **Commits:** `test(red)` `afd37c4` e `feat(green)` `67d3150`.
