import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, SALA_101, TODOS } from '@/test/recursos';

function LocalAtual() {
  const { search } = useLocation();
  return <output aria-label="endereço atual">{search}</output>;
}

/** Responde com todos os recursos quando não há filtro e só com a Sala 101 quando há. */
function montar(rota = '/buscar') {
  const falso = rotearFetch({
    'GET /api/recursos': (pedido) => {
      const filtrado = [...new URL(pedido.url).searchParams.keys()].length > 0;
      return resposta(200, filtrado ? [SALA_101] : TODOS);
    },
  });
  montarPagina({
    rota,
    caminho: '/buscar',
    elemento: (
      <>
        <PaginaDeBusca />
        <LocalAtual />
      </>
    ),
    fetch: falso,
  });
  return falso;
}

const consultas = (falso: ReturnType<typeof montar>) =>
  falso.mock.calls.map(([entrada]) => new URL((entrada as Request).url).searchParams);

const formulario = () => within(screen.getByRole('search', { name: 'Filtros da busca' }));

describe('PaginaDeBusca: filtros', () => {
  it('tem um campo para cada filtro, todos opcionais, e os botões Buscar e Limpar filtros', async () => {
    montar();
    await screen.findByText('4 recursos encontrados');

    const filtros = formulario();
    for (const rotulo of ['Tipo', 'Capacidade mínima', 'Local', 'Competência', 'Início', 'Fim']) {
      expect(filtros.getByLabelText(rotulo)).toBeInTheDocument();
    }
    expect(filtros.queryByText('(obrigatório)')).not.toBeInTheDocument();
    expect(filtros.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    expect(filtros.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('o tipo oferece Todos, Sala, Professor e Material', async () => {
    montar();
    await screen.findByText('4 recursos encontrados');

    const opcoes = within(formulario().getByLabelText('Tipo')).getAllByRole('option');

    expect(opcoes.map((o) => o.textContent)).toEqual(['Todos', 'Sala', 'Professor', 'Material']);
  });

  it('Buscar envia os filtros preenchidos e mostra o novo resultado', async () => {
    const falso = montar();
    await screen.findByText('4 recursos encontrados');

    await userEvent.selectOptions(formulario().getByLabelText('Tipo'), 'Sala');
    await userEvent.type(formulario().getByLabelText('Capacidade mínima'), '30');
    await userEvent.type(formulario().getByLabelText('Local'), 'Bloco A');
    await userEvent.click(formulario().getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByText('1 recurso encontrado')).toBeInTheDocument();
    const ultima = consultas(falso).at(-1) as URLSearchParams;
    expect(ultima.get('tipo')).toBe('SALA');
    expect(ultima.get('capacidadeMinima')).toBe('30');
    expect(ultima.get('localizacao')).toBe('Bloco A');
    expect(ultima.has('inicio')).toBe(false);
  });

  it('o período vai ao servidor em ISO-8601 com offset do campus (ADR-005)', async () => {
    const falso = montar();
    await screen.findByText('4 recursos encontrados');

    fireEvent.change(formulario().getByLabelText('Início'), { target: { value: '2026-10-21T14:00' } });
    fireEvent.change(formulario().getByLabelText('Fim'), { target: { value: '2026-10-21T16:00' } });
    await userEvent.click(formulario().getByRole('button', { name: 'Buscar' }));

    await screen.findByText('1 recurso encontrado');
    const ultima = consultas(falso).at(-1) as URLSearchParams;
    expect(ultima.get('inicio')).toBe('2026-10-21T14:00:00-03:00');
    expect(ultima.get('fim')).toBe('2026-10-21T16:00:00-03:00');
  });

  it.each([
    ['Início', 'Fim', 'Informe também o fim do período.'],
    ['Fim', 'Início', 'Informe também o início do período.'],
  ])('só %s preenchido: pede o %s, marca o campo e não consulta o servidor', async (preenchido, faltante, mensagem) => {
    const falso = montar();
    await screen.findByText('4 recursos encontrados');
    const antes = falso.mock.calls.length;

    fireEvent.change(formulario().getByLabelText(preenchido), { target: { value: '2026-10-21T14:00' } });
    await userEvent.click(formulario().getByRole('button', { name: 'Buscar' }));

    const campo = formulario().getByLabelText(faltante);
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(mensagem);
    expect(falso.mock.calls.length).toBe(antes);
  });

  it('Limpar filtros esvazia os campos e volta a listar tudo', async () => {
    const falso = montar('/buscar?tipo=SALA&capacidadeMinima=30');
    await screen.findByText('1 recurso encontrado');

    await userEvent.click(formulario().getByRole('button', { name: 'Limpar filtros' }));

    expect(await screen.findByText('4 recursos encontrados')).toBeInTheDocument();
    expect(formulario().getByLabelText('Capacidade mínima')).toHaveValue(null);
    expect(formulario().getByLabelText('Tipo')).toHaveValue('');
    expect([...(consultas(falso).at(-1) as URLSearchParams).keys()]).toEqual([]);
  });

  it('os filtros ficam no endereço, e abrir o endereço já filtra e preenche os campos', async () => {
    const falso = montar('/buscar?tipo=SALA&capacidadeMinima=30&localizacao=Bloco%20A');

    expect(await screen.findByText('1 recurso encontrado')).toBeInTheDocument();

    expect(formulario().getByLabelText('Tipo')).toHaveValue('SALA');
    expect(formulario().getByLabelText('Capacidade mínima')).toHaveValue(30);
    expect(formulario().getByLabelText('Local')).toHaveValue('Bloco A');
    expect((consultas(falso)[0] as URLSearchParams).get('tipo')).toBe('SALA');
  });

  it('depois de Buscar o endereço reflete os filtros, com a hora do campus legível', async () => {
    montar();
    await screen.findByText('4 recursos encontrados');

    await userEvent.selectOptions(formulario().getByLabelText('Tipo'), 'Sala');
    fireEvent.change(formulario().getByLabelText('Início'), { target: { value: '2026-10-21T14:00' } });
    fireEvent.change(formulario().getByLabelText('Fim'), { target: { value: '2026-10-21T16:00' } });
    await userEvent.click(formulario().getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(screen.getByLabelText('endereço atual')).toHaveTextContent('tipo=SALA'));
    expect(screen.getByLabelText('endereço atual').textContent).toContain('inicio=2026-10-21T14%3A00');
  });

  it('com período informado, diz para qual intervalo os recursos estão livres', async () => {
    montar('/buscar?inicio=2026-10-21T14:00&fim=2026-10-21T16:00');

    expect(await screen.findByText(/livres em/)).toHaveTextContent('14:00 às 16:00');
  });

  it('a busca mantém os valores digitados depois de mostrar o resultado', async () => {
    montar();
    await screen.findByText('4 recursos encontrados');

    await userEvent.type(formulario().getByLabelText('Local'), 'Bloco A');
    await userEvent.click(formulario().getByRole('button', { name: 'Buscar' }));
    await screen.findByText('1 recurso encontrado');

    expect(formulario().getByLabelText('Local')).toHaveValue('Bloco A');
  });

  it('a lista traz o laboratório só quando o servidor o devolve (o front não filtra por conta própria)', async () => {
    montar();

    await screen.findByText('4 recursos encontrados');

    expect(screen.getByRole('article', { name: new RegExp(LABORATORIO.nome) })).toBeInTheDocument();
  });
});
