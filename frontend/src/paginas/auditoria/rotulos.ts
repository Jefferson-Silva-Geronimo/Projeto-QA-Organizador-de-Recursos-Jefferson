import type { EntidadeAuditada } from '@/auditoria/consulta';

/** Ações que o servidor grava na auditoria, na grafia da pessoa. O código técnico só aparece se a tela não o conhecer. */
export const ROTULO_DA_ACAO: Record<string, string> = {
  RESERVA_CRIADA: 'Reserva criada',
  RESERVA_ALTERADA: 'Reserva alterada',
  RESERVA_APROVADA: 'Reserva aprovada',
  RESERVA_REJEITADA: 'Reserva rejeitada',
  RESERVA_CANCELADA: 'Reserva cancelada',
  RESERVA_INICIADA: 'Uso iniciado',
  RESERVA_CONCLUIDA: 'Uso concluído',
  RESERVA_NAO_COMPARECEU: 'Não comparecimento registrado',
  MATERIAL_RETIRADO: 'Material retirado',
  MATERIAL_DEVOLVIDO: 'Material devolvido',
  RECURSO_CRIADO: 'Recurso cadastrado',
  RECURSO_RESTRICAO_ALTERADA: 'Restrição do recurso alterada',
  RECURSO_DESATIVADO: 'Recurso desativado',
  USUARIO_CRIADO: 'Usuário cadastrado',
  USUARIO_PERFIL_ALTERADO: 'Perfil do usuário alterado',
  USUARIO_DESATIVADO: 'Usuário desativado',
  BLOQUEIO_CRIADO: 'Bloqueio criado',
  BLOQUEIO_LEVANTADO: 'Bloqueio levantado',
};

export const ROTULO_DA_ENTIDADE: Record<EntidadeAuditada, string> = {
  RESERVA: 'Reserva',
  RECURSO: 'Recurso',
  USUARIO: 'Usuário',
  BLOQUEIO: 'Bloqueio',
  CONFIGURACAO: 'Configuração',
};
