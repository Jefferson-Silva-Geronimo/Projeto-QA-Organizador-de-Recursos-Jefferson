import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type TokensDoTema = Record<string, string>;

/** Devolve o texto entre as chaves do bloco que começa em `seletor`, a partir de `desde`. */
function corpoDoBloco(css: string, seletor: string, desde = 0): string {
  const inicio = css.indexOf(seletor, desde);
  if (inicio < 0) {
    return '';
  }
  const abre = css.indexOf('{', inicio);
  let nivel = 0;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === '{') nivel++;
    if (css[i] === '}') nivel--;
    if (nivel === 0) {
      return css.slice(abre + 1, i);
    }
  }
  return '';
}

function variaveis(corpo: string): TokensDoTema {
  const tokens: TokensDoTema = {};
  for (const m of corpo.matchAll(/--cor-([a-z-]+)\s*:\s*([^;]+);/g)) {
    tokens[m[1] as string] = (m[2] as string).trim();
  }
  return tokens;
}

export interface TemasDeCor {
  claro: TokensDoTema;
  escuroPelaPreferencia: TokensDoTema;
  escuroPelaEscolha: TokensDoTema;
}

/** Lê src/estilo/tokens.css e separa o tema claro e os dois blocos do tema escuro. */
export function lerTemasDeCor(): TemasDeCor {
  const css = readFileSync(resolve(__dirname, '../estilo/tokens.css'), 'utf-8').replace(/\r\n/g, '\n');
  const media = css.indexOf('@media (prefers-color-scheme: dark)');
  const corpoMedia = corpoDoBloco(css, '@media (prefers-color-scheme: dark)');
  return {
    claro: variaveis(corpoDoBloco(css, ':root {')),
    escuroPelaPreferencia: variaveis(corpoDoBloco(corpoMedia, ":root:not([data-tema='claro'])")),
    escuroPelaEscolha: variaveis(corpoDoBloco(css, ":root[data-tema='escuro']", media + 1)),
  };
}
