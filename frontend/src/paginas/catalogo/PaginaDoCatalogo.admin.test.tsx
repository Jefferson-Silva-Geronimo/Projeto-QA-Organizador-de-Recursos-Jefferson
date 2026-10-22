import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { montarCatalogo, recusa } from '@/test/catalogo';

const AVISO_DE_RESTRITO = 'Mudar "restrito" vale só para as próximas reservas: as reservas que já existem não mudam.';

async function sala(nome = 'Sala 101') {
  return screen.findByRole('article', { name: nome });
}

describe('PaginaDoCatalogo: quem pode mudar o catálogo (matriz de telas, ADR-004)', () => {
  it.each(['SOLICITANTE', 'RESPONSAVEL'] as const)('%s só consulta: sem cadastrar, sem restrito e sem desativar', async (perfil) => {
    montarCatalogo({ perfil });

    const cartao = await sala();

    expect(screen.queryByRole('button', { name: /^(Nova|Novo)/ })).not.toBeInTheDocument();
    expect(within(cartao).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(cartao).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(AVISO_DE_RESTRITO)).not.toBeInTheDocument();
  });

  it('o Administrador vê o botão de cadastrar do tipo da aba', async () => {
    montarCatalogo();
    await sala();

    expect(screen.getByRole('button', { name: 'Nova sala' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Professores' }));
    expect(await screen.findByRole('button', { name: 'Novo professor' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Materiais' }));
    expect(await screen.findByRole('button', { name: 'Novo material' })).toBeInTheDocument();
  });

  it('o Administrador vê o aviso de que mudar restrito não muda as reservas existentes (RF-02)', async () => {
    montarCatalogo();
    await sala();

    expect(screen.getByText(AVISO_DE_RESTRITO)).toBeVisible();
  });
});

describe('PaginaDoCatalogo: restrito', () => {
  it('cada recurso tem a caixa Restrito marcada conforme o servidor, com o nome do recurso no nome da caixa', async () => {
    montarCatalogo();

    const livre = await sala();
    const restrita = screen.getByRole('article', { name: 'Laboratório de Informática 3' });

    expect(within(livre).getByRole('checkbox', { name: 'Restrito Sala 101' })).not.toBeChecked();
    expect(within(restrita).getByRole('checkbox', { name: 'Restrito Laboratório de Informática 3' })).toBeChecked();
  });

  it('marcar envia restrito verdadeiro, a lista é refeita e o resultado é anunciado com o foco', async () => {
    const { estado } = montarCatalogo();
    const cartao = await sala();

    await userEvent.click(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' }));

    const texto = await screen.findByText('"Sala 101" agora exige aprovação.');
    const aviso = texto.closest('[role="status"]');
    expect(aviso).not.toBeNull();
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(estado.chamadas).toEqual([{ rota: 'restrito:1', corpo: { restrito: true } }]);
    await waitFor(() => expect(within(screen.getByRole('article', { name: 'Sala 101' })).getByRole('checkbox')).toBeChecked());
  });

  it('desmarcar envia restrito falso e anuncia que deixou de exigir aprovação', async () => {
    const { estado } = montarCatalogo();
    const cartao = await screen.findByRole('article', { name: 'Laboratório de Informática 3' });

    await userEvent.click(within(cartao).getByRole('checkbox', { name: /^Restrito/ }));

    expect(await screen.findByText('"Laboratório de Informática 3" deixou de exigir aprovação.')).toBeInTheDocument();
    expect(estado.chamadas).toEqual([{ rota: 'restrito:3', corpo: { restrito: false } }]);
  });

  it('enquanto envia, a caixa fica desabilitada e um clique duplo envia um único pedido', async () => {
    const { estado } = montarCatalogo({ responder: () => new Promise<Response>(() => {}) });
    const cartao = await sala();

    await userEvent.dblClick(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' }));

    expect(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it.each([
    [403, 'ACESSO_NEGADO'],
    [404, 'NAO_ENCONTRADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no cartão, com o foco, e a caixa volta a funcionar', async (status, code) => {
    montarCatalogo({ responder: () => recusa(status, code) });
    const cartao = await sala();

    await userEvent.click(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' }));

    const alerta = await within(cartao).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
    expect(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' })).toBeEnabled();
    expect(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' })).not.toBeChecked();
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montarCatalogo({
      responder: () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const cartao = await sala();

    await userEvent.click(within(cartao).getByRole('checkbox', { name: 'Restrito Sala 101' }));

    expect(await within(cartao).findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });
});

describe('PaginaDoCatalogo: desativar (irreversível, com confirmação)', () => {
  async function abrir(nome = 'Sala 101') {
    const cartao = await sala(nome);
    const abridor = within(cartao).getByRole('button', { name: `Desativar ${nome}` });
    await userEvent.click(abridor);
    return { abridor, dialogo: await screen.findByRole('dialog') };
  }

  it('Desativar abre um diálogo modal com título e o recurso em questão', async () => {
    montarCatalogo();

    const { dialogo } = await abrir();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Desativar este recurso?');
    expect(dialogo).toHaveAccessibleDescription(/Sala 101/);
    expect(within(dialogo).getByRole('button', { name: 'Confirmar desativação' })).toHaveFocus();
    expect(within(dialogo).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('só abre o diálogo do recurso escolhido', async () => {
    montarCatalogo();

    const { dialogo } = await abrir('Laboratório de Informática 3');

    expect(dialogo).toHaveAccessibleDescription(/Laboratório de Informática 3/);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('Escape fecha o diálogo, devolve o foco ao botão e não envia nada', async () => {
    const { estado } = montarCatalogo();
    const { abridor } = await abrir();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
    expect(estado.chamadas).toHaveLength(0);
  });

  it('Voltar fecha o diálogo e devolve o foco ao botão', async () => {
    montarCatalogo();
    const { abridor, dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
  });

  it('o Tab não sai do diálogo', async () => {
    montarCatalogo();
    const { dialogo } = await abrir();
    const confirmar = within(dialogo).getByRole('button', { name: 'Confirmar desativação' });
    const voltar = within(dialogo).getByRole('button', { name: 'Voltar' });

    await userEvent.tab();
    expect(voltar).toHaveFocus();
    await userEvent.tab();
    expect(confirmar).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(voltar).toHaveFocus();
  });

  it('confirmar envia o pedido, o recurso sai da lista e o resultado é anunciado com o foco', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    const texto = await screen.findByText('Recurso "Sala 101" desativado.');
    const aviso = texto.closest('[role="status"]');
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Sala 101' })).not.toBeInTheDocument();
    expect(estado.chamadas).toEqual([{ rota: 'desativacao:1', corpo: {} }]);
  });

  it('clique duplo em Confirmar desativação envia um único pedido', async () => {
    const { estado } = montarCatalogo();
    const { dialogo } = await abrir();

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(estado.chamadas.filter((c) => c.rota === 'desativacao:1')).toHaveLength(1);
  });

  it('enquanto envia, o botão mostra Desativando… e o Escape não fecha o diálogo', async () => {
    montarCatalogo({ responder: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));
    await userEvent.keyboard('{Escape}');

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativando…' })).toBeDisabled();
  });

  it('RECURSO_COM_RESERVA_FUTURA: mostra a mensagem da tabela e a lista das reservas afetadas, com o diálogo aberto', async () => {
    montarCatalogo({ responder: () => recusa(409, 'RECURSO_COM_RESERVA_FUTURA', { itens: ['41', '44'] }) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('RECURSO_COM_RESERVA_FUTURA').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('RECURSO_COM_RESERVA_FUTURA').acao);
    expect(alerta).toHaveFocus();
    expect(within(screen.getByRole('dialog')).getByText('Reservas afetadas: nº 41, nº 44')).toBeVisible();
    expect(screen.getByRole('article', { name: 'Sala 101' })).toBeInTheDocument();
  });

  it.each([
    [404, 'NAO_ENCONTRADO'],
    [403, 'ACESSO_NEGADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, que continua aberto, sem lista', async (status, code) => {
    montarCatalogo({ responder: () => recusa(status, code) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveFocus();
    expect(within(screen.getByRole('dialog')).queryByText(/Reservas afetadas/)).not.toBeInTheDocument();
  });

  it('a página com o diálogo aberto e a recusa com a lista não tem violação (axe)', async () => {
    montarCatalogo({ responder: () => recusa(409, 'RECURSO_COM_RESERVA_FUTURA', { itens: ['41'] }) });
    const { dialogo } = await abrir();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar desativação' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
