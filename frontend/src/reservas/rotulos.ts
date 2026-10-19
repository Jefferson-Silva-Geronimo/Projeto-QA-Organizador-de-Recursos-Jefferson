import type { Reserva } from '@/reservas/criar';

/** Estados na grafia da especificação (RN-05) para a pessoa; o identificador técnico nunca vai à tela. */
export const ROTULO_DO_ESTADO: Record<Reserva['estado'], string> = {
  SOLICITADA: 'Solicitada',
  APROVADA: 'Aprovada',
  EM_USO: 'Em uso',
  CONCLUIDA: 'Concluída',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada',
  NAO_COMPARECEU: 'Não compareceu',
};

/** Motivos que o próprio sistema grava ao cancelar (RN-22, RN-25). Qualquer outro texto foi digitado por uma pessoa. */
const MOTIVO_DO_SISTEMA: Record<string, string> = {
  MANUTENCAO: 'Cancelada porque o recurso entrou em manutenção.',
  SEM_DECISAO: 'Cancelada porque o início chegou sem decisão.',
};

export function textoDoMotivo(motivo: string): string {
  return MOTIVO_DO_SISTEMA[motivo] ?? motivo;
}
