# Requisitos funcionais

Fonte dos requisitos RF-01 a RF-14: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html), seção "Requisitos funcionais obrigatórios". Este documento contém **somente requisitos funcionais**. Requisitos não funcionais (desempenho, segurança de transporte, cobertura e similares) ficam para a Fase 2.

As regras estão em [regras-negocio.md](regras-negocio.md) (RN-01 a RN-08 da especificação; RN-09 em diante, decisões da equipe). As decisões A a D e as lacunas estão em [perguntas-abertas.md](perguntas-abertas.md). As jornadas estão nas personas em [personas/](personas/).

## Como ler

| Item | Significado |
| --- | --- |
| RF-01 a RF-14 | Requisitos obrigatórios da especificação, com numeração e enunciado fiéis |
| RF-15 e RF-16 | **Acréscimo da equipe**, incluído porque uma jornada ficou sem requisito, com justificativa |
| Critério de aceite | Observável e mensurável: resultado esperado, contagem ou código de resposta. Nenhum limite de tempo, volume ou cobertura é definido aqui |

## 1. Resumo

| ID | Requisito | Persona principal | Origem |
| --- | --- | --- | --- |
| RF-01 | Autenticação e autorização por perfil | Todas as personas | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-02 | Cadastro e consulta de salas, professores e materiais | Administrador | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-03 | Pesquisa por tipo, capacidade, localização, competência e disponibilidade | Solicitante | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-04 | Criação, alteração e cancelamento de reservas | Solicitante | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-05 | Detecção de sobreposição de horários, inclusive na agenda do professor | Solicitante | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-06 | Proteção contra dupla reserva em solicitações simultâneas | Solicitante | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-07 | Aprovação obrigatória para recursos restritos | Responsável | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-08 | Bloqueio de recursos em manutenção | Administrador | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-09 | Registro de retirada e devolução de materiais e equipamentos | Responsável | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-10 | Histórico auditável de mudanças | Responsável e Administrador | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-11 | Notificação simulada ou integração com API externa | Sistema | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-12 | Relatório de utilização por recurso, carga horária alocada e conflitos evitados | Responsável e Administrador (somente leitura) | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-13 | Interface responsiva e mensagens de erro compreensíveis | Todas as personas | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-14 | Documentação de API ou dos fluxos públicos do sistema | Equipe | Especificação, seção "Requisitos funcionais obrigatórios" |
| RF-15 | Gestão de usuários e perfis | Administrador | Acréscimo da equipe |
| RF-16 | Ciclo de vida de uso da reserva | Responsável | Acréscimo da equipe |

## 2. Requisitos

### RF-01. Autenticação e autorização por perfil

- **Enunciado:** Autenticação e autorização por perfil.
- **Persona principal:** Todas as personas
- **Demais personas:** —
- **Jornada que o atende:** Passo 1 das jornadas do [Solicitante](personas/solicitante.md), do [Responsável](personas/responsavel.md) e do [Administrador](personas/administrador.md); fluxos de erro de token expirado e de acesso negado
- **Regras ligadas:** RN-06, RN-17, RN-26
- **Decisões ligadas:** A4, B1, B2, B3, C4, C8, D5
- **Critérios de aceite:**
  1. Credenciais válidas abrem uma sessão com exatamente um perfil; credenciais inválidas retornam 401 e não criam sessão.
  2. Requisição sem token ou com token expirado retorna 401 e não grava nada.
  3. Para cada par perfil × operação previsto nas personas, a operação não permitida retorna 403 e produz 0 mudanças de estado.
  4. O Solicitante só lê as próprias reservas: a leitura de reserva de outro usuário é recusada e retorna 0 dados dela.
  5. O Administrador não cria nem aprova reserva (403) e o Responsável não aprova a própria reserva (403).

### RF-02. Cadastro e consulta de salas, professores e materiais

