import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeAprovacoes } from '@/paginas/aprovacoes/PaginaDeAprovacoes';
import { PEDIDO_DE_JOAO, PEDIDO_DE_MARIA, type ItemDaFila } from '@/test/fila';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROJETOR } from '@/test/recursos';

interface Cenario {
  /** Fila que o servidor devolve. A decisão bem-sucedida tira o item da fila. */
  fila: ItemDaFila[];
  /** Resposta à aprovação. Padrão: 200 com a reserva aprovada. */
  aprovar?: (corpo: unknown, pedido: Request) => Response | Promise<Response>;
  /** Resposta à rejeição. Padrão: 200 com a reserva rejeitada. */
  rejeitar?: (corpo: unknown, pedido: Request) => Response | Promise<Response>;
}

function montar({ fila, aprovar, rejeitar }: Cenario) {
  const estado = { fila: [...fila], aprovacoes: [] as unknown[], rejeicoes: [] as unknown[], listagens: 0 };
  const tirar = (id: number) => {
    estado.fila = estado.fila.filter((i) => i.id !== id);
  };
  const reserva = (item: ItemDaFila, novo: 'APROVADA' | 'REJEITADA') => ({
    id: item.id,
    solicitanteId: item.solicitanteId,
    titulo: item.titulo,
    inicio: item.inicio,
    fim: item.fim,
    estado: novo,
    exigeAprovacao: true,
    recursoIds: item.recursoIds,
    podeAlterar: false,
    podeCancelar: true,
  });
  const decisao = (
    lista: unknown[],
    padrao: (corpo: Record<string, unknown>) => Response,
    personalizada: Cenario['aprovar'],
  ) =>
    async (pedido: Request) => {
      const corpo = await pedido.json();
      lista.push(corpo);
      return personalizada ? personalizada(corpo, pedido) : padrao(corpo);
    };
  const falso = rotearFetch({
    'GET /api/reservas/fila': () => {
      estado.listagens++;
      return resposta(200, estado.fila);
    },
    'GET /api/recursos/3': () => resposta(200, LABORATORIO),
    'GET /api/recursos/7': () => resposta(200, PROJETOR),
    'POST /api/reservas/21/aprovacao': decisao(estado.aprovacoes, () => {
      tirar(21);
      return resposta(200, reserva(PEDIDO_DE_MARIA, 'APROVADA'));
    }, aprovar),
    'POST /api/reservas/21/rejeicao': decisao(estado.rejeicoes, (corpo) => {
      tirar(21);
      return resposta(200, { ...reserva(PEDIDO_DE_MARIA, 'REJEITADA'), motivo: corpo.motivo });
    }, rejeitar),
    'POST /api/reservas/22/aprovacao': decisao(estado.aprovacoes, () => {
      tirar(22);
      return resposta(200, reserva(PEDIDO_DE_JOAO, 'APROVADA'));
    }, aprovar),
  });
  const montada = montarPagina({
    rota: '/aprovacoes',
    caminho: '/aprovacoes',
    elemento: <PaginaDeAprovacoes />,
    perfil: 'RESPONSAVEL',
    fetch: falso,
  });
  return { estado, falso, ...montada };
}

const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) => resposta(status, { status, code, ...extra });

async function abrirAprovacao(titulo = 'Prova de Estatística') {
  const cartao = await screen.findByRole('article', { name: titulo });
  const abridor = within(cartao).getByRole('button', { name: new RegExp(`^Aprovar ${titulo}`) });
  await userEvent.click(abridor);
  return { cartao, abridor, dialogo: await screen.findByRole('dialog') };
}

async function abrirRejeicao(titulo = 'Prova de Estatística') {
  const cartao = await screen.findByRole('article', { name: titulo });
  const abridor = within(cartao).getByRole('button', { name: new RegExp(`^Rejeitar ${titulo}`) });
  await userEvent.click(abridor);
  return { cartao, abridor, dialogo: await screen.findByRole('dialog') };
}

