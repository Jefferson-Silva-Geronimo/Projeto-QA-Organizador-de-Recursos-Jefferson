import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeletorDeTema } from '@/layout/SeletorDeTema';

describe('SeletorDeTema', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-tema');
  });

  it('oferece Sistema, Claro e Escuro, com Sistema marcado quando não há escolha guardada', () => {
    render(<SeletorDeTema />);

    const grupo = screen.getByRole('group', { name: 'Tema' });
    expect(grupo).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sistema' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Escuro' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('escolher Escuro marca o documento, guarda só a escolha e atualiza o botão', async () => {
    render(<SeletorDeTema />);

    await userEvent.click(screen.getByRole('button', { name: 'Escuro' }));

    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
    expect(window.localStorage.getItem('tema')).toBe('escuro');
    expect(screen.getByRole('button', { name: 'Escuro' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sistema' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('lembra a escolha guardada ao ser montado de novo', () => {
    window.localStorage.setItem('tema', 'claro');

    render(<SeletorDeTema />);

    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'true');
  });
});