- **Enunciado:** Cadastro e consulta de salas, professores e materiais.
- **Persona principal:** Administrador
- **Demais personas:** Solicitante e Responsável (consulta)
- **Jornada que o atende:** Passos 2 a 5 da jornada do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-10, RN-12, RN-13, RN-14, RN-29, RN-32
- **Decisões ligadas:** A1, A3, A4, A6, C5, C7, D6
- **Critérios de aceite:**
  1. Sala só é gravada com capacidade, localização, hora de abertura, hora de fechamento e ao menos um dia de funcionamento; sem qualquer um, retorna erro de validação.
  2. Material só é gravado com código de patrimônio, e um código já existente é recusado.
  3. Professor pode ser cadastrado sem usuário; o vínculo, quando existe, não altera o perfil do usuário.
  4. Alterar o atributo "restrito" altera 0 reservas existentes.
  5. Desativar recurso com reservas futuras SOLICITADA, APROVADA ou EM_USO retorna 409 com a lista e não muda nada; sem elas, o recurso é desativado e não aparece em novas buscas.
  6. Cada criação, alteração e desativação gera exatamente 1 evento de auditoria.
  7. Todo recurso cadastrado aparece na consulta com os atributos informados.

### RF-03. Pesquisa por tipo, capacidade, localização, competência e disponibilidade

- **Enunciado:** Pesquisa por tipo, capacidade, localização, competência e disponibilidade.
- **Persona principal:** Solicitante
- **Demais personas:** Responsável
- **Jornada que o atende:** Passo 2 da jornada do [Solicitante](personas/solicitante.md)
- **Regras ligadas:** RN-02, RN-04, RN-11, RN-14, RN-15, RN-26
- **Decisões ligadas:** A2, A3, A6, B3, C5
- **Critérios de aceite:**
  1. Para cada filtro aplicado (tipo, capacidade, localização, competência, disponibilidade), 0 resultados que não o satisfaçam.
  2. Com intervalo informado, devolve apenas recursos sem ocupação sobreposta segundo [início, fim): recurso cuja reserva termina no instante em que o intervalo começa é devolvido.
  3. Recurso em bloqueio de manutenção que cobre o intervalo não é devolvido como disponível.
  4. Sala só é devolvida se o intervalo cabe na janela e cai em dia de funcionamento.
  5. A resposta de disponibilidade a um Solicitante contém 0 identificações de donos de reservas.
  6. Recurso desativado não é devolvido.

### RF-04. Criação, alteração e cancelamento de reservas

- **Enunciado:** Criação, alteração e cancelamento de reservas.
- **Persona principal:** Solicitante
- **Demais personas:** Responsável (também cria) e Administrador (cancela com motivo)
- **Jornada que o atende:** Passos 3 a 7 da jornada do [Solicitante](personas/solicitante.md); passos 10 e "Criar reservas próprias" do [Responsável](personas/responsavel.md); passo 9 do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-01, RN-02, RN-04, RN-05, RN-07, RN-09, RN-10, RN-11, RN-13, RN-14, RN-15, RN-17, RN-18, RN-19, RN-26, RN-27
- **Decisões ligadas:** A1, A2, A6, A8, B1, B2, C1, C8, Regra geral (nenhuma exclusão física)
- **Critérios de aceite:**
  1. Reserva válida é criada em SOLICITADA e, sem recurso restrito, passa a APROVADA com ator SISTEMA, gerando 1 evento de auditoria por transição.
  2. Término igual ou anterior ao início é recusado e 0 reservas são gravadas.
  3. Alteração de período ou de recurso com conflito retorna 409 e a reserva e suas ocupações permanecem idênticas.
  4. Alteração de período ou de recurso em reserva que exigia aprovação a devolve a SOLICITADA; alteração só de título ou descrição mantém o estado.
  5. O cancelamento segue a matriz estado × perfil de RN-18: 0 cancelamentos de reservas EM_USO ou em estado terminal.
  6. Após qualquer cancelamento a reserva continua consultável, com estado e motivo; 0 reservas removidas fisicamente.
  7. Cada reserva guarda o valor de "exige aprovação" calculado pelo servidor no momento da criação.

