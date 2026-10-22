import { FUSO_DO_CAMPUS, localParaIsoComOffset } from '@/datas/fuso';
import type { ConsultaDoRelatorio } from '@/relatorios/consulta';

type Tipo = 'SALA' | 'PROFESSOR' | 'MATERIAL';

/**
 * Tamanho da página do relatório. A especificação não o define (D4): é uma suposição de 20 por página, configurável
 * por `VITE_TAMANHO_DA_PAGINA_DO_RELATORIO`, e o servidor exige o valor em todo pedido.
 */
export const TAMANHO_DA_PAGINA: number = (() => {
  const configurado = Number(import.meta.env.VITE_TAMANHO_DA_PAGINA_DO_RELATORIO);
  return Number.isInteger(configurado) && configurado > 0 ? configurado : 20;
})();

/** O que a pessoa escolheu nos filtros. Tudo é texto, como nos campos; o período fica na hora do campus. */
export interface RascunhoDoRelatorio {
  inicio: string;
  fim: string;
  tipo: '' | Tipo;
  recursoId: string;
  /** Página para a pessoa: começa em 1. Vazio quer dizer a primeira. */
  pagina: string;
}

export const FILTROS_VAZIOS: RascunhoDoRelatorio = { inicio: '', fim: '', tipo: '', recursoId: '', pagina: '' };

const TIPOS: readonly string[] = ['SALA', 'PROFESSOR', 'MATERIAL'];

/** Lê os filtros do endereço. Valor desconhecido é ignorado, nunca enviado ao servidor. */
export function filtrosDoEndereco(params: URLSearchParams): RascunhoDoRelatorio {
  const tipo = params.get('tipo') ?? '';
  return {
    inicio: params.get('inicio') ?? '',
    fim: params.get('fim') ?? '',
    tipo: (TIPOS.includes(tipo) ? tipo : '') as RascunhoDoRelatorio['tipo'],
    recursoId: params.get('recursoId') ?? '',
    pagina: params.get('pagina') ?? '',
  };
}

/** Endereço com só os filtros preenchidos. */
export function enderecoDosFiltros(r: RascunhoDoRelatorio): URLSearchParams {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(r)) {
    if (valor.trim() !== '') {
      params.set(chave, valor.trim());
    }
  }
  return params;
}

/** Consulta ao servidor. Sem período completo e válido não há consulta: o servidor exige início e fim. */
export function consultaDoRelatorio(r: RascunhoDoRelatorio): ConsultaDoRelatorio | null {
  const inicio = localParaIsoComOffset(r.inicio, FUSO_DO_CAMPUS);
  const fim = localParaIsoComOffset(r.fim, FUSO_DO_CAMPUS);
  if (!inicio || !fim) {
    return null;
  }
  const numero = Number(r.pagina);
  const pagina = Number.isInteger(numero) && numero >= 1 ? numero - 1 : 0;
  const recurso = Number(r.recursoId);
  return {
    inicio,
    fim,
    ...(r.tipo ? { tipo: r.tipo } : {}),
    ...(r.recursoId.trim() !== '' && Number.isInteger(recurso) && recurso > 0 ? { recursoId: recurso } : {}),
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
  };
}

/** O que falta no período, campo a campo. */
export function faltasDoPeriodo(r: RascunhoDoRelatorio): { inicio?: string; fim?: string } {
  return {
    ...(r.inicio ? {} : { inicio: 'Informe o início do período.' }),
    ...(r.fim ? {} : { fim: 'Informe o fim do período.' }),
  };
}
