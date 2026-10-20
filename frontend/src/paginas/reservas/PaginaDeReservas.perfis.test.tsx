import { screen, within } from '@testing-library/react';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { SALA_101 } from '@/test/recursos';
import { AULA_EXTRA, type Reserva } from '@/test/reservas';
import type { Perfil } from '@/sessao/armazenamento';

async function cartaoDo(perfil: Perfil, permissoes: Pick<Reserva, 'podeAlterar' | 'podeCancelar'>) {
  const falso = rotearFetch({
    'GET /api/reservas': () => resposta(200, [{ ...AULA_EXTRA, ...permissoes }]),
    'GET /api/recursos/1': () => resposta(200, SALA_101),
  });
  montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, perfil, fetch: falso });
  return screen.findByRole('article', { name: 'Aula extra' });
}

/**
 * BUG-016 e F6-14: quem decide o que cada perfil pode fazer é o servidor. O Administrador recebe podeAlterar falso
 * (a alteração não é tela dele, RN-17) e por isso não vê Alterar; o front não olha o perfil.
 */
describe('PaginaDeReservas: ações por perfil vêm do servidor (ADR-004, F6-14)', () => {
  it('o Administrador, com podeAlterar falso e podeCancelar verdadeiro, cancela com motivo mas não vê Alterar', async () => {
    const cartao = await cartaoDo('ADMINISTRADOR', { podeAlterar: false, podeCancelar: true });

    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
    expect(within(cartao).queryByRole('link', { name: /Alterar/ })).not.toBeInTheDocument();
  });

  it('o Responsável que não é o dono recebe só podeCancelar e vê só Cancelar', async () => {
    const cartao = await cartaoDo('RESPONSAVEL', { podeAlterar: false, podeCancelar: true });

    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
    expect(within(cartao).queryByRole('link', { name: /Alterar/ })).not.toBeInTheDocument();
  });

  it('o front não olha o perfil: Administrador com podeAlterar verdadeiro (hipotético) veria Alterar', async () => {
    const cartao = await cartaoDo('ADMINISTRADOR', { podeAlterar: true, podeCancelar: true });

    expect(within(cartao).getByRole('link', { name: 'Alterar Aula extra' })).toBeInTheDocument();
  });

  it.each(['SOLICITANTE', 'RESPONSAVEL'] as const)('o %s dono recebe os dois campos verdadeiros e vê Alterar e Cancelar', async (perfil) => {
    const cartao = await cartaoDo(perfil, { podeAlterar: true, podeCancelar: true });

    expect(within(cartao).getByRole('link', { name: 'Alterar Aula extra' })).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
  });
});
