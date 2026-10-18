export type EscolhaDeTema = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'tema';

export function lerEscolhaDeTema(): EscolhaDeTema {
  return document.documentElement.getAttribute('data-tema') as EscolhaDeTema;
}

export function escolherTema(escolha: EscolhaDeTema): void {
  document.documentElement.setAttribute('data-tema', escolha);
  window.localStorage.setItem(CHAVE, escolha);
}
