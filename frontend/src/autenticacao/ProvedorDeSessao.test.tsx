import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { ProvedorDeSessao } from '@/autenticacao/ProvedorDeSessao';
import { useSessao } from '@/autenticacao/useSessao';
import { lerSessao } from '@/sessao/armazenamento';

const BASE = 'http://api.teste';
const LOGIN_OK = { token: 'token-novo', perfil: 'RESPONSAVEL', expiraEm: '2999-01-01T00:00:00Z' };

function resposta(status: number, corpo?: unknown): Response {
  return corpo === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

function Sonda() {
  const { sessao, entrar, sair, cliente } = useSessao();
  const [codigo, setCodigo] = useState('');
  return (
    <div>
      <p data-testid="perfil">{sessao?.perfil ?? 'nenhum'}</p>
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
});
