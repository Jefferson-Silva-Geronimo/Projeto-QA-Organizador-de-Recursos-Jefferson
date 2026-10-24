# ADR-015. Stack do front end: cliente gerado, token em sessionStorage, React Router, TanStack Query e CSS Modules

| Campo | Valor |
| --- | --- |
| Status | Aceito em 18/10/2026 (escolha explícita de Jefferson). Detalha o [ADR-010](ADR-010-contrato-openapi-e-front-end-react-vite.md) e respeita o [ADR-004](ADR-004-autenticacao-e-autorizacao.md) e o [ADR-005](ADR-005-relogio-injetavel-e-tempo-em-utc.md) |
| Data | 18/10/2026 |
| Origem | [decisoes-equipe.md](../decisoes-equipe.md), seção 8 (F6-01 a F6-05); [navegacao-telas.md](../prd/navegacao-telas.md), tabela de princípios; RF-13; RNF-10; [ADR-004](ADR-004-autenticacao-e-autorizacao.md), [ADR-005](ADR-005-relogio-injetavel-e-tempo-em-utc.md) e [ADR-008](ADR-008-erros-padronizados-e-consultas-parametrizadas.md) |
| Decisores | Jefferson Silva (dono do projeto e única pessoa da equipe). |

## Contexto

O ADR-010 fixou React + Vite como SPA que consome a API. Seis decisões de front end precisam ficar registradas ([decisoes-equipe.md](../decisoes-equipe.md), seção 8, e a tabela de princípios de [navegacao-telas.md](../prd/navegacao-telas.md)) e ficam abertas as técnicas: gerador de cliente, roteador, gerenciamento de estado, CSS e a forma concreta de guardar o token. Nenhuma aula cobre front end; a especificação exige só interface responsiva (RF-13) e teste E2E.

## Decisão

| # | Decisão | Origem |
| --- | --- | --- |
| 1 | Tipos e cliente gerados do `docs/api/openapi.json` com **openapi-typescript** e **openapi-fetch**; nada do contrato é digitado à mão | F6-01 ([decisoes-equipe.md](../decisoes-equipe.md), seção 8); escolha de Jefferson |
| 2 | Tabela **código de erro estável → mensagem com ação sugerida** (ADR-008); o texto cru do back end nunca aparece | ADR-008; RF-13; [navegacao-telas.md](../prd/navegacao-telas.md), tabela de princípios; F6-05 |
| 3 | Rotas por perfil são conveniência; o front nunca decide sobreposição, aprovação nem posse | ADR-004; [navegacao-telas.md](../prd/navegacao-telas.md), tabela de princípios |
| 4 | Token opaco no **`sessionStorage`**, enviado no cabeçalho `Authorization`, com as mitigações abaixo | ADR-004; F6-02; escolha de Jefferson, condicionada a não contrariar a especificação nem o plano |
| 5 | **React Router** nas rotas e **TanStack Query** no estado do servidor | Escolha de Jefferson |
| 6 | **CSS Modules + variáveis CSS**, sem biblioteca de componentes; *mobile-first*, validado em 360 px e 1280 px, com rótulo, foco e contraste acessíveis | [navegacao-telas.md](../prd/navegacao-telas.md), tabela de princípios (*mobile-first*, 360 px e 1280 px, rótulo, foco e contraste); RF-13; RNF-10; F6-04; escolha de Jefferson |
| 7 | Datas exibidas no fuso do campus e enviadas em ISO-8601 com offset | [navegacao-telas.md](../prd/navegacao-telas.md), tabela de princípios; ADR-005 |
| 11 | Padrão visual e de interação aprovado a partir do protótipo da Busca e da Nova reserva; uma tela por PR, cada uma com TDD, navegador real, axe, teclado e sem rolagem horizontal | F6-11 |
| 12 | Campo de data e hora nativo do navegador, com as limitações declaradas (6 paradas de Tab; anel do ícone do calendário é o do navegador) | F6-12 |
| 10 | Direção visual moderna com a paleta A (violeta e rosa), valores e contraste na seção "Paleta escolhida" | F6-07; escolha de Jefferson |
| 8 | Navegação: menu lateral no desktop e barra inferior no celular, com no máximo 4 itens principais e "Mais"; rótulo de texto em todo item; item ativo destacado por mais que cor | F6-08; escolha de Jefferson |
| 9 | Temas claro e escuro por tokens semânticos, `prefers-color-scheme` e botão manual; todo par de cores com no mínimo WCAG AA nos dois temas. O tema escuro não é requisito de acessibilidade e é o primeiro item a cortar, com aviso prévio a Jefferson | F6-09; escolha de Jefferson |

