import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '@/api/schema';
import { lerSessao, limparSessao } from '@/sessao/armazenamento';

export interface OpcoesDoCliente {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Chamada quando uma rota autenticada responde 401: a sessão já foi apagada. */
  aoExpirarSessao?: () => void;
}

/** Rotas em que 401 significa credencial inválida, não sessão expirada. */
const ROTAS_SEM_SESSAO: readonly string[] = ['/api/auth/login'];

/**
 * Cliente da API tipado pelo contrato gerado (F6-01). O token vai no cabeçalho Authorization (ADR-004).
 * A segurança é do servidor: aqui o 401 só limpa a sessão local e avisa a interface.
 */
export function criarCliente(opcoes: OpcoesDoCliente) {
  const cliente = createClient<paths>({ baseUrl: opcoes.baseUrl, fetch: opcoes.fetch });
  const middleware: Middleware = {
    onRequest({ request }) {
      const sessao = lerSessao();
      if (sessao) {
        request.headers.set('Authorization', `Bearer ${sessao.token}`);
      }
      return request;
    },
    onResponse({ response, schemaPath }) {
      if (response.status === 401 && !ROTAS_SEM_SESSAO.includes(schemaPath)) {
        limparSessao();
        opcoes.aoExpirarSessao?.();
      }
      return response;
    },
  };
  cliente.use(middleware);
  return cliente;
}
