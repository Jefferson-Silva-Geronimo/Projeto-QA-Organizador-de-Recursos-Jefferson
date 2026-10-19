import { useQueries, useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import { useSessao } from '@/autenticacao/useSessao';
import type { Recurso } from '@/recursos/consulta';

/** Reservas que o perfil pode ver (RN-26). Quem filtra por dono é o servidor; o front mostra a lista como vem. */
export function useReservas() {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['reservas'],
    queryFn: () => executar(cliente.GET('/api/reservas')),
  });
}

/** Uma reserva (para abrir a alteração). A visibilidade é decidida pelo servidor. */
export function useReserva(id: number) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['reservas', id],
    queryFn: () => executar(cliente.GET('/api/reservas/{id}', { params: { path: { id } } })),
  });
}

/** Resultado da consulta de um recurso: o nome vem de `GET /api/recursos/{id}`, que também devolve recursos inativos. */
export interface RecursoDaReserva {
  id: number;
  recurso: Recurso | undefined;
  carregando: boolean;
}

/** Resolve os recursos de uma reserva. A mesma consulta é compartilhada por todas as reservas que usam o recurso. */
export function useRecursosDaReserva(ids: readonly number[]): RecursoDaReserva[] {
  const { cliente } = useSessao();
  const consultas = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['recurso', id],
      queryFn: () => executar(cliente.GET('/api/recursos/{id}', { params: { path: { id } } })),
    })),
  });
  return ids.map((id, posicao) => ({
    id,
    recurso: consultas[posicao]?.data,
    carregando: consultas[posicao]?.isPending ?? false,
  }));
}
