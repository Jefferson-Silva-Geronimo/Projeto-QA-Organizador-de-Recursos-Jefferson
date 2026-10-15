# ADR-010. Contrato OpenAPI e front end React + Vite

| Campo | Valor |
| --- | --- |
| Status | Proposto, aguardando aceite da equipe |
| Data | 15/10/2026 |
| Origem | Decisão inicial 9 da equipe; decisão técnica de [prd.md](../prd.md), seção 4.5; [arquitetura.md](../arquitetura.md), seção 12 |
| Decisores | Equipe. Nomes: TODO |

## Contexto

RF-14 aceita "documentação de API ou dos fluxos públicos". RF-13 exige interface responsiva com mensagens de erro compreensíveis. A especificação não exige tecnologia de front end, e as aulas não cobrem front end. A equipe decidiu React + Vite antes da Fase 2 ([prd.md](../prd.md), seção 4.5).

## Requisitos e cenários

RF-13, RF-14; RNF-10; R-15.

## Alternativas consideradas

| Alternativa | A favor | Contra |
| --- | --- | --- |
| Páginas renderizadas no servidor (Thymeleaf) | Menos camadas e menor custo; atende "responsivo" com CSS | Acopla a interface ao back end; contrato de API menos exercitado |
| Angular | Estrutura completa | Custo de aprendizado sem aula e sem requisito |
| Documentar só os fluxos em [fluxos-sequencia.md](../prd/fluxos-sequencia.md) | Atende RF-14 literalmente | Não gera teste de contrato (R-15) |

## Decisão

Contrato OpenAPI desde o primeiro endpoint e front end React + Vite como SPA que consome a API. **Marca:** não há requisito da especificação que distinga React + Vite de Thymeleaf ou Angular, nem que escolha OpenAPI entre as formas de documentar. A base é a decisão anterior da equipe.

## Fundamentação

| Argumento | Base |
| --- | --- |
| Contrato executável alimenta o teste de documentação | RF-14; R-15; teste de contrato em [plano-de-teste.md](../plano-de-teste.md), seção 4.1 |
| Front end separado consome a mesma API que os testes de API | Especificação, seção 5 (API em caixa-preta) |
| Escolha da tecnologia | Decisão da equipe, [prd.md](../prd.md), seção 4.5; **sem requisito correspondente** |

## Consequências

- **Positivas:** contrato único para API, testes e front end.
- **Negativas:** Fase 6 sem aula de apoio; mais um artefato a testar e hospedar.

## Riscos

Prazo da Fase 6 até a semana 46. Divergência entre contrato e comportamento (R-15).

## Evidência necessária

- Teste de contrato entre a API e o documento OpenAPI.
- Teste ponta a ponta em viewport de celular (RNF-10).

## Condição de revisão

Risco de prazo na Fase 6: avaliar renderização no servidor como alternativa.
