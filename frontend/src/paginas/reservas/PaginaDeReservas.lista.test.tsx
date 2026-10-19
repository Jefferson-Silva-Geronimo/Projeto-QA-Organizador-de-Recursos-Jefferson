import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROJETOR, SALA_101 } from '@/test/recursos';
import { AULA_EXTRA, PROVA, type Reserva } from '@/test/reservas';

const RECURSOS = { 1: SALA_101, 3: LABORATORIO, 7: PROJETOR } as const;

function montarCom(reservas: () => Response | Promise<Response>, perfil: 'SOLICITANTE' | 'RESPONSAVEL' | 'ADMINISTRADOR' = 'SOLICITANTE') {
  const falso = rotearFetch({
    'GET /api/reservas': reservas,
    'GET /api/recursos/1': () => resposta(200, RECURSOS[1]),
    'GET /api/recursos/3': () => resposta(200, RECURSOS[3]),
    'GET /api/recursos/7': () => resposta(200, RECURSOS[7]),
  });
  const montada = montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, perfil, fetch: falso });
  return { falso, ...montada };
}

describe('PaginaDeReservas: lista', () => {
  it('tem o título Reservas', () => {
    montarCom(() => resposta(200, []));

    expect(screen.getByRole('heading', { level: 1, name: 'Reservas' })).toBeInTheDocument();
  });

  it('enquanto o servidor não responde, anuncia que está carregando', () => {
    montarCom(() => new Promise<Response>(() => {}));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando reservas…');
  });

  it('cada reserva é um cartão com título, período no fuso do campus, estado em texto e os nomes dos recursos', async () => {
    montarCom(() => resposta(200, [AULA_EXTRA, PROVA]));

    const aula = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(aula).getByText('Aprovada')).toBeInTheDocument();
    expect(within(aula).getByText(/20\/10, 14:00 às 16:00/)).toBeInTheDocument();
    expect(await within(aula).findByText('Sala 101')).toBeInTheDocument();
    const prova = screen.getByRole('article', { name: 'Prova de Estatística' });
    expect(within(prova).getByText('Solicitada')).toBeInTheDocument();
    expect(await within(prova).findByText(/Laboratório de Informática 3, Projetor P-007/)).toBeInTheDocument();
  });

  it('mantém a ordem em que o servidor devolveu as reservas', async () => {
    montarCom(() => resposta(200, [PROVA, AULA_EXTRA]));

    const cartoes = await screen.findAllByRole('article');

    expect(cartoes.map((c) => within(c).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Prova de Estatística',
      'Aula extra',
    ]);
  });

  it('diz quantas reservas há', async () => {
    montarCom(() => resposta(200, [AULA_EXTRA, PROVA]));

    expect(await screen.findByText('2 reservas')).toBeInTheDocument();
  });

  it('sem reservas: diz o que fazer, com caminho para a Busca, sem parecer erro', async () => {
    montarCom(() => resposta(200, []));

    expect(await screen.findByText('Nenhuma reserva ainda')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buscar recursos' })).toHaveAttribute('href', '/buscar');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('recusa do servidor: mostra a mensagem e a ação da tabela de erros', async () => {
    montarCom(() => resposta(500, { status: 500, code: 'ERRO_INTERNO' }));

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ERRO_INTERNO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ERRO_INTERNO').acao);
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montarCom(() => {
      throw new TypeError('Failed to fetch');
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
  });

  it('Tentar de novo refaz a consulta e mostra as reservas quando o servidor volta', async () => {
    let chamadas = 0;
    montarCom(() => (++chamadas === 1 ? resposta(500, { status: 500, code: 'ERRO_INTERNO' }) : resposta(200, [AULA_EXTRA])));
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('article', { name: 'Aula extra' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reserva cancelada continua listada, com o estado e o motivo que o servidor devolveu (RN-27)', async () => {
    const cancelada: Reserva = { ...AULA_EXTRA, estado: 'CANCELADA', motivo: 'A turma foi dispensada.' };
    montarCom(() => resposta(200, [cancelada]));

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).getByText('Cancelada')).toBeInTheDocument();
    expect(within(cartao).getByText('A turma foi dispensada.')).toBeInTheDocument();
  });

  it.each([
    ['MANUTENCAO', 'Cancelada porque o recurso entrou em manutenção.'],
    ['SEM_DECISAO', 'Cancelada porque o início chegou sem decisão.'],
  ])('motivo do sistema %s aparece em texto compreensível, não como identificador', async (motivo, texto) => {
    montarCom(() => resposta(200, [{ ...AULA_EXTRA, estado: 'CANCELADA', motivo }]));

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).getByText(texto)).toBeInTheDocument();
    expect(within(cartao).queryByText(motivo)).not.toBeInTheDocument();
  });

  it.each([
    ['SOLICITADA', 'Solicitada'],
    ['APROVADA', 'Aprovada'],
    ['EM_USO', 'Em uso'],
    ['CONCLUIDA', 'Concluída'],
    ['REJEITADA', 'Rejeitada'],
    ['CANCELADA', 'Cancelada'],
    ['NAO_COMPARECEU', 'Não compareceu'],
  ] as const)('o estado %s aparece como "%s"', async (estado, rotulo) => {
    montarCom(() => resposta(200, [{ ...AULA_EXTRA, estado }]));

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).getByText(rotulo)).toBeInTheDocument();
  });

  it('se o nome de um recurso não puder ser resolvido, a reserva continua legível com o número do recurso', async () => {
    const falso = rotearFetch({
      'GET /api/reservas': () => resposta(200, [AULA_EXTRA]),
      'GET /api/recursos/1': () => resposta(404, { status: 404, code: 'NAO_ENCONTRADO' }),
    });
    montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, fetch: falso });

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(await within(cartao).findByText('Recurso 1')).toBeInTheDocument();
  });

  it('o Responsável e o Administrador também consultam a lista que o servidor devolve', async () => {
    montarCom(() => resposta(200, [AULA_EXTRA, PROVA]), 'RESPONSAVEL');

    expect(await screen.findByText('2 reservas')).toBeInTheDocument();
  });

  it('a lista não tem violação de acessibilidade (axe)', async () => {
    const { container } = montarCom(() => resposta(200, [AULA_EXTRA, PROVA]));
    await screen.findByRole('article', { name: 'Aula extra' });
    await screen.findByText('Sala 101');

    expect(await axe(container)).toHaveNoViolations();
  });
});
