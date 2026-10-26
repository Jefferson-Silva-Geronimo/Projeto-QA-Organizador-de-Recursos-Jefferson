# Revisão assistida independente do front end

Item explícito da Fase 7: conferir de fora que **nenhuma regra de negócio está duplicada no front end** (porta de saída da Fase 6, [ADR-004](../adr/ADR-004-autenticacao-e-autorizacao.md)). Chamada sempre de **revisão assistida**, nunca de "revisão por pares". Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html).

Data: 24/10/2026. Decisões de Jefferson sobre os achados: F7-01, F7-02 e F7-03 em [decisoes-equipe.md](../decisoes-equipe.md).

## 1. Como foi feita

| Item | Valor |
| --- | --- |
| Executor | Subagente de uso geral, **sem o contexto da implementação** (prompt escrito do zero, sem o histórico da conversa) |
| Escopo de leitura | `frontend/src` (código e testes) e [navegacao-telas.md](../prd/navegacao-telas.md). Somente leitura: não editou, não criou e não executou nada |
| Roteiro | (1) nenhuma tela decide por perfil, estado, horário, capacidade, sobreposição, aprovação, reserva futura ou mínimo de Responsáveis além da matriz de telas e dos campos `pode...`; (2) toda mensagem de recusa vem do mapa de erros (34 códigos), nunca de texto cru do servidor nem de regra local; (3) conferências locais de formulário são só de preenchimento; (4) o front não guarda id de usuário, não chama `GET /api/usuarios` para mostrar nomes, não olha o relógio para decidir ação e não ordena movimentações |
| Conferência do autor | Depois do relatório, o autor conferiu no código, por conta própria, só estes pontos: as 34 entradas do mapa (`frontend/src/erros/mensagens.ts`), `DialogoDeDecisao.tsx:65`, `PaginaDeBusca.tsx:24`, `FormularioDeReserva.tsx:77-85`, `PaginaDeRetiradas.tsx:55`, `DialogoDeCancelamento.tsx:59` e os usos de `useUsuarios`. Os demais achados são do subagente e não foram refeitos |

## 2. Arquivos lidos

- **Lidos inteiros (produção, `frontend/src`):** `api/cliente.ts`; `erros/` (`mensagens.ts`, `problema.ts`); `autenticacao/`; `sessao/armazenamento.ts`; `rotas/` (`destino.ts`, `navegacao.ts`, `telas.ts`, `RotaProtegida.tsx`); `Rotas.tsx`; `main.tsx`; `datas/fuso.ts`; `estilo/tema.ts`; os módulos de consulta e de ação de `aprovacoes/`, `auditoria/`, `bloqueios/`, `recursos/`, `relatorios/`, `reservas/` e `usuarios/`; `layout/` (`Navegacao.tsx`, `Estrutura.tsx`, `SeletorDeTema.tsx`); `ui/` (`ErroDaApi.tsx`, `Dialogo.tsx`, `Campo.tsx`, `Aviso.tsx`, `Botao.tsx`, `Estados.tsx`); e todas as páginas de `paginas/` (aprovacoes, auditoria, bloqueios, busca, catalogo, entrada, relatorios, reserva, reservas, retiradas, usuarios, mais `NaoEncontrada.tsx` e `PaginaDeTela.tsx`).
- **Testes lidos inteiros:** `erros/mensagens.test.ts`, `erros/problema.test.ts` e `test/documentacao.ts`.
- **Documento lido inteiro:** `docs/prd/navegacao-telas.md`, seções 1 a 9.
- **Só varridos por busca (não lidos inteiros):** todos os outros `*.test.ts` e `*.test.tsx`, os auxiliares de `test/`, `api/schema.d.ts` (gerado, 2843 linhas), os `.css`, `estilo/contraste.ts`, `estilo/tokens` e `layout/Icone.tsx`.
- **Varreduras globais no código de produção:** `.sort(`, `.reverse(`, `toSorted`, `localeCompare`, `Date.now`, `new Date(`, `/api/usuarios`, `.message`, `.detail`, `.title`, `usuarioId`, `atorId`, `solicitanteId`, `registradoPorId`, os sete estados da reserva, os três perfis, `.perfil`, `localStorage`, `sessionStorage`, `alert(` e `console.`.

## 3. Resultado por ponto do roteiro

