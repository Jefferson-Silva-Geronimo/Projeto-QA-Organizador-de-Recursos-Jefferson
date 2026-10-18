import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mensagemPara, MENSAGEM_DE_REDE } from '@/erros/mensagens';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { SALA_101 } from '@/test/recursos';

function montarCom(rota: () => Response | Promise<Response>) {
  const falso = rotearFetch({ 'GET /api/recursos': rota });
  montarPagina({ rota: '/buscar', caminho: '/buscar', elemento: <PaginaDeBusca />, fetch: falso });
  return falso;
}

describe('PaginaDeBusca: estados', () => {
  it('sem resultado: diz que nada foi encontrado e o que tentar, sem parecer erro', async () => {
    montarCom(() => resposta(200, []));

    expect(await screen.findByText('Nenhum recurso encontrado')).toBeInTheDocument();
    expect(screen.getByText(/outro período/)).toBeInTheDocument();
    expect(screen.getByText('0 recursos encontrados')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('recusa do servidor: mostra a mensagem compreensível e a ação da tabela de erros', async () => {
    montarCom(() => resposta(500, { status: 500, code: 'ERRO_INTERNO' }));

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara('ERRO_INTERNO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ERRO_INTERNO').acao);
  });

  it('nunca mostra o texto cru que o servidor mandar no detalhe', async () => {
    montarCom(() =>
      resposta(500, { status: 500, code: 'ERRO_INTERNO', detail: 'java.lang.NullPointerException em JdbcRecursoRepository' }),
    );

    await screen.findByRole('alert');

    expect(screen.queryByText(/NullPointerException/)).not.toBeInTheDocument();
    expect(screen.queryByText(/JdbcRecursoRepository/)).not.toBeInTheDocument();
  });

  it('falha de rede: mensagem própria de conexão', async () => {
    montarCom(() => {
      throw new TypeError('Failed to fetch');
    });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
    expect(alerta).toHaveTextContent(MENSAGEM_DE_REDE.acao);
  });

  it('código que o front não conhece: mensagem genérica', async () => {
    montarCom(() => resposta(500, { status: 500, code: 'CODIGO_DE_UM_SERVIDOR_MAIS_NOVO' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagemPara('CODIGO_DE_UM_SERVIDOR_MAIS_NOVO').mensagem);
  });

  it('Tentar de novo refaz a busca e mostra o resultado quando o servidor volta', async () => {
    let chamadas = 0;
    montarCom(() => (++chamadas === 1 ? resposta(500, { status: 500, code: 'ERRO_INTERNO' }) : resposta(200, [SALA_101])));
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('1 recurso encontrado')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('com erro não mostra "0 recursos encontrados" (não é a mesma coisa que vazio)', async () => {
    montarCom(() => resposta(500, { status: 500, code: 'ERRO_INTERNO' }));

    await screen.findByRole('alert');

    expect(screen.queryByText(/recursos? encontrados?/)).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum recurso encontrado')).not.toBeInTheDocument();
  });
});
