import { useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type EventoDeAuditoria = components['schemas']['EventoAuditoriaResposta'];
export type EntidadeAuditada = 'RESERVA' | 'RECURSO' | 'USUARIO' | 'BLOQUEIO' | 'CONFIGURACAO';

export interface ConsultaDaAuditoria {
  entidade?: EntidadeAuditada;
  entidadeId?: number;
}

/**
 * Auditoria completa (RF-10), só do Administrador. A consulta não é paginada nem filtra por período (L-03): o filtro de
 * período é da tela, sobre a lista inteira que o servidor devolve.
 */
export function useAuditoria(consulta: ConsultaDaAuditoria, habilitado = true) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['auditoria', consulta],
    enabled: habilitado,
    queryFn: () => executar(cliente.GET('/api/auditoria', { params: { query: consulta } })),
  });
}

/** Histórico de uma reserva (RF-10), para Responsável e Administrador. */
export function useHistoricoDaReserva(id: number | null) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['reservas', id, 'historico'],
    enabled: id !== null,
    queryFn: () => executar(cliente.GET('/api/reservas/{id}/historico', { params: { path: { id: id as number } } })),
  });
}
