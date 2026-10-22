import { screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { PaginaDeAprovacoes } from '@/paginas/aprovacoes/PaginaDeAprovacoes';
import { PEDIDO_DE_JOAO, PEDIDO_DE_MARIA, type ItemDaFila } from '@/test/fila';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROJETOR } from '@/test/recursos';

/** Texto aprovado por Jefferson (22/10/2026): não explica a regra nem sugere ação. */
const MENSAGEM = 'Você não pode aprovar nem rejeitar esta solicitação agora.';

function montar(fila: ItemDaFila[]) {
  const falso = rotearFetch({
    'GET /api/reservas/fila': () => resposta(200, fila),
    'GET /api/recursos/3': () => resposta(200, LABORATORIO),
    'GET /api/recursos/7': () => resposta(200, PROJETOR),
  });
  return montarPagina({
    rota: '/aprovacoes',
    caminho: '/aprovacoes',
    elemento: <PaginaDeAprovacoes />,
    perfil: 'RESPONSAVEL',
    fetch: falso,
  });
}

describe('PaginaDeAprovacoes: ações conforme o que o servidor informa (F6-15)', () => {
  it('podeAprovar e podeRejeitar verdadeiros: oferece Aprovar e Rejeitar, com o título da solicitação no nome', async () => {
    montar([PEDIDO_DE_MARIA]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(cartao).getByRole('button', { name: 'Aprovar Prova de Estatística' })).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Rejeitar Prova de Estatística' })).toBeInTheDocument();
  });

  it('só podeAprovar verdadeiro: oferece só Aprovar, sem mensagem', async () => {
    montar([{ ...PEDIDO_DE_MARIA, podeAprovar: true, podeRejeitar: false }]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(cartao).getByRole('button', { name: /^Aprovar/ })).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /^Rejeitar/ })).not.toBeInTheDocument();
    expect(within(cartao).queryByText(MENSAGEM)).not.toBeInTheDocument();
  });

  it('só podeRejeitar verdadeiro (por exemplo, o horário de início já passou): oferece só Rejeitar, sem mensagem', async () => {
    montar([{ ...PEDIDO_DE_MARIA, podeAprovar: false, podeRejeitar: true }]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(cartao).getByRole('button', { name: /^Rejeitar/ })).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /^Aprovar/ })).not.toBeInTheDocument();
    expect(within(cartao).queryByText(MENSAGEM)).not.toBeInTheDocument();
  });

  it('os dois campos falsos: nenhuma ação e a mensagem visível', async () => {
    montar([{ ...PEDIDO_DE_MARIA, podeAprovar: false, podeRejeitar: false }]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(cartao).queryByRole('button')).not.toBeInTheDocument();
    expect(within(cartao).getByText(MENSAGEM)).toBeVisible();
  });

  it('a mensagem é texto, sem papel de alerta, e o leitor de tela a lê junto com o cartão (descrição acessível)', async () => {
    montar([{ ...PEDIDO_DE_MARIA, podeAprovar: false, podeRejeitar: false }]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(cartao).queryByRole('alert')).not.toBeInTheDocument();
    expect(cartao).toHaveAccessibleDescription(MENSAGEM);
  });

  it('o cartão com ação disponível não tem descrição acessível', async () => {
    montar([PEDIDO_DE_MARIA]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(cartao).not.toHaveAccessibleDescription();
  });

  it('o front obedece ao campo, não ao relógio: solicitação que já começou com podeAprovar verdadeiro mostra Aprovar', async () => {
    montar([{ ...PEDIDO_DE_MARIA, inicio: '2020-01-01T17:00:00Z', fim: '2020-01-01T19:00:00Z' }]);

    const cartao = await screen.findByRole('article', { name: 'Prova de Estatística' });

    expect(within(cartao).getByRole('button', { name: /^Aprovar/ })).toBeInTheDocument();
  });

  it('cada cartão obedece aos próprios campos: a mensagem aparece só no cartão sem ação', async () => {
    montar([PEDIDO_DE_MARIA, { ...PEDIDO_DE_JOAO, podeAprovar: false, podeRejeitar: false }]);

    const maria = await screen.findByRole('article', { name: 'Prova de Estatística' });
    const joao = screen.getByRole('article', { name: 'Oficina de robótica' });

    expect(within(maria).getAllByRole('button')).toHaveLength(2);
    expect(within(joao).queryByRole('button')).not.toBeInTheDocument();
    expect(within(joao).getByText(MENSAGEM)).toBeVisible();
    expect(within(maria).queryByText(MENSAGEM)).not.toBeInTheDocument();
  });

  it('a lista com a mensagem não tem violação de acessibilidade (axe)', async () => {
    const { container } = montar([PEDIDO_DE_MARIA, { ...PEDIDO_DE_JOAO, podeAprovar: false, podeRejeitar: false }]);
    await screen.findByText(MENSAGEM);
    await screen.findAllByText(/Projetor P-007/);

    expect(await axe(container)).toHaveNoViolations();
  });
});
