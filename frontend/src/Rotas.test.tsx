import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProvedorDeSessao } from '@/autenticacao/ProvedorDeSessao';
import { mensagemPara } from '@/erros/mensagens';
import { Rotas } from '@/Rotas';
import { guardarSessao, lerSessao, type Perfil } from '@/sessao/armazenamento';

function entrarComo(perfil: Perfil) {
  guardarSessao({ token: 'token-de-teste', perfil, expiraEm: '2999-01-01T00:00:00Z' });
}

function montar(rota: string, fetchFalso: typeof fetch = async () => new Response(null, { status: 204 })) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ProvedorDeSessao baseUrl="http://api.teste" fetch={fetchFalso}>
        <MemoryRouter initialEntries={[rota]}>
          <Rotas />
        </MemoryRouter>
      </ProvedorDeSessao>
    </QueryClientProvider>,
  );
}

describe('Rotas', () => {
  it('sem sessão, a raiz leva à tela de entrada', () => {
    montar('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });

  it.each([
    ['SOLICITANTE', 'Buscar'],
    ['RESPONSAVEL', 'Aprovações'],
    ['ADMINISTRADOR', 'Catálogo'],
  ] as const)('com sessão de %s, a raiz leva à tela inicial %s', (perfil, titulo) => {
    entrarComo(perfil);

    montar('/');

    expect(screen.getByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
  });

  it('quem já tem sessão e abre a tela de entrada vai para a tela inicial do perfil', () => {
    entrarComo('RESPONSAVEL');

    montar('/entrar');

    expect(screen.getByRole('heading', { level: 1, name: 'Aprovações' })).toBeInTheDocument();
  });

  it('Responsável abrindo a tela de Usuários vê acesso negado, sem a tela', () => {
    entrarComo('RESPONSAVEL');

    montar('/usuarios');

    expect(screen.getByRole('alert')).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(screen.queryByRole('heading', { level: 1, name: 'Usuários' })).not.toBeInTheDocument();
  });

  it('Administrador abrindo Nova reserva vê acesso negado (RN-17)', () => {
    entrarComo('ADMINISTRADOR');

    montar('/reservas/nova');

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('endereço que não existe mostra a página não encontrada com caminho de volta', () => {
    entrarComo('SOLICITANTE');

    montar('/nao-existe');

    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/buscar');
  });

  it('as telas do perfil aparecem dentro da estrutura, com o nome do sistema e o botão Sair', () => {
    entrarComo('SOLICITANTE');

    montar('/buscar');

    expect(screen.getByText('Organização de Recursos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument();
  });

  it('a rota Buscar mostra a tela de busca de verdade, com os filtros, e não o marcador de lugar', () => {
    entrarComo('SOLICITANTE');

    montar('/buscar');

    expect(screen.getByRole('search', { name: 'Filtros da busca' })).toBeInTheDocument();
    expect(screen.queryByText('Esta tela será construída na etapa 6.C.')).not.toBeInTheDocument();
  });

  it('a rota Nova reserva mostra o formulário de verdade, e não o marcador de lugar', () => {
    entrarComo('SOLICITANTE');

    montar('/reservas/nova');

    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument();
    expect(screen.queryByText('Esta tela será construída na etapa 6.C.')).not.toBeInTheDocument();
  });

  it('a rota Reservas mostra a lista de verdade, e não o marcador de lugar', async () => {
    entrarComo('SOLICITANTE');

    montar('/reservas', async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));

    expect(await screen.findByText('Nenhuma reserva ainda')).toBeInTheDocument();
    expect(screen.queryByText('Esta tela será construída na etapa 6.C.')).not.toBeInTheDocument();
  });

  it.each(['SOLICITANTE', 'RESPONSAVEL'] as const)('%s abre a alteração de uma reserva em /reservas/:id/alterar', async (perfil) => {
    entrarComo(perfil);

    montar('/reservas/10/alterar', async () => new Response(null, { status: 404, headers: { 'Content-Type': 'application/json' } }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Alterar reserva' })).toBeInTheDocument();
    expect(screen.queryByText('Página não encontrada')).not.toBeInTheDocument();
  });

  it('Administrador abrindo a alteração de reserva vê acesso negado (RN-17)', () => {
    entrarComo('ADMINISTRADOR');

    montar('/reservas/10/alterar');

    expect(screen.getByRole('alert')).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(screen.queryByRole('heading', { level: 1, name: 'Alterar reserva' })).not.toBeInTheDocument();
  });

  it('a página de alteração tem título "Alterar reserva · Organização de Recursos"', () => {
    entrarComo('SOLICITANTE');

    montar('/reservas/10/alterar');

    expect(document.title).toBe('Alterar reserva · Organização de Recursos');
  });

  it('a rota Aprovações mostra a fila de verdade, e não o marcador de lugar', async () => {
    entrarComo('RESPONSAVEL');

    montar('/aprovacoes', async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));

    expect(await screen.findByText('Sem pendências')).toBeInTheDocument();
    expect(screen.queryByText('Esta tela será construída na etapa 6.C.')).not.toBeInTheDocument();
  });

  it.each(['SOLICITANTE', 'ADMINISTRADOR'] as const)(
    '%s abrindo a fila de aprovações vê acesso negado, sem a tela e sem consultar a fila',
    (perfil) => {
      entrarComo(perfil);
      const falso = vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));

      montar('/aprovacoes', falso);

      expect(screen.getByRole('alert')).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
      expect(screen.queryByRole('heading', { level: 1, name: 'Aprovações' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^(Aprovar|Rejeitar)/ })).not.toBeInTheDocument();
      expect(falso).not.toHaveBeenCalled();
    },
  );

  it('as outras telas seguem como marcador de lugar até a aprovação do padrão', () => {
    entrarComo('RESPONSAVEL');

    montar('/retiradas');

    expect(screen.getByText('Esta tela será construída na etapa 6.C.')).toBeInTheDocument();
  });

  it('ao trocar de tela pelo menu o foco vai para o conteúdo, para o teclado não ficar perdido', async () => {
    entrarComo('SOLICITANTE');
    montar('/buscar');

    await userEvent.click(within(screen.getByRole('navigation', { name: 'Menu principal' })).getByRole('link', { name: 'Reservas' }));

    await waitFor(() => expect(document.getElementById('conteudo')).toHaveFocus());
  });

  it('ao abrir a página o foco não é roubado pelo conteúdo', () => {
    entrarComo('SOLICITANTE');

    montar('/buscar');

    expect(document.getElementById('conteudo')).not.toHaveFocus();
  });

  it('mudar só o que está no endereço da mesma tela (os filtros) não move o foco', async () => {
    entrarComo('SOLICITANTE');
    montar('/buscar');
    await userEvent.type(await screen.findByLabelText('Local'), 'Bloco A');

    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(document.getElementById('conteudo')).not.toHaveFocus();
  });

  it.each([
    ['/buscar', 'Buscar'],
    ['/reservas/nova', 'Nova reserva'],
    ['/aprovacoes', 'Aprovações'],
    ['/nao-existe', 'Página não encontrada'],
  ])('a página %s tem o título "%s · Organização de Recursos"', (rota, titulo) => {
    entrarComo('RESPONSAVEL');

    montar(rota);

    expect(document.title).toBe(`${titulo} · Organização de Recursos`);
  });

  it.each([
    ['SOLICITANTE', '/aprovacoes'],
    ['ADMINISTRADOR', '/aprovacoes'],
    ['RESPONSAVEL', '/usuarios'],
    ['ADMINISTRADOR', '/reservas/10/alterar'],
  ] as const)('%s abrindo %s vê o título "Acesso negado" na página e na aba (BUG-018)', (perfil, rota) => {
    entrarComo(perfil);

    montar(rota);

    expect(screen.getByRole('heading', { level: 1, name: 'Acesso negado' })).toBeInTheDocument();
    expect(document.title).toBe('Acesso negado · Organização de Recursos');
  });

  it('a aba volta a ter o nome da tela quando o perfil pode vê-la', () => {
    entrarComo('RESPONSAVEL');

    montar('/aprovacoes');

    expect(document.title).toBe('Aprovações · Organização de Recursos');
  });

  it('a rota Entrar mostra o formulário de login de verdade, e não o marcador de lugar', () => {
    montar('/entrar');

    expect(screen.getByRole('form', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText('Esta tela será construída na etapa 6.C.')).not.toBeInTheDocument();
  });

  it.each([
    ['RESPONSAVEL', 'Aprovações'],
    ['ADMINISTRADOR', 'Catálogo'],
    ['SOLICITANTE', 'Buscar'],
  ] as const)('entrar como %s leva à tela inicial %s', async (perfil, titulo) => {
    montar('/entrar', async (entrada) => {
      const pedido = entrada as Request;
      return pedido.url.endsWith('/api/auth/login')
        ? new Response(JSON.stringify({ token: 't', perfil, expiraEm: '2999-01-01T00:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        : new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    await userEvent.type(screen.getByLabelText(/E-mail/), 'pessoa@exemplo.test');
    await userEvent.type(screen.getByLabelText(/Senha/), 'senha-de-teste-123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
  });

  it('depois de entrar o foco vai para o conteúdo, para o teclado não ficar no corpo da página (BUG-015)', async () => {
    montar('/entrar', async (entrada) => {
      const pedido = entrada as Request;
      return pedido.url.endsWith('/api/auth/login')
        ? new Response(JSON.stringify({ token: 't', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        : new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    await userEvent.type(screen.getByLabelText(/E-mail/), 'pessoa@exemplo.test');
    await userEvent.type(screen.getByLabelText(/Senha/), 'senha-de-teste-123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Buscar' })).toBeInTheDocument();
    await waitFor(() => expect(document.getElementById('conteudo')).toHaveFocus(), { timeout: 1000 });
  });

  it('quem foi mandado ao login volta para a tela que tentava abrir, com os filtros do endereço', async () => {
    montar('/reservas/nova?recursos=1', async (entrada) => {
      const pedido = entrada as Request;
      return pedido.url.endsWith('/api/auth/login')
        ? new Response(JSON.stringify({ token: 't', perfil: 'SOLICITANTE', expiraEm: '2999-01-01T00:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        : new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    expect(await screen.findByRole('form', { name: 'Entrar' })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/E-mail/), 'pessoa@exemplo.test');
    await userEvent.type(screen.getByLabelText(/Senha/), 'senha-de-teste-123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Nova reserva' })).toBeInTheDocument();
  });

  it('sessão que o servidor encerrou (401) leva ao login com o aviso de que terminou', async () => {
    entrarComo('SOLICITANTE');
    montar('/buscar', async () => new Response(JSON.stringify({ code: 'NAO_AUTENTICADO' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));

    const aviso = await screen.findByText('Sua sessão terminou. Entre novamente.');

    expect(aviso).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('sair por vontade própria não mostra o aviso de sessão terminada', async () => {
    entrarComo('SOLICITANTE');
    montar('/aprovacoes');

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('form', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText('Sua sessão terminou. Entre novamente.')).not.toBeInTheDocument();
  });

  it('a tela de entrada também tem título', () => {
    montar('/entrar');

    expect(document.title).toBe('Entrar · Organização de Recursos');
  });

  it('a tela de entrada não mostra o menu nem o botão Sair', () => {
    montar('/entrar');

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
  });

  it('Sair revoga a sessão no servidor, apaga a local e volta à tela de entrada', async () => {
    entrarComo('SOLICITANTE');
    const falso = vi.fn(async (_entrada: RequestInfo | URL) => new Response(null, { status: 204 }));
    montar('/buscar', falso);

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument());
    const enderecos = falso.mock.calls.map(([entrada]) => (entrada as Request).url);
    expect(enderecos).toContain('http://api.teste/api/auth/logout');
    expect(lerSessao()).toBeNull();
  });
});
