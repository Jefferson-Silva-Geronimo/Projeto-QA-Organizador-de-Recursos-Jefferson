import { criarCliente } from '@/api/cliente';
import { guardarSessao, lerSessao } from '@/sessao/armazenamento';
import { vi } from 'vitest';

const BASE = 'http://api.teste';

function respostaJson(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('criarCliente', () => {
  it('envia o token da sessão no cabeçalho Authorization (ADR-004)', async () => {
    guardarSessao({ token: 'token-de-teste', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    const falso = vi.fn(async (_entrada: RequestInfo | URL) => respostaJson(200, []));
    const cliente = criarCliente({ baseUrl: BASE, fetch: falso });

    await cliente.GET('/api/reservas');

    const pedido = falso.mock.calls[0]?.[0] as Request;
    expect(pedido.headers.get('Authorization')).toBe('Bearer token-de-teste');
  });

  it('sem sessão não envia Authorization', async () => {
    const falso = vi.fn(async (_entrada: RequestInfo | URL) => respostaJson(200, []));
    const cliente = criarCliente({ baseUrl: BASE, fetch: falso });

    await cliente.GET('/api/reservas');

    const pedido = falso.mock.calls[0]?.[0] as Request;
    expect(pedido.headers.has('Authorization')).toBe(false);
  });

  it('401 numa rota autenticada apaga a sessão e avisa a interface', async () => {
    guardarSessao({ token: 'token-de-teste', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    const aoExpirar = vi.fn();
    const cliente = criarCliente({
      baseUrl: BASE,
      fetch: async () => respostaJson(401, { code: 'NAO_AUTENTICADO' }),
      aoExpirarSessao: aoExpirar,
    });

    await cliente.GET('/api/reservas');

    expect(lerSessao()).toBeNull();
    expect(aoExpirar).toHaveBeenCalledTimes(1);
  });

  it('401 no login é credencial inválida, não sessão expirada', async () => {
    const aoExpirar = vi.fn();
    const cliente = criarCliente({
      baseUrl: BASE,
      fetch: async () => respostaJson(401, { code: 'CREDENCIAIS_INVALIDAS' }),
      aoExpirarSessao: aoExpirar,
    });

    await cliente.POST('/api/auth/login', { body: { email: 'a@exemplo.test', senha: 'x' } });

    expect(aoExpirar).not.toHaveBeenCalled();
  });
});
