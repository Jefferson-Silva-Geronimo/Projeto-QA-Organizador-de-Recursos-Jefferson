import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { mensagemPara } from '@/erros/mensagens';
import { USUARIO_CADASTRADO, montarAuditoria, recusa } from '@/test/auditoria';

describe('PaginaDeAuditoria: Administrador consulta a auditoria completa (T09, RF-10)', () => {
  it('abre já com a auditoria inteira, sem filtro, na ordem do servidor', async () => {
    const { estado } = montarAuditoria();

    expect(await screen.findByText('4 eventos')).toBeInTheDocument();
    expect(estado.consultasDaAuditoria.map((p) => p.toString())).toEqual(['']);
    expect(estado.consultasDeHistorico).toEqual([]);
    expect(screen.getAllByRole('listitem').map((i) => within(i).getByRole('heading').textContent)).toEqual([
      'Usuário cadastrado',
      'Reserva criada',
      'Reserva aprovada',
      'Reserva cancelada',
    ]);
  });

  it('cada evento diz sobre qual entidade e qual número, e quem fez', async () => {
    montarAuditoria();

    const usuario = (await screen.findAllByRole('listitem'))[0] as HTMLElement;

    expect(within(usuario).getByText('Usuário nº 9')).toBeInTheDocument();
    expect(within(usuario).getByText('Ana Prado')).toBeInTheDocument();
    expect(within(usuario).getByText(/18\/10\/2026.*09:00/)).toBeInTheDocument();
  });

  it('a escolha de entidade tem Todas e as cinco entidades, na grafia da pessoa', async () => {
    montarAuditoria();
    await screen.findByText('4 eventos');

    const opcoes = within(screen.getByLabelText('Entidade')).getAllByRole('option').map((o) => o.textContent);

    expect(opcoes).toEqual(['Todas', 'Reserva', 'Recurso', 'Usuário', 'Bloqueio', 'Configuração']);
  });

  it('filtrar por entidade envia a entidade, atualiza o endereço e mostra só o que o servidor devolveu', async () => {
    const { estado } = montarAuditoria();
    await screen.findByText('4 eventos');

    await userEvent.selectOptions(screen.getByLabelText('Entidade'), 'USUARIO');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(await screen.findByText('1 evento')).toBeInTheDocument();
    expect(estado.consultasDaAuditoria.at(-1)?.get('entidade')).toBe('USUARIO');
    expect(estado.consultasDaAuditoria.at(-1)?.has('entidadeId')).toBe(false);
    expect(screen.getByLabelText('endereço atual')).toHaveTextContent('/auditoria?entidade=USUARIO');
    expect(screen.getByRole('heading', { name: 'Usuário cadastrado' })).toBeInTheDocument();
  });

  it('filtrar por entidade e número envia os dois', async () => {
    const { estado } = montarAuditoria();
    await screen.findByText('4 eventos');

    await userEvent.selectOptions(screen.getByLabelText('Entidade'), 'RESERVA');
    await userEvent.type(screen.getByLabelText('Número'), '41');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(await screen.findByText('3 eventos')).toBeInTheDocument();
    expect(estado.consultasDaAuditoria.at(-1)?.get('entidade')).toBe('RESERVA');
    expect(estado.consultasDaAuditoria.at(-1)?.get('entidadeId')).toBe('41');
  });

  it('abrir já com os filtros no endereço consulta direto com eles', async () => {
    const { estado } = montarAuditoria({ rota: '/auditoria?entidade=USUARIO&numero=9' });

    expect(await screen.findByText('1 evento')).toBeInTheDocument();
    expect(estado.consultasDaAuditoria.map((p) => p.toString())).toEqual(['entidade=USUARIO&entidadeId=9']);
    expect(screen.getByLabelText('Entidade')).toHaveValue('USUARIO');
    expect(screen.getByLabelText('Número')).toHaveValue(9);
  });

  it('o período é filtrado na tela, sem nova consulta ao servidor', async () => {
    const { estado } = montarAuditoria();
    await screen.findByText('4 eventos');

    await userEvent.type(screen.getByLabelText('De'), '2026-10-20');
    await userEvent.type(screen.getByLabelText('Até'), '2026-10-21');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(await screen.findByText('2 eventos')).toBeInTheDocument();
    expect(estado.consultasDaAuditoria).toHaveLength(1);
  });

  it('só com a data De, mostra dela em diante', async () => {
    montarAuditoria({ rota: '/auditoria?de=2026-10-21' });
    expect(await screen.findByText('2 eventos')).toBeInTheDocument();
  });

  it('Limpar filtros volta à auditoria inteira', async () => {
    montarAuditoria({ rota: '/auditoria?entidade=USUARIO' });
    await screen.findByText('1 evento');

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(await screen.findByText('4 eventos')).toBeInTheDocument();
    expect(screen.getByLabelText('endereço atual')).toHaveTextContent(/^\/auditoria$/);
  });

  it('ACESSO_NEGADO do servidor aparece com a mensagem e a ação da tabela de erros', async () => {
    montarAuditoria({ responder: () => recusa(403, 'ACESSO_NEGADO') });

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').mensagem);
    expect(alerta).toHaveTextContent(mensagemPara('ACESSO_NEGADO').acao);
  });

  it('o e-mail do usuário cadastrado, que só existe em depois, não aparece', async () => {
    montarAuditoria({ eventos: [USUARIO_CADASTRADO] });
    await screen.findByText('1 evento');

    expect(document.body.textContent).not.toContain('carlos.lima@exemplo.test');
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = montarAuditoria();
    await screen.findByText('4 eventos');

    expect(await axe(container)).toHaveNoViolations();
  });
});
