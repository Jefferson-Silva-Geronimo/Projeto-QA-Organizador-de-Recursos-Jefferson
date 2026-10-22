import { useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type Movimentacao = components['schemas']['MovimentacaoResposta'];

/**
 * Histórico de retiradas e devoluções da reserva (RF-09). O servidor marca em cada movimentação se ela é a atual do
 * material (`atual`, F6-16) e traz o nome de quem registrou: a tela lê esses campos e não interpreta a sequência.
 */
export function useMovimentacoes(id: number) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['reservas', id, 'movimentacoes'],
    queryFn: () => executar(cliente.GET('/api/reservas/{id}/movimentacoes', { params: { path: { id } } })),
  });
}
