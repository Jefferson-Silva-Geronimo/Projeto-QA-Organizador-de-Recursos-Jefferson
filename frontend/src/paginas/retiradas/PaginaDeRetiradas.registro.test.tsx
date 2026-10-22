import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { montarRetiradas, recusa, type Cenario, type EstadoDoServidor } from '@/test/retiradas';
import { AULA_DE_INFORMATICA, movimento } from '@/test/uso';

const EM_USO = { ...AULA_DE_INFORMATICA, estado: 'EM_USO' as const, podeIniciar: false };
const COM_TUDO = { ...AULA_DE_INFORMATICA, podeIniciar: true, podeConcluir: true, podeMarcarNaoComparecimento: true };

async function cartao() {
  return screen.findByRole('article', { name: 'Aula de informática' });
}

/** Uma unidade pelo nome do material, depois de os recursos carregarem. */
async function botao(nome: string) {
  return within(await cartao()).findByRole('button', { name: nome });
}

describe('PaginaDeRetiradas: ações diretas (iniciar, retirar e devolver)', () => {
  it('Iniciar uso envia o pedido, o cartão passa a Em uso e o resultado é anunciado com o foco', async () => {
    const { estado } = montarRetiradas({
      reservas: [AULA_DE_INFORMATICA],
      registrar: (acao, id, _corpo, s) => {
        if (acao === 'inicio') s.reservas = [{ ...EM_USO, id }];
        return undefined;
      },
    });

    await userEvent.click(await botao('Iniciar uso Aula de informática'));

    const texto = await screen.findByText(/Uso da reserva "Aula de informática" iniciado/);
    const aviso = texto.closest('[role="status"]');
    expect(aviso).not.toBeNull();
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(estado.chamadas).toEqual([{ acao: 'inicio', reservaId: 30, corpo: undefined }]);
    expect(within(await cartao()).getByText('Em uso')).toBeInTheDocument();
    expect(within(await cartao()).queryByRole('button', { name: /^Iniciar/ })).not.toBeInTheDocument();
  });

  it('Retirar envia o material, a unidade passa a retirada com quem registrou e o resultado é anunciado', async () => {
    const { estado } = montarRetiradas({
      reservas: [AULA_DE_INFORMATICA],
      registrar: (acao, id, corpo, s) => {
        if (acao === 'retiradas') {
          s.movimentacoes[id] = [movimento(1, (corpo as { materialId: number }).materialId, 'RETIRADA', true, '17:05', 'Ana Prado')];
          s.reservas = [{ ...EM_USO, id }];
        }
        return undefined;
      },
    });

    await userEvent.click(await botao('Retirar Notebook N-001'));

    expect(await screen.findByText(/Retirada de "Notebook N-001" registrada/)).toBeInTheDocument();
    expect(estado.chamadas).toEqual([{ acao: 'retiradas', reservaId: 30, corpo: { materialId: 8 } }]);
    expect(await within(await cartao()).findByText('Retirado às 14:05 por Ana Prado')).toBeInTheDocument();
    expect(within(await cartao()).getByRole('button', { name: 'Devolver Notebook N-001' })).toBeInTheDocument();
  });

  it('Devolver envia o material e a unidade passa a devolvida', async () => {
    const { estado } = montarRetiradas({
      reservas: [{ ...EM_USO, podeConcluir: false }],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', true)] },
      registrar: (acao, id, corpo, s) => {
        if (acao === 'devolucoes') {
          s.movimentacoes[id] = [movimento(1, 7, 'RETIRADA', false), movimento(2, (corpo as { materialId: number }).materialId, 'DEVOLUCAO', true, '17:30', 'Ana Prado')];
        }
        return undefined;
      },
    });

    await userEvent.click(await botao('Devolver Projetor P-007'));

    expect(await screen.findByText(/Devolução de "Projetor P-007" registrada/)).toBeInTheDocument();
    expect(estado.chamadas).toEqual([{ acao: 'devolucoes', reservaId: 30, corpo: { materialId: 7 } }]);
    expect(await within(await cartao()).findByText('Devolvido às 14:30 por Ana Prado')).toBeInTheDocument();
  });

  it('clique duplo em Retirar envia um único pedido enquanto o primeiro está em andamento', async () => {
    // O servidor só responde depois dos dois cliques: o segundo cai com o primeiro ainda em andamento.
    const { estado } = montarRetiradas({ reservas: [AULA_DE_INFORMATICA], registrar: () => new Promise<Response>(() => {}) });

    await userEvent.dblClick(await botao('Retirar Notebook N-001'));

    expect(estado.chamadas.filter((c) => c.acao === 'retiradas')).toHaveLength(1);
  });

  it('enquanto envia, as ações do cartão ficam desabilitadas', async () => {
    montarRetiradas({ reservas: [COM_TUDO], registrar: () => new Promise<Response>(() => {}) });

    await userEvent.click(await botao('Retirar Notebook N-001'));

    await waitFor(() => expect(within(screen.getByRole('article', { name: 'Aula de informática' })).getByRole('button', { name: /Iniciar/ })).toBeDisabled());
    for (const b of within(screen.getByRole('article', { name: 'Aula de informática' })).getAllByRole('button')) {
      expect(b).toBeDisabled();
    }
  });
});

