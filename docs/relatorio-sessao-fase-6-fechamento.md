# Relatório de sessão: fechamento da Fase 6 (22/10/2026)

Fase 6 do plano mestre (front end React + Vite, de 6.A a 6.D). Todo número vem de execução da CI ou de uma rodada citada.
Meta não atingida consta como não atingida. Estado do repositório: `main` com todos os pull requests da fase mesclados
(o último é o #52) e as branches de fase apagadas. Sucede [relatorio-sessao-fase-6-andamento.md](relatorio-sessao-fase-6-andamento.md).

## 1. Porta de saída da Fase 6 (plano mestre, seção 10)

| Item | Situação | Evidência |
| --- | --- | --- |
| Todo RF de 01 a 14 é acessível pela interface por pelo menos um perfil | **Atingido com uma ressalva que precisa de decisão** | RF-01 a RF-10, RF-12 e RF-13 têm tela (mapa de telas, T01 a T11). **RF-11 (notificação simulada) e RF-14 (documentação) não têm tela:** o primeiro é do sistema para um provedor, e o segundo é o OpenAPI e os fluxos. O mapa de telas aprovado também não traz tela para eles; não inventei uma. Ver seção 5 |
| Cada código de erro estável tem mensagem compreensível testada | **Atingido** | [mensagens.test.ts](../frontend/src/erros/mensagens.test.ts): os 34 códigos da documentação, os mesmos 34 de `CodigoErro.java`, cada um com mensagem e ação; as telas testam as recusas que mostram |
| Os testes E2E passam na CI, incluindo o conflito e o viewport de celular | **Atingido** | Job `e2e`, run `39872935422`: 5 de 5, entre eles CT-162 (conflito) e CT-165 (360 por 640). Relatório e traces publicados como artifact |
| Nenhuma regra de negócio foi duplicada no front end | **Atingido por construção, sem auditoria formal** | O front só mostra ou esconde o que o servidor decide: campos `pode...` (F6-14 a F6-16) e recusas pelo código estável (ADR-004). Sustentado pelos testes de componente (servidor simulado na fronteira) e pelos roteiros em navegador real; **não houve revisão independente**, e recomendo uma revisão assistida na Fase 7 |
| A linha de RF-13 na RTM aponta para testes de componente e E2E com execução | **Atingido** | [RTM.md](../RTM.md), RF-13 `testado`, execuções E-4 a E-22 |

## 2. O que foi feito

| Etapa | Entrega |
| --- | --- |
| 6.A | Mapa de telas, mapa de erros e decisões F6-01 a F6-06 |
| 6.B | Projeto React + TypeScript + Vite, contrato gerado do OpenAPI, camada de erros, sessão, tema e rotas por perfil |
| 6.C | **As onze telas do mapa**, uma por pull request: T01 Login, T02 Busca, T03 Nova reserva, T04 Reservas, T05 Aprovações, T06 Retiradas, T07 Catálogo, T08 Bloqueios, T09 Histórico, T10 Relatórios e T11 Usuários e perfis. Cada uma em TDD (test red e feat green), verificada em navegador real contra a API (axe, teclado, 360 e 1280 px, nos dois temas) e documentada (mapa de telas, CT, evidência de TDD, RTM) |
| Back end de apoio | `podeAlterar`, `podeCancelar`, `podeAprovar`, `podeRejeitar`, `podeIniciar`, `podeConcluir`, `podeMarcarNaoComparecimento`, nomes em vez de números (`registradoPorNome`, `atorNome`), `atual` na movimentação, `GET /api/bloqueios` (F6-06, F6-14 a F6-17) |
| 6.D | `compose.e2e.yaml`, Dockerfiles da API e do front (imagens por digest, sem segredo), cinco testes Playwright, job `e2e` na CI com relatório, traces e logs como artifacts |
| Defeitos achados e corrigidos com regressão | BUG-015 a BUG-018; R-25 mitigado (R-26) e mantido como risco aceito |

## 3. Números desta fase (todos de CI)

| Item | Valor | Origem |
| --- | --- | --- |
| Back end | **657 testes** (226 de unidade e arquitetura, 431 de integração e BDD), 0 falhas | CI do PR #52, run `39872935422` |
| Front end | **910 testes** em 56 arquivos, 0 falhas | mesma run |
| E2E | **5 de 5** | mesma run, job `e2e` |
| Quality Gate do SonarCloud | OK no último PR | API pública do SonarCloud, PR #52 |
| Roteiros em navegador real desta sessão (axe, 0 violações em todos) | T07: 44 estados; T10: 25; T11: 37; T09: 33; T08: 33 | RTM, execuções E-17 a E-21 |

## 4. O que NÃO foi feito, ou ficou limitado

- **R-25** (`NotificacaoApiIT.int01ECt103`, causa desconhecida) segue aberto como risco aceito para o relatório final.
- **RNF-08b** não é atendido (p95 de 568 a 886 ms contra 300 ms, hipótese não validada pelo professor), herdado da Fase 5.
- **O job `e2e` ainda não é obrigatório na `main`.** Os passos estão em [testes/e2e/README.md](testes/e2e/README.md); dependem do "pode" do responsável pelo repositório.
- **E2E só em Chromium**, e a suíte não é repetível no mesmo banco (a CI sempre sobe um novo).
- **Contraste:** o axe deixa verificações `color-contrast` incompletas em diálogos, no aviso e na barra inferior fixa (RTM E-17 a E-21); o contraste dos pares de cores foi medido à mão e coberto por teste de tokens.
- **`BLOQUEIO_COM_RESERVA_EM_USO` e a paginação do relatório** não foram exercidos no navegador (só em teste de componente e integração).
- Faltam no contrato e na interface: reativar recurso e usuário, trocar senha, e `GET /api/bloqueios` devolve `reservasCanceladas` vazio.
- O componente `PaginaDeTela` (marcador de lugar) ficou sem uso, só como padrão de segurança.

## 5. Suposições, lacunas e dúvidas abertas

- **Decisão sua pendente (porta de saída):** ler "RF 01 a 14 acessíveis pela interface" como valendo só para os requisitos que têm interação humana (RF-11 e RF-14 não têm), ou pedir uma tela (por exemplo, uma lista das notificações simuladas e um link para o OpenAPI). Escolhi não inventar tela e registrar a lacuna.
- **Contrato dizia motivo opcional, servidor exige** ao criar e ao levantar bloqueio (`MOTIVO_OBRIGATORIO`): **resolvido pela F6-19** (OpenAPI com `required`, CT-166 e CT-167, cliente regenerado); a tela já pedia o motivo.
- **Mínimo de Responsáveis** só vale na desativação (D14), não na troca de perfil: o Administrador pode deixar o sistema com um Responsável só. Pergunta ao professor em [perguntas-professor.md](perguntas-professor.md).
- Suposições da tela: tamanho de página do relatório = 20 (D4); perfil do cadastro de usuário começa em Solicitante; tabela de 18 ações na grafia da pessoa (T09), que precisa acompanhar ação nova do back end.
- A lista completa e viva está em [fase-7-pendencias.md](fase-7-pendencias.md).

## 6. Ações pendentes

1. **Você decide:** tornar o `e2e` obrigatório na `main` (depois de algumas execuções verdes) e a leitura de RF-11 e RF-14 acima.
2. ~~Marcar o motivo como obrigatório no OpenAPI de bloqueios~~ Feito pela F6-19.
3. Fase 7: relatório final só com números que têm origem, R-25 como risco aceito, RNF-08b não atendido, SEC-03 e SEC-04, dúvidas ao professor, alertas do Dependabot em `.aiox-core/`, token antigo do SonarCloud e ADR-015 citando o plano mestre sem link.
4. Limpeza: `mvnw.cmd` aparece modificado só por fim de linha e não deve ser commitado.

## 7. Próximo passo: Fase 7 (fechamento: RTM, relatório, entrega e prova oral)

Nada novo é construído; qualquer defeito achado volta como defeito, com regressão.
