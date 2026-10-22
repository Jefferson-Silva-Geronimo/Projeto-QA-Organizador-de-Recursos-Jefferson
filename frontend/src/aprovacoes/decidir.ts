import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErroDeApi, executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type Decisao = components['schemas']['DecisaoRequisicao'];
export type TipoDeDecisao = 'aprovar' | 'rejeitar';

/** Recusas que indicam que a fila já não está como a tela mostrava: ela é consultada de novo. */
const CODIGOS_QUE_MUDAM_A_FILA: ReadonlySet<string> = new Set(['TRANSICAO_PROIBIDA', 'APROVACAO_APOS_INICIO', 'NAO_ENCONTRADO']);

/**
 * Aprova ou rejeita a reserva (RF-07). Quem pode, em que momento e se o motivo é obrigatório é decisão do servidor
 * (RN-16, RN-24, RN-33, D10): o front envia o pedido e mostra a resposta.
 */
export function useDecidirReserva(id: number, tipo: TipoDeDecisao) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (corpo: Decisao) =>
      tipo === 'aprovar'
        ? executar(cliente.POST('/api/reservas/{id}/aprovacao', { params: { path: { id } }, body: corpo }))
        : executar(cliente.POST('/api/reservas/{id}/rejeicao', { params: { path: { id } }, body: corpo })),
    // Só termina depois de a fila ser refeita: quando o diálogo fecha, a tela já mostra o que o servidor tem.
    // A decisão muda a reserva e, na rejeição, libera o recurso; por isso as outras consultas também ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
    onError: (erro) => {
      if (erro instanceof ErroDeApi && CODIGOS_QUE_MUDAM_A_FILA.has(erro.problema.code)) {
        void consultas.invalidateQueries({ queryKey: ['fila'] });
      }
    },
  });
}
