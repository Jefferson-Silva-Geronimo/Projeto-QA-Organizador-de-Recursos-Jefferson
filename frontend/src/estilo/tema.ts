export type EscolhaDeTema = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'tema';
const ESCOLHAS: readonly EscolhaDeTema[] = ['sistema', 'claro', 'escuro'];

/**
 * Tema claro, escuro ou o do sistema (F6-09). Só a escolha fica no navegador (localStorage), sem dado pessoal.
 * Sem escolha, o atributo data-tema não existe e vale prefers-color-scheme (ver tokens.css).
 */
export function lerEscolhaDeTema(): EscolhaDeTema {
  try {
    const guardada = window.localStorage.getItem(CHAVE);
    return ESCOLHAS.find((e) => e === guardada) ?? 'sistema';
  } catch {
    return 'sistema';
  }
}

function marcarDocumento(escolha: EscolhaDeTema): void {
  if (escolha === 'sistema') {
    document.documentElement.removeAttribute('data-tema');
  } else {
    document.documentElement.setAttribute('data-tema', escolha);
  }
}

export function escolherTema(escolha: EscolhaDeTema): void {
  marcarDocumento(escolha);
  try {
    if (escolha === 'sistema') {
      window.localStorage.removeItem(CHAVE);
    } else {
      window.localStorage.setItem(CHAVE, escolha);
    }
  } catch {
    // sem armazenamento a escolha vale só até recarregar a página
  }
}

/** Chamada uma vez ao abrir a página, antes de desenhar a interface. */
export function aplicarTemaGuardado(): void {
  marcarDocumento(lerEscolhaDeTema());
}
