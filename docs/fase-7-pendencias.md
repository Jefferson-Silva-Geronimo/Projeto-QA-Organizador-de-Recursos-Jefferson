# Pendências para o fechamento (Fase 7)

Lista viva de tudo o que precisa entrar no fechamento da Fase 7. A Fase 7 **ainda não foi executada**. Quando Jefferson pedir,
este arquivo vira a base do prompt dela.

## Como manter

- Cada item tem **origem** e **arquivo**. Item sem origem rastreável não entra.
- Atualizar a cada pull request, na seção "Histórico de atualizações".
- Quando um item for resolvido, a situação muda para "resolvido", com o PR; o item não é apagado.

| Origem | Significado |
| --- | --- |
| Fato | Está no repositório, no arquivo indicado |
| Decisão | Escolha da equipe, com o ID em [decisoes-equipe.md](decisoes-equipe.md) |
| Lacuna | Ponto sem resposta, a validar com o professor |
| Suposição | Premissa adotada sem resposta, com o impacto registrado |

## 1. Segurança e dívida técnica

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| SEC-03: SBOM e soma de verificação do Maven no wrapper (A03) | Fato | [revisao-seguranca.md](testes/revisao-seguranca.md), tabela de achados; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Aberto, previsto para a Fase 7 |
| SEC-04: alerta de segurança além do log (A09) | Fato | [revisao-seguranca.md](testes/revisao-seguranca.md), tabela de achados; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Aberto, previsto para a Fase 7 |
| Modelo de ameaças formal (OWASP A06, Insecure Design) | Fato | [revisao-seguranca.md](testes/revisao-seguranca.md), seção A06 ("escrever um modelo de ameaças curto na Fase 7, se o grupo achar necessário") | Opcional, a critério de Jefferson |
| R-23: a aplicação usa o papel dono das tabelas, que pode desligar o gatilho da auditoria; separar papéis de migração e de aplicação vai à dívida técnica | Decisão (risco aceito por Jefferson) | [decisoes-equipe.md](decisoes-equipe.md), seção "Resultado da execução de P5-08 e risco aceito R-23"; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 5 | Aberto: declarar no relatório final como dívida técnica |
| Limite de login: pode bloquear a conta de outra pessoa de propósito; tentativas simultâneas podem passar de N por pouco; o e-mail da falha fica guardado durante a janela | Decisão (D18, SEC-01) com limitações conhecidas | [decisoes-equipe.md](decisoes-equipe.md), seção 6; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 5 | Aberto: declarar as limitações no relatório final |
| 22 alertas abertos do Dependabot (npm), todos em manifestos do **framework AIOX** (`.aiox-core/package-lock.json` e `.aiox-core/scripts/diagnostics/health-dashboard/package-lock.json`); nenhum em `frontend/` nem no Maven. Conferido em 18/10/2026 pela API do GitHub. O framework é camada protegida (L1) e não deve ser editado | Fato | GitHub, aba de segurança (Dependabot); [relatório de sessão](relatorio-sessao-fase-6-andamento.md) | Aberto: Jefferson decide se dispensa os alertas como "não se aplica ao produto" ou atualiza o framework pelo canal dele |
| Versões fixadas por incompatibilidade: TypeScript 5.9 (a 7.x conflita com `openapi-typescript` e `typescript-eslint`) e ESLint 9 (`eslint-plugin-jsx-a11y` não aceita a 10) | Fato (verificado na instalação) | [ADR-015](adr/ADR-015-stack-do-front-end.md), seção "Ajustes de versão na etapa 6.B"; `.github/dependabot.yml` | Reavaliar quando os pacotes aceitarem as versões novas |

