import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { PaginaDeAlteracao } from '@/paginas/reserva/PaginaDeAlteracao';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROFESSORA, SALA_101, type Recurso } from '@/test/recursos';
import { AULA_EXTRA, type Reserva } from '@/test/reservas';

interface Cenario {
  reserva?: () => Response | Promise<Response>;
  /** Recursos livres que o servidor devolve a cada consulta (a n-ésima chamada usa o n-ésimo item; a última se repete). */
  livres?: Recurso[][];
  alterar?: (corpo: Record<string, unknown>) => Response | Promise<Response>;
  perfil?: 'SOLICITANTE' | 'RESPONSAVEL';
}

function montar({ reserva, livres = [[LABORATORIO, PROFESSORA]], alterar, perfil }: Cenario = {}) {
  const estado = { alteracoes: [] as Record<string, unknown>[], consultasDeLivres: [] as URL[] };
  const falso = rotearFetch({
    'GET /api/reservas/10': reserva ?? (() => resposta(200, AULA_EXTRA)),
    'GET /api/recursos': (pedido) => {
      const url = new URL(pedido.url);
      estado.consultasDeLivres.push(url);
      return resposta(200, livres[Math.min(estado.consultasDeLivres.length, livres.length) - 1]);
    },
    'GET /api/recursos/1': () => resposta(200, SALA_101),
    'PUT /api/reservas/10': async (pedido) => {
      const corpo = (await pedido.json()) as Record<string, unknown>;
      estado.alteracoes.push(corpo);
      return alterar ? alterar(corpo) : resposta(200, { ...AULA_EXTRA, ...corpo });
    },
  });
  montarPagina({
    rota: '/reservas/10/alterar',
    caminho: '/reservas/:id/alterar',
    elemento: <PaginaDeAlteracao />,
    fetch: falso,
    perfil: perfil ?? 'SOLICITANTE',
  });
  return { falso, estado };
}

const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) => resposta(status, { status, code, ...extra });

async function carregada() {
  await screen.findByRole('group', { name: 'Salas' });
}

