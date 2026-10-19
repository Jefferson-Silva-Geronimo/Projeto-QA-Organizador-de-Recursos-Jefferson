import { rotaInicial } from '@/rotas/navegacao';
import { TELAS } from '@/rotas/telas';
import type { Perfil } from '@/sessao/armazenamento';

const ORIGEM_FALSA = 'http://interno.invalido';

/**
 * Para onde ir depois de entrar: a tela que a pessoa tentava abrir, ou a inicial do perfil.
 * A origem vem do estado do roteador, mas é validada mesmo assim: só endereço interno de uma tela que o perfil vê.
 * Isso evita redirecionamento aberto (OWASP A01); é conveniência de interface, a autorização continua no servidor.
 */
export function destinoDepoisDoLogin(estado: unknown, perfil: Perfil): string {
  const inicial = rotaInicial(perfil);
  const de = (estado as { de?: unknown } | null | undefined)?.de;
  if (typeof de !== 'string' || !de.startsWith('/') || de.startsWith('//') || de.includes('\\')) {
    return inicial;
  }
  let url: URL;
  try {
    url = new URL(de, ORIGEM_FALSA);
  } catch {
    return inicial;
  }
  const tela = TELAS.find((t) => t.id !== 'T01' && t.caminho === url.pathname);
  if (url.origin !== ORIGEM_FALSA || !tela?.perfis.includes(perfil)) {
    return inicial;
  }
  return url.pathname + url.search;
}
