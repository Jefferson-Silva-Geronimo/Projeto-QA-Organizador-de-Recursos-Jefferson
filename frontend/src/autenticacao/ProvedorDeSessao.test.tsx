import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { ErroDeApi } from '@/api/cliente';
import { ProvedorDeSessao } from '@/autenticacao/ProvedorDeSessao';
import { useSessao } from '@/autenticacao/useSessao';
import { guardarSessao, lerSessao } from '@/sessao/armazenamento';

const BASE = 'http://api.teste';
const LOGIN_OK = { token: 'token-novo', perfil: 'RESPONSAVEL', expiraEm: '2999-01-01T00:00:00Z' };

function resposta(status: number, corpo?: unknown): Response {
  return corpo === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

function Sonda() {
  const { sessao, sessaoExpirou, entrar, sair, cliente } = useSessao();
  const [codigo, setCodigo] = useState('');
  return (
    <div>
      <p data-testid="perfil">{sessao?.perfil ?? 'nenhum'}</p>
      <p data-testid="expirou">{String(sessaoExpirou)}</p>
      <p data-testid="codigo">{codigo}</p>
      <button type="button" onClick={() => entrar('r@exemplo.test', 'senha').catch((e: unknown) => setCodigo((e as ErroDeApi).problema.code))}>
        entrar
      </button>
      <button type="button" onClick={() => void sair()}>
        sair
      </button>
      <button type="button" onClick={() => void cliente.GET('/api/reservas')}>
        consultar
      </button>
    </div>
  );
}

function montar(fetchFalso: typeof fetch) {
  return render(
    <ProvedorDeSessao baseUrl={BASE} fetch={fetchFalso}>
      <Sonda />
    </ProvedorDeSessao>,
  );
}

describe('ProvedorDeSessao', () => {
  it('entrar com credenciais válidas guarda a sessão e atualiza o contexto', async () => {
    montar(async () => resposta(200, LOGIN_OK));

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => expect(screen.getByTestId('perfil')).toHaveTextContent('RESPONSAVEL'));
    expect(lerSessao()).toEqual(LOGIN_OK);
  });

  it('credencial inválida lança ErroDeApi com o código estável e não guarda sessão', async () => {
    montar(async () => resposta(401, { status: 401, code: 'CREDENCIAIS_INVALIDAS' }));

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => expect(screen.getByTestId('codigo')).toHaveTextContent('CREDENCIAIS_INVALIDAS'));
    expect(screen.getByTestId('perfil')).toHaveTextContent('nenhum');
    expect(lerSessao()).toBeNull();
  });

  it('login que volta sem token é tratado como erro, nunca como sessão', async () => {
    montar(async () => resposta(200, {}));

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => expect(screen.getByTestId('codigo')).toBeInTheDocument());
    expect(screen.getByTestId('perfil')).toHaveTextContent('nenhum');
    expect(lerSessao()).toBeNull();
  });

  it('ao abrir a página retoma a sessão que está no sessionStorage', () => {
    guardarSessao({ token: 'token-antigo', perfil: 'ADMINISTRADOR', expiraEm: '2999-01-01T00:00:00Z' });

    montar(async () => resposta(200, []));

    expect(screen.getByTestId('perfil')).toHaveTextContent('ADMINISTRADOR');
  });

  it('sair avisa o servidor com o token, apaga a sessão e zera o contexto', async () => {
    guardarSessao({ token: 'token-antigo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    const falso = vi.fn(async (_entrada: RequestInfo | URL) => resposta(204));
    montar(falso);

    await userEvent.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(screen.getByTestId('perfil')).toHaveTextContent('nenhum'));
    const pedido = falso.mock.calls[0]?.[0] as Request;
    expect(pedido.url).toBe(`${BASE}/api/auth/logout`);
    expect(pedido.headers.get('Authorization')).toBe('Bearer token-antigo');
    expect(lerSessao()).toBeNull();
  });

  it('sair apaga a sessão local mesmo que o servidor não responda', async () => {
    guardarSessao({ token: 'token-antigo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    montar(async () => {
      throw new TypeError('Failed to fetch');
    });

    await userEvent.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(screen.getByTestId('perfil')).toHaveTextContent('nenhum'));
    expect(lerSessao()).toBeNull();
  });

  it('401 numa chamada qualquer zera a sessão do contexto (sessão expirada ou revogada)', async () => {
    guardarSessao({ token: 'token-antigo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    montar(async () => resposta(401, { status: 401, code: 'NAO_AUTENTICADO' }));

    await userEvent.click(screen.getByRole('button', { name: 'consultar' }));

    await waitFor(() => expect(screen.getByTestId('perfil')).toHaveTextContent('nenhum'));
    expect(lerSessao()).toBeNull();
  });

  it('na abertura a sessão não expirou', () => {
    montar(async () => resposta(200, []));

    expect(screen.getByTestId('expirou')).toHaveTextContent('false');
  });

  it('401 numa chamada com sessão marca a sessão como expirada', async () => {
    guardarSessao({ token: 'token-antigo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    montar(async () => resposta(401, { status: 401, code: 'NAO_AUTENTICADO' }));

    await userEvent.click(screen.getByRole('button', { name: 'consultar' }));

    await waitFor(() => expect(screen.getByTestId('expirou')).toHaveTextContent('true'));
  });

  it('sair por vontade própria não conta como sessão expirada', async () => {
    guardarSessao({ token: 'token-antigo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    montar(async () => resposta(204));

    await userEvent.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(screen.getByTestId('perfil')).toHaveTextContent('nenhum'));
    expect(screen.getByTestId('expirou')).toHaveTextContent('false');
  });

  it('entrar de novo limpa a marca de expirada', async () => {
    guardarSessao({ token: 'token-antigo', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' });
    let chamadas = 0;
    montar(async () => (++chamadas === 1 ? resposta(401, { code: 'NAO_AUTENTICADO' }) : resposta(200, LOGIN_OK)));
    await userEvent.click(screen.getByRole('button', { name: 'consultar' }));
    await waitFor(() => expect(screen.getByTestId('expirou')).toHaveTextContent('true'));

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }));

    await waitFor(() => expect(screen.getByTestId('perfil')).toHaveTextContent('RESPONSAVEL'));
    expect(screen.getByTestId('expirou')).toHaveTextContent('false');
  });
});

