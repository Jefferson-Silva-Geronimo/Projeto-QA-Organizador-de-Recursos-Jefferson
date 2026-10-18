import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { PaginaDeNovaReserva } from '@/paginas/reserva/PaginaDeNovaReserva';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { TODOS } from '@/test/recursos';

const ENDERECO = '/reservas/nova?inicio=2026-10-21T14:00&fim=2026-10-21T16:00';

interface Reserva {
  id: number;
  solicitanteId: number;
  titulo: string;
  inicio: string;
  fim: string;
  estado: 'APROVADA' | 'SOLICITADA';
  exigeAprovacao: boolean;
  recursoIds: number[];
}

function reservaCriada(estado: Reserva['estado'], recursoIds: number[] = [1]): Reserva {
  return {
    id: 41,
    solicitanteId: 12,
    titulo: 'Aula de reforço',
    inicio: '2026-10-21T17:00:00Z',
    fim: '2026-10-21T19:00:00Z',
    estado,
    exigeAprovacao: estado === 'SOLICITADA',
    recursoIds,
  };
}

function montar(criar: (pedido: Request) => Response | Promise<Response>, rota = ENDERECO) {
  const falso = rotearFetch({
    'GET /api/recursos': () => resposta(200, TODOS),
    'POST /api/reservas': criar,
  });
  montarPagina({
    rota,
    caminho: '/reservas/nova',
    elemento: <PaginaDeNovaReserva />,
    fetch: falso,
    outras: <Route path="/reservas" element={<p>Minhas reservas</p>} />,
  });
  return falso;
}

async function preencherEReservar(titulo = 'Aula de reforço', ...recursos: RegExp[]) {
  await screen.findByRole('group', { name: 'Salas' });
  await userEvent.type(screen.getByLabelText(/Título/), titulo);
  for (const nome of recursos) {
    await userEvent.click(screen.getByRole('checkbox', { name: nome }));
  }
  await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));
}

const envios = (falso: ReturnType<typeof montar>) =>
  falso.mock.calls.map(([e]) => e as Request).filter((p) => p.method === 'POST');

