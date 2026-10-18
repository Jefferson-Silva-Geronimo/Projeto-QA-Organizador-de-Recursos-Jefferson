import type { components } from '@/api/schema';

export type Perfil = components['schemas']['LoginResposta']['perfil'];

export interface Sessao {
  token: string;
  perfil: Perfil;
  expiraEm: string;
}

const CHAVE = 'sessao';
const PERFIS: readonly string[] = ['SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR'] satisfies Perfil[];

/**
 * Único módulo que toca o armazenamento do token (ADR-015, F6-02). O token é opaco e revogável no servidor;
 * aqui ele só sobrevive ao recarregar a página, nunca à aba.
 */
export function guardarSessao(sessao: Sessao): void {
  window.sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
}

/** O instante de expiração é só conveniência de interface: quem decide a validade é o servidor. */
export function lerSessao(agora: Date = new Date()): Sessao | null {
  const bruto = window.sessionStorage.getItem(CHAVE);
  if (bruto === null) {
    return null;
  }
  const sessao = interpretar(bruto);
  if (sessao === null || new Date(sessao.expiraEm).getTime() <= agora.getTime()) {
    limparSessao();
    return null;
  }
  return sessao;
}

export function limparSessao(): void {
  window.sessionStorage.removeItem(CHAVE);
}

function interpretar(bruto: string): Sessao | null {
  try {
    const valor: unknown = JSON.parse(bruto);
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const { token, perfil, expiraEm } = valor as Record<string, unknown>;
    const valido =
      typeof token === 'string' &&
      token !== '' &&
      typeof perfil === 'string' &&
      PERFIS.includes(perfil) &&
      typeof expiraEm === 'string' &&
      !Number.isNaN(new Date(expiraEm).getTime());
    return valido ? { token, perfil: perfil as Perfil, expiraEm } : null;
  } catch {
    return null;
  }
}
