import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('as outras telas seguem como marcador de lugar até a aprovação do padrão', () => {
    entrarComo('RESPONSAVEL');

    montar('/aprovacoes');

    expect(screen.getByText('Esta tela será construída na etapa 6.C.')).toBeInTheDocument();
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
