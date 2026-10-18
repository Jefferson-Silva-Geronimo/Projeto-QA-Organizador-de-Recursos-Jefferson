# Matriz de autorização

Gerada por `AutorizacaoApiIT` com `-Dgerar.matriz=true`, da mesma lista de operações que o teste executa. Cada célula foi verificada contra a API real: **permitido** significa que a requisição passa pela autorização (o resultado final depende da regra de negócio); **403** significa recusa sem mudança de estado. Sem sessão válida, toda operação retorna **401**, exceto o login.

Fonte dos requisitos: [especificação do projeto](https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). Regras: RN-06, RN-16, RN-17, RN-26 e RF-01.

| Operação | Método e caminho | Solicitante | Responsável | Administrador |
| --- | --- | --- | --- | --- |
| Sair | `POST /api/auth/logout` | permitido | permitido | permitido | 
| Quem sou eu | `GET /api/auth/eu` | permitido | permitido | permitido | 
| Criar usuário | `POST /api/usuarios` | 403 | 403 | permitido | 
| Alterar perfil | `PUT /api/usuarios/{id}/perfil` | 403 | 403 | permitido | 
| Desativar usuário | `POST /api/usuarios/{id}/desativacao` | 403 | 403 | permitido | 
| Listar usuários | `GET /api/usuarios` | 403 | 403 | permitido | 
| Cadastrar sala | `POST /api/salas` | 403 | 403 | permitido | 
| Cadastrar professor | `POST /api/professores` | 403 | 403 | permitido | 
| Cadastrar material | `POST /api/materiais` | 403 | 403 | permitido | 
| Alterar restrito | `PUT /api/recursos/{id}/restrito` | 403 | 403 | permitido | 
| Desativar recurso | `POST /api/recursos/{id}/desativacao` | 403 | 403 | permitido | 
| Consultar recurso | `GET /api/recursos/{id}` | permitido | permitido | permitido | 
| Pesquisar recursos | `GET /api/recursos` | permitido | permitido | permitido | 
| Ocupações do recurso | `GET /api/recursos/{id}/ocupacoes` | permitido | permitido | permitido | 
| Criar reserva | `POST /api/reservas` | permitido | permitido | 403 | 
| Alterar reserva | `PUT /api/reservas/{id}` | permitido | permitido | 403 | 
| Cancelar reserva | `POST /api/reservas/{id}/cancelamento` | permitido | permitido | permitido | 
| Consultar reserva | `GET /api/reservas/{id}` | permitido | permitido | permitido | 
| Listar reservas | `GET /api/reservas` | permitido | permitido | permitido | 
| Aprovar reserva | `POST /api/reservas/{id}/aprovacao` | 403 | permitido | 403 | 
| Rejeitar reserva | `POST /api/reservas/{id}/rejeicao` | 403 | permitido | 403 | 
| Fila de aprovações | `GET /api/reservas/fila` | 403 | permitido | 403 | 
| Criar bloqueio | `POST /api/bloqueios` | 403 | 403 | permitido | 
| Listar bloqueios | `GET /api/bloqueios` | 403 | 403 | permitido | 
| Levantar bloqueio | `POST /api/bloqueios/{id}/levantamento` | 403 | 403 | permitido | 
| Iniciar uso | `POST /api/reservas/{id}/inicio` | 403 | permitido | 403 | 
| Retirar material | `POST /api/reservas/{id}/retiradas` | 403 | permitido | 403 | 
| Devolver material | `POST /api/reservas/{id}/devolucoes` | 403 | permitido | 403 | 
| Concluir reserva | `POST /api/reservas/{id}/conclusao` | 403 | permitido | 403 | 
| Marcar não comparecimento | `POST /api/reservas/{id}/nao-comparecimento` | 403 | permitido | 403 | 
| Movimentações da reserva | `GET /api/reservas/{id}/movimentacoes` | permitido | permitido | permitido | 
| Auditoria completa | `GET /api/auditoria` | 403 | 403 | permitido | 
| Histórico da reserva | `GET /api/reservas/{id}/historico` | permitido | permitido | permitido | 
| Relatório de utilização | `GET /api/relatorios/utilizacao` | 403 | permitido | permitido | 

Operação pública: `POST /api/auth/login`.

## Regras de posse e estado que a matriz não mostra

| Regra | Resultado | Regra de origem |
| --- | --- | --- |
| Solicitante lê, altera ou cancela reserva de outro usuário | 403 | RN-26, RN-18, RN-19 |
| Responsável aprova ou rejeita a própria reserva | 403 | RN-16, RN-33 |
| Administrador cria reserva | 403 | RN-17 |
| Solicitante vê o histórico de reserva de outro usuário | 403 | RN-26 |
