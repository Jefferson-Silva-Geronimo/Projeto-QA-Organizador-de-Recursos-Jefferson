# ADR-014. Estrutura MVC: controller, service, repository, model e view

| Campo | Valor |
| --- | --- |
| Status | Aceito em 15/10/2026, por determinação do usuário. Substitui a **estrutura de pacotes** do ADR-001 |
| Data | 15/10/2026 |
| Origem | Instrução do usuário na Fase 4: "Faça o projeto em formato MVC, a estrutura deve respeitar esse padrão e as boas práticas" |
| Decisores | Usuário (dono do projeto) e equipe. Nomes: TODO |

## Contexto

O ADR-001 organizou o back end como monólito modular com quatro camadas hexagonais (`api`, `aplicacao`, `dominio`, `infra`) e portas explícitas. A especificação não prescreve padrão de organização, só Java 21 e Spring Boot 3.x (seção 1). Durante a Fase 4, o usuário determinou que o projeto siga o padrão MVC e as boas práticas dele. Isso altera a estrutura de pacotes, não as decisões de comportamento: transação local, constraint de exclusão, auditoria transacional, relógio injetável e demais ADR continuam valendo.

## Requisitos e cenários

RNF-01, RNF-02 (testabilidade e cobertura), RNF-11; ADR-001, ADR-003, ADR-006, ADR-013; CEN-08.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Manter a estrutura hexagonal do ADR-001 | Contraria a instrução explícita do usuário |
| MVC com visão renderizada no servidor (Thymeleaf) | O ADR-010 já decidiu a view como SPA React + Vite, e RF-13 exige interface responsiva, que o front end separado cumpre. Misturar duas views duplicaria telas |
| Camadas só por nome de pasta, sem regra automática | O ADR-001 já mostrou que regra de dependência sem teste se perde. A estrutura MVC ganha regras no `ArquiteturaTest` |

## Decisão

Estrutura de `br.senac.recursos`:

| Camada | Pacote | Papel | Pode depender de |
| --- | --- | --- | --- |
| **Model** | `model`, `model.regra` | Entidades e objetos de valor (`Reserva`, `Recurso`, `Usuario`, `Periodo`), enums e regras puras (máquina de estados, políticas, janela). Sem Spring, sem persistência | `exception` |
| **Controller** | `controller` | Endpoints REST, autorização por perfil e tradução de erros (`@RestControllerAdvice`) | `service`, `dto`, `model`, `exception` |
| **Service** | `service` | Casos de uso, transações, orquestração das regras do model | `repository`, `model`, `exception` |
| **Repository** | `repository` | Contratos de acesso a dados e implementações JDBC com SQL parametrizado (ADR-013) | `model`, `exception` |
| **DTO** | `dto` | Objetos de requisição e de resposta da API, com validação de entrada | `model` |
| **Exception** | `exception` | `ErroDeNegocio` e `CodigoErro` (códigos estáveis, ADR-008) | nenhuma |
| **Config e security** | `config`, `security` | Beans, propriedades, filtro de token e cadeia de segurança | todas |
| **View** | `frontend/` | SPA React + Vite (ADR-010). Consome a API REST dos controllers | API HTTP |

Convenções: sufixos `Controller`, `Service` e `Repository` (padrão do Spring); DTOs terminam em `Requisicao` e `Resposta`; o controller nunca acessa um repository; o service nunca conhece DTO nem controller; o model não conhece nenhuma outra camada.

Correspondência com a estrutura anterior:

| Antes (ADR-001) | Agora (ADR-014) |
| --- | --- |
| `api` | `controller` e `dto` |
| `aplicacao` | `service` |
| `aplicacao.porta` e implementações em `infra` | `repository` |
| `dominio` | `model`, `model.regra` e `exception` |
| `infra` (configuração e segurança) | `config` e `security` |

## Fundamentação

| Argumento | Base |
| --- | --- |
| A estrutura segue a determinação do dono do projeto | Instrução do usuário em 15/10/2026 |
| A view já é a SPA do ADR-010 | ADR-010; RF-13 |
| O model continua sem dependência de Spring e de persistência | ADR-001 (domínio testável sem contexto), especificação seção 5 (unitários isolados) |
| O comportamento não muda | A suíte de 220 testes (112 de unidade e arquitetura, 108 de integração) passou antes e depois da mudança, sem alteração de asserção |
| A estrutura é verificável | Seis regras de camada em `ArquiteturaTest` |

## Consequências

- **Positivas:** estrutura conhecida por quem usa Spring MVC; regra de camada automatizada; DTOs separados do model, sem vazar o model na API.
- **Negativas:** o model deixa de ter a separação "porta e adaptador" explícita; a troca de provedor de notificação (CEN-08) passa a ser feita por interface em `service`, com implementação em `repository` ou `config`, e não por porta nomeada.

## Riscos

Camadas MVC tendem a acumular lógica no service. Mitigado mantendo as regras de negócio no `model.regra`, testadas por testes de unidade sem Spring.

## Evidência necessária

- `ArquiteturaTest` com as seis regras verde.
- Suíte completa verde na nova estrutura (feito no commit da mudança).

## Condição de revisão

Se o front end React for substituído por visão no servidor, ou se o service passar a depender de DTO por conveniência (a regra de arquitetura falhará antes).
