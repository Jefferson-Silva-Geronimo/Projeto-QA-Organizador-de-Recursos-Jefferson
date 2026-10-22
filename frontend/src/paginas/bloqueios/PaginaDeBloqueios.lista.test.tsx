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

describe('PaginaDeBloqueios: levantar', () => {
  it('Levantar envia o levantamento, anuncia com o foco e o cartão passa a Levantado, sem ação', async () => {
    const { estado } = montarBloqueios();
    const sala = await cartao('Sala 101');

    await userEvent.click(within(sala).getByRole('button', { name: 'Levantar bloqueio Sala 101' }));

    const texto = await screen.findByText('Bloqueio de "Sala 101" levantado.');
    await waitFor(() => expect(texto.closest('[role="status"]')).toHaveFocus());
    expect(estado.chamadas).toEqual([{ rota: 'levantamento:5', corpo: {} }]);
    await waitFor(() => expect(within(screen.getByRole('article', { name: 'Sala 101' })).getByText('Levantado')).toBeInTheDocument());
    expect(within(screen.getByRole('article', { name: 'Sala 101' })).queryByRole('button')).not.toBeInTheDocument();
  });

  it('enquanto envia, o botão fica ocupado e um clique duplo envia um único pedido', async () => {
    const { estado } = montarBloqueios({ responder: () => new Promise<Response>(() => {}) });
    const sala = await cartao('Sala 101');

    await userEvent.dblClick(within(sala).getByRole('button', { name: 'Levantar bloqueio Sala 101' }));

    expect(within(sala).getByRole('button', { name: /Levantando/ })).toBeDisabled();
    expect(estado.chamadas).toHaveLength(1);
  });

  it.each([
    [403, 'ACESSO_NEGADO'],
    [404, 'NAO_ENCONTRADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: a mensagem e a ação da tabela de erros aparecem no cartão, com o foco, e o botão volta a funcionar', async (status, code) => {
    montarBloqueios({ responder: () => recusa(status, code) });
    const sala = await cartao('Sala 101');

    await userEvent.click(within(sala).getByRole('button', { name: 'Levantar bloqueio Sala 101' }));

    const alerta = await within(sala).findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
    expect(within(sala).getByRole('button', { name: 'Levantar bloqueio Sala 101' })).toBeEnabled();
    expect(within(sala).getByText('Ativo')).toBeInTheDocument();
  });

  it('o bloqueio com reservas canceladas também pode ser levantado, e o aviso não promete reativar as reservas', async () => {
    montarBloqueios({ bloqueios: [COM_CANCELADAS, LEVANTADO] });
    const projetor = await cartao('Projetor P-007');

    await userEvent.click(within(projetor).getByRole('button', { name: 'Levantar bloqueio Projetor P-007' }));

    expect(await screen.findByText('Bloqueio de "Projetor P-007" levantado.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/reativ/i);
  });
});