describe('PaginaDeAprovacoes: diálogo de confirmação da aprovação', () => {
  it('Aprovar abre um diálogo modal com título, a solicitação em questão e o campo Motivo', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });

    const { dialogo } = await abrirAprovacao();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Aprovar esta solicitação?');
    expect(dialogo).toHaveAccessibleDescription(/Prova de Estatística/);
    expect(dialogo).toHaveAccessibleDescription(/Maria Souza/);
    expect(within(dialogo).getByLabelText(/Motivo/)).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' })).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('na aprovação o motivo é opcional: o campo não é marcado como obrigatório', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });

    const { dialogo } = await abrirAprovacao();

    expect(within(dialogo).getByLabelText(/Motivo/)).not.toBeRequired();
  });

  it('só abre o diálogo da solicitação escolhida', async () => {
    montar({ fila: [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO] });

    const { dialogo } = await abrirAprovacao('Oficina de robótica');

    expect(dialogo).toHaveAccessibleDescription(/Oficina de robótica/);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('ao abrir, o foco entra no diálogo, no campo Motivo', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });

    const { dialogo } = await abrirAprovacao();

    expect(within(dialogo).getByLabelText(/Motivo/)).toHaveFocus();
  });

  it('o Tab não sai do diálogo: do último elemento volta ao primeiro e vice-versa', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirAprovacao();
    const motivo = within(dialogo).getByLabelText(/Motivo/);
    const voltar = within(dialogo).getByRole('button', { name: 'Voltar' });
    const confirmar = within(dialogo).getByRole('button', { name: 'Confirmar aprovação' });

    await userEvent.tab();
    expect(confirmar).toHaveFocus();
    await userEvent.tab();
    expect(voltar).toHaveFocus();
    await userEvent.tab();
    expect(motivo).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(voltar).toHaveFocus();
  });

  it('Escape fecha o diálogo, devolve o foco ao botão Aprovar e não envia nada', async () => {
    const { falso, estado } = montar({ fila: [PEDIDO_DE_MARIA] });
    const { abridor } = await abrirAprovacao();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
    expect(estado.aprovacoes).toHaveLength(0);
    expect(falso.mock.calls.some(([e]) => (e as Request).method === 'POST')).toBe(false);
  });

  it('Voltar fecha o diálogo e devolve o foco ao botão Aprovar', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });
    const { abridor, dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
  });

  it('o texto digitado no motivo se perde ao fechar, e um novo diálogo abre vazio', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirAprovacao();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'rascunho');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    await userEvent.click(screen.getByRole('button', { name: /^Aprovar Prova de Estatística/ }));

    expect(within(await screen.findByRole('dialog')).getByLabelText(/Motivo/)).toHaveValue('');
  });
});

describe('PaginaDeAprovacoes: aprovar', () => {
  it('sem motivo, envia o corpo vazio: o motivo da aprovação é opcional', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    await waitFor(() => expect(estado.aprovacoes).toEqual([{}]));
  });

  it('confirmar envia o motivo digitado, sem espaços nas pontas', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirAprovacao();

    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), '  Laboratório disponível.  ');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    await waitFor(() => expect(estado.aprovacoes).toEqual([{ motivo: 'Laboratório disponível.' }]));
  });

  it('depois de aprovar, o diálogo fecha e a solicitação sai da fila, que é consultada de novo', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO] });
    const { dialogo } = await abrirAprovacao();
    const antes = estado.listagens;

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('article', { name: 'Prova de Estatística' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Oficina de robótica' })).toBeInTheDocument();
    expect(estado.listagens).toBeGreaterThan(antes);
    expect(screen.getByText('1 solicitação pendente')).toBeInTheDocument();
  });

  it('o resultado é anunciado em uma mensagem de sucesso que recebe o foco', async () => {
    montar({ fila: [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO] });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    const texto = await screen.findByText(/Reserva "Prova de Estatística" aprovada/);

    const aviso = texto.closest('[role="status"]');
    expect(aviso).not.toBeNull();
    await waitFor(() => expect(aviso).toHaveFocus());
  });

  it('clique duplo em Confirmar aprovação envia um único pedido', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirAprovacao();

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(estado.aprovacoes).toHaveLength(1);
  });

  it('enquanto envia, o botão mostra Aprovando… e o Escape não fecha o diálogo', async () => {
    montar({ fila: [PEDIDO_DE_MARIA], aprovar: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));
    await userEvent.keyboard('{Escape}');

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprovando…' })).toBeDisabled();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Voltar' })).toBeDisabled();
  });
});

