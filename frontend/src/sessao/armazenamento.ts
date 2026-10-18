import type { components } from '@/api/schema';

export type Perfil = components['schemas']['LoginResposta']['perfil'];

export interface Sessao {
  token: string;
  perfil: Perfil;
  expiraEm: string;
}

export function guardarSessao(_sessao: Sessao): void {
  // ainda não implementado
}

export function lerSessao(_agora: Date = new Date()): Sessao | null {
  return null;
}

export function limparSessao(): void {
  // ainda não implementado
}
