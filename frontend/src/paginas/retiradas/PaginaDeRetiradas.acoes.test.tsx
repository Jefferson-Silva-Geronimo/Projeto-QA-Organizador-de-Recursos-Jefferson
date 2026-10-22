import { screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { montarRetiradas } from '@/test/retiradas';
import { AULA_DE_INFORMATICA, movimento } from '@/test/uso';

/** Texto no padrão aprovado da T04 e da T05 (22/10/2026): não explica a regra nem sugere ação. */
const MENSAGEM = 'Você não pode registrar o uso desta reserva agora.';
const SEM_MATERIAL = { ...AULA_DE_INFORMATICA, recursoIds: [1] };
const TODAS_FALSAS = { podeIniciar: false, podeConcluir: false, podeMarcarNaoComparecimento: false };

describe('PaginaDeRetiradas: ações da reserva conforme o que o servidor informa (F6-16)', () => {
  it('podeIniciar verdadeiro: oferece Iniciar uso, com o título da reserva no nome', async () => {
    montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS, podeIniciar: true }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(within(cartao).getByRole('button', { name: 'Iniciar uso Aula de informática' })).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /^Concluir/ })).not.toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /^Não compareceu/ })).not.toBeInTheDocument();
  });

  it('podeConcluir verdadeiro: oferece Concluir reserva', async () => {
    montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS, estado: 'EM_USO', podeConcluir: true }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(within(cartao).getByRole('button', { name: 'Concluir reserva Aula de informática' })).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /^Iniciar/ })).not.toBeInTheDocument();
  });

  it('podeMarcarNaoComparecimento verdadeiro: oferece Não compareceu', async () => {
    montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS, podeMarcarNaoComparecimento: true }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(within(cartao).getByRole('button', { name: 'Não compareceu Aula de informática' })).toBeInTheDocument();
  });

  it('os três verdadeiros: oferece as três ações', async () => {
    montarRetiradas({
      reservas: [{ ...SEM_MATERIAL, podeIniciar: true, podeConcluir: true, podeMarcarNaoComparecimento: true }],
    });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(within(cartao).getAllByRole('button')).toHaveLength(3);
  });

  it('o front obedece ao campo, não ao estado nem ao relógio: APROVADA que já passou da tolerância sem o campo não mostra Não compareceu', async () => {
    montarRetiradas({
      reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS, podeIniciar: true, inicio: '2020-01-01T17:00:00Z', fim: '2020-01-01T19:00:00Z' }],
    });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(within(cartao).queryByRole('button', { name: /^Não compareceu/ })).not.toBeInTheDocument();
  });

  it('o front obedece ao campo, não ao estado: EM_USO com podeConcluir falso (material pendente) não mostra Concluir', async () => {
    montarRetiradas({
      reservas: [{ ...AULA_DE_INFORMATICA, estado: 'EM_USO', ...TODAS_FALSAS }],
      movimentacoes: { 30: [movimento(1, 7, 'RETIRADA', true)] },
    });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });
    await within(cartao).findByRole('button', { name: 'Devolver Projetor P-007' });

    expect(within(cartao).queryByRole('button', { name: /^Concluir/ })).not.toBeInTheDocument();
  });

  it('cada cartão obedece aos próprios campos', async () => {
    montarRetiradas({
      reservas: [
        { ...SEM_MATERIAL, podeIniciar: true, podeConcluir: false, podeMarcarNaoComparecimento: false },
        { ...SEM_MATERIAL, id: 31, titulo: 'Atendimento', estado: 'EM_USO', podeIniciar: false, podeConcluir: true, podeMarcarNaoComparecimento: false },
      ],
    });

    const primeiro = await screen.findByRole('article', { name: 'Aula de informática' });
    const segundo = screen.getByRole('article', { name: 'Atendimento' });

    expect(within(primeiro).getByRole('button', { name: /^Iniciar/ })).toBeInTheDocument();
    expect(within(segundo).queryByRole('button', { name: /^Iniciar/ })).not.toBeInTheDocument();
    expect(within(segundo).getByRole('button', { name: /^Concluir/ })).toBeInTheDocument();
  });
});

describe('PaginaDeRetiradas: quando nenhuma ação de uso está disponível', () => {
  it('três campos falsos e nenhuma unidade para retirar ou devolver: mostra a mensagem, sem botões', async () => {
    montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });

    expect(await within(cartao).findByText(MENSAGEM)).toBeVisible();
    expect(within(cartao).queryByRole('button')).not.toBeInTheDocument();
  });

  it('a mensagem é texto, sem papel de alerta, e o leitor de tela a lê junto com o cartão (descrição acessível)', async () => {
    montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });
    await within(cartao).findByText(MENSAGEM);

    expect(within(cartao).queryByRole('alert')).not.toBeInTheDocument();
    expect(cartao).toHaveAccessibleDescription(MENSAGEM);
  });

  it.each([
    ['podeIniciar', { podeIniciar: true }],
    ['podeConcluir', { podeConcluir: true }],
    ['podeMarcarNaoComparecimento', { podeMarcarNaoComparecimento: true }],
  ])('com %s verdadeiro a mensagem não aparece', async (_campo, campo) => {
    montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS, ...campo }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });
    await within(cartao).findByText(/Sala 101/);

    expect(within(cartao).queryByText(MENSAGEM)).not.toBeInTheDocument();
    expect(cartao).not.toHaveAccessibleDescription();
  });

  it('com uma unidade para retirar a mensagem não aparece, mesmo com os três campos falsos', async () => {
    montarRetiradas({ reservas: [{ ...AULA_DE_INFORMATICA, ...TODAS_FALSAS }] });

    const cartao = await screen.findByRole('article', { name: 'Aula de informática' });
    await within(cartao).findByRole('button', { name: 'Retirar Notebook N-001' });

    expect(within(cartao).queryByText(MENSAGEM)).not.toBeInTheDocument();
  });

  it('a lista com a mensagem não tem violação de acessibilidade (axe)', async () => {
    const { container } = montarRetiradas({ reservas: [{ ...SEM_MATERIAL, ...TODAS_FALSAS }, { ...SEM_MATERIAL, id: 31, titulo: 'Outra aula' }] });
    await screen.findByText(MENSAGEM);
    await screen.findAllByText(/Sala 101/);

    expect(await axe(container)).toHaveNoViolations();
  });
});
