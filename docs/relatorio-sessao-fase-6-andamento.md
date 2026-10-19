# Relatório de sessão: Fase 6 em andamento (18 e 19/10/2026)

Documento para contextualizar a próxima conversa. Cole-o no início da sessão ou peça para o Claude lê-lo. **Não contém
senha nem token.** Nada aqui substitui os documentos do repositório: quando houver divergência, vale o repositório.
Sucede o resumo da sessão anterior (Fases 4 e 5 concluídas) e cobre o trabalho da Fase 6 até a tela Minhas reservas (T04). Atualizado em 19/10/2026: o Login foi mesclado (PR 34) e a T04 está no PR 36.

## 1. Como retomar (comece por aqui)

1. Abra o projeto em `C:\Users\super\Projeto-QA-Jefferson` (repositório
   `Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson`, público).
2. Leia, nesta ordem: este relatório, `AGENTS.md`, `docs/fase-7-pendencias.md`, `docs/decisoes-equipe.md` (seções 7 e 8 e
   os blocos F6-xx), `docs/adr/ADR-015-stack-do-front-end.md`, `docs/prd/navegacao-telas.md` (seções 5, 7 e 9),
   `docs/defeitos/README.md`, `RTM.md` e `docs/testes/roteiro-navegador-real/README.md`. A especificação e o plano mestre
   são cópias locais **ignoradas pelo Git** (`docs/especificacao.md`, `docs/plano_mestre.md`): cite a especificação pelo
   endereço público, nunca por caminho local.
3. Rode `git status`, `git log --oneline -5`, `git branch --show-current` e `gh pr list` para ver o estado real antes de agir.
4. **Não invente número, regra ou resultado.** Peça confirmação do que não estiver claro.

## 2. Estado atual

| Item | Situação |
| --- | --- |
| Fases 0 a 5 | Concluídas |
| Fase 6 (front end) | **Em andamento.** Feitos: 6.A (documento de telas), mudanças de back end para o front, 6.B (base do front), o protótipo da 6.C (Busca e Nova reserva, aprovado) e o Login (T01, PR 34). **Em andamento:** Minhas reservas e alteração (T04, branch `fase-6/tela-minhas-reservas`). **Faltam:** as telas T05 a T11 e a etapa 6.D (E2E na CI) |
| Fase 7 | **Ainda não executada.** A lista viva do que entra nela é `docs/fase-7-pendencias.md` |
| `main` | Protegida: PR obrigatório, 0 aprovações, vale para administrador, `strict` (branch precisa estar atualizada), sem force push e sem exclusão da branch. **Checks obrigatórios: `test` e `frontend`.** O `e2e` ainda não existe |
| Último commit da `main` | merge do PR #36 (T04); ver `git log` |
| Branch ativa | Nenhuma: a T04 foi mesclada. A próxima tela (T05) começa em um branch novo a partir da `main` |
| PRs abertos | Nenhum. Issues de defeito abertas: nenhuma (BUG-010 a BUG-016 fechados) |
| SonarCloud | Quality Gate OK em todos os PRs mesclados. Não roda em PR do Dependabot (ele não recebe segredos) |

### 2.1 Pull requests mesclados nesta fase

| PR | O que entrou |
| --- | --- |
| #19 | Decisões F6-01 a F6-04 e ADR-015 (stack do front) |
| #20 | Prompt 6.A: `docs/prd/navegacao-telas.md` (mapa por perfil, 11 telas, mapa dos 34 códigos de erro) e F6-05, F6-06 |
| #21 | Back end: `GET /api/bloqueios` e nome do solicitante na fila (F6-06a e b), em TDD, com `openapi.json` atualizado |
| #22 | Paleta A (violeta e rosa) e F6-07 |
| #23 | Prompt 6.B: esqueleto do front (React, Vite, TypeScript), cliente gerado, erros, sessão, tema, rotas por perfil e navegação; job `frontend` na CI; npm no Dependabot |
| #25 | L-06 (F6-10): o contrato marca como obrigatórios só os campos de resposta que nunca são nulos (só documentação) |
| #26 | `docs/fase-7-pendencias.md` |
| #32 | Protótipo da 6.C: Busca (T02) e Nova reserva (T03); F6-11 a F6-13; BUG-010 a BUG-014; roteiro de navegador real |
| #34 | Login (T01): destino sem redirecionamento aberto, volta à origem, aviso de sessão terminada, verificação em navegador real e BUG-015 (foco depois de entrar) |
| #36 | Reservas (T04): lista, cancelamento com diálogo de foco gerenciado, alteração com o formulário da Nova reserva, verificação em navegador real (incluindo reserva já iniciada, RN-07) e BUG-016 (Administrador sem Alterar) |
| #24 (fechado) | Dependabot `jsdom` 29 para 30, **fechado sem mesclar** (F6-13) |