### RF-05. Detecção de sobreposição de horários, inclusive na agenda do professor

- **Enunciado:** Detecção de sobreposição de horários, inclusive na agenda do professor.
- **Persona principal:** Solicitante
- **Demais personas:** Responsável (validação de docentes)
- **Jornada que o atende:** Passo 3 e fluxo "professor ocupado" da jornada do [Solicitante](personas/solicitante.md); passo 3 do [Responsável](personas/responsavel.md)
- **Regras ligadas:** RN-02, RN-11, RN-13, RN-30
- **Decisões ligadas:** A2, A4, B4, C8
- **Critérios de aceite:**
  1. Reserva de professor sobreposta a outra do mesmo professor, em qualquer sala, retorna 409 com código estável e não grava.
  2. Fronteira [início, fim): fim às 16:00 e início às 16:00 não conflitam; um instante de sobreposição conflita.
  3. Os mesmos casos de limite valem para sala, professor e material.
  4. Cada recusa por sobreposição gera exatamente 1 tentativa de conflito registrada.
  5. A agenda de professor sem usuário vinculado e a de professor vinculado alocado por ele mesmo usam a mesma regra.

### RF-06. Proteção contra dupla reserva em solicitações simultâneas

- **Enunciado:** Proteção contra dupla reserva em solicitações simultâneas.
- **Persona principal:** Solicitante
- **Demais personas:** Responsável
- **Jornada que o atende:** Fluxo "pedido simultâneo perdedor" da jornada do [Solicitante](personas/solicitante.md)
- **Regras ligadas:** RN-03, RN-30
- **Decisões ligadas:** A2, B4
- **Critérios de aceite:**
  1. Dadas N solicitações simultâneas (N ≥ 2) para o mesmo recurso e intervalos sobrepostos, exatamente 1 é aceita e N−1 retornam 409.
  2. Ao fim, existe exatamente 1 ocupação ativa para o recurso e o intervalo.
  3. Cada solicitação recusada gera 1 tentativa de conflito com motivo RN-03.
  4. O resultado se repete em execuções sucessivas do mesmo cenário: 0 ocorrências de duas reservas ativas sobrepostas.

### RF-07. Aprovação obrigatória para recursos restritos

- **Enunciado:** Aprovação obrigatória para recursos restritos.
- **Persona principal:** Responsável
- **Demais personas:** Solicitante (pede) e Administrador (define o atributo "restrito")
- **Jornada que o atende:** Passos 2 a 4a da jornada do [Responsável](personas/responsavel.md); passos 4 e 8 do [Solicitante](personas/solicitante.md)
- **Regras ligadas:** RN-05, RN-06, RN-09, RN-10, RN-16, RN-24, RN-25, RN-33
- **Decisões ligadas:** A1, B1, C2, D8
- **Critérios de aceite:**
  1. Reserva com ao menos um recurso restrito entra em SOLICITADA e só vai a APROVADA por decisão de Responsável que não é o dono.
  2. Aprovação pelo dono, por Solicitante ou por Administrador retorna 403 e deixa o estado inalterado.
  3. Rejeição exige motivo: sem motivo retorna erro de validação e a reserva permanece SOLICITADA; rejeição pelo dono, por Solicitante ou por Administrador retorna 403.
  4. Reserva sem recurso restrito aparece 0 vezes na fila de aprovações.
  5. Mudar o atributo "restrito" depois da criação altera 0 valores de "exige aprovação" em reservas existentes.
  6. Reserva SOLICITADA cujo início chega sem decisão passa a cancelada com motivo SEM_DECISAO e ator SISTEMA (suposição S6, a validar).
  7. Cada decisão gera exatamente 1 evento de auditoria com o ator.

### RF-08. Bloqueio de recursos em manutenção

