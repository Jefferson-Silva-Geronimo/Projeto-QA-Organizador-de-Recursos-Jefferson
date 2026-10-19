import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErroDeApi, executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type Cancelamento = components['schemas']['CancelamentoRequisicao'];

/** Recusas que indicam que a reserva já não está como a lista mostrava: a lista é consultada de novo. */
const CODIGOS_QUE_MUDAM_A_LISTA: ReadonlySet<string> = new Set(['TRANSICAO_PROIBIDA', 'RESERVA_JA_INICIADA', 'NAO_ENCONTRADO']);

/**
 * Cancela a reserva (RF-04, RN-18). Quem pode cancelar, em que estado e se o motivo é obrigatório é decisão do servidor:
 * o front envia o pedido e mostra a resposta.
 */
export function useCancelarReserva(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (corpo: Cancelamento) =>
      executar(cliente.POST('/api/reservas/{id}/cancelamento', { params: { path: { id } }, body: corpo })),
    // Só termina depois de a lista ser refeita: quando o diálogo fecha, o cartão já mostra o estado que o servidor tem.
    // O cancelamento também libera o recurso, então as consultas de disponibilidade ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
    onError: (erro) => {
      if (erro instanceof ErroDeApi && CODIGOS_QUE_MUDAM_A_LISTA.has(erro.problema.code)) {
        void consultas.invalidateQueries({ queryKey: ['reservas'] });
      }
    },
  });
}