Classificação usada: **(a)** permitido pela matriz de telas ou pelos campos `pode...`; **(b)** só apresentação; **(c)** regra duplicada.

| Ponto | Veredito do revisor | Confiança declarada |
| --- | --- | --- |
| 1. Nenhuma tela decide além da matriz e dos campos `pode...` | **Sem regra duplicada confirmada** de habilitação por perfil, estado, horário, capacidade, sobreposição, aprovação, reserva futura ou contagem de Responsáveis. Ressalvas: R1 e S1 a S3 (seção 4) | Alta para "nenhuma ação decidida fora do documento"; média para S1 |
| 2. Recusas só pelo mapa de erros | **Sem achado de regra duplicada.** O mapa tem 34 entradas; nenhum caminho exibe texto do servidor. Há textos fixos fora do mapa (seção 5) | Alta |
| 3. Conferências locais só de preenchimento | **Sem regra de negócio**, exceto R1, aceita (F7-01) | Alta para os formulários lidos |
| 4. Id de usuário, `GET /api/usuarios`, relógio e ordenação | **Sem regra duplicada** | Alta nas buscas em código de produção; testes não verificados |

### 3.1 Ponto 1: onde o front usa estado ou perfil, e por que é permitido

| Onde | O que faz | Classe | Respaldo |
| --- | --- | --- | --- |
| `reservas/CartaoDeReserva.tsx:79-92` | Alterar e Cancelar saem de `podeAlterar` e `podeCancelar` | (a) | F6-14 |
| `aprovacoes/CartaoDaFila.tsx:36,63,68` | Aprovar e Rejeitar saem de `podeAprovar` e `podeRejeitar` | (a) | F6-15 |
| `retiradas/CartaoDeUso.tsx:57,135,143,152` | Iniciar, Concluir e Não compareceu saem de `podeIniciar`, `podeConcluir` e `podeMarcarNaoComparecimento` | (a) | F6-16 |
| `retiradas/CartaoDeUso.tsx:99,109` | Retirar ou Devolver sai de `m.atual` e do tipo da movimentação atual, sem ordenar | (a) | F6-16 |
| `reservas/CartaoDeReserva.tsx:22,40` | `ESTADOS_EM_ANDAMENTO` só decide se mostra a frase "Você não pode alterar nem cancelar esta reserva agora." quando os dois campos `pode...` são falsos; não habilita nem esconde ação | (a) | `navegacao-telas.md`, seção 4 (T04) |
| `paginas/retiradas/PaginaDeRetiradas.tsx:12,55` | Filtra no cliente as reservas APROVADA e EM_USO | (a) | `navegacao-telas.md`, seção 9 (T06) |
| `rotas/telas.ts:16-28`, `Rotas.tsx:91-109`, `rotas/RotaProtegida.tsx:24`, `rotas/destino.ts:24-25`, `layout/Estrutura.tsx:49` | Menu e rotas por perfil, a matriz de telas; o servidor continua recusando com 403 | (a) | `navegacao-telas.md`, seção 3 |
| `paginas/catalogo/PaginaDoCatalogo.tsx:38`, `paginas/auditoria/PaginaDeAuditoria.tsx:29` | `perfil === 'ADMINISTRADOR'` decide quais controles aparecem | (a) | Matriz (T07 e T09) |
| `rotas/navegacao.ts:16-20` | Tela inicial por perfil | (a) | Suposição de conveniência do documento |
| `reserva/ReservaCriada.tsx:21-28,57` | Título e frase conforme o `estado` devolvido (SOLICITADA ou APROVADA); não calcula se exigia aprovação | (b) | Dado do servidor |
| `paginas/usuarios/CartaoDoUsuario.tsx:43`, `paginas/bloqueios/CartaoDoBloqueio.tsx:47` | `ativo` controla se aparecem ações (não há campo `pode...`) | (a) e (b) | F6-17; seção 9 (T11 e T08) |
| `paginas/catalogo/CartaoDoCatalogo.tsx:84,91`, `reserva/SeletorDeRecursos.tsx:52` | "Exige aprovação" a partir de `recurso.restrito` | (b) | Dado do servidor |
| `paginas/retiradas/CartaoDeUso.tsx:56` | `tipo === 'MATERIAL'` separa as unidades | (b) | Só apresentação |

## 4. Achados e exceções

