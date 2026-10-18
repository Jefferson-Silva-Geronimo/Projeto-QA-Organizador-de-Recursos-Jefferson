import { useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type Recurso = components['schemas']['RecursoResposta'];

export interface FiltrosDeRecursos {
  tipo?: Recurso['tipo'];
  capacidadeMinima?: number;
  localizacao?: string;
  competencia?: string;
  /** Instante ISO-8601 com offset. Só vale junto com `fim`. */
  inicio?: string;
  fim?: string;
}

/** Pesquisa de recursos (RF-03). O servidor decide a disponibilidade; o front só mostra o que vem. */
export function useRecursos(filtros: FiltrosDeRecursos) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['recursos', filtros],
    queryFn: () => executar(cliente.GET('/api/recursos', { params: { query: filtros } })),
  });
}