- **Enunciado:** Bloqueio de recursos em manutenção.
- **Persona principal:** Administrador
- **Demais personas:** Solicitante (afetado)
- **Jornada que o atende:** Passos 7 e 8 da jornada do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-04, RN-07, RN-11, RN-22
- **Decisões ligadas:** A2, A7, D7
- **Critérios de aceite:**
  1. Criar bloqueio sobre período com reservas retorna 409 listando as reservas SOLICITADA e APROVADA conflitantes e não grava o bloqueio.
  2. Após a confirmação, o bloqueio é gravado e cada reserva listada vai a cancelada por inteiro com motivo MANUTENCAO, com 1 evento de auditoria e 1 notificação por reserva.
  3. Com reserva EM_USO no período, o bloqueio é recusado, nada muda e não existe opção de forçar.
  4. Depois do bloqueio, nova reserva do recurso no período é recusada, e reserva encostada na borda, sem sobreposição, é aceita.
  5. Reserva com vários recursos é cancelada por inteiro e os demais recursos dela voltam a ficar livres.

### RF-09. Registro de retirada e devolução de materiais e equipamentos

- **Enunciado:** Registro de retirada e devolução de materiais e equipamentos.
- **Persona principal:** Responsável
- **Demais personas:** Solicitante (quem usa o material)
- **Jornada que o atende:** Passos 5 a 8 da jornada do [Responsável](personas/responsavel.md)
- **Regras ligadas:** RN-05, RN-12, RN-20, RN-23
- **Decisões ligadas:** A3, A8, C3
- **Critérios de aceite:**
  1. Retirada e devolução ficam registradas por unidade, com quem registrou e quando.
  2. O registro da primeira retirada leva a reserva de APROVADA a EM_USO.
  3. Devolução de unidade não retirada é recusada.
  4. Conclusão com material retirado e não devolvido é recusada com a lista das unidades pendentes; com todo material retirado devolvido, ou nenhum retirado, é aceita.
  5. Cada retirada e devolução é consultável no histórico (RF-10).

### RF-10. Histórico auditável de mudanças

- **Enunciado:** Histórico auditável de mudanças.
- **Persona principal:** Responsável e Administrador
- **Demais personas:** —
- **Jornada que o atende:** Passo 11 da jornada do [Responsável](personas/responsavel.md); passo 10 da jornada do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-08, RN-26, RN-27, RN-29
- **Decisões ligadas:** B3, C4, C7
- **Critérios de aceite:**
  1. Toda mudança de estado de reserva gera exatamente 1 evento com estado anterior, estado novo, ator (inclusive SISTEMA), instante e motivo quando houver.
  2. Criação, alteração e desativação de recursos, usuários, perfis e bloqueios geram 1 evento com ator, entidade, antes e depois.
  3. Não existe operação de alteração ou exclusão de eventos de auditoria.
  4. O Responsável consulta o histórico das reservas e recebe 403 ao abrir a auditoria de cadastros, usuários e perfis; o Administrador acessa toda a auditoria.
  5. Reserva cancelada, rejeitada ou encerrada mantém o histórico consultável.

### RF-11. Notificação simulada ou integração com API externa

- **Enunciado:** Notificação simulada ou integração com API externa.
- **Persona principal:** Sistema
- **Demais personas:** Solicitante e Responsável (destinatários)
- **Jornada que o atende:** Passos 4 e 8 da jornada do [Solicitante](personas/solicitante.md); passos 2 e 4 da jornada do [Responsável](personas/responsavel.md)
- **Regras ligadas:** RN-28
- **Decisões ligadas:** A5, C6, S5, S7
- **Critérios de aceite:**
  1. Os eventos de solicitação pendente, reserva aprovada, rejeitada e cancelada geram 1 notificação por destinatário: Responsáveis para pendente e Solicitante para os demais.
  2. O corpo da notificação contém tipo do evento, id da reserva, id do destinatário, instante e chave de idempotência, sem dados pessoais além do necessário.
  3. O envio ocorre após o commit, e falha do provedor (500, 404 ou lentidão) desfaz 0 reservas.
  4. A falha mantém a notificação em PENDENTE ou FALHA, com o número de tentativas registrado, e o reenvio usa a mesma chave de idempotência.
  5. O endereço do provedor vem de configuração e o repositório contém 0 segredos.

