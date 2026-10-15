# ADR-008. Erros padronizados com códigos estáveis, validação de entrada e consultas parametrizadas

| Campo | Valor |
| --- | --- |
| Status | Proposto, aguardando aceite da equipe |
| Data | 15/10/2026 |
| Origem | Decisões iniciais 7 e 12 da equipe; [arquitetura.md](../arquitetura.md), seção 12 |
| Decisores | Equipe. Nomes: TODO |

## Contexto

RF-13 exige mensagens de erro compreensíveis. A especificação cobra validação de entrada e tratamento seguro de erros (seção 5). O front end e os testes não podem depender do texto da mensagem. As buscas (RF-03) e o relatório (RF-12) são paginados e filtrados.

## Requisitos e cenários

RF-03, RF-12, RF-13; RN-01 a RN-04, RN-18, RN-19, RN-22 a RN-24, RN-33; RNF-07, RNF-10; CEN-09; R-12.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Mensagens livres | Testes e front end presos ao texto; risco de vazar detalhe interno |
| Montagem de consulta por concatenação de texto | Abre injeção de SQL e contraria a validação de entrada exigida |
| Listagens sem paginação | Degradam sob carga; o relatório já é paginado por C5 |

## Decisão

- Resposta de erro no formato Problem Details para APIs HTTP, com um **código estável** por regra recusada e uma mensagem compreensível. Nenhuma pilha, nome de tabela ou segredo na resposta.
- A violação da constraint de exclusão vira 409 com código estável (ADR-003).
- Entrada validada na borda. Consultas parametrizadas e paginadas; tamanho de página é configuração (D4, sem valor).

## Fundamentação

| Argumento | Base |
| --- | --- |
| Código estável desacopla testes e front end do texto | RF-13; regras com recusa ligadas a RF-13 em [requisitos-funcionais.md](../prd/requisitos-funcionais.md) |
| Erro sem vazamento | Especificação, seção 5; RNF-07; CEN-09; **Exception Handling** (catálogo, seção 4.1.2) |
| Validação e consulta segura | Especificação, seção 5 (validação de entrada); RNF-07 |
| Paginação do relatório | C5, RN-31 |

## Consequências

- **Positivas:** contrato de erro previsível; testes negativos objetivos.
- **Negativas:** catálogo de códigos a manter; mensagem compreensível e código estável precisam evoluir juntos.

## Riscos

R-12 (vazamento entre perfis ou de segredo em erro). D4 sem valor.

## Evidência necessária

- Testes negativos por endpoint com entrada inválida.
- Teste que procura detalhe interno em toda resposta de erro.
- Teste de contrato dos códigos contra o contrato da API.

## Condição de revisão

A ferramenta de contrato (ADR-010) impor formato de erro incompatível.
