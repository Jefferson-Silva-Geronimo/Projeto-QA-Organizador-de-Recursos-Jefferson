import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { ATIVO, COM_CANCELADAS, LEVANTADO, montarBloqueios, recusa } from '@/test/bloqueios';

async function cartao(nome: string) {
  return screen.findByRole('article', { name: nome });
}

describe('PaginaDeBloqueios: lista (T08, RN-22)', () => {
  it('o título da tela é Bloqueios, com a contagem e um cartão por bloqueio', async () => {
    montarBloqueios();

    expect(await screen.findByRole('heading', { level: 1, name: 'Bloqueios' })).toBeInTheDocument();
    expect(await screen.findByText('3 bloqueios')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('um único bloqueio usa o singular', async () => {
    montarBloqueios({ bloqueios: [ATIVO] });

    expect(await screen.findByText('1 bloqueio')).toBeInTheDocument();
  });

  it('cada bloqueio mostra o recurso pelo nome, o período na hora do campus, o motivo e a situação', async () => {
    montarBloqueios();

    const sala = await cartao('Sala 101');

    expect(within(sala).getByText(/10\/11.*08:00 às 18:00/)).toBeInTheDocument();
    expect(within(sala).getByText('Pintura da sala')).toBeInTheDocument();
    expect(within(sala).getByText('Ativo')).toBeInTheDocument();
    expect(within(await cartao('Laboratório de Informática 3')).getByText('Levantado')).toBeInTheDocument();
  });

  it('recurso que não está mais na lista aparece pelo número, e não some', async () => {
    montarBloqueios({ bloqueios: [{ ...ATIVO, recursoId: 99 }] });

    expect(await cartao('Recurso nº 99')).toBeInTheDocument();
  });

  it('as reservas que o bloqueio cancelou aparecem como o servidor as devolveu', async () => {
    montarBloqueios();

    const projetor = await cartao('Projetor P-007');

    expect(within(projetor).getByText('Reservas canceladas: nº 41, nº 44')).toBeInTheDocument();
    expect(within(await cartao('Sala 101')).queryByText(/Reservas canceladas/)).not.toBeInTheDocument();
  });

  it('só os bloqueios ativos oferecem Levantar, com o recurso no nome do botão', async () => {
    montarBloqueios();

    const sala = await cartao('Sala 101');

    expect(within(sala).getByRole('button', { name: 'Levantar bloqueio Sala 101' })).toBeInTheDocument();
    expect(within(await cartao('Laboratório de Informática 3')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('enquanto consulta mostra o carregando', () => {
    montarBloqueios({ listar: () => new Promise<Response>(() => {}) });

    expect(screen.getByText('Carregando bloqueios…')).toBeInTheDocument();
  });

  it('sem bloqueios mostra o estado vazio', async () => {
    montarBloqueios({ bloqueios: [] });

    expect(await screen.findByText('Nada bloqueado')).toBeInTheDocument();
    expect(screen.getByText('Nenhum bloqueio registrado.')).toBeInTheDocument();
  });

  it('erro da consulta mostra a mensagem da tabela de erros e o botão de tentar de novo', async () => {
    montarBloqueios({ listar: () => recusa(403, 'ACESSO_NEGADO') });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument();
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = montarBloqueios();
    await cartao('Sala 101');

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('PaginaDeBloqueios: levantar (o servidor exige o motivo)', () => {
  async function abrir(nome = 'Sala 101') {
    const cartaoDoBloqueio = await cartao(nome);
    const abridor = within(cartaoDoBloqueio).getByRole('button', { name: `Levantar bloqueio ${nome}` });
    await userEvent.click(abridor);
    return { abridor, dialogo: await screen.findByRole('dialog') };
  }

  async function levantarComMotivo(dialogo: HTMLElement, motivo = 'Obra concluída') {
    await userEvent.type(within(dialogo).getByLabelText(/^Motivo/), motivo);
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Levantar bloqueio' }));
  }

  it('Levantar abre um diálogo modal com o recurso em questão e o foco no motivo', async () => {
    montarBloqueios();

    const { dialogo } = await abrir();

    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Levantar este bloqueio?');
    expect(dialogo).toHaveAccessibleDescription(/Sala 101/);
    expect(within(dialogo).getByLabelText(/^Motivo/)).toBeRequired();
    expect(within(dialogo).getByLabelText(/^Motivo/)).toHaveFocus();
    expect(within(dialogo).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('sem motivo aponta o campo, com o foco, e não envia nada', async () => {
    const { estado } = montarBloqueios();
    const { dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Levantar bloqueio' }));

    expect(within(dialogo).getByText('Informe o motivo.')).toBeInTheDocument();
    expect(within(dialogo).getByLabelText(/^Motivo/)).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialogo).getByLabelText(/^Motivo/)).toHaveFocus();
    expect(estado.chamadas).toEqual([]);
  });

  it('envia o motivo sem espaços nas pontas, anuncia com o foco e o cartão passa a Levantado, sem ação', async () => {
    const { estado } = montarBloqueios();
    const { dialogo } = await abrir();

    await levantarComMotivo(dialogo, '  Obra concluída ');

    const texto = await screen.findByText('Bloqueio de "Sala 101" levantado.');
    await waitFor(() => expect(texto.closest('[role="status"]')).toHaveFocus());
    expect(estado.chamadas).toEqual([{ rota: 'levantamento:5', corpo: { motivo: 'Obra concluída' } }]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole('article', { name: 'Sala 101' })).getByText('Levantado')).toBeInTheDocument());
    expect(within(screen.getByRole('article', { name: 'Sala 101' })).queryByRole('button')).not.toBeInTheDocument();
  });

  it('enquanto envia, o botão fica ocupado e um clique duplo envia um único pedido', async () => {
    const { estado } = montarBloqueios({ responder: () => new Promise<Response>(() => {}) });
    const { dialogo } = await abrir();
    await userEvent.type(within(dialogo).getByLabelText(/^Motivo/), 'Obra concluída');

    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Levantar bloqueio' }));

    expect(within(dialogo).getByRole('button', { name: 'Levantando…' })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it.each([
    [403, 'ACESSO_NEGADO'],
    [404, 'NAO_ENCONTRADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no diálogo, com o foco, e o botão volta a funcionar', async (status, code) => {
    montarBloqueios({ responder: () => recusa(status, code) });
    const { dialogo } = await abrir();

    await levantarComMotivo(dialogo);

    const alerta = await within(dialogo).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
    expect(within(dialogo).getByRole('button', { name: 'Levantar bloqueio' })).toBeEnabled();
    expect(within(screen.getByRole('article', { name: 'Sala 101' })).getByText('Ativo')).toBeInTheDocument();
  });

  it('MOTIVO_OBRIGATORIO do servidor marca o motivo', async () => {
    montarBloqueios({ responder: () => recusa(400, 'MOTIVO_OBRIGATORIO') });
    const { dialogo } = await abrir();

    await levantarComMotivo(dialogo);

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(mensagemPara('MOTIVO_OBRIGATORIO').mensagem);
    expect(within(dialogo).getByLabelText(/^Motivo/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('Voltar fecha sem levantar e devolve o foco ao botão que abriu', async () => {
    const { estado } = montarBloqueios();
    const { abridor, dialogo } = await abrir();

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Voltar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(abridor).toHaveFocus();
    expect(estado.chamadas).toEqual([]);
  });

  it('Escape fecha o diálogo e o Tab fica preso dentro dele enquanto está aberto', async () => {
    montarBloqueios();
    const { abridor, dialogo } = await abrir();

    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      expect(dialogo.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(abridor).toHaveFocus();
  });

  it('o bloqueio com reservas canceladas também pode ser levantado, e o aviso não promete reativar as reservas', async () => {
    montarBloqueios({ bloqueios: [COM_CANCELADAS, LEVANTADO] });
    const { dialogo } = await abrir('Projetor P-007');

    await levantarComMotivo(dialogo);

    expect(await screen.findByText('Bloqueio de "Projetor P-007" levantado.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/reativ/i);
  });

  it('o diálogo não tem violações de acessibilidade', async () => {
    montarBloqueios();
    const { dialogo } = await abrir();

    expect(await axe(dialogo)).toHaveNoViolations();
  });
});
