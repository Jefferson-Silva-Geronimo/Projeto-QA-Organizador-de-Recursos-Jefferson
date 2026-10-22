import { FUSO_DO_CAMPUS, diaNoCampus } from '@/datas/fuso';
import type { ConsultaDaAuditoria, EntidadeAuditada, EventoDeAuditoria } from '@/auditoria/consulta';

/** O que a pessoa escolheu nos filtros. Tudo é texto, como nos campos; o período é em dias do campus. */
export interface FiltrosDaAuditoria {
  /** Número da reserva (Responsável). */
  reserva: string;
  /** Entidade e número dela (Administrador). */
  entidade: '' | EntidadeAuditada;
  numero: string;
  /** Período, filtrado na tela (L-03): "2026-10-21". */
  de: string;
  ate: string;
}

export const FILTROS_VAZIOS: FiltrosDaAuditoria = { reserva: '', entidade: '', numero: '', de: '', ate: '' };

export const ENTIDADES: readonly EntidadeAuditada[] = ['RESERVA', 'RECURSO', 'USUARIO', 'BLOQUEIO', 'CONFIGURACAO'];

/** Lê os filtros do endereço. Entidade desconhecida é ignorada, nunca enviada ao servidor. */
export function filtrosDoEndereco(params: URLSearchParams): FiltrosDaAuditoria {
  const entidade = params.get('entidade') ?? '';
  return {
    reserva: params.get('reserva') ?? '',
    entidade: (ENTIDADES.includes(entidade as EntidadeAuditada) ? entidade : '') as FiltrosDaAuditoria['entidade'],
    numero: params.get('numero') ?? '',
    de: params.get('de') ?? '',
    ate: params.get('ate') ?? '',
  };
}

/** Endereço com só os filtros preenchidos. */
export function enderecoDosFiltros(f: FiltrosDaAuditoria): URLSearchParams {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(f)) {
    if (valor.trim() !== '') {
      params.set(chave, valor.trim());
    }
  }
  return params;
}

function inteiroPositivo(texto: string): number | null {
  const numero = Number(texto);
  return texto.trim() !== '' && Number.isInteger(numero) && numero > 0 ? numero : null;
}

/** Número da reserva para o histórico do Responsável. Sem número válido não há consulta. */
export function reservaDoFiltro(f: FiltrosDaAuditoria): number | null {
  return inteiroPositivo(f.reserva);
}

/** Consulta da auditoria completa. O número só vai com a entidade; sem entidade a consulta é a auditoria inteira. */
export function consultaDoFiltro(f: FiltrosDaAuditoria): ConsultaDaAuditoria {
  const entidadeId = inteiroPositivo(f.numero);
  return {
    ...(f.entidade ? { entidade: f.entidade } : {}),
    ...(entidadeId !== null ? { entidadeId } : {}),
  };
}

/** Período na tela: o dia do evento, na hora do campus, precisa estar entre De e Até (os dois inclusive). */
export function dentroDoPeriodo(evento: EventoDeAuditoria, f: FiltrosDaAuditoria): boolean {
  const dia = diaNoCampus(evento.ocorridoEm, FUSO_DO_CAMPUS);
  return (!f.de || dia >= f.de) && (!f.ate || dia <= f.ate);
}
