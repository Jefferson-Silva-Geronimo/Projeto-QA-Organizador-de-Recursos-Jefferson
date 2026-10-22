import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { ACAO_DESCONHECIDA, montarAuditoria, recusa } from '@/test/auditoria';

async function consultar(numero: string) {
  await userEvent.type(screen.getByLabelText(/^Reserva/), numero);
  await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));
}

describe('PaginaDeAuditoria: Responsável consulta o histórico de uma reserva (T09, RF-10)', () => {
  it('o título da tela é Histórico, e sem reserva a tela pede o número e não consulta', async () => {
    const { estado } = montarAuditoria({ perfil: 'RESPONSAVEL' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByText('Informe a reserva')).toBeInTheDocument();
    expect(screen.getByText('Digite o número da reserva para ver o histórico dela.')).toBeInTheDocument();
    expect(estado.consultasDeHistorico).toEqual([]);
    expect(estado.consultasDaAuditoria).toEqual([]);
  });

  it('o Responsável não vê a escolha de entidade, que é da auditoria completa do Administrador', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL' });
    await screen.findByText('Informe a reserva');

    expect(screen.queryByLabelText('Entidade')).not.toBeInTheDocument();
  });

  it('consultar sem o número aponta o campo, com o foco, e não consulta', async () => {
    const { estado } = montarAuditoria({ perfil: 'RESPONSAVEL' });
    await screen.findByText('Informe a reserva');

    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(screen.getByText('Informe o número da reserva.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Reserva/)).toHaveFocus();
    expect(screen.getByLabelText(/^Reserva/)).toHaveAttribute('aria-invalid', 'true');
    expect(estado.consultasDeHistorico).toEqual([]);
  });

  it('consulta o histórico da reserva, na ordem do servidor, com a contagem', async () => {
    const { estado } = montarAuditoria({ perfil: 'RESPONSAVEL' });
    await screen.findByText('Informe a reserva');

    await consultar('41');

    expect(await screen.findByText('3 eventos')).toBeInTheDocument();
    expect(estado.consultasDeHistorico).toEqual(['41']);
    expect(screen.getAllByRole('listitem').map((i) => within(i).getByRole('heading').textContent)).toEqual([
      'Reserva criada',
      'Reserva aprovada',
      'Reserva cancelada',
    ]);
  });

  it('cada evento mostra quando (hora do campus), quem (pelo nome), a mudança de estado e o que foi afetado', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41' });

    const aprovada = (await screen.findAllByRole('listitem'))[1] as HTMLElement;

    expect(within(aprovada).getByText(/21\/10\/2026.*10:30/)).toBeInTheDocument();
    expect(within(aprovada).getByText('Carlos Lima')).toBeInTheDocument();
    expect(within(aprovada).getByText('De Solicitada para Aprovada')).toBeInTheDocument();
    expect(within(aprovada).getByText('Reserva nº 41')).toBeInTheDocument();
  });

  it('o primeiro evento, sem estado anterior, mostra só o estado novo', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41' });

    const criada = (await screen.findAllByRole('listitem'))[0] as HTMLElement;

    expect(within(criada).getByText('Estado: Solicitada')).toBeInTheDocument();
    expect(within(criada).queryByText(/^De /)).not.toBeInTheDocument();
  });

  it('o sistema aparece como SISTEMA, sem nome, e o motivo gravado pelo sistema vira texto para a pessoa', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41' });

    const cancelada = (await screen.findAllByRole('listitem'))[2] as HTMLElement;

    expect(within(cancelada).getByText('SISTEMA')).toBeInTheDocument();
    expect(within(cancelada).getByText('Cancelada porque o recurso entrou em manutenção.')).toBeInTheDocument();
  });

  it('nunca mostra o número do ator nem o e-mail, nem o conteúdo bruto de antes e depois', async () => {
    montarAuditoria({ perfil: 'ADMINISTRADOR' });
    await screen.findByText('4 eventos');

    const tela = document.body.textContent ?? '';
    expect(tela).not.toContain('@');
    expect(tela).not.toContain('atorId');
    expect(tela).not.toContain('RESPONSAVEL');
  });

  it('o filtro vai para o endereço: abrir já com a reserva consulta direto', async () => {
    const { estado } = montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41' });

    expect(await screen.findByText('3 eventos')).toBeInTheDocument();
    expect(estado.consultasDeHistorico).toEqual(['41']);
    expect(screen.getByLabelText(/^Reserva/)).toHaveValue(41);
    expect(screen.getByLabelText('endereço atual')).toHaveTextContent('/auditoria?reserva=41');
  });

  it('ação que a tela não conhece aparece pelo código, em vez de sumir', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41', historicos: { '41': [ACAO_DESCONHECIDA] } });

    expect(await screen.findByRole('heading', { name: 'RESERVA_TELEPORTADA' })).toBeInTheDocument();
  });

  it('reserva sem eventos mostra o estado vazio', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41', historicos: { '41': [] } });

    expect(await screen.findByText('Nada registrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhum evento encontrado com estes filtros.')).toBeInTheDocument();
  });

  it('enquanto consulta mostra o carregando', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41', responder: () => new Promise<Response>(() => {}) });

    expect(await screen.findByText('Carregando histórico…')).toBeInTheDocument();
  });

  it('NAO_ENCONTRADO: a mensagem e a ação da tabela de erros', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=99' });

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('NAO_ENCONTRADO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('NAO_ENCONTRADO').acao);
  });

  it('erro do servidor tem o botão de tentar de novo, que consulta outra vez', async () => {
    let falhar = true;
    const { estado } = montarAuditoria({
      perfil: 'RESPONSAVEL',
      rota: '/auditoria?reserva=41',
      responder: () => (falhar ? recusa(500, 'ERRO_INTERNO') : undefined),
    });
    await screen.findByRole('alert');

    falhar = false;
    await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));

    expect(await screen.findByText('3 eventos')).toBeInTheDocument();
    expect(estado.consultasDeHistorico).toEqual(['41', '41']);
  });

  it('o filtro de período é feito na tela, sobre a lista que já veio, sem nova consulta', async () => {
    const { estado } = montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41' });
    await screen.findByText('3 eventos');

    await userEvent.type(screen.getByLabelText('De'), '2026-10-21');
    await userEvent.type(screen.getByLabelText('Até'), '2026-10-21');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(await screen.findByText('1 evento')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reserva aprovada' })).toBeInTheDocument();
    expect(estado.consultasDeHistorico).toEqual(['41']);
  });

  it('o período usa o dia do campus: o evento de 22h do dia 24 (01h UTC do 25) cai no dia 24', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41&de=2026-10-24&ate=2026-10-24' });

    expect(await screen.findByRole('heading', { name: 'Reserva cancelada' })).toBeInTheDocument();
    expect(screen.getByText('1 evento')).toBeInTheDocument();
  });

  it('período sem eventos mostra o vazio e Limpar filtros volta a lista inteira', async () => {
    montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41&de=2026-01-01&ate=2026-01-02' });

    expect(await screen.findByText('Nada registrado')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(await screen.findByText('Informe a reserva')).toBeInTheDocument();
    expect(screen.getByLabelText('endereço atual')).toHaveTextContent(/^\/auditoria$/);
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = montarAuditoria({ perfil: 'RESPONSAVEL', rota: '/auditoria?reserva=41' });
    await screen.findByText('3 eventos');

    expect(await axe(container)).toHaveNoViolations();
  });
});
