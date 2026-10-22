import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProvedorDeSessao } from '@/autenticacao/ProvedorDeSessao';
import { useSessao } from '@/autenticacao/useSessao';
import { mensagemPara } from '@/erros/mensagens';
import { RotaProtegida } from '@/rotas/RotaProtegida';
import { guardarSessao, type Perfil } from '@/sessao/armazenamento';

function entrarComo(perfil: Perfil) {
  guardarSessao({ token: 'token-de-teste', perfil, expiraEm: '2999-01-01T00:00:00Z' });
}

function Consulta() {
  const { cliente } = useSessao();
  return (
    <button type="button" onClick={() => void cliente.GET('/api/reservas')}>
      consultar
    </button>
  );
}

function montar(perfis?: readonly Perfil[], fetchFalso: typeof fetch = async () => new Response('[]')) {
  return render(
    <ProvedorDeSessao baseUrl="http://api.teste" fetch={fetchFalso}>
      <MemoryRouter initialEntries={['/aprovacoes']}>
        <Routes>
          <Route path="/entrar" element={<p>Tela de entrada</p>} />
          <Route
            path="/aprovacoes"
            element={
              <RotaProtegida perfis={perfis}>
                <p>Fila de aprovações</p>
                <Consulta />
              </RotaProtegida>
            }
          />
        </Routes>
      </MemoryRouter>
    </ProvedorDeSessao>,
  );
}

describe('RotaProtegida (conveniência de interface: o servidor decide o acesso)', () => {
  it('sem sessão leva à tela de entrada e não mostra o conteúdo', () => {
    montar(['RESPONSAVEL']);

    expect(screen.getByText('Tela de entrada')).toBeInTheDocument();
    expect(screen.queryByText('Fila de aprovações')).not.toBeInTheDocument();
  });

  it('perfil permitido vê a tela', () => {
    entrarComo('RESPONSAVEL');

    montar(['RESPONSAVEL']);

    expect(screen.getByText('Fila de aprovações')).toBeInTheDocument();
  });

  it('perfil não permitido vê a mensagem de acesso negado da tabela de erros, sem o conteúdo', () => {
    entrarComo('SOLICITANTE');

    montar(['RESPONSAVEL']);

    expect(screen.queryByText('Fila de aprovações')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(screen.getByRole('alert')).toHaveTextContent(mensagemPara('ACESSO_NEGADO').acao);
  });

  it('a tela de acesso negado tem o título de página "Acesso negado" (h1) e a mensagem da tabela continua abaixo dele (BUG-018)', () => {
    entrarComo('SOLICITANTE');

    montar(['RESPONSAVEL']);

    const titulo = screen.getByRole('heading', { level: 1, name: 'Acesso negado' });
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').acao);
    expect(titulo.compareDocumentPosition(alerta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('perfil permitido não vê o título de acesso negado', () => {
    entrarComo('RESPONSAVEL');

    montar(['RESPONSAVEL']);

    expect(screen.queryByRole('heading', { name: 'Acesso negado' })).not.toBeInTheDocument();
  });

  it('sem lista de perfis, qualquer usuário com sessão vê a tela', () => {
    entrarComo('ADMINISTRADOR');

    montar();

    expect(screen.getByText('Fila de aprovações')).toBeInTheDocument();
  });

  it('depois de um 401 a sessão some e a pessoa volta para a tela de entrada', async () => {
    entrarComo('RESPONSAVEL');
    montar(['RESPONSAVEL'], async () => new Response(JSON.stringify({ code: 'NAO_AUTENTICADO' }), { status: 401 }));

    await userEvent.click(screen.getByRole('button', { name: 'consultar' }));

    await waitFor(() => expect(screen.getByText('Tela de entrada')).toBeInTheDocument());
  });
});
