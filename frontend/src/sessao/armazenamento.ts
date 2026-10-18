import type { components } from '@/api/schema';

export type Perfil = components['schemas']['LoginResposta']['perfil'];

export interface Sessao {
  token: string;
  perfil: Perfil;
  expiraEm: string;
}

const CHAVE = 'sessao';

export function guardarSessao(sessao: Sessao): void {
  window.sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
}

export function lerSessao(_agora: Date = new Date()): Sessao | null {
  const bruto = window.sessionStorage.getItem(CHAVE);
  return bruto === null ? null : (JSON.parse(bruto) as Sessao);
}

export function limparSessao(): void {
  // ainda não implementado
}
