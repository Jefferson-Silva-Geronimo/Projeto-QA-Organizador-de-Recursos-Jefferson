/** Problem Details devolvido pelo servidor (ADR-008). O texto cru do servidor nunca é guardado aqui. */
export interface ProblemaApi {
  status: number;
  code: string;
  itens: string[];
  campos: string[];
}

export function interpretarProblema(_status: number, _corpo: unknown): ProblemaApi {
  return { status: 0, code: '', itens: [], campos: [] };
}
