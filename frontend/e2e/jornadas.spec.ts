import { expect, test, type Page } from '@playwright/test';
import { chamar, diaUtil, entrarNaApi } from './api';
import { RECURSOS, pessoas, type Pessoa } from './ambiente';

/**
 * Jornadas principais ponta a ponta (Fase 6, 6.D): navegador real, front e API reais, sem mocks, só dados fictícios.
 * O que cada teste verifica passa pela tela. A API é chamada só para montar uma pré-condição (por exemplo, a reserva
 * concorrente do teste de conflito). Cada teste usa dias próprios, semanas distantes, para não se atrapalharem.
 */
const p = pessoas();

async function entrarPelaTela(page: Page, pessoa: Pessoa) {
  await page.goto('/entrar');
  await page.getByLabel(/^E-mail/).fill(pessoa.email);
  await page.getByLabel(/^Senha/).fill(pessoa.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).not.toHaveURL(/\/entrar/);
}

/** Busca salas livres no período, pela tela, e abre a Nova reserva a partir do Reservar da sala escolhida. */
async function buscarEAbrirReserva(page: Page, sala: string, dia: string, de: string, ate: string) {
  await page.getByRole('link', { name: 'Buscar', exact: true }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Buscar' })).toBeVisible();
  await page.getByLabel('Tipo').selectOption('SALA');
  await page.getByLabel('Início').fill(`${dia}T${de}`);
  await page.getByLabel('Fim').fill(`${dia}T${ate}`);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText(/Recursos livres em/)).toBeVisible();
  await page.getByRole('link', { name: `Reservar ${sala}` }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Nova reserva' })).toBeVisible();
}

async function reservar(page: Page, titulo: string) {
  await page.getByLabel(/Título/).fill(titulo);
  await page.getByRole('button', { name: 'Reservar' }).click();
}

test.describe.configure({ mode: 'serial' });

test('Solicitante busca e reserva uma sala', async ({ page }) => {
  const dia = diaUtil(30);
  await entrarPelaTela(page, p.maria);

  await buscarEAbrirReserva(page, RECURSOS.sala203.nome, dia, '10:00', '12:00');
  await reservar(page, 'Aula de reforço de Matemática');

  await expect(page.getByRole('status').filter({ hasText: 'Reserva aprovada' })).toBeVisible();

  // a reserva aparece na lista da própria pessoa, aprovada
  await page.getByRole('link', { name: 'Reservas', exact: true }).first().click();
  const cartao = page.getByRole('article', { name: /Aula de reforço de Matemática/ });
  await expect(cartao).toBeVisible();
  await expect(cartao.getByText('Aprovada')).toBeVisible();
});

test('segunda reserva no mesmo horário mostra a mensagem de conflito, sem jargão', async ({ page }) => {
  const dia = diaUtil(37);
  await entrarPelaTela(page, p.joao);

  // João já escolheu a Sala 203 e preencheu o formulário...
  await buscarEAbrirReserva(page, RECURSOS.sala203.nome, dia, '10:00', '12:00');
  await page.getByLabel(/Título/).fill('Reunião do colegiado');

  // ...quando a outra Solicitante reserva a mesma sala no mesmo horário (pré-condição montada pela API real).
  const tokenDaMaria = await entrarNaApi(p.maria.email, p.maria.senha);
  const salas = await chamar<{ id: number; nome: string }[]>('GET', '/api/recursos?tipo=SALA', undefined, tokenDaMaria);
  const sala203 = salas.corpo.find((s) => s.nome === RECURSOS.sala203.nome);
  const concorrente = await chamar('POST', '/api/reservas', {
    titulo: 'Reserva que chegou primeiro',
    inicio: `${dia}T10:00:00-03:00`,
    fim: `${dia}T12:00:00-03:00`,
    recursoIds: [sala203?.id],
  }, tokenDaMaria);
  expect(concorrente.status).toBe(201);

  await page.getByRole('button', { name: 'Reservar' }).click();

  const alerta = page.getByRole('alert').filter({ hasText: 'já está reservado' });
  await expect(alerta).toBeVisible();
  // mensagem compreensível: diz o que houve e o que fazer, sem código técnico nem texto cru do servidor
  await expect(alerta).not.toContainText('CONFLITO_DE_ALOCACAO');
  await expect(alerta).not.toContainText('409');
  await expect(page.getByRole('status').filter({ hasText: /Reserva (aprovada|enviada)/ })).toHaveCount(0);
});

test('Responsável aprova a reserva de um recurso restrito', async ({ page }) => {
  const dia = diaUtil(44);
  await entrarPelaTela(page, p.maria);
  await buscarEAbrirReserva(page, RECURSOS.lab3.nome, dia, '14:00', '16:00');
  await reservar(page, 'Prática no laboratório');
  await expect(page.getByRole('status').filter({ hasText: 'enviada para aprovação' })).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();

  await entrarPelaTela(page, p.carlos);
  await page.getByRole('link', { name: 'Aprovações', exact: true }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Aprovações' })).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar Prática no laboratório' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar aprovação' }).click();
  await expect(page.getByText('Reserva "Prática no laboratório" aprovada.')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();

  // quem pediu vê a reserva aprovada
  await entrarPelaTela(page, p.maria);
  await page.getByRole('link', { name: 'Reservas', exact: true }).first().click();
  const cartao = page.getByRole('article', { name: /Prática no laboratório/ });
  await expect(cartao.getByText('Aprovada')).toBeVisible();
});

test('Solicitante não vê a ação de aprovar', async ({ page }) => {
  const dia = diaUtil(51);
  // pré-condição: um pedido do laboratório aguardando aprovação, feito pela própria Solicitante
  const token = await entrarNaApi(p.maria.email, p.maria.senha);
  const salas = await chamar<{ id: number; nome: string }[]>('GET', '/api/recursos?tipo=SALA', undefined, token);
  const lab = salas.corpo.find((s) => s.nome === RECURSOS.lab3.nome);
  const pedido = await chamar('POST', '/api/reservas', {
    titulo: 'Pedido que aguarda decisão',
    inicio: `${dia}T14:00:00-03:00`,
    fim: `${dia}T16:00:00-03:00`,
    recursoIds: [lab?.id],
  }, token);
  expect(pedido.status).toBe(201);

  await entrarPelaTela(page, p.maria);

  // sem item de menu de aprovações
  await expect(page.getByRole('link', { name: 'Aprovações' })).toHaveCount(0);
  // o pedido dela aparece como solicitado, sem Aprovar nem Rejeitar
  await page.getByRole('link', { name: 'Reservas', exact: true }).first().click();
  const cartao = page.getByRole('article', { name: /Pedido que aguarda decisão/ });
  await expect(cartao.getByText('Solicitada')).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Aprovar|Rejeitar)/ })).toHaveCount(0);
  // e abrir a tela de aprovações pelo endereço mostra acesso negado
  await page.goto('/aprovacoes');
  await expect(page.getByRole('heading', { level: 1, name: 'Acesso negado' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Aprovar|Rejeitar)/ })).toHaveCount(0);
});

test.describe('em celular (360 por 640)', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('fluxo principal: buscar e reservar uma sala, sem rolagem horizontal', async ({ page }) => {
    const dia = diaUtil(58);
    await entrarPelaTela(page, p.maria);

    await buscarEAbrirReserva(page, RECURSOS.sala101.nome, dia, '08:00', '10:00');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await reservar(page, 'Aula pelo celular');

    await expect(page.getByRole('status').filter({ hasText: 'Reserva aprovada' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByRole('link', { name: 'Reservas', exact: true }).first().click();
    await expect(page.getByRole('article', { name: /Aula pelo celular/ })).toBeVisible();
  });
});
