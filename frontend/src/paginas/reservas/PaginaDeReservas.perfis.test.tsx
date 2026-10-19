import { screen, within } from '@testing-library/react';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { SALA_101 } from '@/test/recursos';
import { AULA_EXTRA } from '@/test/reservas';
import type { Perfil } from '@/sessao/armazenamento';

async function cartaoDo(perfil: Perfil) {
  const falso = rotearFetch({
    'GET /api/reservas': () => resposta(200, [AULA_EXTRA]),
    'GET /api/recursos/1': () => resposta(200, SALA_101),
  });
  montarPagina({ rota: '/reservas', caminho: '/reservas', elemento: <PaginaDeReservas />, perfil, fetch: falso });
  return screen.findByRole('article', { name: 'Aula extra' });
}

describe('PaginaDeReservas: ações por perfil (conveniência; o servidor continua decidindo, ADR-004)', () => {
  it('o Administrador cancela com motivo, mas não vê Alterar: a alteração não é uma tela dele (RN-17)', async () => {
    const cartao = await cartaoDo('ADMINISTRADOR');

    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
    expect(within(cartao).queryByRole('link', { name: /Alterar/ })).not.toBeInTheDocument();
  });

  it.each(['SOLICITANTE', 'RESPONSAVEL'] as const)('o %s vê Alterar e Cancelar', async (perfil) => {
    const cartao = await cartaoDo(perfil);

    expect(within(cartao).getByRole('link', { name: 'Alterar Aula extra' })).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Cancelar Aula extra' })).toBeInTheDocument();
  });
});
