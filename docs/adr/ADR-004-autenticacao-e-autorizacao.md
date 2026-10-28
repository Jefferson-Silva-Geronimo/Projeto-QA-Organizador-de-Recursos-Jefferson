# ADR-004. Autenticação por token opaco com revogação e autorização por perfil e posse

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026 (aprovação do usuário). D17 segue aberta |
| Data | 15/10/2026 |
| Origem | Decisão inicial 5 da equipe; [arquitetura.md](../arquitetura.md), seções 12, 12.1 e 13.3 |
| Decisores | Equipe (Jefferson Silva Geronimo, única pessoa do projeto), com aprovação do usuário. |

## Contexto

"Falha de autorização" é limitador de nota (especificação, seção "Avaliação"). RF-01 exige autenticação e autorização por perfil. A autorização depende também de posse e estado: ninguém aprova a própria reserva (RN-16), só o Responsável não dono rejeita (RN-33), o cancelamento depende de estado e perfil (RN-18). Alterar perfil e desativar usuário são auditados (RN-29) e devem valer de imediato (D14).

## Requisitos e cenários

RF-01, RF-07, RF-15; RN-06, RN-16, RN-17, RN-18, RN-19, RN-26, RN-33, D13; RNF-06; CEN-02.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Token de curta duração, sem estado no servidor | Exige um prazo de validade sem origem na fonte. A revogação imediata só existe com uma lista no servidor, o que recria o estado que a alternativa quer evitar |
| Sessão com cookie | Acopla a autenticação ao navegador; para uma SPA que consome a API, acrescenta tratamento de CSRF e de origem cruzada sem que a especificação peça |
| Autorização só por anotação no endpoint | Não expressa posse nem estado; a regra de posse se espalharia por serviços e escaparia da matriz de teste |

## Decisão

- **Autenticação:** token opaco com revogação. O servidor guarda só o hash em `sessoes`. Desativar usuário, trocar perfil ou sair revoga a sessão.
- **Autorização em duas camadas:** perfil por endpoint e uma **política única no domínio** que decide por perfil, estado da reserva e dono.
- A duração da sessão é configuração. O valor é a lacuna D17, sem valor.
- **Sem cache de sessão na primeira versão:** a consulta vai ao banco a cada requisição. Cache só entra se a medição de CEN-04 o justificar, porque um cache reabre a janela entre a revogação e o efeito.

## Fundamentação

| Argumento | Base |
| --- | --- |
| A mudança de perfil e a desativação precisam valer na requisição seguinte | RN-29, RF-15, D14; RNF-06 |
| Evita prazo inventado | Regra 3 de [AGENTS.md](../../AGENTS.md); D17 |
| Posse e estado não cabem em regra por endpoint | RN-16, RN-18, RN-19, RN-33, D13 |
| Matriz perfil × operação é a evidência | CEN-02; tática **Authorize Actors** (catálogo, seção 4.5.2) |
| Visibilidade filtrada na consulta | RN-26, B3 |

## Consequências

- **Positivas:** efeito imediato de revogação; regra de posse em um lugar.
- **Negativas:** consulta de sessão a cada requisição (TO-04); tabela nova `sessoes`; dependência do banco para autenticar.

## Riscos

R-21 (degradação do p95 ou cache que mantém token válido após revogação). **Sem requisito na especificação:** limite de tentativas de login (**Lock Computer**) e transporte cifrado (**Encrypt Data**); ficam registrados como lacunas no painel da seção 20 de [arquitetura.md](../arquitetura.md).

## Evidência necessária

- Matriz perfil × operação com 403 em toda combinação proibida.
- Teste: perfil alterado ou usuário desativado, e a requisição seguinte é recusada.
- Medição do custo da consulta de sessão no teste de carga (CEN-04, hipótese).

## Condição de revisão

Violação do p95 atribuível à consulta de sessão, ou exigência do professor de outro mecanismo (por exemplo, login federado).
