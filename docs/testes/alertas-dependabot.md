# Alertas do Dependabot: justificativa de que não se aplicam ao produto

Decisão **F7-08** ([decisoes-equipe.md](../decisoes-equipe.md)), de 24/10/2026: os alertas abertos do Dependabot estão todos no framework AIOX e **ficam declarados como risco, sem dispensa no GitHub**. Os alertas continuam visíveis na aba de segurança do repositório. Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), que não trata de alertas de dependência.

## 1. Consulta

| Item | Valor |
| --- | --- |
| Data | 24/10/2026 |
| Consulta | `gh api "repos/<dono>/<repositório>/dependabot/alerts?state=open&per_page=100" --paginate` (leitura; nenhuma alteração no GitHub) |
| Alertas abertos | **27** |
| Aviso do `git push` no mesmo dia | "27 vulnerabilities (11 high, 13 moderate, 3 low)", igual à consulta |

## 2. Por manifesto

| Manifesto | Altos | Médios | Baixos | Total |
| --- | --- | --- | --- | --- |
| `.aiox-core/scripts/diagnostics/health-dashboard/package-lock.json` | 10 | 13 | 3 | 26 |
| `.aiox-core/package-lock.json` | 1 | 0 | 0 | 1 |
| **`frontend/package-lock.json`** | **0** | **0** | **0** | **0** |
| **`pom.xml` (Maven)** | **0** | **0** | **0** | **0** |
| **Total** | **11** | **13** | **3** | **27** |

**Fora de `.aiox-core/` não há nenhum alerta aberto.** Se algum aparecer, ele é do produto e deve ser tratado: a regra desta decisão é parar e avisar Jefferson.

Outros fatos da consulta: 14 pacotes afetados (`vite` 7 alertas, `js-yaml` 4, `react-router` 3, `brace-expansion` 2, `postcss` 2, e um em cada de `@babel/core`, `@remix-run/router`, `baseline-browser-mapping`, `braces`, `browserslist`, `esbuild`, `nanoid`, `react-router-dom` e `source-map-js`); escopo de desenvolvimento em 21 e de runtime em 6 (o escopo "runtime" é o da própria dependência dentro do manifesto do framework, não do produto); 19 transitivos e 8 diretos; **26 têm versão corrigida disponível** e 1 não (`braces`, alerta 1).

## 3. A diferença entre 22 e 27

A pendência de 18/10/2026 registrava **22** alertas, todos em `.aiox-core/`. A consulta de hoje mostra **22 alertas criados em 17/10/2026 e 5 criados em 22/10/2026**: os 22 antigos continuam abertos e os 5 são novos. Fato da API; a causa de os 5 terem aparecido naquele dia (novo aviso de segurança publicado, por exemplo) **não foi investigada**.

## 4. Por que não se aplica ao produto

| Fato | Origem |
| --- | --- |
| O produto é a API Java (Maven) e o front end React (`frontend/`). Nenhum alerta aberto em `pom.xml` nem em `frontend/package-lock.json` | Consulta da seção 2 |
| A imagem da API é construída com `COPY .mvn`, `COPY mvnw pom.xml` e `COPY src`; o `.dockerignore` exclui `.aiox-core` (linha 10) | `Dockerfile`; `.dockerignore` |
| A imagem do front é construída com contexto `./frontend` | `compose.e2e.yaml`, linhas 44 a 46 |
| Os workflows da CI não referenciam o `.aiox-core` | `grep -i aiox .github/workflows/*.yml` sem resultado |
| O framework é camada protegida e não deve ser editado nesta fase | `CLAUDE.md` do projeto, "Framework vs Project Boundary" |

**Conclusão (decisão F7-08):** os 27 alertas não se aplicam ao produto entregue. Eles dizem respeito a ferramentas do framework de agentes usado no desenvolvimento, que não entram nas imagens nem na CI do produto.

## 5. Risco declarado e limites

| Item | Tipo | Detalhe |
| --- | --- | --- |
| Alertas abertos no framework | Risco declarado | Continuam abertos e visíveis. Quem executar localmente as ferramentas do `.aiox-core` (por exemplo, o painel de diagnóstico) usa dependências com alerta conhecido. Impacto limitado à máquina de quem desenvolve; **não medido** |
| Atualização do framework | Decisão | Não feita nesta fase: o canal de atualização do AIOX não é conhecido (lacuna) e o framework é de terceiros e protegido. Alternativas apresentadas a Jefferson em 24/10/2026: atualizar pelo canal do framework, ou dispensar os alertas no GitHub; ele escolheu só declarar |
| Causa dos 5 alertas de 22/10 | Lacuna | Não investigada |
| Revalidação | Regra | A consulta é repetida antes de cada tag (última em 26/10/2026, seção 6). Qualquer alerta fora de `.aiox-core/` interrompe o fluxo |
| Entrada no relatório final | Pendência | Risco declarado, com esta justificativa, no bloco 9 (riscos residuais) |

## 6. Consulta de 26/10/2026 e o que continua versionado

| Item | Valor |
| --- | --- |
| Data | 26/10/2026 |
| Consulta | a mesma da seção 1, pela API do GitHub (leitura) |
| Alertas abertos | **27**: 1 em `.aiox-core/package-lock.json` (alto) e 26 em `.aiox-core/scripts/diagnostics/health-dashboard/package-lock.json` (10 altos, 13 médios, 3 baixos) |
| Fora de `.aiox-core/` | 0 (nenhum em `frontend/` nem no Maven) |

O projeto usa só Claude Code e GitHub Copilot, e as configurações das outras ferramentas (`.antigravity`, `.codex`, `.cursor`, `.gemini`, `.grok`, `.kimi`) deixaram de ser versionadas. Elas não continham manifesto de dependências com alerta, e a contagem de alertas não mudou por isso.

**Por que o `health-dashboard` continua versionado:** nenhum arquivo do produto o referencia, mas `.aiox-core/install-manifest.yaml`, `.aiox-core/.installed-manifest.yaml` e `.aiox-core/version.json` listam os 39 arquivos dele com soma de verificação, e a verificação de integridade do framework (`manifest validate`) compara o diretório com essas listas. Retirá-lo do índice faria essa verificação acusar arquivos ausentes. A justificativa da seção 4 vale para ele: o painel de diagnóstico não entra nas imagens nem na CI do produto. Os 26 alertas dele seguem declarados como risco, sem dispensa no GitHub.
