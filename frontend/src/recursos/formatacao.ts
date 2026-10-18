const NOMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'] as const;

/** Dias de funcionamento (1 = segunda a 7 = domingo) em texto: "de segunda a sexta", "segunda, quarta e sexta". */
export function descreverDias(dias: number[]): string {
  const ordenados = [...new Set(dias)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (ordenados.length === 0) {
    return '';
  }
  if (ordenados.length === 7) {
    return 'todos os dias';
  }
  const nome = (d: number) => NOMES[d - 1] as string;
  const primeiro = ordenados[0] as number;
  const ultimo = ordenados[ordenados.length - 1] as number;
  const seguidos = ultimo - primeiro + 1 === ordenados.length;
  if (seguidos && ordenados.length >= 3) {
    return `de ${nome(primeiro)} a ${nome(ultimo)}`;
  }
  const textos = ordenados.map(nome);
  if (textos.length === 1) {
    return `só ${textos[0]}`;
  }
  return `${textos.slice(0, -1).join(', ')} e ${textos[textos.length - 1]}`;
}

export const ROTULO_DO_TIPO = { SALA: 'Sala', PROFESSOR: 'Professor', MATERIAL: 'Material' } as const;
