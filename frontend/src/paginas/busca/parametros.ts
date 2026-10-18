import { FUSO_DO_CAMPUS, localParaIsoComOffset } from '@/datas/fuso';
import type { FiltrosDeRecursos, Recurso } from '@/recursos/consulta';

/** O que a pessoa digitou nos filtros. Tudo é texto, como nos campos; o período fica na hora do campus. */
export interface RascunhoDosFiltros {
  tipo: '' | Recurso['tipo'];
  capacidadeMinima: string;
  localizacao: string;
  competencia: string;
  inicio: string;
  fim: string;
}

export const FILTROS_VAZIOS: RascunhoDosFiltros = {
  tipo: '',
  capacidadeMinima: '',
  localizacao: '',
  competencia: '',
  inicio: '',
  fim: '',
};

const TIPOS: readonly string[] = ['SALA', 'PROFESSOR', 'MATERIAL'];

/** Lê os filtros do endereço. Valor desconhecido é ignorado, nunca enviado ao servidor. */
export function filtrosDoEndereco(params: URLSearchParams): RascunhoDosFiltros {
  const tipo = params.get('tipo') ?? '';
  return {
    tipo: (TIPOS.includes(tipo) ? tipo : '') as RascunhoDosFiltros['tipo'],
    capacidadeMinima: params.get('capacidadeMinima') ?? '',
    localizacao: params.get('localizacao') ?? '',
    competencia: params.get('competencia') ?? '',
    inicio: params.get('inicio') ?? '',
    fim: params.get('fim') ?? '',
  };
}

/** Endereço com só os filtros preenchidos. */
export function enderecoDosFiltros(r: RascunhoDosFiltros): URLSearchParams {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(r)) {
    if (valor.trim() !== '') {
      params.set(chave, valor.trim());
    }
  }
  return params;
}

/** Consulta ao servidor: só os filtros preenchidos, com o período em ISO-8601 com offset do campus (ADR-005). */
export function consultaDosFiltros(r: RascunhoDosFiltros): FiltrosDeRecursos {
  const consulta: FiltrosDeRecursos = {};
  if (r.tipo) consulta.tipo = r.tipo;
  const capacidade = Number(r.capacidadeMinima);
  if (r.capacidadeMinima.trim() !== '' && Number.isFinite(capacidade) && capacidade > 0) {
    consulta.capacidadeMinima = capacidade;
  }
  if (r.localizacao.trim()) consulta.localizacao = r.localizacao.trim();
  if (r.competencia.trim()) consulta.competencia = r.competencia.trim();
  const inicio = localParaIsoComOffset(r.inicio, FUSO_DO_CAMPUS);
  const fim = localParaIsoComOffset(r.fim, FUSO_DO_CAMPUS);
  if (inicio && fim) {
    consulta.inicio = inicio;
    consulta.fim = fim;
  }
  return consulta;
}

/** O servidor só aceita período com início e fim juntos. Devolve o campo que falta e a mensagem. */
export function periodoIncompleto(r: RascunhoDosFiltros): { campo: 'inicio' | 'fim'; mensagem: string } | null {
  if (r.inicio && !r.fim) return { campo: 'fim', mensagem: 'Informe também o fim do período.' };
  if (r.fim && !r.inicio) return { campo: 'inicio', mensagem: 'Informe também o início do período.' };
  return null;
}