### RF-12. Relatório de utilização por recurso, carga horária alocada e conflitos evitados

- **Enunciado:** Relatório de utilização por recurso, carga horária alocada e conflitos evitados.
- **Persona principal:** Responsável e Administrador (somente leitura)
- **Demais personas:** —
- **Jornada que o atende:** Passo 12 da jornada do [Responsável](personas/responsavel.md); passo 11 da jornada do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-02, RN-03, RN-04, RN-15, RN-26, RN-30, RN-31
- **Decisões ligadas:** B4, C4, C5, D5, D4 (aberta)
- **Critérios de aceite:**
  1. Carga horária alocada é a soma das durações das ocupações de reservas APROVADA, EM_USO e CONCLUÍDA, só a parte interna do período; reservas SOLICITADA e encerradas sem uso não contam. O valor confere com o banco em dados semeados.
  2. Utilização é horas alocadas dividido pelas horas de funcionamento nos dias de funcionamento do período, apenas para salas.
  3. Conflitos evitados são as tentativas recusadas por RN-02, RN-03 ou RN-04, com contagem total e distinta por solicitante, recurso e período.
  4. Os filtros por período, tipo de recurso e recurso restringem o resultado; o relatório é paginado (tamanho em aberto, D4).
  5. O Administrador só lê; o Solicitante recebe 403 (suposição, ver D5).

### RF-13. Interface responsiva e mensagens de erro compreensíveis

- **Enunciado:** Interface responsiva e mensagens de erro compreensíveis.
- **Persona principal:** Todas as personas
- **Demais personas:** —
- **Jornada que o atende:** Fluxos alternativos e de erro das jornadas do [Solicitante](personas/solicitante.md), do [Responsável](personas/responsavel.md) e do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-01, RN-02, RN-03, RN-04, RN-14, RN-18, RN-19, RN-22, RN-23, RN-24, RN-33
- **Decisões ligadas:** B3, C2
- **Critérios de aceite:**
  1. Toda recusa por regra devolve código estável e mensagem que indica o motivo (sobreposição, manutenção, fora da janela, estado inválido, motivo ausente), verificado por regra.
  2. Nenhuma mensagem de erro identifica terceiros (B3).
  3. As telas de busca, criação de reserva e aprovação são operáveis em viewport de celular (verificado em 360×640; CT-165, E2E).
  4. Sessão expirada leva ao login sem gravar dados.

### RF-14. Documentação de API ou dos fluxos públicos do sistema

- **Enunciado:** Documentação de API ou dos fluxos públicos do sistema.
- **Persona principal:** Equipe
- **Demais personas:** Consumidores da API
- **Jornada que o atende:** Não se aplica a uma persona; transversal às jornadas
- **Regras ligadas:** nenhuma específica; requisito transversal
- **Decisões ligadas:** B3
- **Critérios de aceite:**
  1. Toda operação pública está documentada com perfis permitidos, parâmetros, respostas de sucesso e códigos de erro.
  2. O contrato publicado corresponde ao comportamento: 0 divergências em teste de contrato.
  3. Os fluxos de sequência documentados cobrem todos os RF (ver fluxos-sequencia.md).
  4. A documentação contém 0 segredos.

### RF-15. Gestão de usuários e perfis

**Acréscimo da equipe.** O passo 6 da jornada do Administrador não tinha requisito: RF-01 trata de autenticação e autorização e RF-02 de salas, professores e materiais. A especificação atribui ao Administrador o gerenciamento de usuários (seção "Escopo e perfis") sem um RF correspondente.