### Mitigações do `sessionStorage` (decisão 4)

O `sessionStorage` é legível por qualquer script da página, então a segurança depende de não haver XSS. As mitigações, todas verificáveis:

- o token é lido e escrito em **um único módulo**; nenhum outro código toca o armazenamento;
- logout chama a revogação no servidor (ADR-004) e apaga o token; qualquer **401** apaga o token e leva ao login;
- sem `dangerouslySetInnerHTML` (regra de lint) e sem script de terceiros; dependências travadas por `package-lock.json` e vigiadas pelo Dependabot;
- cabeçalho `Content-Security-Policy` restritivo na entrega do front (ponto a validar no `compose.e2e.yaml`);
- o token é opaco e revogável no servidor, então um vazamento tem efeito limitado ao tempo até a revogação.

**Risco residual aceito:** um XSS que passe por essas barreiras lê o token da aba. Mais seguro seria guardá-lo só em memória, ao custo de novo login a cada recarga; Jefferson preferiu o equilíbrio com `sessionStorage`.

## Paleta escolhida (F6-07)

Jefferson escolheu a **paleta A, violeta e rosa**, em 18/10/2026, entre três opções calculadas por script. Direção visual:
moderna, com cor forte só nos pontos de destaque (ações principais, estados, navegação ativa) e base neutra para leitura,
cantos arredondados e sombras suaves sem exagero. Tabelas compactas no desktop e cartões no celular nas telas densas
(Fila de aprovações, Relatórios, Auditoria e Catálogo). Nenhum nome, logotipo ou paleta de instituição real em tela, texto,
código ou documentação; o sistema aparece só como "Organização de Recursos".

| Token | Uso | Tema claro | Tema escuro |
| --- | --- | --- | --- |
| `fundo` | Fundo | `#F6F5FB` | `#14122A` |
| `superficie` | Superfície (cartão, tabela) | `#FFFFFF` | `#1E1B3A` |
| `texto` | Texto | `#1C1B2E` | `#F1EFFF` |
| `texto-suave` | Texto secundário | `#55536E` | `#B7B3D6` |
| `destaque` | Destaque (botão, indicador ativo) | `#6D28D9` | `#A78BFA` |
| `sobre-destaque` | Texto sobre o destaque | `#FFFFFF` | `#14122A` |
| `destaque-texto` | Destaque em texto (link, ação) | `#5B21B6` | `#C4B5FD` |
| `foco` | Anel de foco | `#C2185B` | `#F9A8D4` |
| `borda-campo` | Borda de campo | `#7B7894` | `#8E89B8` |
| `erro-texto` | Erro, texto | `#9F1239` | `#FECDD3` |
| `erro-fundo` | Erro, fundo | `#FFE4EA` | `#4C1425` |
| `erro-borda` | Erro, borda | `#C81E4B` | `#FB7185` |
| `sucesso-texto` | Sucesso, texto | `#14532D` | `#BBF7D0` |
| `sucesso-fundo` | Sucesso, fundo | `#DCFCE7` | `#12351F` |
| `aviso-texto` | Aviso, texto | `#78350F` | `#FDE68A` |
| `aviso-fundo` | Aviso, fundo | `#FEF3C7` | `#3B2A0A` |
| `info-texto` | Informação, texto | `#1E3A8A` | `#C7D2FE` |
| `info-fundo` | Informação, fundo | `#E0E7FF` | `#1E2A5A` |

