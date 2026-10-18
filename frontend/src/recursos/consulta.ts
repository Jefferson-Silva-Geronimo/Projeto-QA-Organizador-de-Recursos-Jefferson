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
export function useRecursos(filtros: FiltrosDeRecursos, habilitado = true) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['recursos', filtros],
    enabled: habilitado,
    queryFn: () => executar(cliente.GET('/api/recursos', { params: { query: filtros } })),
  });
}

/** Intervalos ocupados de um recurso, sem o dono (B3). Só consulta quando a lista é aberta. */
export function useOcupacoes(recursoId: number, inicio: string, fim: string, habilitado: boolean) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['ocupacoes', recursoId, inicio, fim],
    enabled: habilitado,
    queryFn: () =>
      executar(
        cliente.GET('/api/recursos/{id}/ocupacoes', { params: { path: { id: recursoId }, query: { inicio, fim } } }),
      ),
  });
}
