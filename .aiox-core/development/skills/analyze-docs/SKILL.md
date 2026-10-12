---
name: analyze-docs
description: >
  Valida a documentação do projeto Organização de Recursos: links relativos, fences,
  Mermaid, DBML, consistência de IDs (RN, RF, RNF, CEN, ADR) com a RTM, estrutura do
  README e ortografia. Entrega um relatório. Nunca edita os documentos analisados.
  Use when: analyze-docs, ao finalizar qualquer criação ou edição de documentação.
user-invocable: true
---

# analyze-docs

Gate de documentação. Executar ao final de toda criação ou edição de documentos.
A skill **só lê e reporta**; correções são feitas fora dela, pelo agente ou pela equipe.

## Escopo

Analisar os arquivos Markdown e DBML **versionados** do repositório: `README.md`,
`RTM.md`, `AGENTS.md`, `docs/**`, `.github/**/*.md`.

**Ignorar:**

- Arquivos ignorados pelo Git (`git check-ignore -v <arquivo>`), em especial os dois
  materiais de apoio listados no `.gitignore` sob "Material de apoio, não versionar".
  Eles não são analisados como origem.
- `.aiox-core/`, `.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.antigravity/`,
  `.grok/`, `.kimi/` e `node_modules/` (arquivos do framework, fora do escopo do projeto).

## Verificações

### 1. Links

- Todo link relativo (`[texto](caminho)` e âncoras `#`) deve apontar para arquivo
  ou seção existente. Link relativo para alvo inexistente é **ERRO**.
- Links `https://` não são buscados; apenas conferir sintaxe.
- **Arquivos ignorados pelo Git não contam como link quebrado.** Uma referência a um
  deles não é erro de link. Em documento versionado ela vira **AVISO**: a fonte deve
  ser citada pelo endereço público da especificação,
  `https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html`,
  e não por caminho local.

### 2. Fences

- Cada abertura de bloco de código (` ``` `) tem fechamento correspondente.
- Todo bloco declara a linguagem (`text`, `bash`, `yaml`, `mermaid`, `dbml`...). Ausência é AVISO.

### 3. Mermaid

- Todo bloco ` ```mermaid ` começa com um tipo de diagrama válido (`sequenceDiagram`,
  `flowchart`, `C4Context`, `stateDiagram-v2`...).
- **Nenhuma mensagem de `sequenceDiagram` contém ponto e vírgula** (quebra a renderização). É ERRO.
- Participantes declarados antes do uso; nomes iguais aos do texto de arquitetura.
- Se `mmdc` (mermaid-cli) estiver disponível, renderizar cada bloco; se não, registrar
  "renderização não verificada" no relatório, nunca como aprovado.

### 4. DBML

- Para `*.dbml`: toda tabela com chaves `{}` balanceadas, todo `Ref` aponta para tabela
  e coluna declaradas, todo tipo é válido.
- Cada tabela referencia o RF ou RN que a justifica (nota ou comentário). Ausência é AVISO.

### 5. Consistência de IDs

Padrões: `RN-xx`, `RF-xx` (RF-01 a RF-14 são os da especificação; extras começam em
RF-15), `RNF-xx`, `CEN-xx`, `ADR-xxx`, `CT-xxx`, `INT-xx`, `BUG-xxx`, `R-xx`.

- Formato com hífen e zeros à esquerda (`RF-01`, nunca `RF01`). Variante é ERRO.
- Todo ID citado em qualquer documento existe na sua definição (documento dono).
- Todo RF e RN definido aparece em `RTM.md`. ID definido e ausente da RTM é ERRO
  (a partir da Fase 1; antes disso a RTM é só cabeçalho e isso é registrado como informação).
- RTM não cita ID inexistente.
- `ADR-xxx` citado tem arquivo em `docs/adr/`.
- RN sem RF ligado e RF sem RN ligado são listados (AVISO).

### 6. Estrutura do README

`README.md` deve ter: objetivo, como subir, como testar. Seção ainda não preenchida
precisa estar marcada `TODO` de forma explícita; seção ausente é ERRO.

### 7. RTM

Cabeçalho exato: `Requisito | Regra | Risco | Cenário | Caso de teste | Evidência | Status`.
Toda linha com o mesmo número de colunas do cabeçalho.

### 8. Ortografia

- Texto em português com acentuação completa (sem "nao", "validacao", "requisito" sem
  til onde aplicável etc.). Palavra sem acento em texto corrido é AVISO.
- Marcadores de pendência permitidos: `TODO`, `lacuna`, `suposição`, `pergunta aberta`.
  `TBD`, `XXX` e `???` são AVISO.

### 9. Higiene

- Nenhum segredo, token, senha ou dado pessoal real em documento versionado
  (padrões: `ghp_`, `sk-`, `SONAR_TOKEN=` com valor, e-mails pessoais). É ERRO.
- Nenhum número, SLA ou volume sem origem: afirmação numérica precisa citar fonte
  ou estar marcada como suposição. Violação é AVISO.

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
- {contexto, por exemplo RTM ainda só com cabeçalho}
```

O gate só é considerado cumprido com **zero erros**. Avisos são levados ao usuário.
O relatório é entregue na resposta; não é gravado no repositório, a menos que o usuário peça.