**Verificação:** 34 pares calculados por script (17 por tema), 0 falhas. Pares de texto, mínimo de 4,5:1: o menor é 6,69:1
no tema claro e 6,71:1 no escuro. Pares de componente e foco, mínimo de 3:1: o menor é 4,24:1 no claro (borda de campo) e
5,04:1 no escuro. Os valores acima são o ponto de partida; qualquer mudança de cor exige novo cálculo. A CI do front end repete a
verificação sobre os tokens reais: `frontend/src/estilo/tokens.test.ts` confere 22 pares nos três blocos de `tokens.css`
(tema claro, escuro pela preferência e escuro pela escolha), com 4,5:1 para texto e 3:1 para foco, bordas e indicador. **Regra de foco:** o anel tem um espaço de 2 px na cor do fundo, então
nunca encosta no botão, e o critério de 3:1 vale contra o fundo e o cartão.

## Ajustes de versão na etapa 6.B (18/10/2026)

Escolhas técnicas de compatibilidade, sem relação com a especificação nem com o plano mestre. Versões exatas em
`frontend/package.json` e `package-lock.json`.

| Ajuste | Motivo (verificado na instalação) |
| --- | --- |
| TypeScript fixado em 5.9 | A versão 7.x conflita com `openapi-typescript` (pede TypeScript 5.x) e com `typescript-eslint` (pede até 6.0) |
| ESLint fixado em 9 | `eslint-plugin-jsx-a11y` não aceita ESLint 10. A regra de acessibilidade no lint tem prioridade |
| Ferramentas de acessibilidade só para desenvolvimento: `vitest-axe`, `axe-core` e `@axe-core/playwright` (versões exatas) | Auditoria axe nos testes de componente e no navegador real; sem efeito no pacote de produção |
| Saltos maiores ignorados no Dependabot | Mesmos motivos, mais mudança de API nas bibliotecas principais; só correções e menores entram sozinhas |

**Achado de contrato (L-06), resolvido pela F6-10 em 18/10/2026:** os esquemas de **resposta** do OpenAPI não declaravam
`required`, e o gerador marcava todo campo como opcional. O back end passou a marcar como obrigatórios só os campos que nunca
são nulos (só documentação, sem mudar nenhum comportamento HTTP), e o cliente foi regenerado: 63 campos deixaram de ser
opcionais. Os campos de fora seguem opcionais e estão listados, com o motivo, na F6-10 de
[decisoes-equipe.md](../decisoes-equipe.md). O único guarda de resposta em tempo de execução é o do login, que nunca vira
sessão sem `token`, `perfil` e `expiraEm`.

## Alternativas descartadas

| Alternativa | Por que não |
| --- | --- |
| Token só em memória | Recarregar a página, comum no celular, obriga a novo login |
| `localStorage` | Persiste entre abas e sessões; o plano manda evitar |
| Orval; OpenAPI Generator | Mais código gerado e mais acoplamento; o segundo exige Java |
| React Router sem biblioteca de estado | Reimplementaria carregando, erro e nova tentativa em cada tela |
| Tailwind; MUI | Mais configuração ou dependência pesada, sem requisito que as exija |

## Consequências

- **Positivas:** contrato único; poucas dependências; controle total da acessibilidade.
- **Negativas:** mais CSS escrito à mão; o risco residual de XSS descrito acima.
- **Dependabot:** o ecossistema `npm` entra em `.github/dependabot.yml` junto com `frontend/`.

## Evidência necessária

- Teste de componente de cada código de erro estável e de cada estado de tela.
- Teste que prove: logout e 401 apagam o token; só o módulo de sessão acessa o armazenamento.
- E2E em `docker compose` com API e PostgreSQL reais, incluindo conflito e viewport 360 por 640.

## Condição de revisão

Resposta do professor sobre D17 (duração da sessão) ou exigência de outro mecanismo de autenticação; achado de segurança que torne o `sessionStorage` inaceitável (migrar para memória).
