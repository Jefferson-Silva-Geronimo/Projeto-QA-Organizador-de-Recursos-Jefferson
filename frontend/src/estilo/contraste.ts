function canais(cor: string): [number, number, number] {
  let hex = cor.trim().replace(/^#/, '');
  if (hex.length === 3) {
    hex = [...hex].map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Cor inválida: ${cor}`);
  }
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function luminancia(cor: string): number {
  const [r, g, b] = canais(cor).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG 2.x entre duas cores hexadecimais (#RRGGBB ou #RGB). */
export function razaoDeContraste(corA: string, corB: string): number {
  const [maior, menor] = [luminancia(corA), luminancia(corB)].sort((x, y) => y - x) as [number, number];
  return (maior + 0.05) / (menor + 0.05);
}