- **Enunciado:** O Administrador cria, altera e desativa usuários e atribui um único perfil a cada um.
- **Persona principal:** Administrador
- **Demais personas:** —
- **Jornada que o atende:** Passo 6 da jornada do [Administrador](personas/administrador.md)
- **Regras ligadas:** RN-13, RN-17, RN-29
- **Decisões ligadas:** A4, B1, B2, C7, C8
- **Critérios de aceite:**
  1. Usuário é criado com exatamente um perfil, e atribuir um segundo perfil é recusado.
  2. O vínculo entre professor e usuário é opcional e não altera o perfil.
  3. Criação, alteração e desativação de usuário e troca de perfil geram 1 evento de auditoria cada.
  4. Somente o Administrador executa essas operações; os demais perfis recebem 403.
  5. É possível cadastrar dois ou mais usuários com perfil Responsável.

### RF-16. Ciclo de vida de uso da reserva

**Acréscimo da equipe.** Os passos 5, 8 e 9 da jornada do Responsável não tinham requisito: RF-09 trata apenas de retirada e devolução de material, e reservas sem material não tinham como entrar em uso, ser concluídas ou ser marcadas como não compareceu.

- **Enunciado:** O Responsável registra o início de uso, conclui e marca o não comparecimento de reservas, e o sistema encerra automaticamente reservas SOLICITADA sem decisão.
- **Persona principal:** Responsável
- **Demais personas:** Sistema
- **Jornada que o atende:** Passos 5, 8 e 9 da jornada do [Responsável](personas/responsavel.md)
- **Regras ligadas:** RN-05, RN-08, RN-18, RN-20, RN-21, RN-23, RN-25
- **Decisões ligadas:** A8, C2, C3, D1, D2
- **Critérios de aceite:**
  1. Registrar o início de uso em reserva APROVADA a leva a EM_USO; em qualquer outro estado é recusado.
  2. Concluir só é aceito a partir de EM_USO e com a regra de devolução cumprida; caso contrário é recusado.
  3. Marcar não compareceu só é aceito em reserva APROVADA após o início mais a tolerância; antes da tolerância é recusado. O valor da tolerância é configuração, hoje sem valor definido (D1).
  4. Reserva SOLICITADA sem decisão ao chegar o início vai a cancelada com motivo SEM_DECISAO; o mecanismo é o job agendado de D2.
  5. Toda transição proibida da seção 3.2 de regras-negocio.md retorna recusa e não altera o estado.
  6. Cada transição gera exatamente 1 evento de auditoria.

## 3. Cobertura das jornadas

Todo passo das jornadas das três personas tem ao menos um requisito. Os passos sem requisito geraram RF-15 e RF-16.

| Persona | Passo da jornada | RF |
| --- | --- | --- |
| Solicitante | 1 Login | RF-01 |
| Solicitante | 2 Busca | RF-03 |
| Solicitante | 3 Nova reserva | RF-04, RF-05 |
| Solicitante | 4 Confirmação e aprovação automática | RF-04, RF-06, RF-07, RF-11 |
| Solicitante | 5 Minhas reservas | RF-04 |
| Solicitante | 6 Alteração | RF-04 |
| Solicitante | 7 Cancelamento | RF-04 |
| Solicitante | 8 Notificação | RF-11 |
| Responsável | 1 Login | RF-01 |
| Responsável | 2 Fila de aprovações | RF-07 |
| Responsável | 3 Validação de docentes | RF-05, RF-07 |
| Responsável | 4 e 4a Aprovação e rejeição | RF-07 |
| Responsável | 5 Início de uso ou retirada | RF-09, RF-16 |
| Responsável | 6 Retirada | RF-09 |
| Responsável | 7 Devolução | RF-09 |
| Responsável | 8 Conclusão | RF-09, RF-16 |
| Responsável | 9 Não compareceu | RF-16 |
| Responsável | 10 Cancelar com motivo | RF-04 |
| Responsável | 11 Histórico | RF-10 |
| Responsável | 12 Relatório | RF-12 |
| Responsável | Criar reservas próprias | RF-04, RF-07 |
| Administrador | 1 Login | RF-01 |
| Administrador | 2 a 5 Cadastros e atributo restrito | RF-02 |
| Administrador | 6 Usuários e perfis | RF-15 |
| Administrador | 7 e 8 Bloqueio de manutenção | RF-08 |
| Administrador | 9 Cancelar reserva | RF-04 |
| Administrador | 10 Auditoria | RF-10 |
| Administrador | 11 Relatório | RF-12 |