Nenhum achado foi classificado como defeito. As decisões abaixo são de Jefferson, de 24/10/2026, e **não há BUG aberto** por esta revisão. Cada item traz a condição que o reabre como defeito.

| ID | Achado | Onde | Classe | Decisão | Reabre como defeito se |
| --- | --- | --- | --- | --- | --- |
| R1 | A tela não envia a rejeição sem motivo (`if (tipo === 'rejeitar' && !texto)`). É a RN-24 aplicada no cliente, mas o servidor também exige o motivo (`MOTIVO_OBRIGATORIO`) | `frontend/src/paginas/aprovacoes/DialogoDeDecisao.tsx:65` | (a) pelo documento, que diz "a tela não envia o pedido sem ele" (`navegacao-telas.md`, seção 9, T05) | **Exceção aceita, sem BUG** ([F7-01](../decisoes-equipe.md)). Conferência de preenchimento: só pode checar campo vazio ou em branco; o servidor segue como autoridade | Qualquer conferência local passar a avaliar outra regra |
| S1 | Na alteração, o front acrescenta aos recursos escolhíveis os da própria reserva (que ela mesma ocupa e por isso o servidor não os lista como livres) e desmarca o escolhido que saiu da lista. Risco: divergir se a regra do servidor sobre a reserva alterando a si mesma mudar | `frontend/src/paginas/reserva/FormularioDeReserva.tsx:77-85` | (b), com risco de divergência; o servidor decide no envio (`CONFLITO_DE_ALOCACAO`) | **Observação, sem BUG** ([F7-02](../decisoes-equipe.md)) | A tela passar a decidir a disponibilidade |
| S2 | Janela inicial de consulta de horários ocupados da Busca: `DIAS_DA_JANELA_PADRAO = 14`, a partir do relógio. O número fixo **não tem origem** na documentação (busca em `docs/` e `frontend/src` fora dos testes) | `frontend/src/paginas/busca/PaginaDeBusca.tsx:24,26,37-43` | (b); o relógio decide o que consultar, não uma ação | **Suposição sem origem**, sem BUG ([F7-02](../decisoes-equipe.md)). **Impacto se estiver errada:** só muda a janela inicial da Busca; a pessoa pode alterá-la. Validação pendente: confirmar o valor com o professor ou com a equipe | A tela passar a decidir regra |
| S3 | Texto de ajuda "Obrigatório quando quem cancela é um Responsável ou um Administrador." descreve a regra por perfil (RN-18); a tela só informa. Se a regra mudar no servidor, o texto fica errado | `frontend/src/paginas/reservas/DialogoDeCancelamento.tsx:59` | (b); o texto é aprovado na seção 9 (T04) | **Observação, sem BUG** ([F7-02](../decisoes-equipe.md)) | A tela passar a decidir regra |

Registradas por transparência pelo revisor, sem ação: `paginas/auditoria/parametros.ts:62-66` (`dentroDoPeriodo` filtra por período no cliente, autorizado por L-03 e F6-06); `sessao/armazenamento.ts:32-38` (`lerSessao` descarta a sessão vencida pelo relógio, conveniência de interface, o servidor decide a validade); `reservas/rotulos.ts:15-18` (traduz os motivos do sistema `MANUTENCAO` e `SEM_DECISAO`, depende de os valores serem estáveis no servidor); `paginas/auditoria/rotulos.ts:4-23` (tabela de 18 ações, desconhecida aparece pelo código, documentado); `relatorios/parametros.ts:10-13` (tamanho de página 20, suposição D4); `paginas/relatorios/PaginaDeRelatorios.tsx:51` (`Math.ceil(total / tamanho)`, aritmética de paginação).

## 5. Textos fixos fora do mapa de 34 códigos (ponto 2)

O mapa (`frontend/src/erros/mensagens.ts`) tem **34 entradas**, e `erros/mensagens.test.ts` confere o conjunto contra `CodigoErro.java` (lido, não executado). `erros/problema.ts:13-21` extrai só `code`, `itens` e `campos` e descarta `detail` e `title`; `ErroDeApi.message` recebe o código e a mensagem vem de `mensagemPara`. A busca por `.message`, `.detail` e `.title` no código de produção só achou `document.title` (`Rotas.tsx:77`).

