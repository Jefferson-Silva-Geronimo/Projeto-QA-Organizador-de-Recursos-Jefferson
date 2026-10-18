import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErroDeApi, executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type NovaReserva = components['schemas']['NovaReservaRequisicao'];
export type Reserva = components['schemas']['ReservaResposta'];

const CODIGOS_QUE_MUDAM_O_LIVRE: ReadonlySet<string> = new Set([
  'CONFLITO_DE_ALOCACAO',
  'RECURSO_EM_MANUTENCAO',
  'RECURSO_INATIVO',
]);

/** Cria a reserva (RF-04). O servidor decide sobreposição, janela, manutenção e aprovação; o front só envia. */
export function useCriarReserva() {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (corpo: NovaReserva) => executar(cliente.POST('/api/reservas', { body: corpo })),
    // Uma reserva nova muda o que está livre: as listas de recursos e de horários ocupados ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
    // Recusa que muda o que está livre (alguém reservou antes): a lista de recursos livres é refeita.
    onError: (erro) => {
      if (erro instanceof ErroDeApi && CODIGOS_QUE_MUDAM_O_LIVRE.has(erro.problema.code)) {
        void consultas.invalidateQueries({ queryKey: ['recursos'] });
      }
    },
  });
}
