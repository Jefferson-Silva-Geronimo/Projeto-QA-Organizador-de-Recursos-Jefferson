import { useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type ItemDaFila = components['schemas']['ReservaDaFilaResposta'];

/**
 * Fila de aprovações (RF-07). Quem pode vê-la, a ordem e o que cada Responsável pode decidir em cada item
 * (podeAprovar e podeRejeitar, F6-15) são decisões do servidor: o front mostra a fila como vem.
 */
export function useFila() {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['fila'],
    queryFn: () => executar(cliente.GET('/api/reservas/fila')),
  });
}