## 4. Matriz de rastreabilidade RN para RF

| RN | Regra | Origem | RF |
| --- | --- | --- | --- |
| RN-01 | Término posterior ao início | Especificação | RF-04, RF-13 |
| RN-02 | Sem sobreposição do mesmo recurso | Especificação | RF-03, RF-04, RF-05, RF-12, RF-13 |
| RN-03 | Simultâneas geram uma reserva aceita | Especificação | RF-06, RF-12, RF-13 |
| RN-04 | Recurso em manutenção não é reservável | Especificação | RF-03, RF-04, RF-08, RF-12, RF-13 |
| RN-05 | Estados da reserva | Especificação | RF-04, RF-07, RF-09, RF-16 |
| RN-06 | Só responsáveis aprovam restritos | Especificação | RF-01, RF-07 |
| RN-07 | Reserva iniciada não é apagada | Especificação | RF-04, RF-08 |
| RN-08 | Mudança de estado gera auditoria | Especificação | RF-10, RF-16 |
| RN-09 | Aprovação automática sem restrito | Decisão da equipe | RF-04, RF-07 |
| RN-10 | Aprovação exigida, gravada na criação | Decisão da equipe | RF-02, RF-04, RF-07 |
| RN-11 | Intervalos [início, fim) | Decisão da equipe | RF-03, RF-04, RF-05, RF-08 |
| RN-12 | Material é unidade identificada | Decisão da equipe | RF-02, RF-09 |
| RN-13 | Professor é recurso, vínculo opcional | Decisão da equipe | RF-02, RF-04, RF-05, RF-15 |
| RN-14 | Janela e dias de funcionamento da sala | Decisão da equipe | RF-02, RF-03, RF-04, RF-13 |
| RN-15 | UTC e fuso configurável | Decisão da equipe | RF-03, RF-04, RF-12 |
| RN-16 | Segregação de funções | Decisão da equipe | RF-07 |
| RN-17 | Administrador não reserva nem aprova | Decisão da equipe | RF-01, RF-04, RF-15 |
| RN-18 | Cancelamento por estado e perfil | Decisão da equipe | RF-04, RF-13, RF-16 |
| RN-19 | Alteração atômica e reaprovação | Decisão da equipe | RF-04, RF-13 |
| RN-20 | Início de uso | Decisão da equipe | RF-09, RF-16 |
| RN-21 | Não compareceu | Decisão da equipe | RF-16 |
| RN-22 | Bloqueio sobre reservas existentes | Decisão da equipe | RF-08, RF-13 |
| RN-23 | Conclusão condicionada à devolução | Decisão da equipe | RF-09, RF-13, RF-16 |
| RN-24 | Motivo na decisão do Responsável | Decisão da equipe | RF-07, RF-13 |
| RN-25 | Cancelamento SEM_DECISAO | Decisão da equipe | RF-07, RF-16 |
| RN-26 | Visibilidade por perfil | Decisão da equipe | RF-01, RF-03, RF-04, RF-10, RF-12 |
| RN-27 | Nenhuma exclusão física | Decisão da equipe | RF-04, RF-10 |
| RN-28 | Notificação | Decisão da equipe | RF-11 |
| RN-29 | Auditoria ampliada | Decisão da equipe | RF-02, RF-10, RF-15 |
| RN-30 | Conflitos evitados registrados | Decisão da equipe | RF-05, RF-06, RF-12 |
| RN-31 | Cálculos do relatório | Decisão da equipe | RF-12 |
| RN-32 | Desativação de recurso | Decisão da equipe | RF-02 |
| RN-33 | Quem rejeita | Decisão da equipe | RF-07, RF-13 |

