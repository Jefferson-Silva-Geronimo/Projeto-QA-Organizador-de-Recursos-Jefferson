---
name: analyze-docs
description: >
  Valida a documentação do projeto Organização de Recursos: links e âncoras, fences,
  tabelas, hierarquia de títulos, Mermaid, DBML, identificadores e rastreabilidade com a
  RTM, fidelidade à especificação, termos canônicos, números sem origem, README e
  ortografia. Entrega um relatório. Nunca edita os documentos analisados.
  Use when: analyze-docs, ao finalizar qualquer criação ou edição de documentação.
user-invocable: true
---

# analyze-docs

Gate de documentação. Executar ao final de toda criação ou edição de documentos.
A skill **só lê e reporta**; correções são feitas fora dela, pelo agente ou pela equipe.
O gate só é cumprido com **zero erros**. Avisos são levados ao usuário.

## Escopo

Analisar os arquivos Markdown e DBML **versionados**: `README.md`, `RTM.md`, `AGENTS.md`
(somente o bloco do projeto), `docs/**` e `.github/**/*.md` (templates do projeto).

**Ignorar:**

- Arquivos ignorados pelo Git (`git check-ignore -v <arquivo>`), em especial os dois
  materiais de apoio listados no `.gitignore` sob "Material de apoio, não versionar".
  Eles não são analisados como origem.
- `.aiox-core/`, `.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.antigravity/`,
  `.grok/`, `.kimi/`, `.github/agents/` e `node_modules/` (arquivos do framework).
- O arquivo `.env`, que **nunca é aberto**.

## Ferramentas

Todas opcionais, sempre com `npx --yes`, sem instalar nada global, sem alterar o
projeto e **com saída num diretório temporário do sistema, fora do repositório**,
apagado ao final. Se uma ferramenta ou a rede falhar, o item entra em "Não verificado".

| Verificação | Comando |
| --- | --- |
| Renderização Mermaid | `npx --yes @mermaid-js/mermaid-cli@10.9.1 -i <bloco>.mmd -o <saida>.svg` |
| Parser DBML | `npx --yes -p @dbml/cli@3.9.5 dbml2sql <arquivo>.dbml --postgres -o <saida>.sql` (versões mais novas falham com caminhos do Windows) |
| Links | verificação local de links relativos e âncoras |

Script auxiliar é permitido apenas para checagens mecânicas (contagem, cruzamento de
IDs, colunas de tabela). Quem executa a skill deve dizer qual script usou e por quê, e
nunca o apresenta como substituto das verificações abaixo.

## Verificações

### 1. Links e âncoras

- Todo link relativo (`[texto](caminho)`) aponta para arquivo existente, e toda âncora
  (`caminho#secao`) aponta para título existente. Alvo inexistente é **ERRO**.
- Links `https://` não são buscados; apenas conferir sintaxe.
- **Arquivos ignorados pelo Git não contam como link quebrado.** Referência a um deles
  em documento versionado é **AVISO**: a fonte deve ser citada pelo endereço público da
  especificação, `https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html`.

### 2. Estrutura Markdown