## 2. Desempenho

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| **RNF-08b não atendido nesta máquina** (criação de reserva com p95 de até 300 ms com 50 usuários). Causa localizada: `fsync` do PostgreSQL em Docker (sem `fsync`, p95 de 87 ms, rodada de diagnóstico que não vale como resultado). Entra no relatório final como **meta não atingida**, com a frase de [resultado-02.md](performance/resultado-02.md): "RNF-08b não atendido nesta máquina; causa atribuída ao `fsync` do PostgreSQL em Docker" | Fato | [resultado-02.md](performance/resultado-02.md), seções de decisão e consequência; [rnf.md](performance/rnf.md), linha RNF-08b | Aberto: escrever no relatório final |
| A hipótese de 300 ms é da Aula 10 e **não foi validada** pelo professor | Lacuna | [resultado-02.md](performance/resultado-02.md); [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Depende do professor |
| Repetir a carga em outra máquina ou em disco rápido, e repetir cada rodada (cada uma foi executada uma vez; a variação é desconhecida) | Fato | [resultado-02.md](performance/resultado-02.md), parágrafo final; [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 4 | Opcional: o projeto não tem outro ambiente |

## 3. Testes e evidência

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| Ocorrência a vigiar: `NotificacaoApiIT.int01ECt103` falhou uma vez em 18/10/2026, sem causa determinada; nenhum teste alterado | Fato | [ocorrencias-a-vigiar.md](testes/ocorrencias-a-vigiar.md) | Aberto: vigiar; se falhar de novo, avisar Jefferson com os logs |
| RF-13 está **parcial** na RTM. A etapa 6.B entregou o mapa de erros, a sessão, o contraste e a navegação; fecham com as telas (6.C) e o teste E2E em viewport de celular (6.D) | Fato | [RTM.md](../RTM.md), linha de RF-13; [navegacao-telas.md](prd/navegacao-telas.md) | Aberto: depende de 6.C e 6.D |
| Tornar o job `e2e` obrigatório na `main` só depois de visto verde em um PR real | Decisão | Combinado com Jefferson em 18/10/2026; o job `frontend` já é obrigatório | Aberto: 6.D |

## 4. Dependem do professor

Nenhuma bloqueia o trabalho: cada uma tem suposição e impacto registrados.

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| Lacunas A1 a A8 da especificação, resolvidas por suposição (S-A1 a S-A8) | Lacuna | [perguntas-professor.md](perguntas-professor.md); [decisoes-equipe.md](decisoes-equipe.md), seção 4 | Sem resposta |
| D1 (tolerância de não comparecimento), D3 (reenvio de notificação), D4 (tamanho da página do relatório), D9 (retenção da auditoria e das notificações), D17 (duração da sessão) | Lacuna | [perguntas-professor.md](perguntas-professor.md); [decisoes-equipe.md](decisoes-equipe.md), seção 4 | Sem resposta |
| Uma equipe de uma pessoa atende à "revisão por pares" da especificação? Hoje: autorrevisão e revisão assistida registrada, sempre chamada de "revisão assistida" | Lacuna, com suposição S-PAR e decisão P5-09 | [perguntas-professor.md](perguntas-professor.md), seção "Revisão por pares"; [decisoes-equipe.md](decisoes-equipe.md) | Sem resposta |

## 5. Ações de Jefferson

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| Revogar o token do SonarCloud que foi colado em uma conversa (já foi substituído no GitHub), se ainda não foi feito | Fato | [relatório da Fase 5](relatorio-sessao-fase-5-fechamento.md), seção 6 | Confirmar com Jefferson |

## 6. Achados da Fase 6 ainda não corrigidos

Achados das etapas 6.C e 6.D que não forem corrigidos na hora entram aqui, com origem e arquivo.

| Item | Origem | Onde está | Situação |
| --- | --- | --- | --- |
| **Limitação declarada:** anel de foco do ícone do calendário nos campos de data e hora é o do navegador (preto no claro, branco no escuro); a cor do sistema não é aplicada pelo Chromium nesse botão interno | Fato (observado no teste em navegador real) | [Campo.module.css](../frontend/src/ui/Campo.module.css), [foco-do-calendario.test.ts](../frontend/src/ui/foco-do-calendario.test.ts) | Aceito pela visibilidade; declarar no relatório de acessibilidade |
| **Limitação declarada:** axe com 24 verificações `color-contrast` incompletas, todas no glifo decorativo do aviso (`aria-hidden`); o par de cores está coberto pelo teste de tokens | Fato | [Aviso.tsx](../frontend/src/ui/Aviso.tsx), [navegacao-telas.md](prd/navegacao-telas.md), seção 9 | Declarar a limitação no relatório de acessibilidade |
| Campo de data e hora nativo: 6 paradas de Tab por campo no teclado (limitação declarada) | Decisão (F6-12) | [decisoes-equipe.md](decisoes-equipe.md); [navegacao-telas.md](prd/navegacao-telas.md), seção 9 | Aceito; declarar no relatório de acessibilidade |
| O roteiro de verificação em navegador real (axe, teclado, capturas) é manual; precisa virar teste E2E na CI | Fato | [roteiro-navegador-real](testes/roteiro-navegador-real/README.md); [RTM.md](../RTM.md), execução E-6 | Aberto: 6.D |
| Salto do `jsdom` 29 para 30: PR #24 do Dependabot fechado sem mesclar e o `jsdom` passou a ser ignorado; avaliar o salto em PR nosso, com a suíte completa do front. O Dependabot não recebe segredos, então o SonarCloud não roda nos PRs dele | Decisão (F6-13) | [decisoes-equipe.md](decisoes-equipe.md); `.github/dependabot.yml` | Aberto: avaliar o salto |

## Histórico de atualizações

| Data | Pull request | O que mudou |
| --- | --- | --- |
| 18/10/2026 | Login em andamento | Alertas do Dependabot (22, todos no framework AIOX) |
| 18/10/2026 | Aprovação do protótipo da 6.C | F6-11 a F6-13 e BUG-010 a BUG-014 (defeitos achados em navegador real); limitações declaradas; jsdom e Dependabot |
| 18/10/2026 | Protótipo da 6.C | Achados da Fase 6 acrescentados: anel do ícone do calendário, verificações incompletas do axe, campo de data e hora, roteiro manual e PR #24 do Dependabot |
| 18/10/2026 | Criação | Arquivo criado com os itens já registrados: SEC-03, SEC-04, A06, R-23, limites do login, versões fixadas, RNF-08b, ocorrência do `NotificacaoApiIT`, RF-13 parcial, pendências do professor e a revogação do token do SonarCloud |
