# Ocorrências a vigiar

Falhas observadas que ainda não têm causa determinada. Nenhum teste é alterado, desativado ou enfraquecido por causa delas.
Se uma voltar a falhar, a conduta é avisar Jefferson antes de qualquer ação, com os logs.

| # | Teste | Quando | Contexto | Situação |
| --- | --- | --- | --- | --- |
| 1 | `NotificacaoApiIT.int01ECt103_resposta200MarcaEnviadaECorpoTemSoOContratoMinimo` | 18/10/2026 | Primeira execução completa de `./mvnw -B clean verify` na branch `fase-6/backend-front`, depois das mudanças F6-06 (nenhuma delas toca notificação). 1 falha entre 361 testes de integração, na asserção da linha 164 (`expected: 2`: o número de notificações enviadas por `despachar()` não foi 2; o valor obtido não foi registrado). | A classe rodada sozinha passou (10 de 10). A execução completa seguinte passou inteira (154 de unidade e 361 de integração). O check `test` dos PRs #21, #22 e #23 passou. **Causa não determinada.** Hipótese não verificada: dependência de tempo ou de ordem no despacho |

Regra de registro: cada nova ocorrência entra com data, contexto e o resultado de repetir o teste sozinho e a suíte inteira.
