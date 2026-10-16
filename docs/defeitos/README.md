# Processo de defeitos

Processo de registro, triagem e fechamento de defeitos do projeto Organização de Recursos. Base: Aula 05 e exigência de "registro de defeitos encontrados, priorizados e corrigidos" na [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção 7.

## 1. Vocabulário

Os quatro termos são coisas distintas. A correção mira o **defeito**, não o relato.

| Termo | Significado |
| --- | --- |
| Erro humano | Equívoco de uma pessoa ao especificar, projetar ou codificar |
| Defeito | Falha no artefato (documento, modelo, código ou configuração) causada por um erro humano |
| Falha | Comportamento incorreto observado quando o defeito é exercitado |
| Incidente | Ocorrência que afeta a operação e exige resposta, mesmo sem defeito identificado |

## 2. Como relatar

Abra uma issue com o modelo [defeito.md](../../.github/ISSUE_TEMPLATE/defeito.md). Todo relato traz:

- passos mínimos para reproduzir;
- resultado esperado e obtido;
- requisito, regra ou cenário ligado (RF-xx, RN-xx, RNF-xx, CEN-xx);
- evidência sem segredo, token ou dado pessoal real. Use dados fictícios.

## 3. Severidade e prioridade

| Eixo | O que mede | Quem decide | Justificativa |
| --- | --- | --- | --- |
| Severidade | O dano que o defeito causa | Quem triou | Obrigatória |
| Prioridade | A ordem de correção | Equipe, no planejamento | Obrigatória |

| Severidade | Critério |
| --- | --- |
| Crítica | Viola limitador de nota da especificação (aplicação que não executa, pipeline ausente, falha de autorização, possibilidade de dupla reserva) ou expõe segredo |
| Alta | Quebra uma regra crítica (RN-01 a RN-08) ou impede entrega de um requisito crítico |
| Média | Quebra comportamento sem violar regra crítica, com contorno |
| Baixa | Cosmético, texto ou documentação sem efeito no comportamento |

Severidade e prioridade são independentes: um defeito de severidade baixa pode ter prioridade alta se bloqueia uma entrega.

## 4. Ciclo de vida

```text
Novo → Triado → Em correção → Em verificação → Fechado
```

| Estado | Entra quando | Sai quando |
| --- | --- | --- |
| Novo | A issue é aberta com a label `needs-triage` | Severidade, prioridade e requisito são registrados |
| Triado | Há severidade e prioridade justificadas | Alguém assume a correção em branch |
| Em correção | Existe branch ou pull request | O pull request está pronto para verificação |
| Em verificação | O teste de regressão passa na CI | Outra pessoa confirma |
| Fechado | A issue está ligada ao PR, o teste de regressão é identificável e o resultado verde é reproduzível | — |

Três desfechos exigem registro: **duplicado** (aponta a issue original), **não reproduzível** (registra o que foi tentado) e **não será corrigido** (registra o motivo e quem decidiu).

## 5. Fechamento

Um defeito só fecha com:

1. issue ligada ao pull request da correção;
2. teste de regressão identificável (CT-xxx ou classe de teste), escrito antes da correção quando a técnica for TDD;
3. resultado verde reproduzível na CI, com o ID do run.

Teste que falha **não** é alterado, desativado nem enfraquecido para passar: ele é confrontado com a regra na fonte.

## 6. Métricas

| Permitida | Observação |
| --- | --- |
| Tempo de ciclo por severidade | Da abertura ao fechamento |
| Taxa de reabertura | Defeitos reabertos sobre fechados |
| Defeitos escapados por etapa | Etapa em que nasceu contra etapa em que foi encontrado |

**Proibida:** quantidade de defeitos por pessoa. Ela incentiva esconder defeito e não mede qualidade.

## 7. Labels

Criadas no repositório com `gh label create` (o `--force` atualiza a label se já existir):

```bash
gh label create bug --color d73a4a --description "Defeito confirmado" --force
gh label create needs-triage --color fbca04 --description "Aguardando severidade, prioridade e requisito" --force
gh label create severidade-critica --color b60205 --description "Viola limitador de nota ou expõe segredo" --force
gh label create severidade-alta --color d93f0b --description "Quebra regra ou requisito crítico" --force
gh label create severidade-media --color fbca04 --description "Quebra comportamento com contorno" --force
gh label create severidade-baixa --color 0e8a16 --description "Cosmético, texto ou documentação" --force
gh label create regressao --color 5319e7 --description "Defeito que voltou depois de corrigido" --force
```

## 8. Índice

Registra apenas defeitos **reais** encontrados até aqui. A coluna Issue ou PR fica com travessão quando o defeito foi achado e corrigido antes de existir este processo; a partir de agora todo defeito nasce numa issue.

| BUG | Defeito | Issue ou PR | Severidade | Prioridade | Estado | Correção | Teste de regressão |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | Relações um-para-um do DBML geravam a chave estrangeira no sentido invertido (`recursos.id` referenciando `salas`). Achado ao aplicar o esquema em PostgreSQL | — | Alta: modelo inviável para RN-02 | Alta: bloqueava o modelo | Fechado | `8bf9d40` | Parser `@dbml/cli` e esquema aplicado, com as 23 chaves estrangeiras conferidas |
| BUG-002 | Diagrama de cancelamento permitia ao Responsável cancelar SOLICITADA de outro usuário, contra RN-18 | — | Média: diagrama contradiz regra | Média | Fechado | `4a78280` | Cobertura RF → diagrama e conferência de [fluxos-sequencia.md](../prd/fluxos-sequencia.md) contra RN-18 |
| BUG-003 | Dado fictício contraditório: Professor 1 era "sem vínculo" na tabela de dados e aparecia vinculado a um Solicitante no exemplo de RN-13 | — | Baixa: exemplo de documentação | Baixa | Fechado | `5034b76` | Conferência dos exemplos de [regras-negocio.md](../prd/regras-negocio.md) |
| BUG-004 | Brecha em C1: alteração que incluía recurso restrito numa reserva aprovada automaticamente contornava RN-06 | — | Crítica: contorna aprovação obrigatória | Alta | Fechado | `d843f34` (decisão D12) | CEN-11 em [ciclo-00.md](../avaliacao-arquitetural/ciclo-00.md), a executar na Fase 4 |
| BUG-005 | Diagrama de componentes sem aresta do agendador para a auditoria e a persistência, divergindo do texto da seção 13.7 | — | Baixa: diagrama incompleto | Baixa | Fechado | `beb9fa1` | Diagrama renderizado de novo e revisão pelo facilitador ATAM |
| BUG-006 | `mvnw` commitado sem permissão de execução no Windows. A CI falhou com exit 126 | [PR 1](https://github.com/Jefferson-Silva-Geronimo/Projeto-QA-Organizador-de-Recursos-Jefferson/pull/1) | Alta: pipeline não executa o build | Alta: bloqueia toda a CI | Fechado | `af89f13` | Run da CI `38786037634` verde, que executa `./mvnw -B verify` |
| BUG-007 | Impasse do PostgreSQL (`deadlock detected`, SQLState 40P01) quando duas transações inserem ocupações sobrepostas ao mesmo tempo. A aplicação respondia com erro interno em vez de 409. Achado pelo teste de concorrência CT-064 (risco R-17 materializado) | — | Alta: viola o tratamento seguro de erros e a resposta de RF-06 | Alta | Fechado | `eb7f5b1` | CT-064 em `ConcorrenciaApiIT`, vermelho em `test(red)` e verde em `fix(green)` |
| BUG-008 | A validação do corpo da requisição rodava antes da autorização por perfil: um perfil sem permissão recebia 400 em vez de 403 e via as regras de validação. Achado pela matriz perfil × operação (CT-117, 18 casos) | — | Alta: falha de autorização é limitador de nota (especificação, seção 8) | Alta | Fechado | `73488e5` | CT-117 em `AutorizacaoApiIT`, 137 casos, vermelho em `test(red)` e verde em `fix(green)` |

Observações:

- BUG-006 é o único defeito achado pela CI. Run vermelho `38785819928`, run verde `38786037634`.
- BUG-007 é o primeiro defeito achado por teste de concorrência na Fase 4. A causa está no comportamento da constraint de exclusão: cada transação insere a entrada do índice antes de verificar o conflito e, se cada uma encontra a outra em andamento, o banco derruba uma por impasse. ADR-003 já previa o tratamento; faltava implementá-lo.
- Um número sem origem em ADR-008 (contagem de regras ligadas a RF-13) foi apontado na revisão e corrigido **antes** do commit, por isso não entra no índice.
- Defeitos escapados por etapa: BUG-001 a BUG-005 nasceram em documentação e foram achados em revisão; BUG-006 nasceu na casca do projeto e foi achado na CI.
