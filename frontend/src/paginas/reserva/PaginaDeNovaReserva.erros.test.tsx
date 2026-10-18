import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';
import { PaginaDeNovaReserva } from '@/paginas/reserva/PaginaDeNovaReserva';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { TODOS } from '@/test/recursos';

const ENDERECO = '/reservas/nova?inicio=2026-10-21T14:00&fim=2026-10-21T16:00';

function montar(criar: () => Response | Promise<Response>) {
  const falso = rotearFetch({ 'GET /api/recursos': () => resposta(200, TODOS), 'POST /api/reservas': criar });
  montarPagina({ rota: ENDERECO, caminho: '/reservas/nova', elemento: <PaginaDeNovaReserva />, fetch: falso });
  return falso;
}

async function reservar() {
  await screen.findByRole('group', { name: 'Salas' });
  await userEvent.type(screen.getByLabelText(/Título/), 'Aula de reforço');
  await userEvent.click(screen.getByRole('checkbox', { name: /Sala 101/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));
}

const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  resposta(status, { status, code, ...extra });

describe('PaginaDeNovaReserva: recusas do servidor', () => {
  it.each([
    [409, 'CONFLITO_DE_ALOCACAO'],
    [409, 'RECURSO_EM_MANUTENCAO'],
    [400, 'FORA_DA_JANELA'],
    [400, 'DIA_SEM_FUNCIONAMENTO'],
    [400, 'CRUZA_MEIA_NOITE'],
    [400, 'INICIO_NO_PASSADO'],
    [400, 'PERIODO_INVALIDO'],
    [409, 'RECURSO_INATIVO'],
    [403, 'ACESSO_NEGADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: mostra a mensagem e a ação da tabela de erros', async (status, code) => {
    montar(() => recusa(status, code));

    await reservar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
  });

  it('a mensagem recebe o foco, para o teclado e o leitor de tela irem até ela', async () => {
    montar(() => recusa(409, 'CONFLITO_DE_ALOCACAO'));

    await reservar();

    expect(await screen.findByRole('alert')).toHaveFocus();
  });

  it('o que a pessoa digitou e marcou continua lá, e o botão volta a funcionar', async () => {
    montar(() => recusa(409, 'CONFLITO_DE_ALOCACAO'));

    await reservar();
    await screen.findByRole('alert');

    expect(screen.getByLabelText(/Título/)).toHaveValue('Aula de reforço');
    expect(screen.getByRole('checkbox', { name: /Sala 101/ })).toBeChecked();
    expect(screen.getByLabelText(/Início/)).toHaveValue('2026-10-21T14:00');
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeEnabled();
    expect(screen.queryByText('Reserva aprovada')).not.toBeInTheDocument();
  });

  it('nunca mostra o texto cru que o servidor mandar no detalhe', async () => {
    montar(() => recusa(409, 'CONFLITO_DE_ALOCACAO', { detail: 'ERRO: conflicting key value violates exclusion constraint ocupacoes_sem_sobreposicao' }));

    await reservar();
    await screen.findByRole('alert');

    expect(screen.queryByText(/exclusion constraint/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ocupacoes_sem_sobreposicao/)).not.toBeInTheDocument();
  });

  it('falha de rede: mensagem de conexão e, ao tentar de novo, a reserva é criada', async () => {
    let chamadas = 0;
    montar(() => {
      if (++chamadas === 1) {
        throw new TypeError('Failed to fetch');
      }
      return resposta(201, {
        id: 41, solicitanteId: 12, titulo: 'Aula de reforço', inicio: '2026-10-21T17:00:00Z', fim: '2026-10-21T19:00:00Z',
        estado: 'APROVADA', exigeAprovacao: false, recursoIds: [1],
      });
    });
    await reservar();

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGEM_DE_REDE.mensagem);
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(await screen.findByText('Reserva aprovada')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('PaginaDeNovaReserva: campos que o servidor não aceitou', () => {
  const invalido = (campos: string[]) => recusa(400, 'VALIDACAO_FALHOU', { campos });

  it('marca cada campo recusado, com a mensagem do campo e ligada a ele', async () => {
    montar(() => invalido(['titulo', 'recursoIds', 'inicio', 'fim']));

    await reservar();

    await screen.findByRole('alert');
    const titulo = screen.getByLabelText(/Título/);
    expect(titulo).toHaveAttribute('aria-invalid', 'true');
    expect(titulo).toHaveAccessibleDescription('Informe o título.');
    expect(screen.getByLabelText(/Início/)).toHaveAccessibleDescription('Informe o início.');
    expect(screen.getByLabelText(/Fim/)).toHaveAccessibleDescription('Informe o fim.');
    expect(screen.getByRole('group', { name: 'Recursos livres no período' })).toHaveAccessibleDescription(
      'Escolha ao menos um recurso.',
    );
  });

  it('o resumo no topo usa a mensagem da tabela e recebe o foco', async () => {
    montar(() => invalido(['titulo']));

    await reservar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('VALIDACAO_FALHOU').mensagem);
    expect(alerta).toHaveFocus();
  });

  it('campo que o front não conhece é ignorado, sem quebrar a tela', async () => {
    montar(() => invalido(['campoQueNaoExiste']));

    await reservar();

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagemPara('VALIDACAO_FALHOU').mensagem);
    expect(screen.getByLabelText(/Título/)).not.toHaveAttribute('aria-invalid');
  });

  it('ao corrigir e reenviar, os avisos de campo somem', async () => {
    let chamadas = 0;
    montar(() =>
      ++chamadas === 1
        ? invalido(['titulo'])
        : resposta(201, {
            id: 41, solicitanteId: 12, titulo: 'Aula de reforço', inicio: '2026-10-21T17:00:00Z', fim: '2026-10-21T19:00:00Z',
            estado: 'APROVADA', exigeAprovacao: false, recursoIds: [1],
          }),
    );
    await reservar();
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(await screen.findByText('Reserva aprovada')).toBeInTheDocument();
    expect(screen.queryByText('Informe o título.')).not.toBeInTheDocument();
  });
});