describe('PaginaDeAlteracao: abertura', () => {
  it('tem o título Alterar reserva', () => {
    montar();

    expect(screen.getByRole('heading', { level: 1, name: 'Alterar reserva' })).toBeInTheDocument();
  });

  it('enquanto a reserva não chega, anuncia que está carregando', () => {
    montar({ reserva: () => new Promise<Response>(() => {}) });

    expect(screen.getByRole('status')).toHaveTextContent('Carregando reserva…');
  });

  it.each([
    [404, 'NAO_ENCONTRADO'],
    [403, 'ACESSO_NEGADO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s ao abrir: mostra a mensagem da tabela de erros e o caminho de volta, sem formulário', async (status, code) => {
    montar({ reserva: () => recusa(status, code) });

    const alerta = await screen.findByRole('alert');

    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(screen.getByRole('link', { name: 'Voltar às reservas' })).toHaveAttribute('href', '/reservas');
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  it('o formulário abre com os dados atuais da reserva, na hora do campus', async () => {
    montar();

    await carregada();

    expect(screen.getByLabelText(/Título/)).toHaveValue('Aula extra');
    expect(screen.getByLabelText('Descrição')).toHaveValue('Revisão para a prova.');
    expect(screen.getByLabelText(/Início/)).toHaveValue('2026-10-20T14:00');
    expect(screen.getByLabelText(/Fim/)).toHaveValue('2026-10-20T16:00');
  });

  it('consulta os recursos livres no período atual da reserva, em ISO-8601 com offset do campus', async () => {
    const { estado } = montar();

    await carregada();

    expect(estado.consultasDeLivres[0]?.searchParams.get('inicio')).toBe('2026-10-20T14:00:00-03:00');
    expect(estado.consultasDeLivres[0]?.searchParams.get('fim')).toBe('2026-10-20T16:00:00-03:00');
  });

  it('o recurso da própria reserva aparece marcado, com o nome, mesmo que o servidor não o liste como livre', async () => {
    montar({ livres: [[LABORATORIO, PROFESSORA]] });

    await carregada();

    expect(await screen.findByRole('checkbox', { name: /Sala 101/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Laboratório de Informática 3/ })).not.toBeChecked();
    expect(screen.queryByText(/foi desmarcado/)).not.toBeInTheDocument();
  });

  it('tem Salvar alterações e Cancelar edição, que volta para as reservas', async () => {
    montar();

    await carregada();

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancelar edição' })).toHaveAttribute('href', '/reservas');
  });
});

describe('PaginaDeAlteracao: envio', () => {
  it('salvar sem mudar nada envia os dados atuais completos, para o servidor decidir se algo mudou', async () => {
    const { estado } = montar();
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(estado.alteracoes).toEqual([
        {
          titulo: 'Aula extra',
          descricao: 'Revisão para a prova.',
          inicio: '2026-10-20T14:00:00-03:00',
          fim: '2026-10-20T16:00:00-03:00',
          recursoIds: [1],
        },
      ]),
    );
  });

  it('envia o título novo e o recurso acrescentado', async () => {
    const { estado } = montar();
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });
    await userEvent.clear(screen.getByLabelText(/Título/));
    await userEvent.type(screen.getByLabelText(/Título/), 'Aula de reforço');
    await userEvent.click(screen.getByRole('checkbox', { name: /Laboratório de Informática 3/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(estado.alteracoes[0]).toMatchObject({ titulo: 'Aula de reforço', recursoIds: [1, 3] }));
  });

  it('muda o período e consulta de novo os recursos livres no período novo', async () => {
    const { estado } = montar();
    await carregada();

    fireEvent.change(screen.getByLabelText(/Início/), { target: { value: '2026-10-21T15:00' } });
    fireEvent.change(screen.getByLabelText(/Fim/), { target: { value: '2026-10-21T17:00' } });

    await waitFor(() =>
      expect(estado.consultasDeLivres.some((u) => u.searchParams.get('inicio') === '2026-10-21T15:00:00-03:00')).toBe(true),
    );
  });

  it('depois de salvar, confirma pelo estado que o servidor devolveu, e mostra o caminho para as reservas', async () => {
    montar();
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    const aviso = await screen.findByRole('status');
    expect(aviso).toHaveTextContent('Reserva alterada');
    expect(aviso).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Ver minhas reservas' })).toHaveAttribute('href', '/reservas');
    expect(screen.queryByRole('button', { name: 'Fazer outra reserva' })).not.toBeInTheDocument();
  });

  it('se o servidor devolve SOLICITADA (voltou para aprovação), a confirmação diz isso, sem o front calcular', async () => {
    montar({ alterar: (corpo) => resposta(200, { ...AULA_EXTRA, ...corpo, estado: 'SOLICITADA' satisfies Reserva['estado'] }) });
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Reserva alterada e enviada para nova aprovação');
  });

  it('clique duplo em Salvar alterações envia um único pedido', async () => {
    const { estado } = montar();
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });

    await userEvent.dblClick(screen.getByRole('button', { name: 'Salvar alterações' }));

    await screen.findByRole('status');
    expect(estado.alteracoes).toHaveLength(1);
  });

  it('enquanto envia, o botão mostra Salvando… e fica desativado', async () => {
    montar({ alterar: () => new Promise<Response>(() => {}) });
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeDisabled();
  });
});

describe('PaginaDeAlteracao: recusas do servidor', () => {
  async function salvar() {
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  }

  it.each([
    [409, 'CONFLITO_DE_ALOCACAO'],
    [409, 'RECURSO_EM_MANUTENCAO'],
    [409, 'RESERVA_JA_INICIADA'],
    [409, 'TRANSICAO_PROIBIDA'],
    [409, 'RECURSO_INATIVO'],
    [403, 'ACESSO_NEGADO'],
    [404, 'NAO_ENCONTRADO'],
    [400, 'INICIO_NO_PASSADO'],
    [400, 'FORA_DA_JANELA'],
    [400, 'DIA_SEM_FUNCIONAMENTO'],
    [400, 'CRUZA_MEIA_NOITE'],
    [400, 'PERIODO_INVALIDO'],
    [500, 'ERRO_INTERNO'],
  ])('%i %s: mostra a mensagem e a ação da tabela de erros, com o foco na mensagem', async (status, code) => {
    montar({ alterar: () => recusa(status, code) });

    await salvar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara(code).mensagem);
    expect(alerta).toHaveTextContent(mensagemPara(code).acao);
    expect(alerta).toHaveFocus();
  });

  it('o que a pessoa digitou continua lá depois da recusa, e o botão volta a funcionar', async () => {
    montar({ alterar: () => recusa(409, 'CONFLITO_DE_ALOCACAO') });
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });
    await userEvent.clear(screen.getByLabelText(/Título/));
    await userEvent.type(screen.getByLabelText(/Título/), 'Aula de reforço');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText(/Título/)).toHaveValue('Aula de reforço');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
  });

  it('conflito de horário reaproveita o tratamento da Nova reserva: a lista é refeita e o recurso que deixou de estar livre é desmarcado', async () => {
    const { estado } = montar({
      livres: [[LABORATORIO, PROFESSORA], [PROFESSORA]],
      alterar: () => recusa(409, 'CONFLITO_DE_ALOCACAO'),
    });
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });
    await userEvent.click(screen.getByRole('checkbox', { name: /Laboratório de Informática 3/ }));
    const antes = estado.consultasDeLivres.length;

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await screen.findByRole('alert');
    await waitFor(() => expect(estado.consultasDeLivres.length).toBeGreaterThan(antes));
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /Laboratório de Informática 3/ })).not.toBeInTheDocument());
    expect(screen.getByText(/Um recurso que você tinha escolhido não está livre/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Sala 101/ })).toBeChecked();
  });

  it('VALIDACAO_FALHOU com campos marca o campo recusado', async () => {
    montar({ alterar: () => recusa(400, 'VALIDACAO_FALHOU', { campos: ['titulo'] }) });

    await salvar();

    await screen.findByRole('alert');
    expect(screen.getByLabelText(/Título/)).toBeInvalid();
    expect(within(screen.getByLabelText(/Título/).closest('div') as HTMLElement).getByText('Informe o título.')).toBeInTheDocument();
  });
});

describe('PaginaDeAlteracao: acessibilidade', () => {
  it('o formulário preenchido não tem violação (axe)', async () => {
    montar();
    await carregada();
    await screen.findByRole('checkbox', { name: /Sala 101/ });

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
