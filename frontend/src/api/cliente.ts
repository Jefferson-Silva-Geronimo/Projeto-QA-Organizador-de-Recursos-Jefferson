import createClient from 'openapi-fetch';
import type { paths } from '@/api/schema';

export interface OpcoesDoCliente {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Chamada quando uma rota autenticada responde 401: a sessão já foi apagada. */
  aoExpirarSessao?: () => void;
}

export function criarCliente(opcoes: OpcoesDoCliente) {
  return createClient<paths>({ baseUrl: opcoes.baseUrl, fetch: opcoes.fetch });
}
