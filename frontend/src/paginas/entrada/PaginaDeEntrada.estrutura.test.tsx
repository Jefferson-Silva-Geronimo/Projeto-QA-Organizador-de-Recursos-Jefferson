import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { PaginaDeEntrada } from '@/paginas/entrada/PaginaDeEntrada';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';

function montar() {
  const falso = rotearFetch({ 'POST /api/auth/login': () => resposta(401, { status: 401, code: 'CREDENCIAIS_INVALIDAS' }) });
  const { container } = montarPagina({
    rota: '/entrar',
    caminho: '/entrar',
    elemento: <PaginaDeEntrada />,
    fetch: falso,
    perfil: null,
  });
  return { falso, container };
}

describe('PaginaDeEntrada: estrutura', () => {
  it('tem o nome do sistema, o título Entrar, e-mail, senha e o botão Entrar', () => {
    montar();

    expect(screen.getByText('Organização de Recursos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toBeRequired();
    expect(screen.getByLabelText(/Senha/)).toBeRequired();
    expect(screen.getAllByText('(obrigatório)')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute('type', 'submit');
  });

  it('os campos avisam o navegador e o gerenciador de senhas (autocomplete) sem corrigir o que a pessoa digita', () => {
    montar();

    const email = screen.getByLabelText(/E-mail/);
    const senha = screen.getByLabelText(/Senha/);
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'username');
    expect(email).toHaveAttribute('autocapitalize', 'none');
    expect(email).toHaveAttribute('spellcheck', 'false');
    expect(senha).toHaveAttribute('type', 'password');
    expect(senha).toHaveAttribute('autocomplete', 'current-password');
  });

  it('o formulário é um só, com nome, e o título da tela o nomeia', () => {
    montar();

    expect(screen.getByRole('form', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('oferece trocar o tema antes de entrar', () => {
    montar();

    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument();
  });

  it('a senha começa escondida e Mostrar senha alterna, sem perder o que foi digitado', async () => {
    montar();
    const senha = screen.getByLabelText(/Senha/);
    await userEvent.type(senha, 'segredo-de-teste');
    const botao = screen.getByRole('button', { name: 'Mostrar senha' });
    expect(botao).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(botao);

    expect(senha).toHaveAttribute('type', 'text');
    expect(senha).toHaveValue('segredo-de-teste');
    expect(botao).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(botao);

    expect(senha).toHaveAttribute('type', 'password');
  });

  it('a tela não tem violação de acessibilidade (axe)', async () => {
    const { container } = montar();

    expect(await axe(container)).toHaveNoViolations();
  });
});
