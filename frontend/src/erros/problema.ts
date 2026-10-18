/** Problem Details devolvido pelo servidor (ADR-008). O texto cru do servidor nunca é guardado aqui. */
export interface ProblemaApi {
  status: number;
  code: string;
  itens: string[];
  campos: string[];
}

function listaDeTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.map(String) : [];
}

export function interpretarProblema(status: number, corpo: unknown): ProblemaApi {
  const objeto = (corpo ?? {}) as Record<string, unknown>;
  return {
    status,
    code: typeof objeto.code === 'string' ? objeto.code : '',
    itens: listaDeTexto(objeto.itens),
    campos: listaDeTexto(objeto.campos),
  };
}
