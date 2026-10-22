import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeAprovacoes } from '@/paginas/aprovacoes/PaginaDeAprovacoes';
import { PEDIDO_DE_JOAO, PEDIDO_DE_MARIA, type ItemDaFila } from '@/test/fila';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROJETOR } from '@/test/recursos';

function montarCom(fila: () => Response | Promise<Response>) {
  const falso = rotearFetch({
    'GET /api/reservas/fila': fila,
    'GET /api/recursos/3': () => resposta(200, LABORATORIO),
    'GET /api/recursos/7': () => resposta(200, PROJETOR),
  });
  const montada = montarPagina({
    rota: '/aprovacoes',
    caminho: '/aprovacoes',
    elemento: <PaginaDeAprovacoes />,
    perfil: 'RESPONSAVEL',
    fetch: falso,
  });
  return { falso, ...montada };
}

describe('PaginaDeAprovacoes: lista', () => {
  it('tem o título Aprovações', () => {
    montarCom(() => resposta(200, []));

    expect(screen.getByRole('heading', { level: 1, name: 'Aprovações' })).toBeInTheDocument();
  });

  it('enquanto o servidor não responde, anuncia que está carregando', () => {
    montarCom(() => new Promise<Response>(() => {}));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando solicitações…');
  });

  it('cada solicitação é um cartão com título, solicitante pelo nome, período no fuso do campus e nomes dos recursos', async () => {
    montarCom(() => resposta(200, [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO]));

    const maria = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(maria).getByText('Maria Souza')).toBeInTheDocument();
    expect(within(maria).getByText(/22\/10, 08:00 às 10:00/)).toBeInTheDocument();
    expect(await within(maria).findByText(/Laboratório de Informática 3, Projetor P-007/)).toBeInTheDocument();
    const joao = screen.getByRole('article', { name: 'Oficina de robótica' });
    expect(within(joao).getByText('João Lima')).toBeInTheDocument();
    expect(await within(joao).findByText('Projetor P-007')).toBeInTheDocument();
  });

  it('nunca mostra e-mail nem o número do solicitante: só o nome (L-04)', async () => {
    const { container } = montarCom(() => resposta(200, [PEDIDO_DE_MARIA]));
    await screen.findByRole('article', { name: 'Prova de Estatística' });
    await screen.findByText(/Laboratório de Informática 3/);

    expect(container.textContent).not.toContain('@');
    expect(container.textContent).not.toMatch(/#\s*2\b/);
  });

  it('mantém a ordem em que o servidor devolveu as solicitações', async () => {
    montarCom(() => resposta(200, [PEDIDO_DE_JOAO, PEDIDO_DE_MARIA]));

    const cartoes = await screen.findAllByRole('article');

    expect(cartoes.map((c) => within(c).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Oficina de robótica',
      'Prova de Estatística',
    ]);
  });

  it('diz quantas solicitações aguardam decisão', async () => {
    montarCom(() => resposta(200, [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO]));

    expect(await screen.findByText('2 solicitações pendentes')).toBeInTheDocument();
  });

  it('com uma só solicitação usa o singular', async () => {
    montarCom(() => resposta(200, [PEDIDO_DE_MARIA]));

    expect(await screen.findByText('1 solicitação pendente')).toBeInTheDocument();
  });

  it('fila vazia diz que não há pendências, sem erro e sem alerta', async () => {
    montarCom(() => resposta(200, []));

    expect(await screen.findByText('Sem pendências')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('recusa do servidor mostra a mensagem da tabela de erros, com a ação sugerida', async () => {
    montarCom(() => resposta(403, { status: 403, code: 'ACESSO_NEGADO' }));

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').acao);
  });

  it('falha de rede mostra a mensagem de rede e Tentar de novo consulta de novo', async () => {
    let chamadas = 0;
    montarCom(() => {
      chamadas++;
      if (chamadas === 1) {
        throw new TypeError('Failed to fetch');
      }
      return resposta(200, [PEDIDO_DE_MARIA]);
    });

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('article', { name: 'Prova de Estatística' })).toBeInTheDocument();
  });

  it('a lista não tem violação de acessibilidade (axe)', async () => {
    const itens: ItemDaFila[] = [PEDIDO_DE_MARIA, PEDIDO_DE_JOAO];
    const { container } = montarCom(() => resposta(200, itens));
    await screen.findAllByRole('article');
    await screen.findByText(/Laboratório de Informática 3/);

    expect(await axe(container)).toHaveNoViolations();
  });
});
