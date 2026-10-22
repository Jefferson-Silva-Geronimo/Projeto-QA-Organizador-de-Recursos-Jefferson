import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { montarUsuarios, recusa } from '@/test/usuarios';

async function abrir() {
  const abridor = await screen.findByRole('button', { name: 'Novo usuário' });
  await userEvent.click(abridor);
  return { abridor, dialogo: await screen.findByRole('dialog') };
}

async function preencher(dialogo: HTMLElement, { nome = 'Rita Gomes', email = 'rita.gomes@exemplo.test', senha = 'senha-de-teste-1' } = {}) {
  await userEvent.type(within(dialogo).getByLabelText(/^Nome/), nome);
  await userEvent.type(within(dialogo).getByLabelText(/^E-mail/), email);
  await userEvent.type(within(dialogo).getByLabelText(/^Senha/), senha);
}

describe('PaginaDeUsuarios: cadastro (RF-15)', () => {
  it('Novo usuário abre um diálogo modal com os campos, e o foco vai para o nome', async () => {
    montarUsuarios();

    const { dialogo } = await abrir();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Novo usuário');
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveFocus();
    expect(within(dialogo).getByLabelText(/^E-mail/)).toHaveAttribute('type', 'email');
    expect(within(dialogo).getByLabelText(/^Perfil/)).toBeInTheDocument();
  });

  it('a senha é um campo de senha, que o navegador não preenche nem sugere de volta', async () => {
    montarUsuarios();

    const { dialogo } = await abrir();
    const senha = within(dialogo).getByLabelText(/^Senha/);

    expect(senha).toHaveAttribute('type', 'password');
    expect(senha).toHaveAttribute('autocomplete', 'new-password');
  });

  it('o perfil é um só, escolhido numa lista, e começa em Solicitante (o de menor poder)', async () => {
    montarUsuarios();

    const { dialogo } = await abrir();
    const perfil = within(dialogo).getByLabelText(/^Perfil/);

    expect(within(perfil).getAllByRole('option').map((o) => o.textContent)).toEqual(['Solicitante', 'Responsável', 'Administrador']);
    expect(perfil).toHaveValue('SOLICITANTE');
  });

  it('enviar em branco aponta o que falta, leva o foco ao primeiro campo e não envia nada', async () => {
    const { estado } = montarUsuarios();
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(within(dialogo).getByText('Informe o nome.')).toBeInTheDocument();
    expect(within(dialogo).getByText('Informe o e-mail.')).toBeInTheDocument();
    expect(within(dialogo).getByText('Informe a senha.')).toBeInTheDocument();
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveFocus();
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveAttribute('aria-invalid', 'true');
    expect(estado.chamadas).toEqual([]);
  });

  it('cadastra com os dados informados, sem espaços nas pontas, e anuncia com o foco', async () => {
    const { estado } = montarUsuarios();
    const { dialogo } = await abrir();
    await preencher(dialogo, { nome: '  Rita Gomes ', email: ' rita.gomes@exemplo.test ' });
    await userEvent.selectOptions(within(dialogo).getByLabelText(/^Perfil/), 'RESPONSAVEL');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const texto = await screen.findByText('Usuário "Rita Gomes" cadastrado.');
    await waitFor(() => expect(texto.closest('[role="status"]')).toHaveFocus());
    expect(estado.chamadas).toEqual([
      { rota: 'criar', corpo: { nome: 'Rita Gomes', email: 'rita.gomes@exemplo.test', senha: 'senha-de-teste-1', perfil: 'RESPONSAVEL' } },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('depois de cadastrar, o usuário novo está na lista e a senha não aparece em lugar nenhum', async () => {
    montarUsuarios();
    const { dialogo } = await abrir();
    await preencher(dialogo);
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const novo = await screen.findByRole('article', { name: 'Rita Gomes' });

    expect(within(novo).getByText('rita.gomes@exemplo.test')).toBeInTheDocument();
    expect(screen.getByText('5 usuários')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('senha-de-teste-1');
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });

  it('enquanto envia o botão fica ocupado, e um clique duplo envia um único pedido', async () => {
    const { estado } = montarUsuarios({ responder: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrir();
    await preencher(dialogo);

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(within(dialogo).getByRole('button', { name: 'Cadastrando…' })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it('USUARIO_JA_EXISTE: a mensagem e a ação da tabela de erros, com o foco, e o e-mail marcado', async () => {
    montarUsuarios({ responder: () => recusa(409, 'USUARIO_JA_EXISTE') });
    const { dialogo } = await abrir();
    await preencher(dialogo);

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    const alerta = await within(dialogo).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('USUARIO_JA_EXISTE').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('USUARIO_JA_EXISTE').acao);
    expect(alerta).toHaveFocus();
    expect(within(dialogo).getByLabelText(/^E-mail/)).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialogo).getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });

  it('VALIDACAO_FALHOU: marca os campos que o servidor recusou, como a senha curta', async () => {
    montarUsuarios({ responder: () => recusa(400, 'VALIDACAO_FALHOU', { campos: ['senha'] }) });
    const { dialogo } = await abrir();
    await preencher(dialogo, { senha: 'curta' });

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(mensagemPara('VALIDACAO_FALHOU').mensagem);
    expect(within(dialogo).getByLabelText(/^Senha/)).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialogo).getByLabelText(/^Nome/)).not.toHaveAttribute('aria-invalid');
  });

  it('Escape fecha o diálogo, devolve o foco ao botão e não deixa a senha para a próxima vez', async () => {
    montarUsuarios();
    const { abridor, dialogo } = await abrir();
    await preencher(dialogo);

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(abridor).toHaveFocus();
    await userEvent.click(abridor);
    expect(within(await screen.findByRole('dialog')).getByLabelText(/^Senha/)).toHaveValue('');
  });

  it('o diálogo não tem violações de acessibilidade', async () => {
    montarUsuarios();
    const { dialogo } = await abrir();

    expect(await axe(dialogo)).toHaveNoViolations();
  });
});