- Cada abertura de bloco de código (` ``` `) tem fechamento correspondente (**ERRO**).
  Todo bloco declara a linguagem (`text`, `bash`, `mermaid`, `dbml`...); ausência é AVISO.
- Um único título `#` por documento e nenhum salto de nível (`##` para `####`). AVISO.
- Toda linha de tabela tem o mesmo número de colunas do cabeçalho. **ERRO**.

### 3. Mermaid

- Todo bloco ` ```mermaid ` começa com tipo de diagrama válido (`sequenceDiagram`,
  `flowchart`, `stateDiagram-v2`, `C4Context`...).
- **Nenhuma mensagem contém ponto e vírgula** (quebra a renderização). **ERRO**.
- Participantes declarados antes do uso, sem participante sem mensagem, e nomes iguais
  aos usados no texto.
- Renderizar cada bloco com o mermaid-cli. Diagrama que não renderiza é **ERRO**; se a
  ferramenta não rodar, registrar "renderização não verificada", nunca como aprovado.

### 4. DBML

- Passar o arquivo pelo parser. Erro de sintaxe, tipo, enum ou referência é **ERRO**.
- Sem parser, conferir à mão: chaves balanceadas, todo `Ref` aponta para tabela e coluna
  declaradas, todo tipo é válido, nenhum enum órfão.
- Toda tabela tem nota com o RF, a RN e a decisão que a justificam (AVISO). Escolha além
  do pedido é marcada como tal.
- Toda restrição que o DBML não expressa (exclusão, CHECK entre tabelas, somente
  inserção) está documentada em nota.

### 5. Identificadores e rastreabilidade

Padrões: `RN-xx`, `RF-xx` (RF-01 a RF-14 são os da especificação; extras começam em
RF-15), `RNF-xx`, `CEN-xx`, `ADR-xxx`, `CT-xxx`, `INT-xx`, `BUG-xxx`, `R-xx`,
suposições `S1`, `S2`... e decisões e lacunas `A1`, `B1`, `C1`, `D1`....

- Formato com hífen e zeros à esquerda (`RF-01`, nunca `RF01`). Variante é **ERRO**.
- Cada ID tem **uma definição** no documento dono, sem duplicidade nem lacuna na
  sequência: RN em `regras-negocio.md`, RF em `requisitos-funcionais.md`, decisões e
  lacunas em `perguntas-abertas.md`, suposições em `prd.md`, riscos em `plano-de-teste.md`.
- Todo ID citado existe na sua definição. Citado e inexistente é **ERRO**.
- `RTM.md` tem uma linha por RF e por RN definidos, sem ID inexistente. **ERRO**.
- `ADR-xxx` citado tem arquivo em `docs/adr/`.
- RN sem RF ligado e RF sem RN ligado são listados (AVISO), com justificativa quando o
  requisito é transversal.
- Todo diagrama e toda tabela de cobertura citam RF existentes, e todo RF tem diagrama.

### 6. Fidelidade à especificação

- Quando a cópia local de apoio existir (ignorada pelo Git), comparar o enunciado de
  RF-01 a RF-14 e o texto de RN-01 a RN-08 com a especificação. Desvio de sentido é
  **ERRO**; diferença só de pontuação ou de maiúscula é AVISO.
- Metas, perfis (nome e descrição), estados, entregáveis e estratégia obrigatória de
  qualidade não podem contradizer a especificação.
- Tudo o que vem de decisão da equipe (RN-09 em diante, RF-15 em diante, decisões A a D)
  traz a marca "decisão da equipe" ou o ID da decisão, nunca aparece como se fosse da
  especificação.

### 7. Termos canônicos

Aplicar a convenção de nomes de `docs/prd/regras-negocio.md`: perfis com inicial
maiúscula, estados na grafia da especificação em texto e tabelas, identificadores
técnicos (valores de enum, API, auditoria) em maiúsculas sem acento, motivos e atores
como identificadores. Variação fora da convenção é AVISO; identificador técnico citado
em texto que não exista no DBML é **ERRO**.

### 8. Testabilidade

- Toda RN tem exemplo de aceite e de rejeição com valores concretos e técnica de teste.
- Todo RF tem critério de aceite observável e mensurável. Termo vago ("rápido",
  "adequado", "amigável", "corretamente") sem critério é AVISO.
- Ambiguidade conhecida está registrada como lacuna; regra que depende de lacuna aberta
  declara a dependência.

### 9. README e RTM

- `README.md` tem objetivo, perfis, como subir, como testar, estrutura de pastas igual à
  árvore real (conferir com `ls`), roadmap e links válidos. Seção ainda não preenchida
  está marcada `TODO` com a fase em que será preenchida; seção ausente é **ERRO**.
- `RTM.md` tem o cabeçalho exato `Requisito | Regra | Risco | Cenário | Caso de teste |
  Evidência | Status`, todas as linhas com 7 colunas, risco em toda linha, e nota com o
  critério de requisito crítico.

### 10. Ortografia e forma

- Português do Brasil com acentuação completa. Palavra sem acento em texto corrido
  (fora de identificador técnico, código e URL) é AVISO.
- Marcadores de pendência permitidos: `TODO`, `lacuna`, `suposição`, `pergunta aberta`.
  `TBD`, `XXX` e `???` são AVISO. Todo `TODO` tem motivo.
- Texto sem frase de preenchimento e sem repetição desnecessária entre documentos: regra
  ou decisão copiada deve virar referência à fonte.

### 11. Higiene

- Nenhum segredo, token, senha ou dado pessoal real em documento versionado (padrões de
  chave e token, e-mail pessoal). **ERRO**.
- Nenhum número, prazo, limite, percentual ou SLA sem origem: a afirmação numérica cita a
  especificação ou uma decisão registrada, ou está marcada como suposição com impacto ou
  como exemplo fictício. Violação é AVISO.
- Nenhum arquivo ignorado entra no índice: `git diff --cached --name-only` não contém
  `.env`, `docs/especificacao.md` nem `docs/plano_mestre.md`. **ERRO**.

## Formato do relatório

```text
# Relatório analyze-docs — {data}

Arquivos analisados: N | Ignorados (git): M
Resultado: LIMPO | COM PENDÊNCIAS (E erros, A avisos)

## Erros
- {arquivo}:{linha} [{verificação}] descrição

## Avisos
- {arquivo}:{linha} [{verificação}] descrição

## Não verificado
- {o que não pôde ser checado e por quê}

## Informações
- {contexto, ferramentas usadas, script auxiliar e motivo}
```

O relatório é entregue na resposta; não é gravado no repositório, a menos que o usuário peça.
