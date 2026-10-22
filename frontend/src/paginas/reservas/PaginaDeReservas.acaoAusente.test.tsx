import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { SALA_101 } from '@/test/recursos';
import { AULA_EXTRA, type Reserva } from '@/test/reservas';

const MENSAGEM = 'Você não pode alterar nem cancelar esta reserva agora.';
const SEM_ACOES = { podeAlterar: false, podeCancelar: false };

function montar(reservas: Reserva[]) {
  const falso = rotearFetch({
    'GET /api/reservas': () => resposta(200, reservas),
    'GET /api/recursos/1': () => resposta(200, SALA_101),
  });
  return montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, fetch: falso });
}

describe('PaginaDeReservas: quando a ação não está disponível (F6-14)', () => {
  it.each(['SOLICITADA', 'APROVADA', 'EM_USO'] as const)(
    'reserva %s em andamento, com os dois campos falsos, diz que não pode alterar nem cancelar agora',
    async (estado) => {
      montar([{ ...AULA_EXTRA, estado, ...SEM_ACOES }]);

      const cartao = await screen.findByRole('article', { name: 'Aula extra' });

      expect(within(cartao).getByText(MENSAGEM)).toBeVisible();
    },
  );

  it.each(['CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU'] as const)(
    'reserva %s, já encerrada, não mostra a mensagem: o estado e o motivo já explicam',
    async (estado) => {
      montar([{ ...AULA_EXTRA, estado, ...SEM_ACOES }]);

      const cartao = await screen.findByRole('article', { name: 'Aula extra' });

      expect(within(cartao).queryByText(MENSAGEM)).not.toBeInTheDocument();
    },
  );

  it.each([
    { podeAlterar: true, podeCancelar: false },
    { podeAlterar: false, podeCancelar: true },
    { podeAlterar: true, podeCancelar: true },
  ])('com alguma ação disponível (%j) a mensagem não aparece', async (permissoes) => {
    montar([{ ...AULA_EXTRA, ...permissoes }]);

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).queryByText(MENSAGEM)).not.toBeInTheDocument();
  });

  it('a mensagem é texto, sem papel de alerta, e o leitor de tela a lê junto com o cartão (descrição acessível)', async () => {
    montar([{ ...AULA_EXTRA, ...SEM_ACOES }]);

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(within(cartao).queryByRole('alert')).not.toBeInTheDocument();
    expect(cartao).toHaveAccessibleDescription(MENSAGEM);
  });

  it('o cartão sem a mensagem não tem descrição acessível', async () => {
    montar([AULA_EXTRA]);

    const cartao = await screen.findByRole('article', { name: 'Aula extra' });

    expect(cartao).not.toHaveAccessibleDescription();
  });

  it('reserva que passa a EM_USO depois de uma recusa (lista refeita com os campos falsos) ganha a mensagem', async () => {
    const estado = { reservas: [AULA_EXTRA] };
    const falso = rotearFetch({
      'GET /api/reservas': () => resposta(200, estado.reservas),
      'GET /api/recursos/1': () => resposta(200, SALA_101),
      'POST /api/reservas/10/cancelamento': () => {
        estado.reservas = [{ ...AULA_EXTRA, estado: 'EM_USO', ...SEM_ACOES }];
        return resposta(409, { status: 409, code: 'TRANSICAO_PROIBIDA' });
      },
    });
    montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, fetch: falso });
    const cartao = await screen.findByRole('article', { name: 'Aula extra' });
    await userEvent.click(within(cartao).getByRole('button', { name: /^Cancelar/ }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmar cancelamento' }));
    await within(screen.getByRole('dialog')).findByRole('alert');

    await waitFor(() => expect(within(cartao).getByText(MENSAGEM)).toBeVisible());
  });

  it('a lista com a mensagem não tem violação de acessibilidade (axe)', async () => {
    const { container } = montar([{ ...AULA_EXTRA, ...SEM_ACOES }, { ...AULA_EXTRA, id: 11, titulo: 'Outra aula' }]);
    await screen.findByText(MENSAGEM);
    await screen.findAllByText('Sala 101');

    expect(await axe(container)).toHaveNoViolations();
  });
});
