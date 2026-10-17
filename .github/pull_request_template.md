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

**Intervalo mínimo entre abrir e mesclar (proposta, a confirmar por Jefferson):**

- PR que muda código: o merge só ocorre depois de reler o diff com a CI verde e **em outra sessão de trabalho** que
  não a que abriu o PR (por exemplo, no dia seguinte ou depois de uma pausa de pelo menos uma hora).
- PR só de documentação: pode ser mesclado na mesma sessão, depois da releitura e da CI verde.
- Registre aqui quando abriu e quando mesclou: abertura ______ / merge ______
