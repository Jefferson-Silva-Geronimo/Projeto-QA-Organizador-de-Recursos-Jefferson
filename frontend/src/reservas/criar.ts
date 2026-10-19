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

/** Tratamento comum a criar e alterar: o que a recusa ou o sucesso mudam no que a tela mostra. */
function useConsultasAtualizadas() {
  const consultas = useQueryClient();
  return {
    // Uma reserva nova ou alterada muda o que está livre: as listas de recursos, de horários ocupados e de reservas ficam velhas.
    aoSucesso: () => consultas.invalidateQueries(),
    // Recusa que muda o que está livre (alguém reservou antes): a lista de recursos livres é refeita.
    aoErro: (erro: unknown) => {
      if (erro instanceof ErroDeApi && CODIGOS_QUE_MUDAM_O_LIVRE.has(erro.problema.code)) {
        void consultas.invalidateQueries({ queryKey: ['recursos'] });
      }
    },
  };
}

/** Cria a reserva (RF-04). O servidor decide sobreposição, janela, manutenção e aprovação; o front só envia. */
export function useCriarReserva() {
  const { cliente } = useSessao();
  const { aoSucesso, aoErro } = useConsultasAtualizadas();
  return useMutation({
    mutationFn: (corpo: NovaReserva): Promise<Reserva> => executar(cliente.POST('/api/reservas', { body: corpo })),
    onSuccess: aoSucesso,
    onError: aoErro,
  });
}

/**
 * Altera a reserva (RF-04, RN-19). Atômica no servidor: em conflito nada muda. Quem pode alterar, em que estado e até
 * quando é decisão do servidor, e se a reserva volta para aprovação também: o front mostra o estado devolvido.
 */
export function useAlterarReserva(id: number | undefined) {
  const { cliente } = useSessao();
  const { aoSucesso, aoErro } = useConsultasAtualizadas();
  return useMutation({
    mutationFn: (corpo: NovaReserva): Promise<Reserva> => {
      if (id === undefined) {
        throw new Error('Alteração sem reserva.');
      }
      return executar(cliente.PUT('/api/reservas/{id}', { params: { path: { id } }, body: corpo }));
    },
    onSuccess: aoSucesso,
    onError: aoErro,
  });
}