describe('PaginaDeNovaReserva: envio', () => {
  it('envia título, período em ISO com offset e os recursos marcados, com a sessão no cabeçalho', async () => {
    const falso = montar(async () => resposta(201, reservaCriada('APROVADA', [1, 7])));

    await preencherEReservar('Aula de reforço', /Sala 101/, /Projetor P-007/);

    await screen.findByText('Reserva aprovada');
    const pedido = envios(falso)[0] as Request;
    expect(new URL(pedido.url).pathname).toBe('/api/reservas');
    expect(pedido.headers.get('Authorization')).toBe('Bearer token-de-teste');
    expect(await pedido.clone().json()).toEqual({
      titulo: 'Aula de reforço',
      inicio: '2026-10-21T14:00:00-03:00',
      fim: '2026-10-21T16:00:00-03:00',
      recursoIds: [1, 7],
    });
  });

  it('a descrição só vai quando preenchida, e o título vai sem espaços nas pontas', async () => {
    const falso = montar(async () => resposta(201, reservaCriada('APROVADA')));
    await screen.findByRole('group', { name: 'Salas' });

    await userEvent.type(screen.getByLabelText(/Título/), '  Aula de reforço  ');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Revisão para a prova.');
    await userEvent.click(screen.getByRole('checkbox', { name: /Sala 101/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    await screen.findByText('Reserva aprovada');
    const corpo = (await (envios(falso)[0] as Request).clone().json()) as Record<string, unknown>;
    expect(corpo.titulo).toBe('Aula de reforço');
    expect(corpo.descricao).toBe('Revisão para a prova.');
  });

  it('reserva aprovada pelo servidor: confirma com o resumo, em texto, e oferece os próximos passos', async () => {
    montar(async () => resposta(201, reservaCriada('APROVADA')));

    await preencherEReservar('Aula de reforço', /Sala 101/);

    const confirmacao = await screen.findByRole('status');
    expect(confirmacao).toHaveTextContent('Reserva aprovada');
    expect(confirmacao).toHaveTextContent('Aula de reforço');
    expect(confirmacao).toHaveTextContent('14:00 às 16:00');
    expect(confirmacao).toHaveTextContent('Sala 101');
    expect(screen.getByRole('link', { name: 'Ver minhas reservas' })).toHaveAttribute('href', '/reservas');
    expect(screen.getByRole('button', { name: 'Fazer outra reserva' })).toBeInTheDocument();
  });

  it('a mensagem vem do estado que o servidor devolveu: SOLICITADA mesmo com recurso comum', async () => {
    montar(async () => resposta(201, reservaCriada('SOLICITADA')));

    await preencherEReservar('Aula de reforço', /Sala 101/);

    const confirmacao = await screen.findByRole('status');
    expect(confirmacao).toHaveTextContent('Reserva enviada para aprovação');
    expect(confirmacao).not.toHaveTextContent('Reserva aprovada');
  });

  it('e o contrário: recurso restrito marcado, servidor devolve APROVADA, o front confirma aprovada', async () => {
    montar(async () => resposta(201, reservaCriada('APROVADA', [3])));

    await preencherEReservar('Aula de reforço', /Laboratório de Informática 3/);

    expect(await screen.findByRole('status')).toHaveTextContent('Reserva aprovada');
  });

  it('enquanto envia: botão ocupado, e dois cliques geram um só pedido', async () => {
    let liberar: (r: Response) => void = () => {};
    const falso = montar(() => new Promise<Response>((resolver) => (liberar = resolver)));
    await screen.findByRole('group', { name: 'Salas' });
    await userEvent.type(screen.getByLabelText(/Título/), 'Aula de reforço');
    await userEvent.click(screen.getByRole('checkbox', { name: /Sala 101/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    const ocupado = await screen.findByRole('button', { name: 'Reservando…' });
    await userEvent.click(ocupado);
    await userEvent.click(ocupado);

    expect(ocupado).toBeDisabled();
    expect(ocupado).toHaveAttribute('aria-busy', 'true');
    expect(envios(falso)).toHaveLength(1);
    liberar(resposta(201, reservaCriada('APROVADA')));
    await screen.findByText('Reserva aprovada');
  });

  it('a confirmação mostra os nomes dos recursos mesmo que o servidor já não os liste como livres', async () => {
    let consultas = 0;
    const falso = rotearFetch({
      // Depois da reserva a lista é refeita e a Sala 101 já não aparece como livre.
      'GET /api/recursos': () => resposta(200, ++consultas === 1 ? TODOS : TODOS.filter((r) => r.id !== 1)),
      'POST /api/reservas': async () => resposta(201, reservaCriada('APROVADA', [1])),
    });
    montarPagina({
      rota: ENDERECO,
      caminho: '/reservas/nova',
      elemento: <PaginaDeNovaReserva />,
      fetch: falso,
      outras: <Route path="/reservas" element={<p>Minhas reservas</p>} />,
    });

    await preencherEReservar('Aula de reforço', /Sala 101/);

    const confirmacao = await screen.findByRole('status');
    expect(confirmacao).toHaveTextContent('Sala 101');
    expect(confirmacao).not.toHaveTextContent('Recurso 1');
  });

  it('depois do sucesso o foco vai para a confirmação e o formulário some', async () => {
    montar(async () => resposta(201, reservaCriada('APROVADA')));

    await preencherEReservar('Aula de reforço', /Sala 101/);

    expect(await screen.findByRole('status')).toHaveFocus();
    expect(screen.queryByLabelText(/Título/)).not.toBeInTheDocument();
  });

  it('Fazer outra reserva volta a um formulário limpo', async () => {
    montar(async () => resposta(201, reservaCriada('APROVADA')));
    await preencherEReservar('Aula de reforço', /Sala 101/);
    await screen.findByRole('status');

    await userEvent.click(screen.getByRole('button', { name: 'Fazer outra reserva' }));

    expect(screen.getByLabelText(/Título/)).toHaveValue('');
    expect(screen.getByLabelText(/Início/)).toHaveValue('');
    expect(screen.getByText(/Informe o início e o fim/)).toBeInTheDocument();
  });
});
