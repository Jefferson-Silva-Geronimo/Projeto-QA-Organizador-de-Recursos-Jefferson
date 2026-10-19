import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { SALA_101 } from '@/test/recursos';
import { AULA_EXTRA, PROVA, type Reserva } from '@/test/reservas';

interface Cenario {
  /** Reservas que o servidor devolve. O cancelamento bem-sucedido troca a reserva pela devolvida. */
  reservas: Reserva[];
  /** Resposta ao cancelamento. Padrão: 200 com a reserva cancelada. */
  cancelar?: (corpo: unknown, pedido: Request) => Response | Promise<Response>;
}

function montar({ reservas, cancelar }: Cenario) {
  const estado = { reservas: [...reservas], cancelamentos: [] as unknown[], listagens: 0 };
  const falso = rotearFetch({
    'GET /api/reservas': () => {
      estado.listagens++;
      return resposta(200, estado.reservas);
    },
    'GET /api/recursos/1': () => resposta(200, SALA_101),
    'GET /api/recursos/3': () => resposta(200, SALA_101),
    'GET /api/recursos/7': () => resposta(200, SALA_101),
    'POST /api/reservas/10/cancelamento': async (pedido) => {
      const corpo = await pedido.json();
      estado.cancelamentos.push(corpo);
      if (cancelar) return cancelar(corpo, pedido);
      const cancelada: Reserva = { ...AULA_EXTRA, estado: 'CANCELADA', ...(corpo.motivo ? { motivo: corpo.motivo } : {}) };
      estado.reservas = estado.reservas.map((r) => (r.id === cancelada.id ? cancelada : r));
      return resposta(200, cancelada);
    },
  });
  const montada = montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, fetch: falso });
  return { estado, falso, ...montada };
}

const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) => resposta(status, { status, code, ...extra });

async function abrirDialogo() {
  const cartao = await screen.findByRole('article', { name: 'Aula extra' });
  const abridor = within(cartao).getByRole('button', { name: /^Cancelar/ });
  await userEvent.click(abridor);
  return { cartao, abridor, dialogo: await screen.findByRole('dialog') };
}

describe('PaginaDeReservas: ações conforme o estado devolvido', () => {
  it.each(['SOLICITADA', 'APROVADA'] as const)('reserva %s oferece Alterar e Cancelar', async (estado) => {
    montar({ reservas: [{ ...AULA_EXTRA, estado }] });

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).getByRole('link', { name: 'Alterar Aula extra' })).toHaveAttribute('href', '/reservas/10/alterar');
    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
  });

  it.each(['EM_USO', 'CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU'] as const)(
    'reserva %s não oferece Alterar nem Cancelar',
    async (estado) => {
      montar({ reservas: [{ ...AULA_EXTRA, estado }] });

      const cartao = await screen.findByRole('article', { name: 'Aula extra' });

      expect(within(cartao).queryByRole('link', { name: /Alterar/ })).not.toBeInTheDocument();
      expect(within(cartao).queryByRole('button', { name: /Cancelar/ })).not.toBeInTheDocument();
    },
  );

  it('o front não decide pelo relógio: reserva APROVADA que já começou continua oferecendo as ações', async () => {
    montar({ reservas: [{ ...AULA_EXTRA, inicio: '2020-01-01T17:00:00Z', fim: '2020-01-01T19:00:00Z' }] });

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
  });
});

describe('PaginaDeReservas: diálogo de confirmação do cancelamento', () => {
  it('Cancelar abre um diálogo modal com título, a reserva em questão e o campo Motivo', async () => {
    montar({ reservas: [AULA_EXTRA] });

    const { dialogo } = await abrirDialogo();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Cancelar esta reserva?');
    expect(dialogo).toHaveAccessibleDescription(/Aula extra/);
    expect(within(dialogo).getByLabelText(/Motivo/)).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' })).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('só abre o diálogo da reserva escolhida', async () => {
    montar({ reservas: [AULA_EXTRA, PROVA] });
    const prova = await screen.findByRole('article', { name: 'Prova de Estatística' });

    await userEvent.click(within(prova).getByRole('button', { name: /^Cancelar/ }));

    expect(await screen.findByRole('dialog')).toHaveAccessibleDescription(/Prova de Estatística/);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('ao abrir, o foco entra no diálogo, no campo Motivo', async () => {
    montar({ reservas: [AULA_EXTRA] });

    const { dialogo } = await abrirDialogo();

    expect(within(dialogo).getByLabelText(/Motivo/)).toHaveFocus();
  });

  it('o Tab não sai do diálogo: do último elemento volta ao primeiro e vice-versa', async () => {
    montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();
    const motivo = within(dialogo).getByLabelText(/Motivo/);
    const voltar = within(dialogo).getByRole('button', { name: 'Voltar' });
    const confirmar = within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' });

    await userEvent.tab();
    expect(confirmar).toHaveFocus();
    await userEvent.tab();
    expect(voltar).toHaveFocus();
    await userEvent.tab();
    expect(motivo).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(voltar).toHaveFocus();
  });

  it('Escape fecha o diálogo, devolve o foco ao botão Cancelar e não envia nada', async () => {
    const { falso, estado } = montar({ reservas: [AULA_EXTRA] });
    const { abridor } = await abrirDialogo();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
    expect(estado.cancelamentos).toHaveLength(0);
    expect(falso.mock.calls.some(([e]) => (e as Request).method === 'POST')).toBe(false);
  });

  it('Voltar fecha o diálogo e devolve o foco ao botão Cancelar', async () => {
    montar({ reservas: [AULA_EXTRA] });
    const { abridor, dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
  });

  it('o texto digitado no motivo se perde ao fechar, e um novo diálogo abre vazio', async () => {
    montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'rascunho');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar Aula extra' }));

    expect(within(await screen.findByRole('dialog')).getByLabelText(/Motivo/)).toHaveValue('');
  });
});

describe('PaginaDeReservas: cancelar', () => {
  it('confirmar envia o motivo digitado, sem espaços nas pontas', async () => {
    const { estado } = montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();

    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), '  A turma foi dispensada.  ');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    await waitFor(() => expect(estado.cancelamentos).toEqual([{ motivo: 'A turma foi dispensada.' }]));
  });

  it('sem motivo, não envia o campo: quem decide se ele é obrigatório é o servidor', async () => {
    const { estado } = montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    await waitFor(() => expect(estado.cancelamentos).toEqual([{}]));
  });

  it('depois de cancelar, o diálogo fecha e a reserva continua na lista como Cancelada, com o motivo (RN-27)', async () => {
    montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'A turma foi dispensada.');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const cartao = screen.getByRole('article', { name: 'Aula extra' });
    expect(within(cartao).getByText('Cancelada')).toBeInTheDocument();
    expect(within(cartao).getByText('A turma foi dispensada.')).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /Cancelar/ })).not.toBeInTheDocument();
  });

  it('o resultado é anunciado em uma mensagem de sucesso que recebe o foco', async () => {
    montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    const texto = await screen.findByText(/Reserva "Aula extra" cancelada/);

    const aviso = texto.closest('[role="status"]');
    expect(aviso).not.toBeNull();
    await waitFor(() => expect(aviso).toHaveFocus());
  });

  it('clique duplo em Confirmar cancelamento envia um único pedido', async () => {
    const { estado } = montar({ reservas: [AULA_EXTRA] });
    const { dialogo } = await abrirDialogo();

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(estado.cancelamentos).toHaveLength(1);
  });

  it('enquanto envia, o botão mostra Cancelando… e o Escape não fecha o diálogo', async () => {
    montar({ reservas: [AULA_EXTRA], cancelar: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    await userEvent.keyboard('{Escape}');

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelando…' })).toBeDisabled();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Voltar' })).toBeDisabled();
  });
});

