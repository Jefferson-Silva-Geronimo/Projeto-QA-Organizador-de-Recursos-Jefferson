# ADR-015. Stack do front end: cliente gerado, token em sessionStorage, React Router, TanStack Query e CSS Modules

| Campo | Valor |
| --- | --- |
| Status | Aceito em 18/10/2026 (escolha explícita de Jefferson). Detalha o [ADR-010](ADR-010-contrato-openapi-e-front-end-react-vite.md) e respeita o [ADR-004](ADR-004-autenticacao-e-autorizacao.md) e o [ADR-005](ADR-005-relogio-injetavel-e-tempo-em-utc.md) |
| Data | 18/10/2026 |
| Origem | [plano_mestre.md](../plano_mestre.md), seção 10.3 (decisões 1 a 6); RF-13; RNF-10 |
| Decisores | Jefferson Silva (dono do projeto e única pessoa da equipe). |

## Contexto

O ADR-010 fixou React + Vite como SPA que consome a API. O plano mestre (seção 10.3) manda registrar seis decisões de front end e deixa abertas as técnicas: gerador de cliente, roteador, gerenciamento de estado, CSS e a forma concreta de guardar o token. Nenhuma aula cobre front end; a especificação exige só interface responsiva (RF-13) e teste E2E.

## Decisão

| # | Decisão | Origem |
| --- | --- | --- |
| 1 | Tipos e cliente gerados do `docs/api/openapi.json` com **openapi-typescript** e **openapi-fetch**; nada do contrato é digitado à mão | Plano 10.3 (1); escolha de Jefferson |
| 2 | Tabela **código de erro estável → mensagem com ação sugerida** (ADR-008); o texto cru do back end nunca aparece | Plano 10.3 (2) |
| 3 | Rotas por perfil são conveniência; o front nunca decide sobreposição, aprovação nem posse | Plano 10.3 (3); ADR-004 |
| 4 | Token opaco no **`sessionStorage`**, enviado no cabeçalho `Authorization`, com as mitigações abaixo | ADR-004; plano 10.3 (4); escolha de Jefferson, condicionada a não contrariar a especificação nem o plano |
| 5 | **React Router** nas rotas e **TanStack Query** no estado do servidor | Escolha de Jefferson |
| 6 | **CSS Modules + variáveis CSS**, sem biblioteca de componentes; *mobile-first*, validado em 360 px e 1280 px, com rótulo, foco e contraste acessíveis | Plano 10.3 (5); escolha de Jefferson |
| 7 | Datas exibidas no fuso do campus e enviadas em ISO-8601 com offset | Plano 10.3 (6); ADR-005 |
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

## Ajustes de versão na etapa 6.B (18/10/2026)

Escolhas técnicas de compatibilidade, sem relação com a especificação nem com o plano mestre. Versões exatas em
`frontend/package.json` e `package-lock.json`.

| Ajuste | Motivo (verificado na instalação) |
| --- | --- |
| TypeScript fixado em 5.9 | A versão 7.x conflita com `openapi-typescript` (pede TypeScript 5.x) e com `typescript-eslint` (pede até 6.0) |
| ESLint fixado em 9 | `eslint-plugin-jsx-a11y` não aceita ESLint 10. A regra de acessibilidade no lint tem prioridade |
| Saltos maiores ignorados no Dependabot | Mesmos motivos, mais mudança de API nas bibliotecas principais; só correções e menores entram sozinhas |

**Achado de contrato (L-06, em aberto):** os esquemas de **resposta** do OpenAPI não declaram `required` (só os de requisição
declaram). O gerador por isso marca todo campo de resposta como opcional, e o front valida na fronteira antes de confiar
(por exemplo, o login só vira sessão com `token`, `perfil` e `expiraEm`). Marcar os campos como obrigatórios no back end
tornaria os tipos mais precisos, mas muda o contrato; a decisão é de Jefferson.

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
