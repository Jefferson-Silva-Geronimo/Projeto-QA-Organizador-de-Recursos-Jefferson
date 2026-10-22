import { screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { ANA, CARLOS, JOAO, MARIA, montarUsuarios, recusa } from '@/test/usuarios';

describe('PaginaDeUsuarios: lista (T11, RF-15)', () => {
  it('o título da tela é Usuários', async () => {
    montarUsuarios();

    expect(await screen.findByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument();
  });

  it('mostra a contagem e um cartão por usuário, com nome, e-mail, perfil e situação', async () => {
    montarUsuarios();

    const maria = await screen.findByRole('article', { name: MARIA.nome });

    expect(screen.getByText('4 usuários')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(within(maria).getByText(MARIA.email)).toBeInTheDocument();
    expect(within(maria).getByText('Solicitante')).toBeInTheDocument();
    expect(within(maria).getByText('Ativo')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: CARLOS.nome })).getByText('Responsável')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: ANA.nome })).getByText('Administrador')).toBeInTheDocument();
  });

  it('um único usuário usa o singular', async () => {
    montarUsuarios({ usuarios: [ANA] });

    expect(await screen.findByText('1 usuário')).toBeInTheDocument();
  });

  it('o usuário desativado aparece como Desativado e sem ações', async () => {
    montarUsuarios();

    const joao = await screen.findByRole('article', { name: JOAO.nome });

    expect(within(joao).getByText('Desativado')).toBeInTheDocument();
    expect(within(joao).queryByRole('button')).not.toBeInTheDocument();
  });

  it('os usuários ativos têm Trocar perfil e Desativar, com o nome do usuário no nome do botão', async () => {
    montarUsuarios();

    const maria = await screen.findByRole('article', { name: MARIA.nome });

    expect(within(maria).getByRole('button', { name: 'Trocar perfil Maria Souza' })).toBeInTheDocument();
    expect(within(maria).getByRole('button', { name: 'Desativar Maria Souza' })).toBeInTheDocument();
  });

  it('enquanto consulta mostra o carregando', () => {
    montarUsuarios({ listar: () => new Promise<Response>(() => {}) });

    expect(screen.getByText('Carregando usuários…')).toBeInTheDocument();
  });

  it('sem usuários mostra o estado vazio', async () => {
    montarUsuarios({ usuarios: [] });

    expect(await screen.findByText('Nada cadastrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhum usuário cadastrado.')).toBeInTheDocument();
  });

  it('erro da consulta mostra a mensagem da tabela de erros e o botão de tentar de novo', async () => {
    montarUsuarios({ listar: () => recusa(403, 'ACESSO_NEGADO') });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument();
  });

  it('nenhuma senha aparece na tela', async () => {
    montarUsuarios();
    await screen.findByRole('article', { name: MARIA.nome });

    expect(screen.queryByText(/senha/i)).not.toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = montarUsuarios();
    await screen.findByRole('article', { name: MARIA.nome });

    expect(await axe(container)).toHaveNoViolations();
  });
});
