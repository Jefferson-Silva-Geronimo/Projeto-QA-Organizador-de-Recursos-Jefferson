## Resumo

<!-- O que muda e por quê, em poucas linhas. Ligue a issue: Closes #nn -->

## Requisito atendido

<!-- IDs rastreáveis: RF-xx, RN-xx, RNF-xx, CEN-xx, ADR-xxx. -->

-

## Testes adicionados

<!-- Liste os CT-xxx ou classes de teste. Indique o commit test(red) quando houver TDD. -->

-

## Evidência

<!-- Resultado da CI (ID do run), cobertura, relatório, saída de comando. Sem segredos nem dados pessoais. -->

-

## Itens da RTM atualizados

- [ ] `RTM.md` atualizada (cenário, caso de teste, evidência e status)
- [ ] Documentos alterados passaram pela skill `analyze-docs` sem pendências

## Checklist

- [ ] Nenhum teste foi alterado, desativado ou enfraquecido para passar
- [ ] Nenhum token, senha ou dado pessoal real foi gravado
- [ ] Commits seguem a convenção: `test(red)`, `feat(green)`, `refactor`, `docs`, `ci`

## Autorrevisão (P5-09)

Este projeto é de uma pessoa só, então **não há revisão por pares**. No lugar valem a autorrevisão abaixo, a revisão
assistida registrada no PR e as ferramentas automáticas (SonarCloud e, quando disponível, CodeRabbit). Chame de
"revisão assistida", nunca de "revisão por pares".

- [ ] Reli o diff inteiro na tela do PR, e não só no editor
- [ ] Cada arquivo alterado tem motivo ligado a um requisito, defeito ou decisão
- [ ] Procurei segredos, dados pessoais, `TODO` esquecido e código morto no diff
- [ ] A revisão assistida foi pedida e registrada como comentário no PR, com seus achados tratados
- [ ] O Quality Gate do SonarCloud passou, ou cada apontamento foi corrigido ou justificado por escrito
- [ ] Limitações do que não foi testado estão declaradas

**Intervalo entre abrir e mesclar (decisão de Jefferson, 17/10/2026):**

Não há intervalo mínimo obrigatório. O projeto é de uma pessoa só, com prazos fixos, e uma espera artificial não
cria um segundo revisor: ela só atrasa. Abrir e mesclar na mesma sessão é permitido. O que substitui a revisão por
pares é o conjunto abaixo, e o merge **só ocorre quando todos estiverem cumpridos**:

1. CI verde: o check `test` (e `segredos`) passou no commit que será mesclado.
2. Quality Gate do SonarCloud aprovado, ou cada apontamento corrigido ou justificado por escrito.
3. Autorrevisão preenchida acima, com o diff relido na tela do PR.
4. Revisão assistida registrada como comentário no PR, com os achados tratados.
5. Confirmação explícita de Jefferson para o merge.

Limitação declarada: isto **não é revisão por pares**. Se o professor exigir revisão por outra pessoa, ela entra nos
PRs mais críticos (decisão P5-09).

Registre aqui: abertura ______ / merge ______
