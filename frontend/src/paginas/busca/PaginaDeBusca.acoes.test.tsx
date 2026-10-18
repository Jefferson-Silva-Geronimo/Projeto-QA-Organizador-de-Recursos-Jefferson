import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { PROJETOR, SALA_101 } from '@/test/recursos';

const AGORA = new Date('2026-10-20T15:00:00Z');

interface Ocupacao {
  inicio: string;
  fim: string;
}

function montar(rota = '/buscar', ocupacoes: () => Response = () => resposta(200, [])) {
  const falso = rotearFetch({
    'GET /api/recursos': () => resposta(200, [SALA_101, PROJETOR]),
    'GET /api/recursos/1/ocupacoes': ocupacoes,
    'GET /api/recursos/7/ocupacoes': ocupacoes,
  });
  const { container } = montarPagina({
    rota,
    caminho: '/buscar',
    elemento: <PaginaDeBusca agora={AGORA} />,
    fetch: falso,
  });
  return { falso, container };
}

const cartao = (nome: RegExp) => within(screen.getByRole('article', { name: nome }));

describe('PaginaDeBusca: ações de cada recurso', () => {
  it('Reservar leva o recurso à Nova reserva, e o nome do recurso faz parte do nome do link', async () => {
    montar();
    await screen.findByText('2 recursos encontrados');

    const link = cartao(/Sala 101/).getByRole('link', { name: 'Reservar Sala 101' });

    expect(link).toHaveAttribute('href', '/reservas/nova?recursos=1');
  });

  it('com período na busca, o link leva também o período, na hora do campus', async () => {
    montar('/buscar?inicio=2026-10-21T14:00&fim=2026-10-21T16:00');
    await screen.findByText('2 recursos encontrados');

    const link = cartao(/Projetor P-007/).getByRole('link', { name: 'Reservar Projetor P-007' });

    expect(link.getAttribute('href')).toBe(
      '/reservas/nova?recursos=7&inicio=2026-10-21T14%3A00&fim=2026-10-21T16%3A00',
    );
  });

  it('Ver horários ocupados abre a lista de intervalos, sem dono, na hora do campus', async () => {
    const intervalos: Ocupacao[] = [
      { inicio: '2026-10-21T17:00:00Z', fim: '2026-10-21T19:00:00Z' },
      { inicio: '2026-10-22T11:00:00Z', fim: '2026-10-22T13:00:00Z' },
    ];
    montar('/buscar', () => resposta(200, intervalos));
    await screen.findByText('2 recursos encontrados');
    const botao = cartao(/Sala 101/).getByRole('button', { name: 'Ver horários ocupados de Sala 101' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(botao);

    expect(botao).toHaveAttribute('aria-expanded', 'true');
    const lista = within(await cartao(/Sala 101/).findByRole('list', { name: 'Horários ocupados' }));
    const itens = lista.getAllByRole('listitem').map((i) => i.textContent);
    expect(itens[0]).toContain('14:00 às 16:00');
    expect(itens[1]).toContain('08:00 às 10:00');
  });

  it('sem período na busca, consulta os próximos 14 dias a partir de agora', async () => {
    const { falso } = montar();
    await screen.findByText('2 recursos encontrados');

    await userEvent.click(cartao(/Sala 101/).getByRole('button', { name: /Ver horários ocupados/ }));
    await cartao(/Sala 101/).findByText('Nenhum horário ocupado neste período.');

    const pedido = falso.mock.calls.map(([e]) => new URL((e as Request).url)).find((u) => u.pathname.endsWith('/ocupacoes'));
    expect(pedido?.searchParams.get('inicio')).toBe('2026-10-20T12:00:00-03:00');
    expect(pedido?.searchParams.get('fim')).toBe('2026-11-03T12:00:00-03:00');
  });

  it('com período na busca, consulta exatamente esse período', async () => {
    const { falso } = montar('/buscar?inicio=2026-10-21T14:00&fim=2026-10-21T16:00');
    await screen.findByText('2 recursos encontrados');

    await userEvent.click(cartao(/Sala 101/).getByRole('button', { name: /Ver horários ocupados/ }));
    await cartao(/Sala 101/).findByText('Nenhum horário ocupado neste período.');

    const pedido = falso.mock.calls.map(([e]) => new URL((e as Request).url)).find((u) => u.pathname.endsWith('/ocupacoes'));
    expect(pedido?.searchParams.get('inicio')).toBe('2026-10-21T14:00:00-03:00');
    expect(pedido?.searchParams.get('fim')).toBe('2026-10-21T16:00:00-03:00');
  });

  it('clicar de novo recolhe a lista', async () => {
    montar();
    await screen.findByText('2 recursos encontrados');
    const botao = cartao(/Sala 101/).getByRole('button', { name: /Ver horários ocupados/ });
    await userEvent.click(botao);
    await cartao(/Sala 101/).findByText('Nenhum horário ocupado neste período.');

    await userEvent.click(botao);

    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(cartao(/Sala 101/).queryByText('Nenhum horário ocupado neste período.')).not.toBeInTheDocument();
  });

  it('falha ao consultar os horários mostra a mensagem compreensível dentro do cartão', async () => {
    montar('/buscar', () => resposta(500, { status: 500, code: 'ERRO_INTERNO' }));
    await screen.findByText('2 recursos encontrados');

    await userEvent.click(cartao(/Sala 101/).getByRole('button', { name: /Ver horários ocupados/ }));

    expect(await cartao(/Sala 101/).findByRole('alert')).toHaveTextContent(mensagemPara('ERRO_INTERNO').mensagem);
  });

  it('a página com resultados e horários abertos não tem violação de acessibilidade (axe)', async () => {
    const { container } = montar('/buscar', () => resposta(200, [{ inicio: '2026-10-21T17:00:00Z', fim: '2026-10-21T19:00:00Z' }]));
    await screen.findByText('2 recursos encontrados');
    await userEvent.click(cartao(/Sala 101/).getByRole('button', { name: /Ver horários ocupados/ }));
    await cartao(/Sala 101/).findByRole('list', { name: 'Horários ocupados' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