describe('PaginaDeReservas: recusas do servidor no cancelamento', () => {
  it.each([
    [400, 'MOTIVO_OBRIGATORIO'],
    [409, 'RESERVA_JA_INICIADA'],
    [409, 'TRANSICAO_PROIBIDA'],
    [403, 'ACESSO_NEGADO'],
    [404, 'NAO_ENCONTRADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, que continua aberto', async (status, code) => {
    montar({ reservas: [AULA_EXTRA], cancelar: () => recusa(status, code) });
    const { dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
  });

  it('o texto do motivo continua lá depois de uma recusa e o botão volta a funcionar', async () => {
    montar({ reservas: [AULA_EXTRA], cancelar: () => recusa(500, 'ERRO_INTERNO') });
    const { dialogo } = await abrirDialogo();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'A turma foi dispensada.');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(within(screen.getByRole('dialog')).getByLabelText(/Motivo/)).toHaveValue('A turma foi dispensada.');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar cancelamento' })).toBeEnabled();
  });

  it('MOTIVO_OBRIGATORIO marca o campo Motivo como inválido', async () => {
    montar({ reservas: [AULA_EXTRA], cancelar: () => recusa(400, 'MOTIVO_OBRIGATORIO') });
    const { dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(within(screen.getByRole('dialog')).getByLabelText(/Motivo/)).toBeInvalid();
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montar({
      reservas: [AULA_EXTRA],
      cancelar: () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const { dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('reserva já iniciada (RN-07): o servidor recusa com RESERVA_JA_INICIADA e a lista é consultada de novo', async () => {
    const { estado } = montar({
      reservas: [{ ...AULA_EXTRA, inicio: '2020-01-01T17:00:00Z', fim: '2020-01-01T19:00:00Z' }],
      cancelar: () => recusa(409, 'RESERVA_JA_INICIADA'),
    });
    const { dialogo } = await abrirDialogo();
    const antes = estado.listagens;

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));

    await within(screen.getByRole('dialog')).findByRole('alert');
    await waitFor(() => expect(estado.listagens).toBeGreaterThan(antes));
  });

  it('TRANSICAO_PROIBIDA (a reserva mudou de estado): a lista é refeita e as ações somem; ao fechar, o foco vai para o cartão', async () => {
    const { estado } = montar({
      reservas: [AULA_EXTRA],
      cancelar: () => {
        estado.reservas = [{ ...AULA_EXTRA, estado: 'EM_USO' }];
        return recusa(409, 'TRANSICAO_PROIBIDA');
      },
    });
    const { cartao, dialogo } = await abrirDialogo();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');
    await waitFor(() => expect(within(cartao).getByText('Em uso')).toBeInTheDocument());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cartao).toHaveFocus();
  });

  it('recusa que não muda o estado (erro interno) não refaz a lista', async () => {
    const { estado } = montar({ reservas: [AULA_EXTRA], cancelar: () => recusa(500, 'ERRO_INTERNO') });
    const { dialogo } = await abrirDialogo();
    const antes = estado.listagens;

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(estado.listagens).toBe(antes);
  });
});

describe('PaginaDeReservas: acessibilidade do diálogo', () => {
  it('a página com o diálogo aberto não tem violação (axe)', async () => {
    montar({ reservas: [AULA_EXTRA] });
    await abrirDialogo();

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a página com o diálogo aberto e uma recusa não tem violação (axe)', async () => {
    montar({ reservas: [AULA_EXTRA], cancelar: () => recusa(400, 'MOTIVO_OBRIGATORIO') });
    const { dialogo } = await abrirDialogo();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