Há textos escritos na própria tela, fora do mapa. **Decisão ([F7-03](../decisoes-equipe.md)): desvio da letra da seção 5, não da intenção; observação, sem BUG.** Razão: não são recusas do servidor, não explicam regra e não usam texto do servidor.

| Tipo | Textos | Onde |
| --- | --- | --- |
| Aviso genérico de campo | "Confira este campo." | `catalogo/DialogoDeCadastro.tsx:30,123-126`; `usuarios/DialogoDeNovoUsuario.tsx:27,44-46`; `bloqueios/FormularioDeBloqueio.tsx:27,43-46`; `bloqueios/DialogoDeLevantamento.tsx:60` |
| Dicas de preenchimento | "Informe o início.", "Escolha ao menos um recurso.", "A descrição não foi aceita." | `reserva/FormularioDeReserva.tsx:121,124,136-138,161,164` |
| | "Informe um e-mail válido.", "Informe a senha." | `entrada/PaginaDeEntrada.tsx:55` |
| | "Informe o motivo." | `aprovacoes/DialogoDeDecisao.tsx:88`; `reservas/DialogoDeCancelamento.tsx:60` |
| | "Informe o número da reserva." | `auditoria/FiltrosDaAuditoria.tsx:43` |
| | "Informe também o fim/início do período." | `busca/parametros.ts:70-71` |
| | "Informe o início/fim do período." | `relatorios/parametros.ts:75-76` |
| Mensagens de ação ausente (aprovadas nas telas T04, T05 e T06) | "Você não pode alterar nem cancelar esta reserva agora."; "Você não pode aprovar nem rejeitar esta solicitação agora."; "Você não pode registrar o uso desta reserva agora." | Telas T04, T05 e T06, `navegacao-telas.md`, seção 9 |

**Proposta, aplicada depois pela F7-12 (24/10/2026):** ajustar a frase da seção 5 de [navegacao-telas.md](../prd/navegacao-telas.md) (linha 15 da tabela de princípios: "Toda mensagem de erro vem da tabela da seção 5, indexada pelo código estável. O texto cru do servidor nunca aparece") para "Toda mensagem de recusa do servidor vem da tabela da seção 5, indexada pelo código estável. O texto cru do servidor nunca aparece". A frase aplicada em `navegacao-telas.md` é: "Toda mensagem de recusa do servidor vem da tabela da seção 5; dicas de preenchimento e as mensagens de ação ausente aprovadas ficam na seção 9. O texto cru do back end nunca aparece na tela".

**Reabre como defeito se** algum texto passar a explicar regra ou a exibir texto do servidor.

## 6. Pontos 3 e 4 em detalhe

- **Ponto 3.** Todas as conferências locais são de campo vazio ou formato: login (`PaginaDeEntrada.tsx:64-65`), reserva (`FormularioDeReserva.tsx:70-72,97`, só data e hora válidas; **não** confere fim depois do início, janela, antecedência, capacidade, duração, data futura nem número mínimo de recursos), cadastro de recurso (`DialogoDeCadastro.tsx:65-77`), de usuário (`DialogoDeNovoUsuario.tsx:31-37`), bloqueio (`FormularioDeBloqueio.tsx:30-36`, **não** compara fim com início) e levantamento (`DialogoDeLevantamento.tsx:50`), relatório (`relatorios/parametros.ts:73-77`), busca (`busca/parametros.ts:54,69-73`) e auditoria (`FiltrosDaAuditoria.tsx:42`). O `min={1}` dos campos numéricos é atributo HTML e não bloqueia o envio, porque o formulário usa `noValidate`.
- **Id de usuário.** A sessão guarda só `{token, perfil, expiraEm}` em `sessionStorage` (com recuo para memória): `sessao/armazenamento.ts:5-9,21-29`. `localStorage` guarda só o tema. `solicitanteId`, `atorId` e `registradoPorId` existem no esquema gerado, e nenhum código de produção os lê. `usuarioId` aparece só em `CartaoDoCatalogo.tsx:81` (testa `undefined` para "Sem vínculo" ou "Com vínculo") e em `DialogoDeCadastro.tsx` (id escolhido no seletor, enviado ao servidor, não persistido).
- **`GET /api/usuarios`.** Uma só definição, `usuarios/consulta.ts` (`useUsuarios`). Dois usos: `PaginaDeUsuarios.tsx:26` (T11, Administrador gerindo usuários, uso esperado) e `catalogo/DialogoDeCadastro.tsx:139` (`useUsuarios(tipo === 'PROFESSOR')`, lista de usuários ativos para escolher o vínculo do professor, só Administrador; a linha 181 filtra por `ativo` no cliente). O segundo uso é **previsto pela seção 9 (T07)** do documento, mas foge da letra "só a tela de gestão de usuários" do roteiro; fica registrado como uso previsto. T05 e T06 usam `solicitanteNome`, `registradoPorNome` e `atorNome` vindos do servidor.
- **Relógio.** `Date.now` não aparece. `new Date(...)` aparece em `datas/fuso.ts` (formatação e fuso), em `sessao/armazenamento.ts` (validade da sessão local) e em `PaginaDeBusca.tsx` (S2).
- **Ordenação.** Todas as ocorrências de `.sort` em produção são de apresentação ou de ordem de payload: `layout/Navegacao.tsx:17` (item ativo do menu), `ui/Dialogo.tsx:59` (focáveis), `recursos/formatacao.ts:5` (dias da semana), `catalogo/DialogoDeCadastro.tsx:91` (dias antes de enviar), `reserva/FormularioDeReserva.tsx:104` (`recursoIds`), `estilo/contraste.ts:23`. Não há `.reverse()`, `toSorted` nem `localeCompare`. A movimentação "atual" vem do campo `atual` do servidor.

