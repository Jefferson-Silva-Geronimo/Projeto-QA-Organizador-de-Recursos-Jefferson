import createClient, { type Middleware } from 'openapi-fetch';
import { MENSAGEM_DE_REDE, mensagemPara, type MensagemDeErro } from '@/erros/mensagens';
import { interpretarProblema, type ProblemaApi } from '@/erros/problema';
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

/** Erro de uma chamada à API, já com a mensagem compreensível e a ação sugerida (RF-13). */
export class ErroDeApi extends Error {
  readonly problema: ProblemaApi;
  readonly rede: boolean;
  readonly mensagem: MensagemDeErro;

  constructor(problema: ProblemaApi, rede: boolean) {
    super(problema.code);
    this.problema = problema;
    this.rede = rede;
    this.mensagem = rede ? MENSAGEM_DE_REDE : mensagemPara(problema.code);
  }
}

interface Resultado<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Espera a chamada e devolve o corpo de sucesso. Recusa do servidor e falha de rede viram ErroDeApi;
 * o texto cru do servidor nunca é guardado.
 */
export async function executar<T>(chamada: Promise<Resultado<T>>): Promise<T> {
  let resultado: Resultado<T>;
  try {
    resultado = await chamada;
  } catch {
    throw new ErroDeApi(interpretarProblema(0, null), true);
  }
  if (!resultado.response.ok) {
    throw new ErroDeApi(interpretarProblema(resultado.response.status, resultado.error), false);
  }
  return resultado.data as T;
}
