import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { PaginaDeNovaReserva } from '@/paginas/reserva/PaginaDeNovaReserva';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { SALA_101, TODOS } from '@/test/recursos';

const PERIODO = '?inicio=2026-10-21T14:00&fim=2026-10-21T16:00';

function montar(rota = '/reservas/nova') {
  const falso = rotearFetch({ 'GET /api/recursos': () => resposta(200, TODOS) });
  montarPagina({ rota, caminho: '/reservas/nova', elemento: <PaginaDeNovaReserva />, fetch: falso, perfil: 'SOLICITANTE' });
  return falso;
}

const consultasDeRecursos = (falso: ReturnType<typeof montar>) =>
  falso.mock.calls.map(([e]) => new URL((e as Request).url)).filter((u) => u.pathname === '/api/recursos');

describe('PaginaDeNovaReserva: estrutura e recursos livres', () => {
  it('tem título, descrição, início e fim, com "obrigatório" dito em texto, e o botão Reservar', () => {
    montar();

    expect(screen.getByRole('heading', { level: 1, name: 'Nova reserva' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toBeRequired();
    expect(screen.getByLabelText(/Início/)).toBeRequired();
    expect(screen.getByLabelText(/Fim/)).toBeRequired();
    expect(screen.getByLabelText('Descrição')).not.toBeRequired();
    expect(screen.getAllByText('(obrigatório)')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument();
  });

  it('sem período, explica que os recursos livres aparecem depois de informar início e fim, e não consulta', () => {
    const falso = montar();

    expect(screen.getByText(/Informe o início e o fim para ver os recursos livres/)).toBeInTheDocument();
    expect(consultasDeRecursos(falso)).toHaveLength(0);
  });

  it('com período no endereço, consulta os recursos livres em ISO-8601 com offset do campus', async () => {
    const falso = montar(`/reservas/nova${PERIODO}`);

    await screen.findByRole('group', { name: 'Salas' });

    const consulta = consultasDeRecursos(falso)[0];
    expect(consulta?.searchParams.get('inicio')).toBe('2026-10-21T14:00:00-03:00');
    expect(consulta?.searchParams.get('fim')).toBe('2026-10-21T16:00:00-03:00');
  });

  it('os campos de início e fim vêm preenchidos com o período do endereço', () => {
    montar(`/reservas/nova${PERIODO}`);

    expect(screen.getByLabelText(/Início/)).toHaveValue('2026-10-21T14:00');
    expect(screen.getByLabelText(/Fim/)).toHaveValue('2026-10-21T16:00');
  });

  it('digitar o período depois de abrir a página carrega os recursos livres', async () => {
    const falso = montar();

    fireEvent.change(screen.getByLabelText(/Início/), { target: { value: '2026-10-21T14:00' } });
    expect(consultasDeRecursos(falso)).toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/Fim/), { target: { value: '2026-10-21T16:00' } });

    expect(await screen.findByRole('group', { name: 'Salas' })).toBeInTheDocument();
    await waitFor(() => expect(consultasDeRecursos(falso)).toHaveLength(1));
  });

  it('agrupa os recursos livres em Salas, Professores e Materiais, com uma caixa de marcar para cada', async () => {
    montar(`/reservas/nova${PERIODO}`);

    const salas = within(await screen.findByRole('group', { name: 'Salas' }));
    const professores = within(screen.getByRole('group', { name: 'Professores' }));
    const materiais = within(screen.getByRole('group', { name: 'Materiais' }));

    expect(salas.getAllByRole('checkbox')).toHaveLength(2);
    expect(salas.getByRole('checkbox', { name: /Sala 101/ })).not.toBeChecked();
    expect(salas.getByRole('checkbox', { name: /Laboratório de Informática 3/ })).toBeInTheDocument();
    expect(professores.getByRole('checkbox', { name: /Helena Costa/ })).toBeInTheDocument();
    expect(materiais.getByRole('checkbox', { name: /Projetor P-007/ })).toBeInTheDocument();
  });

  it('recurso restrito mostra "Exige aprovação" ao lado do nome, vindo do dado do servidor', async () => {
    montar(`/reservas/nova${PERIODO}`);

    const laboratorio = await screen.findByRole('checkbox', { name: /Laboratório de Informática 3/ });
    const livre = screen.getByRole('checkbox', { name: /Sala 101/ });

    expect(laboratorio).toHaveAccessibleName(expect.stringContaining('Exige aprovação'));
    expect(livre).not.toHaveAccessibleName(expect.stringContaining('Exige aprovação'));
  });

  it('o recurso escolhido na Busca (recursos=1 no endereço) já vem marcado', async () => {
    montar(`/reservas/nova${PERIODO}&recursos=1&recursos=7`);

    expect(await screen.findByRole('checkbox', { name: /Sala 101/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Projetor P-007/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Helena Costa/ })).not.toBeChecked();
  });

  it('recurso escolhido que não está livre no período some da seleção e a pessoa é avisada', async () => {
    montar(`/reservas/nova${PERIODO}&recursos=999`);

    await screen.findByRole('group', { name: 'Salas' });

    expect(screen.getByRole('status')).toHaveTextContent(/não está livre nesse período/);
    for (const caixa of screen.getAllByRole('checkbox')) {
      expect(caixa).not.toBeChecked();
    }
  });

  it('só mostra o grupo que tem recursos', async () => {
    const falso = rotearFetch({ 'GET /api/recursos': () => resposta(200, [SALA_101]) });
    montarPagina({ rota: `/reservas/nova${PERIODO}`, caminho: '/reservas/nova', elemento: <PaginaDeNovaReserva />, fetch: falso });

    await screen.findByRole('group', { name: 'Salas' });

    expect(screen.queryByRole('group', { name: 'Professores' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Materiais' })).not.toBeInTheDocument();
  });

  it('nenhum recurso livre no período: diz isso e sugere outro horário', async () => {
    const falso = rotearFetch({ 'GET /api/recursos': () => resposta(200, []) });
    montarPagina({ rota: `/reservas/nova${PERIODO}`, caminho: '/reservas/nova', elemento: <PaginaDeNovaReserva />, fetch: falso });

    expect(await screen.findByText('Nenhum recurso livre neste período')).toBeInTheDocument();
    expect(screen.getByText(/Escolha outro horário/)).toBeInTheDocument();
  });

  it('o front não inventa recurso: sem a resposta do servidor não há caixas de marcar', () => {
    montar();

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});
