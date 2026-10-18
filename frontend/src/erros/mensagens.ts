export interface MensagemDeErro {
  mensagem: string;
  acao: string;
}

/**
 * Código estável do servidor para mensagem compreensível com ação sugerida (ADR-008, RF-13).
 * O texto cru do servidor nunca aparece na tela. Fonte: docs/prd/navegacao-telas.md, seção 5.1.
 */
const MENSAGENS = {
  CREDENCIAIS_INVALIDAS: { mensagem: 'E-mail ou senha incorretos.', acao: 'Confira os dados e tente de novo.' },
  NAO_AUTENTICADO: { mensagem: 'Sua sessão terminou ou ainda não foi aberta.', acao: 'Entre novamente (a tela leva ao login).' },
  ACESSO_NEGADO: { mensagem: 'Seu perfil não permite esta ação.', acao: 'Volte à tela anterior ou fale com um Administrador.' },
  VALIDACAO_FALHOU: { mensagem: 'Alguns dados não foram aceitos.', acao: 'Corrija os campos destacados e envie de novo.' },
  NAO_ENCONTRADO: { mensagem: 'Não encontramos o item pedido.', acao: 'Volte à lista e atualize a página.' },
  USUARIO_JA_EXISTE: { mensagem: 'Já existe um usuário com este e-mail.', acao: 'Use outro e-mail.' },
  MINIMO_DE_RESPONSAVEIS: { mensagem: 'A mudança deixaria menos de dois Responsáveis ativos.', acao: 'Cadastre outro Responsável antes de continuar.' },
  USUARIO_COM_RESERVA_FUTURA: { mensagem: 'Este usuário tem reservas futuras e não pode ser desativado.', acao: 'Cancele ou conclua as reservas e tente de novo.' },
  PATRIMONIO_JA_EXISTE: { mensagem: 'Já existe um material com este código de patrimônio.', acao: 'Confira o código informado.' },
  VINCULO_JA_EXISTE: { mensagem: 'Este usuário já está ligado a outro professor.', acao: 'Escolha outro usuário ou deixe sem vínculo.' },
  RECURSO_COM_RESERVA_FUTURA: { mensagem: 'Este recurso tem reservas futuras e não pode ser desativado.', acao: 'Cancele as reservas antes de desativar.' },
  PERIODO_INVALIDO: { mensagem: 'O término precisa ser depois do início.', acao: 'Ajuste as datas e horas.' },
  INICIO_NO_PASSADO: { mensagem: 'O início da reserva precisa ser no futuro.', acao: 'Escolha um horário a partir de agora.' },
  FORA_DA_JANELA: { mensagem: 'O horário está fora do funcionamento da sala.', acao: 'Escolha um horário dentro da janela da sala.' },
  DIA_SEM_FUNCIONAMENTO: { mensagem: 'A sala não funciona neste dia da semana.', acao: 'Escolha outro dia.' },
  CRUZA_MEIA_NOITE: { mensagem: 'A reserva não pode passar da meia-noite.', acao: 'Divida em dois dias ou termine antes da meia-noite.' },
  MOTIVO_OBRIGATORIO: { mensagem: 'Informe o motivo para continuar.', acao: 'Preencha o campo motivo.' },
  CONFLITO_DE_ALOCACAO: { mensagem: 'Um dos recursos já está reservado nesse horário.', acao: 'Escolha outro horário ou outro recurso.' },
  RECURSO_EM_MANUTENCAO: { mensagem: 'O recurso está em manutenção nesse horário.', acao: 'Escolha outro horário ou outro recurso.' },
  TRANSICAO_PROIBIDA: { mensagem: 'A reserva não está num estado que permita esta ação.', acao: 'Atualize a lista para ver o estado atual.' },
  RESERVA_JA_INICIADA: { mensagem: 'A reserva já começou e não pode mais ser alterada ou cancelada por você.', acao: 'Fale com um Responsável se precisar de ajuda.' },
  RECURSO_INATIVO: { mensagem: 'Um dos recursos está desativado.', acao: 'Retire-o da reserva e tente de novo.' },
  METODO_NAO_PERMITIDO: { mensagem: 'Esta operação não existe.', acao: 'Volte ao início e tente de novo.' },
  APROVACAO_APOS_INICIO: { mensagem: 'O horário de início já passou e a reserva não pode mais ser aprovada.', acao: 'Atualize a fila.' },
  BLOQUEIO_PENDE_CONFIRMACAO: { mensagem: 'Há reservas neste período. Elas serão canceladas se você confirmar.', acao: 'Revise a lista exibida e confirme ou volte.' },
  BLOQUEIO_LISTA_DESATUALIZADA: { mensagem: 'A lista de reservas mudou desde a sua última revisão.', acao: 'Revise a nova lista e confirme de novo.' },
  BLOQUEIO_COM_RESERVA_EM_USO: { mensagem: 'Há uma reserva em uso neste período, então o bloqueio não pode ser criado.', acao: 'Escolha um período sem reservas em uso.' },
  MATERIAL_FORA_DA_RESERVA: { mensagem: 'Este material não faz parte da reserva.', acao: 'Escolha um material da lista da reserva.' },
  MATERIAL_JA_RETIRADO: { mensagem: 'Esta unidade já foi retirada e ainda não voltou.', acao: 'Registre a devolução antes de retirar de novo.' },
  DEVOLUCAO_SEM_RETIRADA: { mensagem: 'Esta unidade não foi retirada.', acao: 'Registre a retirada antes da devolução.' },
  MATERIAL_PENDENTE: { mensagem: 'Há material retirado e não devolvido.', acao: 'Registre a devolução das unidades pendentes e conclua de novo.' },
  TOLERANCIA_NAO_CONFIGURADA: { mensagem: 'A tolerância de não comparecimento ainda não foi configurada.', acao: 'Peça a um Administrador que configure.' },
  TOLERANCIA_NAO_ENCERRADA: { mensagem: 'A tolerância de não comparecimento ainda não terminou.', acao: 'Tente depois do prazo.' },
  ERRO_INTERNO: { mensagem: 'Não foi possível concluir agora.', acao: 'Tente de novo em instantes.' },
} as const satisfies Record<string, MensagemDeErro>;

export type CodigoConhecido = keyof typeof MENSAGENS;

export function mensagemPara(code: string): MensagemDeErro {
  return (MENSAGENS as Record<string, MensagemDeErro>)[code] as MensagemDeErro;
}
