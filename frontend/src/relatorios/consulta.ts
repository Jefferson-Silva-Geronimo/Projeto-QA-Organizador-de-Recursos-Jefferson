import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { executar } from '@/api/cliente';
import type { components } from '@/api/schema';
import { useSessao } from '@/autenticacao/useSessao';

export type RelatorioDeUtilizacao = components['schemas']['RelatorioResposta'];
export type ItemDoRelatorio = components['schemas']['ItemRelatorioResposta'];

/** O que o servidor pede para gerar o relatório. Início, fim e tamanho são obrigatórios no contrato (D4). */
export interface ConsultaDoRelatorio {
  /** Instantes ISO-8601 com offset do campus (ADR-005). */
  inicio: string;
  fim: string;
  tipo?: ItemDoRelatorio['tipo'];
  recursoId?: number;
  /** Começa em zero, como no servidor. */
  pagina: number;
  tamanho: number;
}

/**
 * Relatório de utilização (RF-12, RN-31). Os números são os que o servidor calcula: o front os mostra e nunca os
 * recalcula. Só consulta quando há período.
 */
export function useRelatorioDeUtilizacao(consulta: ConsultaDoRelatorio | null) {
  const { cliente } = useSessao();
  return useQuery({
    queryKey: ['relatorio', consulta],
    enabled: consulta !== null,
    // Ao trocar de página a tabela anterior fica na tela até a nova chegar, em vez de piscar o carregamento.
    placeholderData: keepPreviousData,
    queryFn: () =>
      executar(cliente.GET('/api/relatorios/utilizacao', { params: { query: consulta as ConsultaDoRelatorio } })),
  });
}
