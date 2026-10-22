import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeRetiradas } from '@/paginas/retiradas/PaginaDeRetiradas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { AULA_EXTRA, PROVA } from '@/test/reservas';
import { montarRetiradas } from '@/test/retiradas';
import { AULA_DE_INFORMATICA, movimento } from '@/test/uso';

const EM_USO = {
  ...AULA_DE_INFORMATICA,
  id: 31,
  titulo: 'Atendimento em uso',
  estado: 'EM_USO' as const,
  recursoIds: [1],
  podeIniciar: false,
  podeConcluir: true,
};
const AULA_EM_USO = { ...AULA_DE_INFORMATICA, estado: 'EM_USO' as const, podeIniciar: false };

async function unidade(titulo: string, material: RegExp) {
  const cartao = await screen.findByRole('article', { name: titulo });
  const itens = await within(cartao).findAllByRole('listitem');
  const achada = itens.find((u) => material.test(u.textContent ?? ''));
  if (!achada) throw new Error(`Unidade ${material} não encontrada`);
  return achada;
}

describe('PaginaDeRetiradas: lista', () => {
  it('tem o título Retiradas', () => {
    montarRetiradas({ reservas: [] });

    expect(screen.getByRole('heading', { level: 1, name: 'Retiradas' })).toBeInTheDocument();
  });

  it('enquanto o servidor não responde, anuncia que está carregando', () => {
    montarPagina({
      rota: '/retiradas',
      caminho: '/retiradas',
      elemento: <PaginaDeRetiradas />,
      perfil: 'RESPONSAVEL',
      fetch: rotearFetch({ 'GET /api/reservas': () => new Promise<Response>(() => {}) }),
    });

    expect(screen.getByRole('status')).toHaveTextContent('Carregando reservas…');
  });

  it('mostra só as reservas aprovadas e em uso, na ordem em que o servidor devolveu', async () => {
    montarRetiradas({
      reservas: [
        EM_USO,
        { ...PROVA, id: 40 },
        { ...AULA_EXTRA, id: 41, estado: 'CONCLUIDA' },
        AULA_DE_INFORMATICA,
        { ...AULA_EXTRA, id: 42, estado: 'CANCELADA' },
      ],
    });

    const cartoes = await screen.findAllByRole('article');

    expect(cartoes.map((c) => within(c).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Atendimento em uso',
      'Aula de informática',
    ]);
  });

  it('cada reserva é um cartão com título, período no fuso do campus, estado em texto e os nomes dos recursos', async () => {
    montarRetiradas({ reservas: [AULA_DE_INFORMATICA, EM_USO] });

    const aula = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(within(aula).getByText('Aprovada')).toBeInTheDocument();
    expect(within(aula).getByText(/20\/10, 14:00 às 16:00/)).toBeInTheDocument();
    expect(await within(aula).findByText(/Sala 101, Projetor P-007, Notebook N-001/)).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Atendimento em uso' })).getByText('Em uso')).toBeInTheDocument();
  });

  it('diz quantas reservas há, no plural e no singular', async () => {
    const { unmount } = montarRetiradas({ reservas: [AULA_DE_INFORMATICA, EM_USO] });
    expect(await screen.findByText('2 reservas para o uso')).toBeInTheDocument();
    unmount();

    montarRetiradas({ reservas: [AULA_DE_INFORMATICA] });
    expect(await screen.findByText('1 reserva para o uso')).toBeInTheDocument();
  });

  it('sem reservas aprovadas ou em uso, diz que não há nada para registrar, sem erro e sem alerta', async () => {
    montarRetiradas({ reservas: [{ ...PROVA, id: 40 }, { ...AULA_EXTRA, id: 41, estado: 'CONCLUIDA' }] });

    expect(await screen.findByText('Nada para registrar')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma reserva aprovada ou em uso agora.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});

describe('PaginaDeRetiradas: unidades de material e movimentação atual (F6-16)', () => {
  it('só os materiais da reserva aparecem como unidades; a sala não tem retirada', async () => {
    montarRetiradas({ reservas: [AULA_DE_INFORMATICA] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });
    const unidades = await within(cartao).findAllByRole('listitem');

    expect(unidades).toHaveLength(2);
    expect(unidades[0]).toHaveTextContent('Projetor P-007');
    expect(unidades[1]).toHaveTextContent('Notebook N-001');
  });

  it('unidade nunca movimentada aparece como não retirada, com Retirar', async () => {
    montarRetiradas({ reservas: [AULA_DE_INFORMATICA] });

    const notebook = await unidade('Aula de informática', /Notebook/);

    expect(within(notebook).getByText('Não retirado')).toBeInTheDocument();
    expect(within(notebook).getByRole('button', { name: 'Retirar Notebook N-001' })).toBeInTheDocument();
    expect(within(notebook).queryByRole('button', { name: /Devolver/ })).not.toBeInTheDocument();
  });

  it('retirada atual: mostra a hora do campus e o nome de quem registrou, com Devolver', async () => {
    montarRetiradas({
      reservas: [AULA_EM_USO],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', true, '17:02', 'Carlos Lima')] },
    });

    const projetor = await unidade('Aula de informática', /Projetor/);

    expect(await within(projetor).findByText('Retirado às 14:02 por Carlos Lima')).toBeInTheDocument();
    expect(within(projetor).getByRole('button', { name: 'Devolver Projetor P-007' })).toBeInTheDocument();
    expect(within(projetor).queryByRole('button', { name: /Retirar/ })).not.toBeInTheDocument();
  });

  it('devolução atual: mostra a hora e o nome de quem registrou, e volta a oferecer Retirar', async () => {
    montarRetiradas({
      reservas: [AULA_EM_USO],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', false, '17:02'), movimento(2, 7, 'DEVOLUCAO', true, '17:40', 'Ana Prado')] },
    });

    const projetor = await unidade('Aula de informática', /Projetor/);

    expect(await within(projetor).findByText('Devolvido às 14:40 por Ana Prado')).toBeInTheDocument();
    expect(within(projetor).getByRole('button', { name: 'Retirar Projetor P-007' })).toBeInTheDocument();
    expect(within(projetor).queryByRole('button', { name: /Devolver/ })).not.toBeInTheDocument();
  });

  it('o front lê o campo atual e não ordena nem compara: vale a marcada, mesmo vindo antes na lista', async () => {
    montarRetiradas({
      reservas: [AULA_EM_USO],
      // A devolução marcada como atual vem primeiro; a retirada, depois e marcada como não atual.
      movimentacoes: { 30: [movimento(5, 7, 'DEVOLUCAO', true, '17:40', 'Ana Prado'), movimento(3, 7, 'RETIRADA', false, '17:02')] },
    });

    const projetor = await unidade('Aula de informática', /Projetor/);

    expect(await within(projetor).findByText(/Devolvido às 14:40/)).toBeInTheDocument();
    expect(within(projetor).getByRole('button', { name: /Retirar/ })).toBeInTheDocument();
  });

  it('nunca mostra e-mail nem o número de quem registrou: só o nome', async () => {
    const { container } = montarRetiradas({
      reservas: [AULA_EM_USO],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', true)] },
    });
    await screen.findByText(/Retirado às 14:02 por Carlos Lima/);

    expect(container.textContent).not.toContain('@');
    expect(container.textContent).not.toMatch(/#\s*9\b/);
  });

  it('as unidades de reserva APROVADA também mostram o estado atual (a primeira retirada inicia o uso)', async () => {
    montarRetiradas({ reservas: [AULA_DE_INFORMATICA] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(await within(cartao).findAllByText('Não retirado')).toHaveLength(2);
  });
});

describe('PaginaDeRetiradas: erros e acessibilidade', () => {
  it('recusa do servidor ao consultar mostra a mensagem da tabela de erros, com a ação sugerida', async () => {
    montarPagina({
      rota: '/retiradas',
      caminho: '/retiradas',
      elemento: <PaginaDeRetiradas />,
      perfil: 'RESPONSAVEL',
      fetch: rotearFetch({ 'GET /api/reservas': () => resposta(403, { status: 403, code: 'ACESSO_NEGADO' }) }),
    });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').acao);
  });

  it('falha de rede mostra a mensagem de rede e Tentar de novo consulta de novo', async () => {
    let chamadas = 0;
    montarPagina({
      rota: '/retiradas',
      caminho: '/retiradas',
      elemento: <PaginaDeRetiradas />,
      perfil: 'RESPONSAVEL',
      fetch: rotearFetch({
        'GET /api/reservas': () => {
          chamadas++;
          if (chamadas === 1) throw new TypeError('Failed to fetch');
          return resposta(200, []);
        },
      }),
    });

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Nada para registrar')).toBeInTheDocument();
  });

  it('a lista não tem violação de acessibilidade (axe)', async () => {
    const { container } = montarRetiradas({
      reservas: [AULA_EM_USO, EM_USO],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', true)] },
    });
    await screen.findAllByRole('article');
    await screen.findByText(/Retirado às 14:02/);

    expect(await axe(container)).toHaveNoViolations();
  });
});
