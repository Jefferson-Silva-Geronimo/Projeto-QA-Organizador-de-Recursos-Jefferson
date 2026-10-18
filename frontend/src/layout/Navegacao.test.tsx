import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Navegacao } from '@/layout/Navegacao';
import { telasDoPerfil } from '@/rotas/telas';
import type { Perfil } from '@/sessao/armazenamento';

function montar(perfil: Perfil, rota = '/buscar') {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Navegacao telas={telasDoPerfil(perfil)} />
    </MemoryRouter>,
  );
}

const lateral = () => within(screen.getByRole('navigation', { name: 'Menu principal' }));
const barra = () => within(screen.getByRole('navigation', { name: 'Menu principal (celular)' }));

describe('Navegacao', () => {
  it('o menu lateral lista todas as telas do perfil, cada uma com rótulo de texto', () => {
    montar('RESPONSAVEL');

    const nomes = lateral()
      .getAllByRole('link')
      .map((l) => l.textContent);

    expect(nomes).toEqual(telasDoPerfil('RESPONSAVEL').map((t) => t.rotulo));
  });

  it('a tela atual é marcada com aria-current="page" e as outras não', () => {
    montar('RESPONSAVEL', '/aprovacoes');

    expect(lateral().getByRole('link', { name: 'Aprovações' })).toHaveAttribute('aria-current', 'page');
    expect(lateral().getByRole('link', { name: 'Buscar' })).not.toHaveAttribute('aria-current');
  });

  it('a barra do celular de quem tem 4 telas mostra as 4 e não tem "Mais"', () => {
    montar('SOLICITANTE');

    expect(barra().getAllByRole('link')).toHaveLength(4);
    expect(barra().queryByRole('button', { name: 'Mais' })).not.toBeInTheDocument();
  });

  it('a barra do celular de quem tem mais de 4 telas mostra 4 e o botão "Mais" fechado', () => {
    montar('RESPONSAVEL');

    expect(barra().getAllByRole('link')).toHaveLength(4);
    expect(barra().getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('"Mais" abre a lista das demais telas, e escolher uma delas fecha a lista', async () => {
    montar('ADMINISTRADOR');
    const mais = barra().getByRole('button', { name: 'Mais' });

    await userEvent.click(mais);

    expect(mais).toHaveAttribute('aria-expanded', 'true');
    const restantes = telasDoPerfil('ADMINISTRADOR').slice(4);
    const lista = within(screen.getByRole('list', { name: 'Mais telas' }));
    expect(lista.getAllByRole('link').map((l) => l.textContent)).toEqual(restantes.map((t) => t.rotulo));

    await userEvent.click(lista.getAllByRole('link')[0] as HTMLElement);
    expect(screen.queryByRole('list', { name: 'Mais telas' })).not.toBeInTheDocument();
  });

  it('Escape fecha "Mais" e devolve o foco ao botão', async () => {
    montar('RESPONSAVEL');
    const mais = barra().getByRole('button', { name: 'Mais' });
    await userEvent.click(mais);

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('list', { name: 'Mais telas' })).not.toBeInTheDocument();
    expect(mais).toHaveFocus();
  });

  it('quando a tela atual está dentro de "Mais", o botão aparece como ativo', () => {
    montar('RESPONSAVEL', '/relatorios');

    expect(barra().getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-current', 'true');
  });
});
