import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type Bloqueio = components['schemas']['BloqueioResposta'];
export type NovoBloqueio = components['schemas']['NovoBloqueioRequisicao'];

/** Bloqueios de manutenção, ativos e levantados, em ordem de início (L-02). Só o Administrador consulta (ADR-004). */
export function useBloqueios() {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['bloqueios'],
    queryFn: () => executar(cliente.GET('/api/bloqueios')),
  });
}

/**
 * Cria um bloqueio (RN-22). O primeiro envio pode voltar `BLOQUEIO_PENDE_CONFIRMACAO` com as reservas afetadas; o
 * reenvio leva essas reservas em `reservasConfirmadas`. Quem decide é o servidor: o front só repete o que ele mostrou.
 */
export function useCriarBloqueio() {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (novo: NovoBloqueio) => executar(cliente.POST('/api/bloqueios', { body: novo })),
    // Reservas canceladas e disponibilidade mudam junto com a lista: as outras consultas também ficam velhas.
    onSuccess: () => consultas.invalidateQueries(),
  });
}

/**
 * Levanta um bloqueio ativo. Não reativa as reservas que ele cancelou. O servidor exige o motivo (`MOTIVO_OBRIGATORIO`),
 * embora o contrato o marque como opcional (lacuna registrada nas pendências).
 */
export function useLevantarBloqueio(id: number) {
  const { cliente } = useSessao();
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (motivo: string) =>
      executar(cliente.POST('/api/bloqueios/{id}/levantamento', { params: { path: { id } }, body: { motivo } })),
    onSuccess: () => consultas.invalidateQueries(),
  });
}
