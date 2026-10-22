import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeRelatorios } from '@/paginas/relatorios/PaginaDeRelatorios';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import {
  montarRelatorios,
  PERIODO,
  PROFESSORA_NO_RELATORIO,
  PROJETOR_NO_RELATORIO,
  SALA_NO_RELATORIO,
} from '@/test/relatorio';

const comPeriodo = `/relatorios?${PERIODO}`;

async function linha(nome: string) {
  const tabela = await screen.findByRole('table');
  return within(tabela).getByRole('row', { name: new RegExp(nome) });
}

describe('PaginaDeRelatorios: resultado', () => {
  it('mostra uma tabela com uma linha por recurso, na ordem do servidor, e os cabeçalhos em texto', async () => {
    montarRelatorios({ rota: comPeriodo });

    const tabela = await screen.findByRole('table', { name: 'Utilização por recurso' });

    expect(within(tabela).getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Recurso',
      'Tipo',
      'Horas alocadas',
      'Utilização',
      'Conflitos evitados',
      'Solicitantes distintos',
    ]);
    const nomes = within(tabela).getAllByRole('rowheader').map((c) => c.textContent);
    expect(nomes).toEqual(['Sala 101', 'Profa. Helena Costa', 'Projetor P-007']);
  });

  it('sala: horas, utilização em porcentagem como o servidor calculou, conflitos e solicitantes', async () => {
    montarRelatorios({ rota: comPeriodo });

    const sala = await linha('Sala 101');

    expect(within(sala).getByText('Sala')).toBeInTheDocument();
    expect(within(sala).getByText('12,5 h')).toBeInTheDocument();
    expect(within(sala).getByText('41,7%')).toBeInTheDocument();
    expect(within(sala).getByText('3')).toBeInTheDocument();
    expect(within(sala).getByText('2')).toBeInTheDocument();
  });

  it('professor e material: utilização não se aplica (RN-31), em texto', async () => {
    montarRelatorios({ rota: comPeriodo });

    const professora = await linha('Profa. Helena Costa');
    const projetor = await linha('Projetor P-007');

    expect(within(professora).getByText('Professor')).toBeInTheDocument();
    expect(within(professora).getByText('8 h')).toBeInTheDocument();
    expect(within(professora).getByText('Não se aplica')).toBeInTheDocument();
    expect(within(projetor).getByText('Material')).toBeInTheDocument();
    expect(within(projetor).getByText('0,5 h')).toBeInTheDocument();
    expect(within(projetor).getByText('Não se aplica')).toBeInTheDocument();
  });

  it('o front não recalcula: mostra a utilização que veio, mesmo que as horas não batam com ela', async () => {
    montarRelatorios({ rota: comPeriodo, itens: [{ ...SALA_NO_RELATORIO, horasAlocadas: 100, utilizacao: 0.05 }] });

    const sala = await linha('Sala 101');

    expect(within(sala).getByText('5%')).toBeInTheDocument();
    expect(within(sala).getByText('100 h')).toBeInTheDocument();
  });

  it('diz quantos recursos há, no plural e no singular, e o período do relatório', async () => {
    const { unmount } = montarRelatorios({ rota: comPeriodo });
    expect(await screen.findByText('3 recursos no relatório')).toBeInTheDocument();
    expect(screen.getByText(/Período: .*20\/10, 08:00 até .*27\/10, 18:00/)).toBeInTheDocument();
    unmount();

    montarRelatorios({ rota: comPeriodo, itens: [SALA_NO_RELATORIO] });
    expect(await screen.findByText('1 recurso no relatório')).toBeInTheDocument();
  });

  it('sem nenhum recurso nos filtros, diz que não há nada para mostrar, sem erro e sem alerta', async () => {
    montarRelatorios({ rota: comPeriodo, itens: [] });

    expect(await screen.findByText('Nada para mostrar')).toBeInTheDocument();
    expect(screen.getByText('Nenhum recurso encontrado com estes filtros.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('enquanto o servidor não responde, anuncia que está gerando', () => {
    montarPagina({
      rota: comPeriodo,
      caminho: '/relatorios',
      elemento: <PaginaDeRelatorios />,
      perfil: 'RESPONSAVEL',
      fetch: rotearFetch({
        'GET /api/relatorios/utilizacao': () => new Promise<Response>(() => {}),
        'GET /api/recursos': () => resposta(200, []),
      }),
    });

    expect(screen.getByRole('status')).toHaveTextContent('Gerando relatório…');
  });

  it('PERIODO_INVALIDO: mostra a mensagem e a ação da tabela de erros e mantém os filtros', async () => {
    montarRelatorios({ rota: comPeriodo, responder: () => resposta(400, { status: 400, code: 'PERIODO_INVALIDO' }) });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('PERIODO_INVALIDO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('PERIODO_INVALIDO').acao);
    expect(within(screen.getByRole('search', { name: 'Filtros do relatório' })).getByLabelText(/^Início/)).toHaveValue('2026-10-20T08:00');
  });

  it('falha de rede mostra a mensagem de rede, e Tentar de novo consulta de novo', async () => {
    let chamadas = 0;
    montarRelatorios({
      rota: comPeriodo,
      responder: () => {
        chamadas++;
        if (chamadas === 1) throw new TypeError('Failed to fetch');
        return undefined;
      },
    });

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('a tabela não tem violação de acessibilidade (axe)', async () => {
    const { container } = montarRelatorios({ rota: comPeriodo, itens: [SALA_NO_RELATORIO, PROFESSORA_NO_RELATORIO, PROJETOR_NO_RELATORIO] });
    await screen.findByRole('table');

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('PaginaDeRelatorios: paginação (o tamanho da página é a suposição D4)', () => {
  it('com mais recursos que o tamanho da página, mostra "Página 1 de 3" e só a Próxima funciona', async () => {
    montarRelatorios({ rota: comPeriodo, total: 45 });

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled();
    expect(screen.getByText('45 recursos no relatório')).toBeInTheDocument();
  });

  it('Próxima consulta a página seguinte, atualiza o endereço e leva o foco ao resultado', async () => {
    const { estado } = montarRelatorios({ rota: comPeriodo, total: 45 });
    await screen.findByText('Página 1 de 3');

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(estado.consultas.at(-1)?.get('pagina')).toBe('1');
    expect(screen.getByLabelText('endereço atual').textContent).toContain('pagina=2');
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Resultado' })).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('na última página a Próxima fica desabilitada, e Anterior volta uma página', async () => {
    const { estado } = montarRelatorios({ rota: `${comPeriodo}&pagina=3`, total: 45 });

    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(estado.consultas.at(-1)?.get('pagina')).toBe('1');
  });

  it('a página vem do endereço (1 para o usuário, 0 para o servidor)', async () => {
    const { estado } = montarRelatorios({ rota: `${comPeriodo}&pagina=2`, total: 45 });

    await waitFor(() => expect(estado.consultas).toHaveLength(1));
    expect(estado.consultas[0]?.get('pagina')).toBe('1');
  });

  it('com tudo numa página, não mostra a paginação', async () => {
    montarRelatorios({ rota: comPeriodo });
    await screen.findByRole('table');

    expect(screen.queryByRole('button', { name: 'Próxima' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Página /)).not.toBeInTheDocument();
  });

  it('mudar um filtro volta para a primeira página', async () => {
    const { estado } = montarRelatorios({ rota: `${comPeriodo}&pagina=2`, total: 45 });
    await screen.findByText('Página 2 de 3');

    await userEvent.selectOptions(within(screen.getByRole('search', { name: 'Filtros do relatório' })).getByLabelText('Tipo'), 'Sala');
    await userEvent.click(within(screen.getByRole('search', { name: 'Filtros do relatório' })).getByRole('button', { name: 'Gerar relatório' }));

    await waitFor(() => expect(estado.consultas.at(-1)?.get('tipo')).toBe('SALA'));
    expect(estado.consultas.at(-1)?.get('pagina')).toBe('0');
    expect(screen.getByLabelText('endereço atual').textContent).not.toContain('pagina=');
  });
});
