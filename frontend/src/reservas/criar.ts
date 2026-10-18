import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type NovaReserva = components['schemas']['NovaReservaRequisicao'];
export type Reserva = components['schemas']['ReservaResposta'];

/** Cria a reserva (RF-04). O servidor decide sobreposição, janela, manutenção e aprovação; o front só envia. */
export function useCriarReserva() {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (corpo: NovaReserva) => executar(cliente.POST('/api/reservas', { body: corpo })),
    // Uma reserva nova muda o que está livre: as listas de recursos e de horários ocupados ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
  });
}