describe('PaginaDeRetiradas: recusas das ações diretas (ADR-004)', () => {
  const casos: [string, string, number, string][] = [
    ['Retirar Notebook N-001', 'retiradas', 409, 'MATERIAL_JA_RETIRADO'],
    ['Retirar Notebook N-001', 'retiradas', 400, 'MATERIAL_FORA_DA_RESERVA'],
    ['Retirar Notebook N-001', 'retiradas', 409, 'TRANSICAO_PROIBIDA'],
    ['Iniciar uso Aula de informática', 'inicio', 409, 'TRANSICAO_PROIBIDA'],
    ['Iniciar uso Aula de informática', 'inicio', 403, 'ACESSO_NEGADO'],
    ['Iniciar uso Aula de informática', 'inicio', 500, 'ERRO_INTERNO'],
  ];

  it.each(casos)('%s, %s, %i %s: a mensagem e a ação da tabela de erros aparecem no cartão, com o foco', async (rotulo, acao, status, code) => {
    montarRetiradas({ reservas: [COM_TUDO], registrar: (a) => (a === acao ? recusa(status, code) : undefined) });

    await userEvent.click(await botao(rotulo));

    const alerta = await within(await cartao()).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
    expect(within(await cartao()).getByRole('button', { name: rotulo })).toBeEnabled();
  });

  it('devolver sem retirada: DEVOLUCAO_SEM_RETIRADA aparece no cartão', async () => {
    montarRetiradas({
      reservas: [EM_USO],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', true)] },
      registrar: () => recusa(409, 'DEVOLUCAO_SEM_RETIRADA'),
    });

    await userEvent.click(await botao('Devolver Projetor P-007'));

    expect(await within(await cartao()).findByRole('alert')).toHaveTextContent(mensagemPara('DEVOLUCAO_SEM_RETIRADA').mensagem);
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montarRetiradas({
      reservas: [COM_TUDO],
      registrar: () => {
        throw new TypeError('Failed to fetch');
      },
    });

    await userEvent.click(await botao('Retirar Notebook N-001'));

    expect(await within(await cartao()).findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('recusa que muda o estado (TRANSICAO_PROIBIDA) faz a lista ser consultada de novo; erro interno não', async () => {
    const trocado = montarRetiradas({ reservas: [COM_TUDO], registrar: () => recusa(409, 'TRANSICAO_PROIBIDA') });
    const antes = trocado.estado.listagens;
    await userEvent.click(await botao('Iniciar uso Aula de informática'));
    await within(await cartao()).findByRole('alert');
    await waitFor(() => expect(trocado.estado.listagens).toBeGreaterThan(antes));
    trocado.unmount();

    const interno = montarRetiradas({ reservas: [COM_TUDO], registrar: () => recusa(500, 'ERRO_INTERNO') });
    await userEvent.click(await botao('Iniciar uso Aula de informática'));
    await within(await cartao()).findByRole('alert');
    expect(interno.estado.listagens).toBe(1);
  });
});

describe('PaginaDeRetiradas: concluir a reserva (irreversível, com confirmação)', () => {
  async function abrir() {
    const abridor = await botao('Concluir reserva Aula de informática');
    await userEvent.click(abridor);
    return { abridor, dialogo: await screen.findByRole('dialog') };
  }

  const concluindo: Cenario = {
    reservas: [{ ...EM_USO, podeConcluir: true }],
    registrar: (acao, _id, _corpo, s: EstadoDoServidor) => {
      if (acao === 'conclusao') s.reservas = [];
      return undefined;
    },
  };

  it('Concluir reserva abre um diálogo modal com título, a reserva em questão e as ações', async () => {
    montarRetiradas(concluindo);

    const { dialogo } = await abrir();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Concluir esta reserva?');
    expect(dialogo).toHaveAccessibleDescription(/Aula de informática/);
    expect(within(dialogo).getByRole('button', { name: 'Confirmar conclusão' })).toHaveFocus();
    expect(within(dialogo).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('Escape fecha o diálogo, devolve o foco ao botão e não envia nada', async () => {
    const { estado } = montarRetiradas(concluindo);
    const { abridor } = await abrir();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
    expect(estado.chamadas).toHaveLength(0);
  });

  it('Voltar fecha o diálogo e devolve o foco ao botão', async () => {
    montarRetiradas(concluindo);
    const { abridor, dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
  });

  it('o Tab não sai do diálogo', async () => {
    montarRetiradas(concluindo);
    const { dialogo } = await abrir();
    const confirmar = within(dialogo).getByRole('button', { name: 'Confirmar conclusão' });
    const voltar = within(dialogo).getByRole('button', { name: 'Voltar' });

    await userEvent.tab();
    expect(voltar).toHaveFocus();
    await userEvent.tab();
    expect(confirmar).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(voltar).toHaveFocus();
  });

  it('confirmar envia o pedido, a reserva sai da lista e o resultado é anunciado com o foco', async () => {
    const { estado } = montarRetiradas(concluindo);
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar conclusão' }));

    const texto = await screen.findByText(/Reserva "Aula de informática" concluída/);
    const aviso = texto.closest('[role="status"]');
    await waitFor(() => expect(aviso).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Aula de informática' })).not.toBeInTheDocument();
    expect(estado.chamadas).toEqual([{ acao: 'conclusao', reservaId: 30, corpo: undefined }]);
  });

  it('clique duplo em Confirmar conclusão envia um único pedido', async () => {
    const { estado } = montarRetiradas(concluindo);
    const { dialogo } = await abrir();

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar conclusão' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(estado.chamadas.filter((c) => c.acao === 'conclusao')).toHaveLength(1);
  });

  it('enquanto envia, o botão mostra Concluindo… e o Escape não fecha o diálogo', async () => {
    montarRetiradas({ ...concluindo, registrar: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar conclusão' }));
    await userEvent.keyboard('{Escape}');

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Concluindo…' })).toBeDisabled();
  });

  it('MATERIAL_PENDENTE: a mensagem da tabela aparece no diálogo com o nome dos materiais pendentes', async () => {
    montarRetiradas({ ...concluindo, registrar: () => recusa(409, 'MATERIAL_PENDENTE', { itens: ['7'] }) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar conclusão' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('MATERIAL_PENDENTE').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('MATERIAL_PENDENTE').acao);
    expect(within(screen.getByRole('dialog')).getByText('Pendentes: Projetor P-007')).toBeVisible();
    expect(alerta).toHaveFocus();
  });

  it.each([
    [409, 'TRANSICAO_PROIBIDA'],
    [403, 'ACESSO_NEGADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem da tabela aparece no diálogo, que continua aberto', async (status, code) => {
    montarRetiradas({ ...concluindo, registrar: () => recusa(status, code) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar conclusão' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveFocus();
  });
});

describe('PaginaDeRetiradas: marcar não compareceu (irreversível, com confirmação)', () => {
  const marcando: Cenario = {
    reservas: [{ ...AULA_DE_INFORMATICA, recursoIds: [1], podeMarcarNaoComparecimento: true }],
    registrar: (acao, _id, _corpo, s: EstadoDoServidor) => {
      if (acao === 'nao-comparecimento') s.reservas = [];
      return undefined;
    },
  };

  async function abrir() {
    const abridor = await botao('Não compareceu Aula de informática');
    await userEvent.click(abridor);
    return { abridor, dialogo: await screen.findByRole('dialog') };
  }

  it('abre um diálogo modal com título e a reserva em questão; Escape devolve o foco', async () => {
    montarRetiradas(marcando);
    const { abridor, dialogo } = await abrir();

    expect(dialogo).toHaveAccessibleName('Marcar como não compareceu?');
    expect(dialogo).toHaveAccessibleDescription(/Aula de informática/);
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abridor).toHaveFocus();
  });

  it('confirmar envia o pedido, a reserva sai da lista e o resultado é anunciado', async () => {
    const { estado } = montarRetiradas(marcando);
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar não comparecimento' }));

    expect(await screen.findByText(/Reserva "Aula de informática" marcada como não compareceu/)).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Aula de informática' })).not.toBeInTheDocument();
    expect(estado.chamadas).toEqual([{ acao: 'nao-comparecimento', reservaId: 30, corpo: undefined }]);
  });

  it.each([
    [409, 'TOLERANCIA_NAO_ENCERRADA'],
    [409, 'TOLERANCIA_NAO_CONFIGURADA'],
    [409, 'TRANSICAO_PROIBIDA'],
    [403, 'ACESSO_NEGADO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, que continua aberto', async (status, code) => {
    montarRetiradas({ ...marcando, registrar: () => recusa(status, code) });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar não comparecimento' }));

    const alerta = await within(screen.getByRole('dialog')).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
  });

  it('TRANSICAO_PROIBIDA: a mensagem continua no diálogo mesmo que o cartão saia da lista, e ao fechar o foco vai para o título', async () => {
    const { estado } = montarRetiradas({
      ...marcando,
      registrar: (_a, _i, _c, s) => {
        s.reservas = [];
        return recusa(409, 'TRANSICAO_PROIBIDA');
      },
    });
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar não comparecimento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Aula de informática' })).not.toBeInTheDocument());
    expect(estado.listagens).toBeGreaterThan(1);
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Voltar' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Retiradas' })).toHaveFocus();
  });
});

describe('PaginaDeRetiradas: acessibilidade dos diálogos', () => {
  it('a página com o diálogo de conclusão aberto não tem violação (axe)', async () => {
    montarRetiradas({ reservas: [{ ...EM_USO, recursoIds: [1], podeConcluir: true }] });
    await userEvent.click(await botao('Concluir reserva Aula de informática'));
    await screen.findByRole('dialog');

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a página com o diálogo aberto e uma recusa não tem violação (axe)', async () => {
    montarRetiradas({ reservas: [{ ...EM_USO, recursoIds: [1], podeConcluir: true }], registrar: () => recusa(409, 'TRANSICAO_PROIBIDA') });
    await userEvent.click(await botao('Concluir reserva Aula de informática'));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmar conclusão' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
