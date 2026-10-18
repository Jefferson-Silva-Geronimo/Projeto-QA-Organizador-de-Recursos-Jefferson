import { razaoDeContraste } from '@/estilo/contraste';
import { lerTemasDeCor } from '@/test/tokens';

type Par = [texto: string, fundo: string, minimo: number, uso: string];

const TEXTO = 4.5;
const COMPONENTE = 3;

/** Pares de cor que a interface usa. Texto exige 4,5:1; componente, foco e borda exigem 3:1 (WCAG AA). */
const PARES: Par[] = [
  ['texto', 'fundo', TEXTO, 'texto sobre o fundo'],
  ['texto', 'superficie', TEXTO, 'texto sobre cartão e tabela'],
  ['texto-suave', 'fundo', TEXTO, 'texto secundário sobre o fundo'],
  ['texto-suave', 'superficie', TEXTO, 'texto secundário sobre cartão'],
  ['sobre-destaque', 'destaque', TEXTO, 'texto do botão principal'],
  ['destaque-texto', 'fundo', TEXTO, 'link e ação em texto sobre o fundo'],
  ['destaque-texto', 'superficie', TEXTO, 'link e ação em texto sobre cartão'],
  ['destaque-texto', 'erro-fundo', TEXTO, 'ação em texto dentro de aviso de erro'],
  ['erro-texto', 'erro-fundo', TEXTO, 'mensagem de erro'],
  ['erro-texto', 'superficie', TEXTO, 'mensagem de erro sobre cartão'],
  ['sucesso-texto', 'sucesso-fundo', TEXTO, 'aviso de sucesso'],
  ['aviso-texto', 'aviso-fundo', TEXTO, 'aviso de atenção'],
  ['info-texto', 'info-fundo', TEXTO, 'aviso informativo'],
  ['destaque', 'fundo', COMPONENTE, 'botão principal sobre o fundo'],
  ['destaque', 'superficie', COMPONENTE, 'indicador de item ativo da navegação sobre o cartão'],
  ['foco', 'fundo', COMPONENTE, 'anel de foco sobre o fundo'],
  ['foco', 'superficie', COMPONENTE, 'anel de foco sobre o cartão'],
  ['foco', 'erro-fundo', COMPONENTE, 'anel de foco sobre aviso de erro'],
  ['borda-campo', 'superficie', COMPONENTE, 'borda de campo sobre o cartão'],
  ['borda-campo', 'fundo', COMPONENTE, 'borda de campo sobre o fundo'],
  ['erro-borda', 'superficie', COMPONENTE, 'borda de erro sobre o cartão'],
  ['erro-borda', 'fundo', COMPONENTE, 'borda de erro sobre o fundo'],
];

const temas = lerTemasDeCor();
const CASOS = (['claro', 'escuroPelaPreferencia', 'escuroPelaEscolha'] as const).flatMap((tema) =>
  PARES.map(([a, b, minimo, uso]) => [tema, a, b, minimo, uso] as const),
);

describe('contraste dos tokens de cor (WCAG AA)', () => {
  it.each(CASOS)('%s: %s sobre %s tem no mínimo %s:1 (%s)', (tema, a, b, minimo) => {
    const cores = temas[tema];

    expect(cores[a], `token ${a} definido em ${tema}`).toBeDefined();
    expect(cores[b], `token ${b} definido em ${tema}`).toBeDefined();
    expect(razaoDeContraste(cores[a] as string, cores[b] as string)).toBeGreaterThanOrEqual(minimo);
  });
});
