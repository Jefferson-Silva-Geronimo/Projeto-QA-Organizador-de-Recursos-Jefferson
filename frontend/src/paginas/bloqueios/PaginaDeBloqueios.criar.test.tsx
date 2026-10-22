import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { montarBloqueios, recusa } from '@/test/bloqueios';

const formulario = () => within(screen.getByRole('form', { name: 'Novo bloqueio' }));

async function preencher(recurso = '1') {
  await screen.findByRole('article', { name: 'Sala 101' });
  await userEvent.selectOptions(formulario().getByLabelText(/^Recurso/), recurso);
  fireEvent.change(formulario().getByLabelText(/^Início/), { target: { value: '2026-11-20T08:00' } });
  fireEvent.change(formulario().getByLabelText(/^Fim/), { target: { value: '2026-11-20T18:00' } });
  await userEvent.type(formulario().getByLabelText(/^Motivo/), 'Troca do piso');
}

const bloquear = () => userEvent.click(formulario().getByRole('button', { name: 'Bloquear' }));

const PENDE = () => recusa(409, 'BLOQUEIO_PENDE_CONFIRMACAO', { itens: ['41', '44'] });

describe('PaginaDeBloqueios: novo bloqueio (RN-22)', () => {
  it('o formulário tem recurso, início, fim e motivo, todos obrigatórios', async () => {
    montarBloqueios();
    await screen.findByRole('article', { name: 'Sala 101' });

    for (const rotulo of [/^Recurso/, /^Início/, /^Fim/, /^Motivo/]) {
      expect(formulario().getByLabelText(rotulo)).toBeRequired();
    }
    expect(within(formulario().getByLabelText(/^Recurso/)).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Escolha um recurso',
      'Sala 101',
      'Laboratório de Informática 3',
      'Profa. Helena Costa',
      'Projetor P-007',
    ]);
  });

  it('Bloquear em branco aponta o que falta, leva o foco ao primeiro campo e não envia nada', async () => {
    const { estado } = montarBloqueios();
    await screen.findByRole('article', { name: 'Sala 101' });

    await bloquear();

    expect(formulario().getByText('Escolha o recurso.')).toBeInTheDocument();
    expect(formulario().getByText('Informe o início.')).toBeInTheDocument();
    expect(formulario().getByText('Informe o fim.')).toBeInTheDocument();
    expect(formulario().getByText('Informe o motivo.')).toBeInTheDocument();
    expect(formulario().getByLabelText(/^Recurso/)).toHaveFocus();
    expect(formulario().getByLabelText(/^Recurso/)).toHaveAttribute('aria-invalid', 'true');
    expect(estado.chamadas).toEqual([]);
  });

  it('sem reservas afetadas o primeiro envio cria o bloqueio: dados no fuso do campus, sem confirmação, aviso com o foco', async () => {
    const { estado } = montarBloqueios();
    await preencher();

    await bloquear();

    const texto = await screen.findByText('Bloqueio de "Sala 101" criado.');
    await waitFor(() => expect(texto.closest('[role="status"]')).toHaveFocus());
    expect(estado.chamadas).toEqual([
      {
        rota: 'criar',
        corpo: { recursoId: 1, inicio: '2026-11-20T08:00:00-03:00', fim: '2026-11-20T18:00:00-03:00', motivo: 'Troca do piso' },
      },
    ]);
    expect(await screen.findByText('4 bloqueios')).toBeInTheDocument();
    expect(formulario().getByLabelText(/^Motivo/)).toHaveValue('');
  });

  it('BLOQUEIO_PENDE_CONFIRMACAO: mostra a mensagem, a ação e a lista de reservas afetadas, com o foco, sem criar nada', async () => {
    const { estado } = montarBloqueios({ responder: (_rota, corpo) => (corpo.reservasConfirmadas ? undefined : PENDE()) });
    await preencher();

    await bloquear();

    const painel = await screen.findByRole('alert');
    expect(painel).toHaveTextContent(mensagemPara('BLOQUEIO_PENDE_CONFIRMACAO').mensagem);
    expect(painel).toHaveTextContent(mensagemPara('BLOQUEIO_PENDE_CONFIRMACAO').acao);
    expect(screen.getByText('Reservas afetadas: nº 41, nº 44')).toBeInTheDocument();
    expect(painel).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Confirmar e cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
    expect(screen.queryByText(/criado\./)).not.toBeInTheDocument();
    expect(estado.bloqueios).toHaveLength(3);
  });

  it('com a confirmação pendente, os campos ficam travados e o botão Bloquear some', async () => {
    montarBloqueios({ responder: (_rota, corpo) => (corpo.reservasConfirmadas ? undefined : PENDE()) });
    await preencher();
    await bloquear();
    await screen.findByText('Reservas afetadas: nº 41, nº 44');

    for (const rotulo of [/^Recurso/, /^Início/, /^Fim/, /^Motivo/]) {
      expect(formulario().getByLabelText(rotulo)).toBeDisabled();
    }
    expect(formulario().queryByRole('button', { name: 'Bloquear' })).not.toBeInTheDocument();
  });

  it('Confirmar e cancelar reenvia os mesmos dados com as reservas confirmadas e anuncia as canceladas', async () => {
    const { estado } = montarBloqueios({ responder: (_rota, corpo) => (corpo.reservasConfirmadas ? undefined : PENDE()) });
    await preencher();
    await bloquear();

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar e cancelar' }));

    expect(await screen.findByText(/Bloqueio de "Sala 101" criado\./)).toBeInTheDocument();
    expect(screen.getByText(/Reservas canceladas: nº 41, nº 44/)).toBeInTheDocument();
    expect(estado.chamadas).toHaveLength(2);
    expect(estado.chamadas[1]?.corpo).toEqual({
      recursoId: 1,
      inicio: '2026-11-20T08:00:00-03:00',
      fim: '2026-11-20T18:00:00-03:00',
      motivo: 'Troca do piso',
      reservasConfirmadas: [41, 44],
    });
    expect(screen.queryByRole('button', { name: 'Confirmar e cancelar' })).not.toBeInTheDocument();
  });

  it('Voltar fecha a confirmação, devolve os campos editáveis com o que foi digitado e não envia mais nada', async () => {
    const { estado } = montarBloqueios({ responder: () => PENDE() });
    await preencher();
    await bloquear();
    await screen.findByText('Reservas afetadas: nº 41, nº 44');

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByText('Reservas afetadas: nº 41, nº 44')).not.toBeInTheDocument();
    expect(formulario().getByLabelText(/^Motivo/)).toBeEnabled();
    expect(formulario().getByLabelText(/^Motivo/)).toHaveValue('Troca do piso');
    expect(formulario().getByLabelText(/^Recurso/)).toHaveValue('1');
    expect(estado.chamadas).toHaveLength(1);
  });

  it('BLOQUEIO_LISTA_DESATUALIZADA: mostra a mensagem e a ação, volta ao formulário e o próximo envio recomeça o ciclo', async () => {
    let rodada = 0;
    const { estado } = montarBloqueios({
      responder: (_rota, corpo) => {
        rodada += 1;
        if (rodada === 1) return PENDE();
        if (rodada === 2) return recusa(409, 'BLOQUEIO_LISTA_DESATUALIZADA', { itens: ['41', '44', '52'] });
        return corpo.reservasConfirmadas ? undefined : PENDE();
      },
    });
    await preencher();
    await bloquear();
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar e cancelar' }));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('BLOQUEIO_LISTA_DESATUALIZADA').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('BLOQUEIO_LISTA_DESATUALIZADA').acao);
    expect(alerta).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Confirmar e cancelar' })).not.toBeInTheDocument();
    expect(formulario().getByLabelText(/^Motivo/)).toBeEnabled();

    await bloquear();

    expect(await screen.findByRole('button', { name: 'Confirmar e cancelar' })).toBeInTheDocument();
    expect(estado.chamadas[2]?.corpo).not.toHaveProperty('reservasConfirmadas');
  });

  it('BLOQUEIO_COM_RESERVA_EM_USO: recusa com a mensagem e a ação e não oferece forçar nem confirmar', async () => {
    montarBloqueios({ responder: () => recusa(409, 'BLOQUEIO_COM_RESERVA_EM_USO') });
    await preencher();

    await bloquear();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('BLOQUEIO_COM_RESERVA_EM_USO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('BLOQUEIO_COM_RESERVA_EM_USO').acao);
    expect(alerta).toHaveFocus();
    expect(screen.queryByRole('button', { name: /Confirmar|Forçar/ })).not.toBeInTheDocument();
    expect(formulario().getByRole('button', { name: 'Bloquear' })).toBeEnabled();
  });

  it('MOTIVO_OBRIGATORIO do servidor marca o motivo', async () => {
    montarBloqueios({ responder: () => recusa(400, 'MOTIVO_OBRIGATORIO') });
    await preencher();

    await bloquear();

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagemPara('MOTIVO_OBRIGATORIO').mensagem);
    expect(formulario().getByLabelText(/^Motivo/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('PERIODO_INVALIDO do servidor marca o fim', async () => {
    montarBloqueios({ responder: () => recusa(400, 'PERIODO_INVALIDO') });
    await preencher();

    await bloquear();

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagemPara('PERIODO_INVALIDO').mensagem);
    expect(formulario().getByLabelText(/^Fim/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('enquanto envia, o botão fica ocupado e um clique duplo envia um único pedido', async () => {
    const { estado } = montarBloqueios({ responder: () => new Promise<Response>(() => {}) });
    await preencher();

    await userEvent.dblClick(formulario().getByRole('button', { name: 'Bloquear' }));

    expect(formulario().getByRole('button', { name: 'Bloqueando…' })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it('enquanto confirma, um clique duplo em Confirmar e cancelar envia um único pedido', async () => {
    let rodada = 0;
    const { estado } = montarBloqueios({
      responder: () => {
        rodada += 1;
        return rodada === 1 ? PENDE() : new Promise<Response>(() => {});
      },
    });
    await preencher();
    await bloquear();

    await userEvent.dblClick(await screen.findByRole('button', { name: 'Confirmar e cancelar' }));

    expect(estado.chamadas).toHaveLength(2);
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montarBloqueios({
      responder: () => {
        throw new TypeError('Failed to fetch');
      },
    });
    await preencher();

    await bloquear();

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('o formulário e a confirmação não têm violações de acessibilidade', async () => {
    const { container } = montarBloqueios({ responder: (_rota, corpo) => (corpo.reservasConfirmadas ? undefined : PENDE()) });
    await preencher();
    expect(await axe(container)).toHaveNoViolations();

    await bloquear();
    await screen.findByText('Reservas afetadas: nº 41, nº 44');

    expect(await axe(container)).toHaveNoViolations();
  });
});