## 5. Matriz de rastreabilidade RF para RN

| RF | Requisito | RN |
| --- | --- | --- |
| RF-01 | Autenticação e autorização por perfil | RN-06, RN-17, RN-26 |
| RF-02 | Cadastro e consulta de salas, professores e materiais | RN-10, RN-12, RN-13, RN-14, RN-29, RN-32 |
| RF-03 | Pesquisa por tipo, capacidade, localização, competência e disponibilidade | RN-02, RN-04, RN-11, RN-14, RN-15, RN-26 |
| RF-04 | Criação, alteração e cancelamento de reservas | RN-01, RN-02, RN-04, RN-05, RN-07, RN-09, RN-10, RN-11, RN-13, RN-14, RN-15, RN-17, RN-18, RN-19, RN-26, RN-27 |
| RF-05 | Detecção de sobreposição de horários, inclusive na agenda do professor | RN-02, RN-11, RN-13, RN-30 |
| RF-06 | Proteção contra dupla reserva em solicitações simultâneas | RN-03, RN-30 |
| RF-07 | Aprovação obrigatória para recursos restritos | RN-05, RN-06, RN-09, RN-10, RN-16, RN-24, RN-25, RN-33 |
| RF-08 | Bloqueio de recursos em manutenção | RN-04, RN-07, RN-11, RN-22 |
| RF-09 | Registro de retirada e devolução de materiais e equipamentos | RN-05, RN-12, RN-20, RN-23 |
| RF-10 | Histórico auditável de mudanças | RN-08, RN-26, RN-27, RN-29 |
| RF-11 | Notificação simulada ou integração com API externa | RN-28 |
| RF-12 | Relatório de utilização por recurso, carga horária alocada e conflitos evitados | RN-02, RN-03, RN-04, RN-15, RN-26, RN-30, RN-31 |
| RF-13 | Interface responsiva e mensagens de erro compreensíveis | RN-01, RN-02, RN-03, RN-04, RN-14, RN-18, RN-19, RN-22, RN-23, RN-24, RN-33 |
| RF-14 | Documentação de API ou dos fluxos públicos do sistema | **nenhuma específica (transversal)** |
| RF-15 | Gestão de usuários e perfis | RN-13, RN-17, RN-29 |
| RF-16 | Ciclo de vida de uso da reserva | RN-05, RN-08, RN-18, RN-20, RN-21, RN-23, RN-25 |

## 6. Órfãos

| Verificação | Resultado |
| --- | --- |
| RN sem RF | Nenhuma |
| RF sem RN | RF-14 |
| RN da especificação (RN-01 a RN-08) com ao menos um RF | Todas |

Observações:

- **RF-14** é transversal: documenta todas as operações e não tem regra própria. Está marcado aqui como RF sem RN, e não como erro.
- **RF-13** lista as regras cujas recusas precisam ter mensagem compreensível; as demais regras que não produzem recusa não aparecem.

## 7. Lacunas que afetam requisitos

Ver [perguntas-abertas.md](perguntas-abertas.md), seção D. Nenhuma foi decidida e nenhum valor foi inventado.

| ID | Lacuna | RF afetado |
| --- | --- | --- |
| D1 | Valor padrão da tolerância de não comparecimento | RF-16 |
| D3 | Valor padrão de tentativas e intervalo do reenvio de notificação | RF-11 |
| D4 | Tamanho da página do relatório | RF-12 |
| D9 | Retenção da auditoria e das notificações | RF-10, RF-11 |