### 2.2 O que está no branch `fase-6/tela-minhas-reservas`

T04 em TDD: lista de reservas (`frontend/src/paginas/reservas/`), diálogo de cancelamento com foco gerenciado (`frontend/src/ui/Dialogo.tsx`), alteração em `/reservas/:id/alterar` reaproveitando o formulário e o tratamento de conflito da Nova reserva (`frontend/src/paginas/reserva/FormularioDeReserva.tsx`) e o BUG-016 (Administrador sem Alterar). Ver a seção 7.

## 3. Números (todos de execução real)

| Item | Valor | Origem |
| --- | --- | --- |
| Back end | 517 testes (154 de unidade e arquitetura, 363 de integração e BDD), 0 falhas, JaCoCo 96,9% de linhas e 84,9% de branches | `./mvnw -B clean verify` local e confirmado pelo CI do PR #25 (RTM, execução E-5) |
| Front (CI) | 37 arquivos de teste, 548 testes, 0 falhas | Job `frontend`, run `39333087251` (PR #36); RTM, execução E-8 |
| Navegador real (protótipo) | axe com 0 violações em 48 estados; 47 paradas de Tab sem mouse, com foco visível; 0 rolagem horizontal em 8 de 8 telas | Roteiro manual (RTM, execução E-6) |

## 4. Decisões da equipe desta fase (texto completo em `docs/decisoes-equipe.md`)

| IDs | Assunto |
| --- | --- |
| F6-01 | Cliente e tipos gerados do `openapi.json` com **openapi-typescript + openapi-fetch** |
| F6-02 | Token opaco no **`sessionStorage`**, com mitigações (módulo único, limpeza em logout e 401, sem HTML injetado) |
| F6-03 | React Router + TanStack Query |
| F6-04 | CSS Modules + variáveis CSS, sem biblioteca de UI |
| F6-05 | Corpo de erro (`code`, `itens`, `campos`) tipado só no front |
| F6-06 | Back end: `GET /api/bloqueios` (a), nome do solicitante na fila, nunca o e-mail (b), filtro de período da auditoria no front porque a auditoria não é paginada (c) |
| F6-07 | Direção visual moderna, **paleta A** (violeta e rosa), com contraste WCAG AA verificado |
| F6-08 | Menu lateral no desktop, barra inferior no celular (até 4 itens e "Mais") |
| F6-09 | Tema claro e escuro por tokens semânticos. O escuro é o primeiro item a cortar se faltar tempo, **e cortar é decisão de Jefferson: avisar antes** |
| F6-10 | Campos obrigatórios das respostas no contrato (alternativa B) |
| F6-11 | **Padrão visual e de interação aprovado**; as outras telas repetem, **uma tela por PR** |
| F6-12 | Campo de data e hora nativo mantido (6 paradas de Tab por campo; anel do ícone do calendário é do navegador) |
| F6-13 | PR #24 do Dependabot fechado; `jsdom` ignorado nos saltos maiores |

## 5. Defeitos e ocorrências

- **BUG-010 a BUG-014** (achados no navegador real, corrigidos em TDD, issues retroativas #27 a #31, fechados com o run `39165239588`):
  foco perdido ao trocar de tela; título de página igual em todas as telas; ícone do calendário sem foco visível;
  confirmação mostrando "Recurso 2"; sala ocupada ainda listada depois do conflito. Lição: testes de componente com API
  simulada e jsdom **não substituem** o navegador real.
- **Ocorrência a vigiar** (`docs/testes/ocorrencias-a-vigiar.md`): `NotificacaoApiIT.int01ECt103` falhou uma vez em
  18/10/2026 sem causa determinada; passou isolado e nas execuções seguintes. **Não alterar o teste. Se falhar de novo,
  parar e avisar Jefferson com os logs.**
- Ocorrência de ambiente (sem registro de defeito): um teste do front ficou 343 s parado numa execução e não se
  reproduziu (passou isolado em 15,8 s); a espera padrão dos testes assíncronos foi aumentada para 5 s (`src/test/preparar.ts`).

## 6. Combinados de trabalho (valem daqui para frente)

- **Português do Brasil, com acentuação completa**, respostas curtas e honestas: resultado ruim aparece como ruim.
- **Fluxo de decisão:** o Claude apresenta alternativas **conformes à especificação e ao plano mestre**, com recomendação
  marcada; Jefferson escolhe; só então vira decisão da equipe (`F6-xx`, com a data). Nunca por inferência.
- **Merge autorizado** quando `test`, `frontend`, `segredos` e SonarCloud estiverem verdes e nenhuma decisão conflitar com a
  especificação e o plano mestre. **Sempre avisar o que foi mesclado.** Se o classificador de permissões negar, não
  contornar: avisar para Jefferson adicionar a permissão. Antes de tornar um check obrigatório, ver o job verde num PR real e
  **pedir o "pode"** (o `e2e` entra só no 6.D).
- **Hook do AIOX** bloqueia `git push`, `gh pr create/merge/close` para quem não é `@devops`: prefixar com
  `AIOX_ACTIVE_AGENT=devops`. Merge commit, sem squash e sem rebase. Commits convencionais com o trailer
  `Co-Authored-By: Claude ...`.
- **TDD estrito também no front:** um teste por vez, visto **vermelho por asserção** (ou por consulta que não acha o
  elemento, nunca por erro de compilação ou configuração), commit `test(red)`, depois `feat(green)`, depois `refactor`.
  O que nasce verde é **declarado** no commit. Teste nunca é alterado, desativado ou enfraquecido para passar.
- **Uma tela por PR.** Em cada tela repetir o que o protótipo fez: TDD, **verificação em navegador real contra a API
  real**, axe nos dois temas e tamanhos (360 e 1280 px), navegação só por teclado e ausência de rolagem horizontal.
- **Não cortar a saída de verificação** (`head`, `tail`) em checagens de documentação, testes ou links; filtrar por padrão
  de erro sem esconder o resto. **`analyze-docs` completo** ao fim de todo trabalho que toque documentação, mostrando o
  resultado real. Ele só vê o que está **commitado**; resultado com 0 arquivos não vale.
- **Nunca** `taskkill /IM node.exe` nem equivalente (derrubou o servidor MCP do figma-console). Encerrar só o PID dono
  da porta que o próprio Claude abriu. **Nenhuma operação destrutiva de git** (`reset --hard`, `clean`, `checkout` que
  descarta) com suíte rodando em segundo plano; para testar algo com commit temporário, usar `git worktree`.
- **Número do front que vale** é o do job `frontend` da CI do PR, não o local.
- Nenhum segredo, token, senha ou dado pessoal real no repositório; nenhuma menção a instituição real em tela, código
  ou documentação (o sistema aparece só como "Organização de Recursos").
- Chamar o que existe de **revisão assistida**, nunca de "revisão por pares".

## 7. Tela de Login (T01): concluída em 19/10/2026 (PR 34)

**Feito (commits em `fase-6/tela-login`, todos em TDD, 449 testes locais verdes):**

- `destinoDepoisDoLogin`: volta para a tela de origem (com `?filtros`) só se for endereço interno de uma tela que o perfil
  vê; senão vai para a inicial do perfil. Rejeita `//host`, `https://`, `javascript:`, `\`, `/entrar` e `/`.
- Contexto de sessão com `sessaoExpirou` (verdadeiro só no 401; falso na abertura, ao entrar e ao sair por vontade própria).
- `PaginaDeEntrada`: e-mail e senha com `autocomplete`, botão "Mostrar senha" (`aria-pressed`), seletor de tema, validação
  local de campo em branco, recusa **sem dizer qual campo errou**, senha apagada e escondida após recusa, e-mail
  preservado, mensagem da tabela de erros com o foco, envio sem clique duplo, "Entrando…".
- Rotas: `/entrar` mostra a tela real; `RotaProtegida` guarda `pathname + search` em `de`; aviso "Sua sessão terminou.
  Entre novamente." no login.
- Documentação: CT-141, evidência de TDD e `navegacao-telas.md` (seção 9) atualizados.

**Histórico do que faltava (feito e mesclado no PR 34, ver RTM, execução E-7):**

1. Verificação em **navegador real** contra a API real (roteiro em `docs/testes/roteiro-navegador-real/`): capturas em
   360 e 1280 px nos dois temas, axe, navegação só por teclado, rolagem horizontal. Incluir: credencial inválida,
   sessão expirada e volta à tela de origem. Estender o `prototipo.cjs` com o fluxo de login (hoje a sessão é injetada).
2. Corrigir o que o navegador real achar (cada defeito vira BUG-xxx, issue e teste de regressão).
3. Conferir o `analyze-docs` completo, abrir o PR, esperar `test`, `frontend`, `segredos` e SonarCloud, usar o número de
   testes **da CI**, atualizar a RTM (E-7 vira número de CI) e mesclar.
4. Opcional a decidir: "Lembrar de mim" e "Esqueci a senha" **não** existem na API; não construir sem decisão.

## 8. Próximas telas (ordem do mapa de telas, uma por PR)

T04 Minhas reservas e cancelamento (inclui alteração de reserva) está no seu PR (ver `gh pr list`). Depois: T05 Fila de aprovações → T06 Retirada e devolução →
T07 Catálogo de recursos → T08 Bloqueios de manutenção → T09 Histórico de auditoria → T10 Relatórios → T11 Usuários e
perfis. Telas densas (Fila, Relatórios, Auditoria, Catálogo): **tabela compacta no desktop e cartões no celular** (F6-07).
Contrato e regras de cada tela estão em `docs/prd/navegacao-telas.md` (seção 4). A auditoria não é paginada: o filtro de
período é no front (F6-06c).

Depois das telas, **6.D**: `compose.e2e.yaml` (PostgreSQL, API e front), testes E2E com Playwright (Solicitante busca e
reserva, conflito com mensagem compreensível, Responsável aprova recurso restrito, Solicitante não vê a ação de aprovar,
fluxo principal em viewport 360 por 640), jobs `e2e` na CI com relatório e traces como artifact (`if: always()`), e só
então **pedir o "pode"** para tornar o `e2e` obrigatório. O roteiro manual vira a base. Cortar primeiro, se faltar tempo:
o tema escuro (**só com aviso a Jefferson**), a amplitude do E2E (manter os dois fluxos principais) e o job de não
compareceu. **Nunca cortar:** aplicação executável, pipeline obrigatório, autorização sem falha, proteção contra dupla
reserva e evidência de TDD ou BDD.

## 9. Pendências abertas (detalhe e origem em `docs/fase-7-pendencias.md`)

- **Depende de Jefferson:** revogar o token antigo do SonarCloud (se ainda não foi feito).
- **Depende do professor:** A1 a A8, D1, D3, D4, D9, D17 e a dúvida sobre "revisão por pares" com equipe de uma pessoa.
- **Desempenho:** RNF-08b **não atendido nesta máquina** (p95 de 568 a 886 ms contra 300 ms), causa localizada no `fsync`
  do PostgreSQL em Docker; entra no relatório final como meta não atingida.
- **Segurança (Fase 7):** SEC-03 (SBOM e soma de verificação do Maven), SEC-04 (alerta de segurança), modelo de ameaças
  A06 (opcional), R-23 (papel dono das tabelas), limitações do limite de login.
- **Limitações declaradas:** anel de foco do ícone do calendário é do navegador; 24 verificações `color-contrast`
  incompletas do axe, todas no glifo decorativo do aviso; campo de data e hora nativo com 6 paradas de Tab.
- **Alertas do Dependabot:** 22 abertos (conferidos em 18/10/2026), **todos em manifestos do framework AIOX** em
  `.aiox-core/` (camada protegida, não editar); **nenhum** em `frontend/` nem no Maven. Cabe a Jefferson decidir se os
  dispensa como "não se aplica ao produto".
- **Dependências fixadas por incompatibilidade (ADR-015):** TypeScript 5.9 e ESLint 9; reavaliar quando os pacotes
  aceitarem as versões novas. Salto do `jsdom` 29 para 30 a avaliar em PR nosso.
- **RF-13 segue "parcial" na RTM:** fecha com as telas restantes e o E2E em celular (6.D).

## 10. Armadilhas técnicas novas

- **Heredoc no Bash do Windows come barra invertida** (`'\\'` vira `'\'`) e quebra o parse com apóstrofos em arquivos
  grandes. Para código, usar a ferramenta **Write/Edit**; para scripts Python, gravá-los em arquivo e executá-los. Travar o
  commit atrás de `typecheck` com `&&` (já saiu commit que não compilava por usar `;`).
- **Chamadas em paralelo na mesma mensagem** podem disputar o `cd` do shell e rodar `npm` no diretório errado. Fazer a
  verificação numa chamada separada, depois da escrita dos arquivos.
- `mvnw.cmd` e `frontend/src/api/schema.d.ts` aparecem modificados só por fim de linha: `git checkout --` neles. Nunca
  `git add -A` na raiz.
- **Vitest:** a espera padrão do Testing Library (1 s) estourava sob carga; está em 5 s. O primeiro teste de cada arquivo
  paga a primeira renderização.
- **Datas:** `datetime-local` do Chromium aceita até 6 dígitos no ano; no teclado digitar o ano, dar Tab e digitar a hora.
- **Nome acessível:** a biblioteca de teste apara o espaço no início de um `span`; colocar o espaço no texto do pai
  (`Reservar{' '}<span>…`).
- **Roteiro de navegador real** deixa reservas de verdade no banco: trocar `DESLOCAMENTO` a cada execução ou recomeçar o
  contêiner. Usar `http://localhost:4173`, não `127.0.0.1` (CORS).
- `npm ci --ignore-scripts` na CI (SonarCloud S6505); verificado que o front funciona sem scripts de instalação.
- O Dependabot não aciona o SonarCloud (sem segredos): PR dele nunca cumpre o Quality Gate; avaliar saltos em PR nosso.

## 11. Comandos úteis

```bash
# Front (na pasta frontend/)
npm ci --ignore-scripts && npm run gerar:api   # tipos regenerados do openapi.json (a CI confere que não divergem)
npm run lint && npm run typecheck && npm test && npm run build
# Back end (na raiz)
./mvnw -B clean verify                         # cerca de 8 minutos, precisa de Docker
./mvnw -B -ntp clean verify -Dit.test=Classe -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true
# Contrato: -Dgerar.openapi=true regenera docs/api/openapi.json (CT-114 e CT-115 falham de propósito quando o contrato muda)
gh pr list ; gh pr checks <n> ; gh run list --branch <b> --limit 3
```

Variáveis do back end: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `SESSAO_DURACAO`, `LOGIN_TENTATIVAS` (5), `LOGIN_JANELA` (`PT10M`);
opcionais: `CORS_ORIGENS`, `NOTIFICACAO_URL`, `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_SENHA`. O front lê `VITE_API_URL`
(modelo em `frontend/.env.example`) e, opcionalmente, `VITE_FUSO_CAMPUS` (padrão `America/Sao_Paulo`, decisão A6).

## 12. Mapa do código do front (`frontend/src/`)

| Pasta | Conteúdo |
| --- | --- |
| `api/` | `schema.d.ts` gerado; `cliente.ts` (openapi-fetch, token no `Authorization`, 401 limpa a sessão, `executar` e `ErroDeApi`) |
| `erros/` | `mensagens.ts` (34 códigos, igual à seção 5.1 de `navegacao-telas.md`, amarrada ao `CodigoErro.java`) e `problema.ts` |
| `sessao/` | Único módulo que toca o `sessionStorage` (regra testada) |
| `autenticacao/` | `ProvedorDeSessao`, contexto e `useSessao` (`entrar`, `sair`, `sessaoExpirou`) |
| `estilo/` | `tokens.css` (paleta A, claro e escuro, contraste testado), `base.css`, `tema.ts`, `contraste.ts` |
| `rotas/` | `telas.ts` (matriz de acesso igual à documentação), `navegacao.ts`, `destino.ts`, `RotaProtegida.tsx` |
| `layout/` | `Estrutura`, `Navegacao` (lateral e barra com "Mais"), `SeletorDeTema`, `Icone` |
| `ui/` | `Aviso`, `Campo`, `Botao`, `Estados`, `ErroDaApi` |
| `datas/` | `fuso.ts` (ISO-8601 com offset, hora do campus) |
| `recursos/`, `reservas/` | Consultas e mutações (TanStack Query) |
| `paginas/` | `busca/`, `reserva/`, `entrada/` (prontas) e `PaginaDeTela` (marcador das demais) |
| `test/` | Auxiliares de teste: `montar.tsx`, `recursos.ts`, `documentacao.ts`, `tokens.ts` |
