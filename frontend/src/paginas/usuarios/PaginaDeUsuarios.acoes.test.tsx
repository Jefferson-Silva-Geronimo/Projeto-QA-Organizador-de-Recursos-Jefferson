import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mensagemPara } from '@/erros/mensagens';
import { MARIA, montarUsuarios, recusa } from '@/test/usuarios';

async function cartaoDe(nome: string) {
  return screen.findByRole('article', { name: nome });
}

async function abrirTroca(nome = 'Maria Souza') {
  const abridor = within(await cartaoDe(nome)).getByRole('button', { name: `Trocar perfil ${nome}` });
  await userEvent.click(abridor);
  return { abridor, dialogo: await screen.findByRole('dialog') };
}

async function abrirDesativacao(nome = 'Maria Souza') {
  const abridor = within(await cartaoDe(nome)).getByRole('button', { name: `Desativar ${nome}` });
  await userEvent.click(abridor);
  return { abridor, dialogo: await screen.findByRole('dialog') };
}

describe('PaginaDeUsuarios: trocar perfil (RF-15)', () => {
  it('abre um diálogo modal com o perfil atual escolhido e o foco na lista de perfis', async () => {
    montarUsuarios();

    const { dialogo } = await abrirTroca();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Trocar perfil');
    expect(dialogo).toHaveAccessibleDescription(/Maria Souza/);
    expect(within(dialogo).getByLabelText('Perfil')).toHaveValue(MARIA.perfil);
    expect(within(dialogo).getByLabelText('Perfil')).toHaveFocus();
  });

  it('envia o perfil escolhido, anuncia com o foco e a lista mostra o perfil novo', async () => {
    const { estado } = montarUsuarios();
    const { dialogo } = await abrirTroca();

    await userEvent.selectOptions(within(dialogo).getByLabelText('Perfil'), 'RESPONSAVEL');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar perfil' }));

    const texto = await screen.findByText('Perfil de "Maria Souza" agora é Responsável.');
    await waitFor(() => expect(texto.closest('[role="status"]')).toHaveFocus());
    expect(estado.chamadas).toEqual([{ rota: 'perfil:2', corpo: { perfil: 'RESPONSAVEL' } }]);
    await waitFor(() => expect(within(screen.getByRole('article', { name: 'Maria Souza' })).getByText('Responsável')).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enquanto envia, um clique duplo envia um único pedido', async () => {
    const { estado } = montarUsuarios({ responder: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrirTroca();
    await userEvent.selectOptions(within(dialogo).getByLabelText('Perfil'), 'ADMINISTRADOR');

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Salvar perfil' }));

    expect(within(dialogo).getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it.each(['MINIMO_DE_RESPONSAVEIS', 'ACESSO_NEGADO', 'NAO_ENCONTRADO'])(
    '%s: a mensagem e a ação da tabela de erros aparecem no diálogo, com o foco, e o perfil não muda',
    async (code) => {
      montarUsuarios({ responder: () => recusa(code === 'ACESSO_NEGADO' ? 403 : code === 'NAO_ENCONTRADO' ? 404 : 409, code) });
      const { dialogo } = await abrirTroca('Carlos Lima');

      await userEvent.selectOptions(within(dialogo).getByLabelText('Perfil'), 'SOLICITANTE');
      await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar perfil' }));

      const alerta = await within(dialogo).findByRole('alert');
      expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
      expect(alerta).toHaveTextContent(mensagemPara(code).acao);
      expect(alerta).toHaveFocus();
      expect(within(dialogo).getByRole('button', { name: 'Salvar perfil' })).toBeEnabled();
      expect(within(screen.getByRole('article', { name: 'Carlos Lima' })).getByText('Responsável')).toBeInTheDocument();
    },
  );

  it('Escape fecha o diálogo e devolve o foco ao botão que o abriu', async () => {
    montarUsuarios();
    const { abridor } = await abrirTroca();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(abridor).toHaveFocus();
  });
});

describe('PaginaDeUsuarios: desativar (irreversível, com confirmação)', () => {
  it('abre um diálogo modal que diz que as sessões do usuário serão encerradas', async () => {
    montarUsuarios();

    const { dialogo } = await abrirDesativacao();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Desativar este usuário?');
    expect(dialogo).toHaveAccessibleDescription(/Maria Souza/);
    expect(dialogo).toHaveAccessibleDescription(/sessões/);
    expect(within(dialogo).getByRole('button', { name: 'Confirmar desativação' })).toHaveFocus();
  });

  it('confirmar desativa, anuncia com o foco e o cartão passa a Desativado, sem ações', async () => {
    const { estado } = montarUsuarios();
    const { dialogo } = await abrirDesativacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    const texto = await screen.findByText('Usuário "Maria Souza" desativado.');
    await waitFor(() => expect(texto.closest('[role="status"]')).toHaveFocus());
    expect(estado.chamadas).toEqual([{ rota: 'desativacao:2', corpo: {} }]);
    const cartao = await cartaoDe('Maria Souza');
    await waitFor(() => expect(within(cartao).getByText('Desativado')).toBeInTheDocument());
    expect(within(cartao).queryByRole('button')).not.toBeInTheDocument();
  });

  it('USUARIO_COM_RESERVA_FUTURA: mostra a mensagem, a ação e a lista de reservas afetadas que veio do servidor', async () => {
    montarUsuarios({ responder: () => recusa(409, 'USUARIO_COM_RESERVA_FUTURA', { itens: [41, 44] }) });
    const { dialogo } = await abrirDesativacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    const alerta = await within(dialogo).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('USUARIO_COM_RESERVA_FUTURA').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('USUARIO_COM_RESERVA_FUTURA').acao);
    expect(alerta).toHaveFocus();
    expect(within(dialogo).getByText('Reservas afetadas: nº 41, nº 44')).toBeInTheDocument();
    expect(within(await cartaoDe('Maria Souza')).getByText('Ativo')).toBeInTheDocument();
  });

  it('MINIMO_DE_RESPONSAVEIS: mostra a mensagem e a ação, sem lista de reservas', async () => {
    montarUsuarios({ responder: () => recusa(409, 'MINIMO_DE_RESPONSAVEIS') });
    const { dialogo } = await abrirDesativacao('Carlos Lima');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    const alerta = await within(dialogo).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('MINIMO_DE_RESPONSAVEIS').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('MINIMO_DE_RESPONSAVEIS').acao);
    expect(within(dialogo).queryByText(/Reservas afetadas/)).not.toBeInTheDocument();
  });

  it('enquanto envia, um clique duplo envia um único pedido', async () => {
    const { estado } = montarUsuarios({ responder: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrirDesativacao();

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    expect(within(dialogo).getByRole('button', { name: 'Desativando…' })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it('Voltar fecha sem desativar e devolve o foco ao botão', async () => {
    const { estado } = montarUsuarios();
    const { abridor, dialogo } = await abrirDesativacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(abridor).toHaveFocus();
    expect(estado.chamadas).toEqual([]);
  });

  it('o Tab fica preso dentro do diálogo', async () => {
    montarUsuarios();
    const { dialogo } = await abrirDesativacao();

    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      expect(dialogo.contains(document.activeElement)).toBe(true);
    }
  });
});
