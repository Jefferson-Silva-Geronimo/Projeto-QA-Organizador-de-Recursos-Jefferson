# Fluxos de sequência

Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Requisitos em [requisitos-funcionais.md](requisitos-funcionais.md), regras em [regras-negocio.md](regras-negocio.md), decisões e lacunas em [perguntas-abertas.md](perguntas-abertas.md).

## Como ler

- Cada diagrama cita os RF e as RN que cobre e mostra o caminho de sucesso e os de erro.
- Os atores são o usuário, o Frontend, a API, o Banco e, onde cabe, o Provedor de notificação.
- Os códigos HTTP (200, 201, 400, 401, 403, 404, 409, 422) são **propostas** coerentes com as decisões e a confirmar na Fase 2. A especificação não os define.
- Mensagens sem ponto e vírgula, para não quebrar a renderização do Mermaid.
- Valores em aberto aparecem como lacuna, sem número: tolerância de não comparecimento (D1), reenvio de notificação (D3) e tamanho de página (D4).

## Índice

| # | Diagrama | RF | RN |
| --- | --- | --- | --- |
| 1 | [Autenticação e autorização](#diagrama-1) | RF-01, RF-13 | RN-06, RN-17, RN-26 |
| 2 | [Pesquisa de disponibilidade](#diagrama-2) | RF-03, RF-13 | RN-02, RN-04, RN-11, RN-14, RN-15, RN-26 |
| 3 | [Criação de reserva com todos os desfechos](#diagrama-3) | RF-04, RF-05, RF-07, RF-08, RF-11, RF-13 | RN-01, RN-02, RN-04, RN-09, RN-10, RN-11, RN-13, RN-14, RN-28 |
| 4 | [Duas solicitações simultâneas](#diagrama-4) | RF-06, RF-05 | RN-03, RN-30, RN-02 |
| 5 | [Aprovação e rejeição com motivo](#diagrama-5) | RF-07, RF-11, RF-13 | RN-05, RN-06, RN-16, RN-24, RN-25, RN-33, RN-28 |
| 6 | [Início de uso, retirada, devolução e conclusão](#diagrama-6) | RF-09, RF-16, RF-13 | RN-05, RN-12, RN-20, RN-23, RN-18 |
| 7 | [Alteração e cancelamento por estado e perfil](#diagrama-7) | RF-04, RF-13 | RN-01, RN-02, RN-04, RN-05, RN-07, RN-18, RN-19, RN-27 |
| 8 | [Bloqueio de manutenção com confirmação em dois passos](#diagrama-8) | RF-08, RF-11, RF-13 | RN-04, RN-07, RN-11, RN-22, RN-28 |
| 9 | [Não compareceu e cancelamento por falta de decisão](#diagrama-9) | RF-16, RF-07, RF-11 | RN-05, RN-21, RN-25, RN-08 |
| 10 | [Relatório de utilização](#diagrama-10) | RF-12, RF-13 | RN-26, RN-30, RN-31, RN-02, RN-03, RN-04, RN-15 |
| 11 | [Cadastro, atributo restrito e desativação de recursos](#diagrama-11) | RF-02, RF-13 | RN-10, RN-12, RN-13, RN-14, RN-29, RN-32 |
| 12 | [Gestão de usuários e perfis](#diagrama-12) | RF-15, RF-01, RF-13 | RN-17, RN-29, RN-13 |
| 13 | [Consulta de histórico e auditoria](#diagrama-13) | RF-10, RF-13 | RN-08, RN-26, RN-27, RN-29 |
| 14 | [Documentação da API](#diagrama-14) | RF-14 | — |

## Diagrama 1

### Autenticação e autorização

- **Cobre:** RF-01, RF-13 e RN-06, RN-17, RN-26
- **Decisões:** B1, B2, B3
- **Resumo:** Login e uso posterior com token. Cobre credencial inválida, token expirado e perfil sem permissão.
- **Desfechos:**
  - Sucesso: 200 com token e perfil
  - Erro: 401 por credencial inválida, usuário inativo ou token expirado
  - Erro: 403 por perfil sem permissão, sem mudar estado

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend
    participant A as API
    participant B as Banco
    U->>F: Informa e-mail e senha
    F->>A: POST autenticação
    A->>B: Busca usuário ativo pelo e-mail
    B-->>A: Usuário com hash e perfil
    alt credenciais válidas
        A-->>F: 200 com token de sessão e perfil
        F-->>U: Abre a tela do perfil
    else credenciais inválidas ou usuário inativo
        A-->>F: 401 sem criar sessão
        F-->>U: Mensagem de credenciais inválidas
    end
    U->>F: Usa a aplicação mais tarde
    F->>A: Requisição com token
    alt token válido e perfil autorizado
        A-->>F: 200 com os dados permitidos ao perfil
    else token ausente ou expirado
        A-->>F: 401 sem gravar nada
        F-->>U: Leva ao login
    else perfil sem permissão para a operação
        A-->>F: 403 sem mudar estado
        F-->>U: Mensagem de acesso negado
    end
```

## Diagrama 2

### Pesquisa de disponibilidade

- **Cobre:** RF-03, RF-13 e RN-02, RN-04, RN-11, RN-14, RN-15, RN-26
- **Decisões:** A2, A6, B3, C5
- **Resumo:** Busca por tipo, capacidade, localização, competência e intervalo, com a fronteira [início, fim), a janela das salas e a regra de visibilidade.
- **Desfechos:**
  - Sucesso: 200 com recursos livres e intervalos ocupados sem identificar o dono
  - Erro: 400 por intervalo inválido
  - Erro: 401 ou 403 como no diagrama 1

```mermaid
sequenceDiagram
    autonumber
    actor U as Solicitante
    participant F as Frontend
    participant A as API
    participant B as Banco
    U->>F: Informa tipo, capacidade, localização, competência, data e intervalo
    F->>A: GET disponibilidade com filtros
    alt intervalo com início não anterior ao fim
        A-->>F: 400 com código estável
        F-->>U: Mensagem de intervalo inválido
    else intervalo válido
        A->>B: Busca recursos ativos que atendem aos filtros
        B-->>A: Recursos candidatos
        A->>B: Remove os que têm ocupação ativa sobreposta ou bloqueio de manutenção
        B-->>A: Recursos livres e intervalos ocupados
        A->>A: Aplica janela e dias de funcionamento das salas no fuso configurado
        A-->>F: 200 recursos livres e intervalos ocupados sem dono
        F-->>U: Mostra a lista
    end
```

## Diagrama 3

### Criação de reserva com todos os desfechos

- **Cobre:** RF-04, RF-05, RF-07, RF-08, RF-11, RF-13 e RN-01, RN-02, RN-04, RN-09, RN-10, RN-11, RN-13, RN-14, RN-28
- **Decisões:** A1, A2, A5, A6, C6
- **Resumo:** Criação de reserva com sucesso aprovado automaticamente, sucesso pendente de aprovação, sobreposição, manutenção, professor ocupado e fora da janela da sala.
- **Desfechos:**
  - Sucesso: 201 APROVADA, com ator SISTEMA, quando não há recurso restrito
  - Sucesso: 201 SOLICITADA quando há recurso restrito
  - Erro: 403 para perfil sem permissão, como o Administrador
  - Erro: 400 por término não posterior ao início
  - Erro: 422 fora da janela ou em dia sem funcionamento
  - Erro: 409 por manutenção, sobreposição ou professor ocupado, com tentativa de conflito registrada

```mermaid
sequenceDiagram
    autonumber
    actor U as Solicitante
    participant F as Frontend
    participant A as API
    participant B as Banco
    participant P as Provedor de notificação
    U->>F: Escolhe recursos, título, início e fim
    F->>A: POST reservas
    alt perfil sem permissão para reservar
        A-->>F: 403 sem gravar nada
    else término igual ou anterior ao início
        A-->>F: 400 término deve ser posterior ao início
    else intervalo válido
        A->>B: Carrega recursos, janelas das salas e bloqueios
        alt fora da janela, em dia sem funcionamento ou cruzando a meia-noite
            A-->>F: 422 fora da janela da sala
        else recurso em bloqueio de manutenção no período
            A->>B: Registra tentativa de conflito MANUTENCAO
            A-->>F: 409 recurso em manutenção
        else professor já alocado em outra reserva no período
            A->>B: Registra tentativa de conflito SOBREPOSICAO
            A-->>F: 409 professor ocupado
        else sala ou material com ocupação sobreposta
            A->>B: Registra tentativa de conflito SOBREPOSICAO
            A-->>F: 409 intervalo ocupado sem identificar o dono
        else sem conflito
            A->>B: Grava reserva, ocupações e auditoria na mesma transação
            alt nenhum recurso restrito
                A->>B: Transição para APROVADA com ator SISTEMA e auditoria
                A-->>F: 201 reserva APROVADA
            else ao menos um recurso restrito
                A-->>F: 201 reserva SOLICITADA aguardando aprovação
            end
            A->>B: Registra notificações PENDENTE
            A->>P: Envia as notificações após o commit
            P-->>A: Resposta do provedor
        end
    end
    F-->>U: Mostra o resultado ou o motivo da recusa
```

## Diagrama 4

### Duas solicitações simultâneas

- **Cobre:** RF-06, RF-05 e RN-03, RN-30, RN-02
- **Decisões:** A2, B4
- **Resumo:** Dois Solicitantes pedem o mesmo recurso e horário no mesmo instante. A constraint de exclusão do banco aceita um e recusa o outro.
- **Desfechos:**
  - Sucesso: um pedido recebe 201
  - Erro: o outro recebe 409 por concorrência, com tentativa de conflito CONCORRENCIA registrada
  - Resultado: exatamente uma ocupação ativa para o recurso e o intervalo

```mermaid
sequenceDiagram
    autonumber
    actor U1 as Solicitante 1
    actor U2 as Solicitante 2
    participant F as Frontend
    participant A as API
    participant B as Banco
    par pedido 1
        U1->>F: Pede a Sala A das 14h às 16h
        F->>A: POST reservas do pedido 1
    and pedido 2
        U2->>F: Pede a Sala A das 14h às 16h
        F->>A: POST reservas do pedido 2
    end
    A->>B: Pedido 1 grava ocupação ativa da Sala A
    A->>B: Pedido 2 grava ocupação ativa da Sala A
    Note over B: A constraint de exclusão por recurso e período aceita só uma
    B-->>A: Pedido 1 confirmado
    B-->>A: Pedido 2 violou a constraint
    A->>B: Registra tentativa de conflito CONCORRENCIA em nova transação
    A-->>F: 201 para o pedido 1
    A-->>F: 409 para o pedido 2
    F-->>U1: Reserva criada
    F-->>U2: Horário já ocupado
```

## Diagrama 5

### Aprovação e rejeição com motivo

- **Cobre:** RF-07, RF-11, RF-13 e RN-05, RN-06, RN-16, RN-24, RN-25, RN-33, RN-28
- **Decisões:** A1, B1, C2, D8
- **Resumo:** O Responsável decide sobre reserva SOLICITADA. Cobre aprovação, rejeição com motivo, rejeição sem motivo, decisão do próprio dono e estado inválido.
- **Desfechos:**
  - Sucesso: 200 com estado APROVADA ou rejeitada, auditoria e notificação ao Solicitante
  - Erro: 400 por rejeição sem motivo
  - Erro: 403 para o dono, Solicitante ou Administrador
  - Erro: 409 por reserva que não está em SOLICITADA

```mermaid
sequenceDiagram
    autonumber
    actor R as Responsável
    participant F as Frontend
    participant A as API
    participant B as Banco
    participant P as Provedor de notificação
    R->>F: Abre a fila de aprovações
    F->>A: GET fila
    A->>B: Reservas SOLICITADA que exigem aprovação
    B-->>A: Lista
    A-->>F: 200 fila
    R->>F: Decide sobre uma reserva
    F->>A: POST decisão com motivo
    alt perfil sem permissão ou token inválido
        A-->>F: 403 ou 401 sem mudar estado
    else ator é o dono da reserva
        A-->>F: 403 o dono não decide a própria reserva
    else reserva não está em SOLICITADA
        A-->>F: 409 transição proibida
    else decisão é aprovar
        A->>B: Grava aprovação, estado APROVADA e auditoria na mesma transação
        A-->>F: 200 reserva APROVADA
        A->>P: Notifica o Solicitante após o commit
    else decisão é rejeitar com motivo
        A->>B: Grava rejeição, motivo, estado rejeitada e auditoria
        A-->>F: 200 reserva rejeitada
        A->>P: Notifica o Solicitante com o motivo após o commit
    else decisão é rejeitar sem motivo
        A-->>F: 400 motivo obrigatório na rejeição
    end
    F-->>R: Atualiza a fila
```

## Diagrama 6

### Início de uso, retirada, devolução e conclusão

- **Cobre:** RF-09, RF-16, RF-13 e RN-05, RN-12, RN-20, RN-23, RN-18
- **Decisões:** A3, A8, C3
- **Resumo:** O Responsável conduz o uso: registra início ou retirada, devolução e conclusão. Cobre devolução sem retirada e conclusão com material pendente.
- **Desfechos:**
  - Sucesso: APROVADA vai a EM_USO e depois a CONCLUÍDA, com auditoria
  - Erro: 409 por estado inválido, devolução sem retirada ou conclusão com unidades pendentes
  - Erro: 403 para perfil sem permissão

```mermaid
sequenceDiagram
    autonumber
    actor R as Responsável
    participant F as Frontend
    participant A as API
    participant B as Banco
    R->>F: Registra início de uso ou retirada da unidade
    F->>A: POST início ou retirada com código de patrimônio
    alt perfil sem permissão
        A-->>F: 403 sem mudar estado
    else reserva APROVADA
        A->>B: Grava retirada quando há material, estado EM_USO e auditoria
        A-->>F: 200 reserva EM_USO
    else reserva em outro estado
        A-->>F: 409 transição proibida
    end
    R->>F: Registra a devolução da unidade
    F->>A: POST devolução
    alt unidade retirada nesta reserva
        A->>B: Grava devolução
        A-->>F: 200
    else unidade não retirada
        A-->>F: 409 devolução sem retirada
    end
    R->>F: Conclui a reserva
    F->>A: POST conclusão
    A->>B: Consulta unidades retiradas e não devolvidas
    B-->>A: Pendências
    alt reserva EM_USO e sem pendências
        A->>B: Grava estado CONCLUÍDA e auditoria
        A-->>F: 200 reserva CONCLUÍDA
    else há unidades retiradas e não devolvidas
        A-->>F: 409 com a lista das unidades pendentes
    else reserva não está EM_USO
        A-->>F: 409 transição proibida
    end
```

## Diagrama 7

### Alteração e cancelamento por estado e perfil

- **Cobre:** RF-04, RF-13 e RN-01, RN-02, RN-04, RN-05, RN-07, RN-18, RN-19, RN-27
- **Decisões:** A8, C1, B2
- **Resumo:** Alteração atômica pelo dono e cancelamento por estado e perfil. Nenhuma reserva é apagada: o cancelamento é mudança de estado.
- **Desfechos:**
  - Sucesso: 200 com estado mantido ou devolvido a SOLICITADA, conforme a regra de reaprovação
  - Sucesso: 200 com estado cancelada, motivo e auditoria
  - Erro: 409 por conflito na alteração, nada muda
  - Erro: 409 por estado que não permite a operação
  - Erro: 403 por perfil sem permissão, 400 por motivo ausente

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend
    participant A as API
    participant B as Banco
    U->>F: Altera período, recursos, título ou descrição
    F->>A: PATCH reserva
    alt ator não é o dono
        A-->>F: 403 sem mudar nada
    else estado EM_USO ou terminal, ou início já passou
        A-->>F: 409 alteração não permitida
    else dono em SOLICITADA ou em APROVADA até o início
        A->>B: Reavalia sobreposição, manutenção e janela
        alt há conflito
            A-->>F: 409 e a reserva permanece como estava
        else mudou só título ou descrição, ou a reserva não exigia aprovação
            A->>B: Grava a alteração e a auditoria, estado mantido
            A-->>F: 200 estado mantido
        else mudou período ou recurso e a reserva exigia aprovação
            A->>B: Troca as ocupações, volta a SOLICITADA e grava auditoria na mesma transação
            A-->>F: 200 reserva SOLICITADA
        end
    end
    U->>F: Cancela a reserva
    F->>A: POST cancelamento
    alt reserva EM_USO ou em estado terminal
        A-->>F: 409 só a conclusão encerra reserva em uso
    else SOLICITADA cancelada pelo dono sem motivo
        A->>B: Grava estado cancelada e auditoria
        A-->>F: 200
    else SOLICITADA cancelada pelo Administrador com motivo
        A->>B: Grava estado cancelada, motivo e auditoria
        A-->>F: 200
    else APROVADA cancelada pelo dono até o início
        A->>B: Grava estado cancelada e auditoria
        A-->>F: 200
    else APROVADA cancelada por Responsável ou Administrador com motivo
        A->>B: Grava estado cancelada, motivo e auditoria
        A-->>F: 200
    else sem motivo quando exigido, ou perfil sem permissão
        A-->>F: 400 motivo obrigatório ou 403
    end
```

## Diagrama 8

### Bloqueio de manutenção com confirmação em dois passos

- **Cobre:** RF-08, RF-11, RF-13 e RN-04, RN-07, RN-11, RN-22, RN-28
- **Decisões:** A7, D7
- **Resumo:** O Administrador cria um bloqueio. Se houver reservas, a API primeiro lista os conflitos sem gravar e só grava depois da confirmação.
- **Desfechos:**
  - Passo 1: 409 com a lista, nada gravado
  - Passo 2 após confirmação: 201, bloqueio gravado e reservas cancelam por inteiro com motivo MANUTENCAO
  - Erro: 409 recusado sem opção de forçar, se houver reserva EM_USO
  - Erro: 403 para perfil sem permissão

```mermaid
sequenceDiagram
    autonumber
    actor Ad as Administrador
    participant F as Frontend
    participant A as API
    participant B as Banco
    participant P as Provedor de notificação
    Ad->>F: Informa recurso, período e motivo
    F->>A: POST bloqueio sem confirmação
    alt perfil sem permissão
        A-->>F: 403
    else perfil Administrador
        A->>B: Busca reservas ativas do recurso no período
        B-->>A: Reservas conflitantes
        alt há reserva EM_USO no período
            A-->>F: 409 recusado sem opção de forçar
        else há reservas SOLICITADA ou APROVADA
            A-->>F: 409 com a lista das reservas conflitantes sem gravar
            F-->>Ad: Mostra a lista e pede confirmação
            Ad->>F: Confirma o bloqueio
            F->>A: POST bloqueio com confirmação
            A->>B: Revalida os conflitos
            alt apareceu reserva EM_USO ou a lista mudou
                A-->>F: 409 com a situação atual, nada gravado
            else lista igual à exibida
                A->>B: Grava bloqueio, cancela as reservas inteiras com motivo MANUTENCAO e audita
                A-->>F: 201 bloqueio criado
                A->>P: Notifica os Solicitantes após o commit
            end
        else não há reservas no período
            A->>B: Grava bloqueio e auditoria
            A-->>F: 201 bloqueio criado
        end
    end
```

## Diagrama 9

### Não compareceu e cancelamento por falta de decisão

- **Cobre:** RF-16, RF-07, RF-11 e RN-05, RN-21, RN-25, RN-08
- **Decisões:** A8, C2, D1, D2
- **Resumo:** O Responsável marca não compareceu após a tolerância. Quando o início de uma reserva SOLICITADA chega sem decisão, o sistema a cancela com motivo SEM_DECISAO.
- **Desfechos:**
  - Sucesso: não compareceu ou cancelada com SEM_DECISAO, com auditoria
  - Erro: 409 por tolerância não encerrada ou estado inválido
  - Em aberto: valor da tolerância (D1). O mecanismo de disparo foi decidido em D2: job agendado, idempotente e com trava, só para SEM_DECISAO

```mermaid
sequenceDiagram
    autonumber
    actor R as Responsável
    participant F as Frontend
    participant A as API
    participant B as Banco
    participant G as Gatilho do sistema
    participant P as Provedor de notificação
    R->>F: Abre as reservas APROVADA vencidas
    F->>A: GET vencidas
    A->>B: Reservas APROVADA sem uso após início e tolerância
    B-->>A: Lista
    A-->>F: 200 lista
    R->>F: Marca uma reserva como não compareceu
    F->>A: POST não compareceu
    alt reserva APROVADA e tolerância encerrada
        A->>B: Grava estado não compareceu e auditoria
        A-->>F: 200
    else tolerância ainda não encerrada
        A-->>F: 409 tolerância não encerrada
    else reserva em outro estado
        A-->>F: 409 transição proibida
    end
    Note over G,A: O gatilho é o job agendado de D2 e o valor da tolerância é lacuna D1
    G->>A: Chegou o início de reserva SOLICITADA
    A->>B: Reavalia o estado da reserva
    alt continua SOLICITADA sem decisão
        A->>B: Grava estado cancelada, motivo SEM_DECISAO, ator SISTEMA e auditoria
        A->>P: Notifica o Solicitante após o commit
    else já foi decidida
        A->>A: Nada a fazer
    end
```

## Diagrama 10

### Relatório de utilização

- **Cobre:** RF-12, RF-13 e RN-26, RN-30, RN-31, RN-02, RN-03, RN-04, RN-15
- **Decisões:** B4, C4, C5, D4, D5
- **Resumo:** Relatório RF-12 com filtros e paginação. Responsável e Administrador consultam, este somente em leitura.
- **Desfechos:**
  - Sucesso: 200 com carga horária, utilização das salas e conflitos evitados
  - Erro: 403 para Solicitante
  - Erro: 400 por filtros inválidos
  - Em aberto: tamanho da página (D4)

```mermaid
sequenceDiagram
    autonumber
    actor U as Responsável ou Administrador
    participant F as Frontend
    participant A as API
    participant B as Banco
    U->>F: Escolhe período, tipo de recurso, recurso e página
    F->>A: GET relatório com filtros
    alt perfil Solicitante
        A-->>F: 403 sem dados
    else filtros inválidos
        A-->>F: 400 com código estável
    else perfil autorizado e filtros válidos
        A->>B: Soma ocupações de reservas APROVADA, EM_USO e CONCLUÍDA na parte interna do período
        B-->>A: Carga horária por recurso
        A->>B: Obtém horas de funcionamento nos dias de funcionamento das salas
        B-->>A: Horas de funcionamento
        A->>B: Conta tentativas de conflito, total e distinta
        B-->>A: Conflitos evitados
        A-->>F: 200 página do relatório
        F-->>U: Mostra o relatório
    end
```

## Diagrama 11

### Cadastro, atributo restrito e desativação de recursos

- **Cobre:** RF-02, RF-13 e RN-10, RN-12, RN-13, RN-14, RN-29, RN-32
- **Decisões:** A1, A3, A4, A6, C5, C7, D6
- **Resumo:** O Administrador cadastra salas, professores e materiais, altera o atributo restrito e desativa recursos.
- **Desfechos:**
  - Sucesso: 201 no cadastro e 200 na alteração, com auditoria
  - Erro: 400 por dados incompletos e 409 por patrimônio duplicado
  - Erro: 409 na desativação com reservas futuras, com a lista e sem cancelamento automático

```mermaid
sequenceDiagram
    autonumber
    actor Ad as Administrador
    participant F as Frontend
    participant A as API
    participant B as Banco
    Ad->>F: Preenche o cadastro de sala, professor ou material
    F->>A: POST recurso
    alt dados incompletos, como sala sem janela ou dias, ou material sem patrimônio
        A-->>F: 400 com código estável
    else código de patrimônio já existente
        A-->>F: 409 patrimônio duplicado
    else dados válidos
        A->>B: Grava recurso e auditoria
        A-->>F: 201 recurso criado
    end
    Ad->>F: Altera o atributo restrito
    F->>A: PATCH recurso
    A->>B: Grava o atributo e a auditoria sem alterar reservas existentes
    A-->>F: 200
    Ad->>F: Desativa um recurso
    F->>A: POST desativação
    A->>B: Busca reservas futuras SOLICITADA, APROVADA ou EM_USO
    alt existem reservas futuras nesses estados
        A-->>F: 409 com a lista, nada desativado nem cancelado
    else não existem
        A->>B: Desativa o recurso e grava auditoria
        A-->>F: 200
    end
```

## Diagrama 12

### Gestão de usuários e perfis

- **Cobre:** RF-15, RF-01, RF-13 e RN-17, RN-29, RN-13
- **Decisões:** B2, C7, A4, C8
- **Resumo:** O Administrador cria e altera usuários e atribui um único perfil a cada um.
- **Desfechos:**
  - Sucesso: 201 ou 200 com auditoria contendo antes e depois
  - Erro: 400 por perfil ausente, 409 por segundo perfil ou e-mail repetido
  - Erro: 403 para quem não é Administrador

```mermaid
sequenceDiagram
    autonumber
    actor Ad as Administrador
    participant F as Frontend
    participant A as API
    participant B as Banco
    Ad->>F: Cria usuário informando nome, e-mail e perfil
    F->>A: POST usuário
    alt quem pede não é Administrador
        A-->>F: 403
    else perfil ausente
        A-->>F: 400 perfil obrigatório
    else tentativa de atribuir mais de um perfil
        A-->>F: 409 um único perfil por usuário
    else e-mail já cadastrado
        A-->>F: 409 e-mail repetido
    else dados válidos
        A->>B: Grava usuário e auditoria
        A-->>F: 201 usuário criado
    end
    Ad->>F: Troca o perfil de um usuário
    F->>A: PATCH usuário
    A->>B: Grava o novo perfil e a auditoria com valores antes e depois
    A-->>F: 200
```

## Diagrama 13

### Consulta de histórico e auditoria

- **Cobre:** RF-10, RF-13 e RN-08, RN-26, RN-27, RN-29
- **Decisões:** B3, C4, C7, D9
- **Resumo:** Consulta do histórico das reservas e da auditoria completa, conforme o perfil.
- **Desfechos:**
  - Sucesso: 200 com eventos
  - Erro: 403 para o Responsável na auditoria de cadastros, usuários e perfis
  - Erro: 403 para Solicitante em reserva de outro usuário

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend
    participant A as API
    participant B as Banco
    U->>F: Abre o histórico de reservas ou a auditoria
    F->>A: GET eventos com filtros
    alt Solicitante pedindo reserva de outro usuário
        A-->>F: 403 sem dados
    else Responsável pedindo auditoria de cadastros, usuários ou perfis
        A-->>F: 403 sem dados
    else Responsável pedindo o histórico das reservas
        A->>B: Eventos das reservas
        A-->>F: 200 histórico
    else Administrador pedindo auditoria
        A->>B: Eventos de todas as entidades
        A-->>F: 200 auditoria completa
    end
    F-->>U: Mostra os eventos
```

## Diagrama 14

### Documentação da API

- **Cobre:** RF-14
- **Decisões:** B3
- **Resumo:** Consulta à documentação do contrato público. A forma de publicação é suposição a confirmar na Fase 2.
- **Desfechos:**
  - Sucesso: 200 com operações, perfis, parâmetros, respostas e códigos de erro
  - Erro: 404 para documento inexistente

```mermaid
sequenceDiagram
    autonumber
    actor C as Consumidor da API
    participant A as API
    C->>A: GET documentação do contrato
    alt documentação publicada
        A-->>C: 200 contrato com perfis, parâmetros, respostas e códigos de erro
    else documentação inexistente
        A-->>C: 404
    end
```

## Cobertura RF para diagrama

| RF | Requisito | Diagramas |
| --- | --- | --- |
| RF-01 | Autenticação e autorização por perfil | [1](#diagrama-1), [12](#diagrama-12) |
| RF-02 | Cadastro e consulta de salas, professores e materiais | [11](#diagrama-11) |
| RF-03 | Pesquisa por tipo, capacidade, localização, competência e disponibilidade | [2](#diagrama-2) |
| RF-04 | Criação, alteração e cancelamento de reservas | [3](#diagrama-3), [7](#diagrama-7) |
| RF-05 | Detecção de sobreposição de horários, inclusive na agenda do professor | [3](#diagrama-3), [4](#diagrama-4) |
| RF-06 | Proteção contra dupla reserva em solicitações simultâneas | [4](#diagrama-4) |
| RF-07 | Aprovação obrigatória para recursos restritos | [3](#diagrama-3), [5](#diagrama-5), [9](#diagrama-9) |
| RF-08 | Bloqueio de recursos em manutenção | [3](#diagrama-3), [8](#diagrama-8) |
| RF-09 | Registro de retirada e devolução de materiais e equipamentos | [6](#diagrama-6) |
| RF-10 | Histórico auditável de mudanças | [13](#diagrama-13) |
| RF-11 | Notificação simulada ou integração com API externa | [3](#diagrama-3), [5](#diagrama-5), [8](#diagrama-8), [9](#diagrama-9) |
| RF-12 | Relatório de utilização por recurso, carga horária alocada e conflitos evitados | [10](#diagrama-10) |
| RF-13 | Interface responsiva e mensagens de erro compreensíveis | [1](#diagrama-1), [2](#diagrama-2), [3](#diagrama-3), [5](#diagrama-5), [6](#diagrama-6), [7](#diagrama-7), [8](#diagrama-8), [10](#diagrama-10), [11](#diagrama-11), [12](#diagrama-12), [13](#diagrama-13) |
| RF-14 | Documentação de API ou dos fluxos públicos do sistema | [14](#diagrama-14) |
| RF-15 | Gestão de usuários e perfis (acréscimo da equipe) | [12](#diagrama-12) |
| RF-16 | Ciclo de vida de uso da reserva (acréscimo da equipe) | [6](#diagrama-6), [9](#diagrama-9) |

| Verificação | Resultado |
| --- | --- |
| RF sem diagrama | Nenhum |

RF-13 é transversal: aparece em todo diagrama que tem ramo de erro com mensagem ao usuário. RF-10 está também implícito em todo diagrama que grava auditoria.

## Regras sem diagrama próprio

| Verificação | Resultado |
| --- | --- |
| RN não citadas em nenhum diagrama | Nenhuma |

As regras listadas acima são de modelagem ou de configuração e não têm interação própria entre atores. Elas continuam cobertas pelas jornadas e pelo modelo de dados.