## 7. O que a revisão NÃO verificou

Nada abaixo foi preenchido por suposição.

| Lacuna | Detalhe |
| --- | --- |
| Comportamento em tempo de execução | Não se verificou o que o servidor devolve (valores de `pode...`, `atual`, `itens`) nem se o `docs/api/openapi.json` corresponde ao `schema.d.ts`. Não se leu o back end Java nem o OpenAPI |
| Execução | Nenhum teste, lint ou build foi executado pelo revisor; "o teste confirma 34 códigos" vem de leitura, não de execução |
| Testes de componente | Só `erros/` e `test/documentacao.ts` foram lidos. Os demais foram varridos por busca; **não se verificou se os testes cobrem cada comportamento citado**. A busca mostrou testes que mencionam `detail:` e `title:` (`PaginaDeBusca.estados`, `PaginaDeNovaReserva.erros`, `PaginaDeEntrada.envio`, 7 ocorrências), sem leitura do conteúdo |
| Esquema gerado | `api/schema.d.ts` só por busca; não se confirmou quais campos `pode...` existem nem se algum é opcional |
| Biblioteca do cliente | Não se leu `openapi-fetch`; o código descarta o corpo de erro por `interpretarProblema` (`api/cliente.ts:75`), mas não se verificou se um corpo de erro em texto puro poderia vazar |
| Documentos | Não se leram ADR-004, ADR-008, [plano de projeto](../plano-de-projeto.md) (seção 10.3), RTM nem `decisoes-equipe.md` |
| Varredura por expressão regular | Código gerado dinamicamente ou com sintaxe incomum poderia escapar |
| CSS e estilo | `.css`, `estilo/tokens` e `layout/Icone.tsx` não foram lidos (sem relação com regra) |
| Conferência do autor | O autor refez só os pontos listados na seção 1; o restante depende da palavra do revisor |

## 8. Conclusão e limites

- **Fato (revisor, com conferência parcial do autor):** não se achou regra de negócio duplicada no front que habilite, esconda ou recuse ação além da matriz de telas e dos campos `pode...`. Há uma conferência de preenchimento que coincide com a RN-24 (R1, aceita), três observações (S1 a S3) e um conjunto de textos fixos fora do mapa (F7-03).
- **Suposição sem origem:** a janela de 14 dias da Busca (S2), com impacto limitado à janela inicial.
- **Limite:** a revisão foi de leitura, por um agente de linguagem. Não substitui revisão por pessoa nem prova, em execução, que o servidor devolve o que a tela espera. A prova em execução vem dos testes de componente (910 na última execução da CI na `main`, [execucao-e24.md](execucao-e24.md)), dos roteiros em navegador real e do E2E; esta revisão não os refez.
- **Defeitos abertos por esta revisão:** nenhum (decisões F7-01 a F7-03). Se qualquer condição de reabertura da seção 4 ou 5 ocorrer, o achado volta como BUG-019 em diante, com issue, teste de regressão e commit.