describe('PaginaDeAprovacoes: diálogo de confirmação da rejeição', () => {
  it('Rejeitar abre um diálogo modal com título, a solicitação em questão e o motivo obrigatório', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });

    const { dialogo } = await abrirRejeicao();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Rejeitar esta solicitação?');
    expect(dialogo).toHaveAccessibleDescription(/Prova de Estatística/);
    expect(dialogo).toHaveAccessibleDescription(/Maria Souza/);
    const motivo = within(dialogo).getByLabelText(/Motivo \(obrigatório\)/);
    expect(motivo).toBeRequired();
    expect(motivo).toHaveFocus();
    expect(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' })).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('Escape fecha o diálogo e devolve o foco ao botão Rejeitar', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });
    const { abridor } = await abrirRejeicao();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
  });
});

describe('PaginaDeAprovacoes: rejeitar exige motivo (RN-24)', () => {
  it.each([['vazio', ''], ['só com espaços', '   ']])(
    'motivo %s: não envia nada, marca o campo como inválido e leva o foco até ele',
    async (_nome, texto) => {
      const { falso, estado } = montar({ fila: [PEDIDO_DE_MARIA] });
      const { dialogo } = await abrirRejeicao();
      if (texto) {
        await userEvent.type(within(dialogo).getByLabelText(/Motivo/), texto);
      }

      await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));

      const motivo = within(screen.getByRole('dialog')).getByLabelText(/Motivo/);
      expect(motivo).toBeInvalid();
      expect(within(screen.getByRole('dialog')).getByText('Informe o motivo.')).toBeVisible();
      expect(motivo).toHaveFocus();
      expect(estado.rejeicoes).toHaveLength(0);
      expect(falso.mock.calls.some(([e]) => (e as Request).method === 'POST')).toBe(false);
    },
  );

  it('com motivo, envia o texto sem espaços nas pontas, a solicitação sai da fila e o resultado é anunciado', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO] });
    const { dialogo } = await abrirRejeicao();

    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), '  Laboratório em manutenção.  ');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(estado.rejeicoes).toEqual([{ motivo: 'Laboratório em manutenção.' }]);
    expect(screen.queryByRole('article', { name: 'Prova de Estatística' })).not.toBeInTheDocument();
    const aviso = screen.getByText(/Reserva "Prova de Estatística" rejeitada/).closest('[role="status"]');
    expect(aviso).not.toBeNull();
    await waitFor(() => expect(aviso).toHaveFocus());
  });

  it('depois do aviso de campo, digitar o motivo e confirmar envia o pedido', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirRejeicao();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));

    await userEvent.type(within(screen.getByRole('dialog')).getByLabelText(/Motivo/), 'Sem equipamento.');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar rejeição' }));

    await waitFor(() => expect(estado.rejeicoes).toEqual([{ motivo: 'Sem equipamento.' }]));
  });

  it('clique duplo em Confirmar rejeição envia um único pedido', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirRejeicao();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'Sem equipamento.');

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(estado.rejeicoes).toHaveLength(1);
  });

  it('se o servidor ainda assim responder MOTIVO_OBRIGATORIO, mostra a mensagem da tabela e marca o campo', async () => {
    montar({ fila: [PEDIDO_DE_MARIA], rejeitar: () => recusa(400, 'MOTIVO_OBRIGATORIO') });
    const { dialogo } = await abrirRejeicao();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'Sem equipamento.');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('MOTIVO_OBRIGATORIO').mensagem);
    expect(within(screen.getByRole('dialog')).getByLabelText(/Motivo/)).toBeInvalid();
  });
});

describe('PaginaDeAprovacoes: recusas do servidor pelo código estável (ADR-004)', () => {
  it.each([
    [403, 'ACESSO_NEGADO'],
    [409, 'APROVACAO_APOS_INICIO'],
    [409, 'TRANSICAO_PROIBIDA'],
    [404, 'NAO_ENCONTRADO'],
    [500, 'ERRO_INTERNO'],
  ])('aprovar, %i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, que continua aberto', async (status, code) => {
    montar({ fila: [PEDIDO_DE_MARIA], aprovar: () => recusa(status, code) });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
  });

  it.each([
    [403, 'ACESSO_NEGADO'],
    [409, 'TRANSICAO_PROIBIDA'],
    [500, 'ERRO_INTERNO'],
  ])('rejeitar, %i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, que continua aberto', async (status, code) => {
    montar({ fila: [PEDIDO_DE_MARIA], rejeitar: () => recusa(status, code) });
    const { dialogo } = await abrirRejeicao();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'Sem equipamento.');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
  });

  it('aprovar a própria reserva (CEN-02): o servidor recusa com ACESSO_NEGADO e a tela mostra a mensagem, sem decidir sozinha', async () => {
    montar({ fila: [PEDIDO_DE_MARIA], aprovar: () => recusa(403, 'ACESSO_NEGADO') });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Seu perfil não permite esta ação.');
    expect(screen.getByRole('article', { name: 'Prova de Estatística' })).toBeInTheDocument();
  });

  it('o texto do motivo continua lá depois de uma recusa e o botão volta a funcionar', async () => {
    montar({ fila: [PEDIDO_DE_MARIA], aprovar: () => recusa(500, 'ERRO_INTERNO') });
    const { dialogo } = await abrirAprovacao();
    await userEvent.type(within(dialogo).getByLabelText(/Motivo/), 'Laboratório disponível.');

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(within(screen.getByRole('dialog')).getByLabelText(/Motivo/)).toHaveValue('Laboratório disponível.');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar aprovação' })).toBeEnabled();
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montar({
      fila: [PEDIDO_DE_MARIA],
      aprovar: () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('APROVACAO_APOS_INICIO: a fila é consultada de novo e o cartão passa a oferecer só Rejeitar; a mensagem continua no diálogo', async () => {
    const { estado } = montar({
      fila: [PEDIDO_DE_MARIA],
      aprovar: () => {
        estado.fila = [{ ...PEDIDO_DE_MARIA, podeAprovar: false }];
        return recusa(409, 'APROVACAO_APOS_INICIO');
      },
    });
    const { cartao, dialogo } = await abrirAprovacao();
    const antes = estado.listagens;

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    await within(screen.getByRole('dialog')).findByRole('alert');
    await waitFor(() => expect(estado.listagens).toBeGreaterThan(antes));
    await waitFor(() => expect(within(cartao).queryByRole('button', { name: /^Aprovar/ })).not.toBeInTheDocument());
    expect(within(cartao).getByRole('button', { name: /^Rejeitar/ })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(mensagemPara('APROVACAO_APOS_INICIO').mensagem);
  });

  it('TRANSICAO_PROIBIDA (outra pessoa já decidiu): o cartão sai da fila, a mensagem continua no diálogo e, ao fechar, o foco vai para o título da página', async () => {
    const { estado } = montar({
      fila: [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO],
      aprovar: () => {
        estado.fila = [PEDIDO_DE_JOAO];
        return recusa(409, 'TRANSICAO_PROIBIDA');
      },
    });
    const { dialogo } = await abrirAprovacao();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));
    await within(screen.getByRole('dialog')).findByRole('alert');
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Prova de Estatística' })).not.toBeInTheDocument());
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(mensagemPara('TRANSICAO_PROIBIDA').mensagem);
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Aprovações' })).toHaveFocus();
  });

  it('recusa que não muda a fila (erro interno) não a refaz', async () => {
    const { estado } = montar({ fila: [PEDIDO_DE_MARIA], aprovar: () => recusa(500, 'ERRO_INTERNO') });
    const { dialogo } = await abrirAprovacao();
    const antes = estado.listagens;

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(estado.listagens).toBe(antes);
  });
});

describe('PaginaDeAprovacoes: acessibilidade dos diálogos', () => {
  it('a página com o diálogo de aprovação aberto não tem violação (axe)', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });
    await abrirAprovacao();

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a página com o diálogo de rejeição aberto e o aviso de campo não tem violação (axe)', async () => {
    montar({ fila: [PEDIDO_DE_MARIA] });
    const { dialogo } = await abrirRejeicao();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar rejeição' }));
    await within(screen.getByRole('dialog')).findByText('Informe o motivo.');

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a página com o diálogo aberto e uma recusa não tem violação (axe)', async () => {
    montar({ fila: [PEDIDO_DE_MARIA], aprovar: () => recusa(403, 'ACESSO_NEGADO') });
    const { dialogo } = await abrirAprovacao();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
