/*
 * Roteiro de verificação em navegador real (etapa 6.C): front de produção contra a API real, no Chromium.
 * Capturas, auditoria axe e navegação só por teclado. Ver README.md desta pasta.
 *
 * Uso: node prototipo.cjs <pasta-de-saida> [tudo|visual|teclado|login]
 * Variável opcional: DESLOCAMENTO (dias a partir de hoje para o primeiro dia útil usado; padrão 7). Troque o valor
 * a cada execução no mesmo banco, porque o roteiro cria reservas de verdade e o mesmo horário não fica livre duas vezes.
 */
const fs = require('node:fs');
const path = require('node:path');
const frontend = path.resolve(__dirname, '../../../frontend');
const { chromium } = require(require.resolve('@playwright/test', { paths: [frontend] }));
const AxeBuilder = require(require.resolve('@axe-core/playwright', { paths: [frontend] })).default;

const LOCAL = path.join(__dirname, 'local'); // credenciais e dados fictícios, ignorados pelo Git
const SAIDA = process.argv[2];
const SO = process.argv[3] || 'tudo'; // tudo | visual | teclado | login
fs.mkdirSync(SAIDA, { recursive: true });
const env = Object.fromEntries(
  fs.readFileSync(path.join(LOCAL, 'proto.env'), 'utf-8').split('\n').filter((l) => l.includes('=')).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim()]),
);
const FRONT = 'http://localhost:4173';
const API = 'http://localhost:8080';

async function api(metodo, caminho, corpo, token) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await r.text();
  return { status: r.status, corpo: texto ? JSON.parse(texto) : null };
}
async function entrar(email, senha) {
  const r = await api('POST', '/api/auth/login', { email, senha });
  if (r.status !== 200) throw new Error('login ' + email + ' ' + r.status);
  return r.corpo;
}

const RELATORIO = { axe: [], foco: [], notas: [] };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function auditar(page, rotulo) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const violacoes = r.violations.map((v) => ({ id: v.id, impacto: v.impact, ajuda: v.help, nos: v.nodes.length, alvo: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) }));
  const incompletas = r.incomplete.map((i) => ({ id: i.id, nos: i.nodes.length, alvo: i.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  RELATORIO.axe.push({ estado: rotulo, regrasVerificadas: r.passes.length, violacoes, incompletas });
  return violacoes;
}
async function foto(page, nome) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SAIDA, nome + '.jpg'), type: 'jpeg', quality: 82, fullPage: false });
  await page.screenshot({ path: path.join(SAIDA, nome + '-completa.png'), fullPage: true });
}
async function semRolagemHorizontal(page, rotulo) {
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  RELATORIO.notas.push({ estado: rotulo, semRolagemHorizontal: ok });
}

/** Próximos dias úteis a partir de hoje + DESLOCAMENTO, como AAAA-MM-DD. */
function proximosDiasUteis(quantos) {
  const base = new Date();
  base.setDate(base.getDate() + Number(process.env.DESLOCAMENTO || 7));
  const lista = [];
  while (lista.length < quantos) {
    const dia = base.getDay();
    if (dia !== 0 && dia !== 6) {
      lista.push(base.getFullYear() + '-' + String(base.getMonth() + 1).padStart(2, '0') + '-' + String(base.getDate()).padStart(2, '0'));
    }
    base.setDate(base.getDate() + 1);
  }
  return lista;
}
const DIAS = proximosDiasUteis(5);
const digitosDoDia = (iso) => iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4);

const COMBOS = [
  { id: 'celular-claro', largura: 360, altura: 740, esquema: 'light', dia: DIAS[0] },
  { id: 'celular-escuro', largura: 360, altura: 740, esquema: 'dark', dia: DIAS[1] },
  { id: 'desktop-claro', largura: 1280, altura: 800, esquema: 'light', dia: DIAS[2] },
  { id: 'desktop-escuro', largura: 1280, altura: 800, esquema: 'dark', dia: DIAS[3] },
];

async function contexto(navegador, c, sessao) {
  const ctx = await navegador.newContext({ viewport: { width: c.largura, height: c.altura }, colorScheme: c.esquema, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', deviceScaleFactor: 1 });
  await ctx.addInitScript((s) => window.sessionStorage.setItem('sessao', JSON.stringify(s)), { token: sessao.token, perfil: sessao.perfil, expiraEm: sessao.expiraEm });
  return ctx;
}

async function fluxoVisual(navegador, c, maria, joao, ids) {
  const ctx = await contexto(navegador, c, maria);
  const page = await ctx.newPage();
  const P = (nome) => `${c.id}-${nome}`;
  const inicio = c.dia + 'T10:00';
  const fim = c.dia + 'T12:00';

  // ---- Busca
  await page.goto(FRONT + '/buscar');
  await page.getByRole('heading', { level: 1, name: 'Buscar' }).waitFor();
  await page.getByText(/recursos? encontrados?/).waitFor();
  await foto(page, P('busca-1-lista'));
  await auditar(page, P('busca-1-lista'));
  await semRolagemHorizontal(page, P('busca'));

  await page.getByRole('button', { name: 'Ver horários ocupados de Sala 101' }).click();
  await page.getByRole('list', { name: 'Horários ocupados' }).waitFor();
  await foto(page, P('busca-2-horarios'));
  await auditar(page, P('busca-2-horarios'));

  await page.getByLabel('Tipo').selectOption('SALA');
  await page.getByLabel('Capacidade mínima').fill('30');
  await page.getByLabel('Início').fill(inicio);
  await page.getByLabel('Fim').fill(fim);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText(/Recursos livres em/).waitFor();
  await foto(page, P('busca-3-filtrada'));
  await auditar(page, P('busca-3-filtrada'));

  await page.getByLabel('Início').fill(inicio);
  await page.getByLabel('Fim').fill('');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText('Informe também o fim do período.').waitFor();
  await foto(page, P('busca-4-erro-de-campo'));
  await auditar(page, P('busca-4-erro-de-campo'));

  // ---- Nova reserva, a partir do Reservar da Busca
  await page.getByLabel('Fim').fill(fim);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText(/Recursos livres em/).waitFor();
  await page.getByRole('link', { name: 'Reservar Sala 203' }).click();
  await page.getByRole('heading', { level: 1, name: 'Nova reserva' }).waitFor();
  await page.getByRole('group', { name: 'Salas' }).waitFor();
  await foto(page, P('reserva-1-recursos'));
  await auditar(page, P('reserva-1-recursos'));
  await semRolagemHorizontal(page, P('reserva'));

  // validação do servidor: nada preenchido, nada marcado
  await page.getByRole('checkbox', { name: /Sala 203/ }).uncheck();
  await page.getByRole('button', { name: 'Reservar' }).click();
  await page.getByRole('alert').waitFor();
  await foto(page, P('reserva-2-validacao'));
  await auditar(page, P('reserva-2-validacao'));

  // conflito: a outra Solicitante reserva a Sala 203 antes de enviarmos
  await page.getByLabel(/Título/).fill('Aula de reforço de Matemática');
  await page.getByLabel('Descrição').fill('Revisão para a prova de segunda-feira.');
  await page.getByRole('checkbox', { name: /Sala 203/ }).check();
  await page.getByRole('checkbox', { name: /Notebook N-001/ }).check();
  await foto(page, P('reserva-3-preenchido'));
  await auditar(page, P('reserva-3-preenchido'));
  const concorrente = await api('POST', '/api/reservas', { titulo: 'Reunião concorrente', inicio: inicio + ':00-03:00', fim: fim + ':00-03:00', recursoIds: [ids.sala203] }, joao.token);
  RELATORIO.notas.push({ estado: P('concorrente'), status: concorrente.status });
  await page.getByRole('button', { name: 'Reservar' }).click();
  await page.getByRole('alert').filter({ hasText: 'já está reservado' }).waitFor();
  await foto(page, P('reserva-4-conflito'));
  await auditar(page, P('reserva-4-conflito'));

  // corrige: troca a sala ocupada pela Sala 101 (a lista é refeita pelo servidor)
  await page.getByRole('checkbox', { name: /Sala 203/ }).waitFor({ state: 'detached' });
  await foto(page, P('reserva-4b-lista-refeita'));
  await auditar(page, P('reserva-4b-lista-refeita'));
  await page.getByRole('checkbox', { name: /Sala 101/ }).check();
  await page.getByRole('button', { name: 'Reservar' }).click();
  await page.getByRole('status').filter({ hasText: /Reserva (aprovada|enviada)/ }).waitFor();
  await foto(page, P('reserva-5-sucesso-aprovada'));
  await auditar(page, P('reserva-5-sucesso-aprovada'));

  // recurso restrito: o servidor devolve SOLICITADA
  await page.getByRole('button', { name: 'Fazer outra reserva' }).click();
  await page.getByLabel('Início').fill(inicio.replace('10:00', '14:00'));
  await page.getByLabel('Fim').fill(fim.replace('12:00', '16:00'));
  await page.getByRole('group', { name: 'Salas' }).waitFor();
  await page.getByLabel(/Título/).fill('Prática no laboratório');
  await page.getByRole('checkbox', { name: /Laboratório de Informática 3/ }).check();
  await foto(page, P('reserva-6-restrito'));
  await auditar(page, P('reserva-6-restrito'));
  await page.getByRole('button', { name: 'Reservar' }).click();
  await page.getByRole('status').filter({ hasText: 'enviada para aprovação' }).waitFor();
  await foto(page, P('reserva-7-sucesso-solicitada'));
  await auditar(page, P('reserva-7-sucesso-solicitada'));

  await ctx.close();
}

async function descrever(page) {
  return page.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return { nome: '(corpo da página)', visivel: false };
    const rotulo = e.labels && e.labels[0] ? e.labels[0].textContent : '';
    const nome = (e.getAttribute('aria-label') || rotulo || e.textContent || e.getAttribute('placeholder') || e.id || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 60);
    const papel = e.getAttribute('role') || (e.tagName === 'A' ? 'link' : e.tagName === 'BUTTON' ? 'button' : e.tagName === 'SELECT' ? 'combobox' : e.tagName === 'INPUT' ? (e.type === 'checkbox' ? 'checkbox' : 'campo') : e.tagName === 'TEXTAREA' ? 'campo' : e.tagName.toLowerCase());
    const alvo = e.closest('label') && e.type === 'checkbox' ? e.closest('label') : e;
    const cs = getComputedStyle(alvo);
    const csE = getComputedStyle(e);
    const contorno = (x) => x.outlineStyle !== 'none' && parseFloat(x.outlineWidth) >= 2;
    return { papel, nome, tipo: e.type || '', visivel: contorno(cs) || contorno(csE) };
  });
}

async function fluxoTeclado(navegador, maria) {
  const c = { id: 'teclado-desktop-claro', largura: 1280, altura: 800, esquema: 'light', dia: DIAS[4] };
  const ctx = await contexto(navegador, c, maria);
  const page = await ctx.newPage();
  const passos = [];
  const tab = async (vezes = 1) => { for (let i = 0; i < vezes; i++) { await page.keyboard.press('Tab'); } };
  const registrar = async (acao) => { const d = await descrever(page); passos.push({ acao, ...d }); return d; };
  const ate = async (papelOuNome, limite = 40, acao = 'Tab') => {
    for (let i = 0; i < limite; i++) {
      await page.keyboard.press('Tab');
      const d = await registrar(acao);
      if (d.nome.includes(papelOuNome)) return d;
    }
    throw new Error('Teclado: não cheguei em "' + papelOuNome + '" em ' + limite + ' Tab');
  };

  try {
  await page.goto(FRONT + '/buscar');
  await page.getByRole('heading', { level: 1, name: 'Buscar' }).waitFor();
  await page.getByText(/recursos? encontrados?/).waitFor();

  await ate('Pular para o conteúdo');
  await page.keyboard.press('Enter');
  await registrar('Enter (pular para o conteúdo)');
  await ate('Tipo');
  await page.keyboard.type('Sala');
  await registrar('digitar "Sala" no seletor de tipo');
  await ate('Capacidade mínima');
  await page.keyboard.type('30');
  await ate('Início');
  await page.keyboard.type(digitosDoDia(c.dia));
  await page.keyboard.press('Tab');
  await page.keyboard.type('1000');
  await ate('Fim');
  await page.keyboard.type(digitosDoDia(c.dia));
  await page.keyboard.press('Tab');
  await page.keyboard.type('1200');
  await ate('Buscar');
  await page.keyboard.press('Enter');
  await page.getByText(/Recursos livres em/).waitFor();
  await registrar('Enter em Buscar');
  await foto(page, 'teclado-1-busca-com-foco');

  await ate('Reservar Sala 203');
  await foto(page, 'teclado-2-foco-no-reservar');
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { level: 1, name: 'Nova reserva' }).waitFor();
  await page.getByRole('group', { name: 'Salas' }).waitFor();
  await registrar('Enter em Reservar (abre a Nova reserva)');

  await ate('Título');
  await page.keyboard.type('Reunião de planejamento');
  await ate('Descrição');
  await page.keyboard.type('Pauta do semestre.');
  await foto(page, 'teclado-3-formulario-com-foco');
  const marcadoPorPadrao = await page.getByRole('checkbox', { name: /Sala 203/ }).isChecked();
  RELATORIO.notas.push({ estado: 'teclado', salaJaMarcadaVindaDaBusca: marcadoPorPadrao });
  await ate('Reservar', 40);
  await page.keyboard.press('Enter');
  await page.getByRole('status').filter({ hasText: /Reserva (aprovada|enviada)/ }).waitFor();
  const aposEnvio = await registrar('Enter em Reservar (envia)');
  RELATORIO.notas.push({ estado: 'teclado', focoDepoisDoEnvio: aposEnvio.nome.slice(0, 40) });
  await foto(page, 'teclado-4-confirmacao');
  await ate('Ver minhas reservas');
  await ate('Fazer outra reserva');

  } catch (e) {
    await page.screenshot({ path: path.join(SAIDA, 'teclado-FALHA.png') });
    const valores = await page.evaluate(() => [...document.querySelectorAll('input,select')].map((i) => (i.labels && i.labels[0] ? i.labels[0].textContent : i.id) + '=' + i.value));
    console.log('PASSOS ATE A FALHA:', passos.map((p) => p.acao + ' -> ' + p.nome).join(' | '));
    console.log('CAMPOS:', valores.join(' ; '));
    console.log('URL:', page.url());
    throw e;
  }
  RELATORIO.foco = passos;
  await ctx.close();
}

/** Contexto limpo, sem sessão injetada: o login é feito de verdade pela tela. */
async function contextoSemSessao(navegador, c) {
  return navegador.newContext({ viewport: { width: c.largura, height: c.altura }, colorScheme: c.esquema, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', deviceScaleFactor: 1 });
}
async function preencherEEnviar(page, email, senha) {
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/^Senha/).fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
function conferir(rotulo, ok, detalhe) {
  RELATORIO.notas.push({ estado: rotulo, ok, ...(detalhe ? { detalhe } : {}) });
  if (!ok) console.log('CONFERÊNCIA FALHOU:', rotulo, detalhe || '');
}

/** Login (T01): tela, validação local, credencial inválida, destino por perfil, volta à origem e sessão terminada. */
async function fluxoLogin(navegador, c, semente, indice) {
  const P = (nome) => `${c.id}-${nome}`;
  const maria = semente.usuarios.solicitante.email;
  const carlos = semente.usuarios.responsavel.email;

  // ---- a tela, campos em branco e credencial inválida (e-mail inexistente: não gasta tentativas de conta real)
  let ctx = await contextoSemSessao(navegador, c);
  let page = await ctx.newPage();
  await page.goto(FRONT + '/entrar');
  await page.getByRole('heading', { level: 1, name: 'Entrar' }).waitFor();
  conferir(P('titulo-da-pagina'), (await page.title()).includes('Entrar'), await page.title());
  await foto(page, P('login-1-tela'));
  await auditar(page, P('login-1-tela'));
  await semRolagemHorizontal(page, P('login'));

  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByText('Informe o e-mail.').waitFor();
  conferir(P('foco-no-email-em-branco'), await page.evaluate(() => document.activeElement && document.activeElement.id !== '' && document.activeElement.type === 'email'));
  await foto(page, P('login-2-em-branco'));
  await auditar(page, P('login-2-em-branco'));

  await page.getByLabel(/^Senha/).fill('qualquer-senha-errada');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await foto(page, P('login-3-senha-visivel'));
  await auditar(page, P('login-3-senha-visivel'));
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await page.getByLabel('E-mail').fill(`inexistente.${indice}@exemplo.test`);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('alert').waitFor();
  const texto = await page.getByRole('alert').innerText();
  conferir(P('recusa-sem-dizer-o-campo'), /e-?mail/i.test(texto) === /senha/i.test(texto), texto.replace(/\s+/g, ' '));
  conferir(P('foco-na-mensagem'), await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('role') === 'alert'));
  conferir(P('senha-apagada'), (await page.getByLabel(/^Senha/).inputValue()) === '');
  conferir(P('email-preservado'), (await page.getByLabel('E-mail').inputValue()) === `inexistente.${indice}@exemplo.test`);
  await foto(page, P('login-4-recusa'));
  await auditar(page, P('login-4-recusa'));
  await ctx.close();

  // ---- entrar de verdade: Solicitante e Responsável vão para a sua tela inicial
  for (const [perfil, email, senha, destino] of [['solicitante', maria, env.SOL_SENHA, '/buscar'], ['responsavel', carlos, env.RESP_SENHA, '/aprovacoes']]) {
    ctx = await contextoSemSessao(navegador, c);
    page = await ctx.newPage();
    await page.goto(FRONT + '/entrar');
    await preencherEEnviar(page, email, senha);
    await page.waitForURL('**' + destino);
    conferir(P('destino-' + perfil), new URL(page.url()).pathname === destino, page.url());
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.waitForTimeout(500);
    const focoDepoisDeEntrar = await descrever(page);
    conferir(P('foco-depois-de-entrar-' + perfil), focoDepoisDeEntrar.nome !== '(corpo da página)', focoDepoisDeEntrar.nome);
    if (perfil === 'solicitante') {
      await foto(page, P('login-5-entrou'));
      await auditar(page, P('login-5-entrou'));
    }
    await ctx.close();
  }

  // ---- volta à tela de origem com filtros: abrir /buscar?tipo=SALA sem sessão, entrar, voltar ao mesmo endereço
  ctx = await contextoSemSessao(navegador, c);
  page = await ctx.newPage();
  await page.goto(FRONT + '/buscar?tipo=SALA&capacidadeMinima=30');
  await page.getByRole('heading', { level: 1, name: 'Entrar' }).waitFor();
  conferir(P('protegida-leva-ao-login'), new URL(page.url()).pathname === '/entrar', page.url());
  await preencherEEnviar(page, maria, env.SOL_SENHA);
  await page.getByRole('heading', { level: 1, name: 'Buscar' }).waitFor();
  const u = new URL(page.url());
  conferir(P('volta-com-filtros'), u.pathname === '/buscar' && u.search === '?tipo=SALA&capacidadeMinima=30', page.url());

  // ---- sessão terminada: o token passa a ser recusado pela API (401) e a tela de login avisa
  await page.evaluate(() => {
    const s = JSON.parse(window.sessionStorage.getItem('sessao'));
    window.sessionStorage.setItem('sessao', JSON.stringify({ ...s, token: 'token-que-a-api-nao-conhece' }));
  });
  await page.reload();
  await page.getByText('Sua sessão terminou. Entre novamente.').waitFor();
  conferir(P('sessao-terminada-no-login'), new URL(page.url()).pathname === '/entrar', page.url());
  await foto(page, P('login-6-sessao-terminada'));
  await auditar(page, P('login-6-sessao-terminada'));
  await semRolagemHorizontal(page, P('login-sessao-terminada'));
  await ctx.close();
}

/** Login só pelo teclado: Tab até os campos, Enter envia, foco vai à mensagem na recusa. */
async function fluxoTecladoLogin(navegador) {
  const c = { id: 'teclado-login', largura: 1280, altura: 800, esquema: 'light' };
  const ctx = await contextoSemSessao(navegador, c);
  const page = await ctx.newPage();
  const passos = [];
  const registrar = async (acao) => { const d = await descrever(page); passos.push({ acao, ...d }); return d; };
  const ate = async (nome, limite = 12) => {
    for (let i = 0; i < limite; i++) {
      await page.keyboard.press('Tab');
      const d = await registrar('Tab');
      if (d.nome.includes(nome)) return d;
    }
    throw new Error('Teclado do login: não cheguei em "' + nome + '"');
  };
  await page.goto(FRONT + '/entrar');
  await page.getByRole('heading', { level: 1, name: 'Entrar' }).waitFor();
  await ate('E-mail');
  await page.keyboard.type('inexistente.teclado@exemplo.test');
  await ate('Senha');
  await page.keyboard.type('senha-errada-teclado');
  await ate('Mostrar senha');
  await ate('Entrar');
  await page.keyboard.press('Enter');
  await page.getByRole('alert').waitFor();
  await registrar('Enter em Entrar (recusa)');
  await foto(page, 'teclado-login-1-recusa');
  await ate('E-mail');
  await page.keyboard.press('Control+A');
  await page.keyboard.type(JSON.parse(fs.readFileSync(path.join(LOCAL, 'semente.json'), 'utf-8')).usuarios.solicitante.email);
  await ate('Senha');
  await page.keyboard.type(env.SOL_SENHA);
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { level: 1, name: 'Buscar' }).waitFor();
  await page.waitForTimeout(500);
  const depois = await registrar('Enter na senha (entra)');
  RELATORIO.notas.push({ estado: 'teclado-login', focoDepoisDeEntrar: depois.nome, ok: depois.nome !== '(corpo da página)' });
  RELATORIO.foco.push(...passos);
  await ctx.close();
}

(async () => {
  const navegador = await chromium.launch();
  const semente = JSON.parse(fs.readFileSync(path.join(LOCAL, 'semente.json'), 'utf-8'));
  if (SO === 'tudo' || SO === 'login') {
    for (const [i, c] of COMBOS.entries()) {
      console.log('login', c.id);
      await fluxoLogin(navegador, c, semente, i);
    }
    console.log('login teclado');
    await fluxoTecladoLogin(navegador);
    if (SO === 'login') {
      fs.writeFileSync(path.join(SAIDA, 'relatorio-login.json'), JSON.stringify(RELATORIO, null, 1));
      await navegador.close();
      const v = RELATORIO.axe.filter((a) => a.violacoes.length);
      console.log('estados auditados:', RELATORIO.axe.length, '| com violação:', v.length);
      for (const a of v) console.log(' -', a.estado, JSON.stringify(a.violacoes));
      const f = RELATORIO.notas.filter((n) => n.ok === false || n.semRolagemHorizontal === false);
      console.log('conferências:', RELATORIO.notas.length, '| falhas:', f.length);
      const semFoco = RELATORIO.foco.filter((p) => !p.visivel);
      console.log('paradas de Tab:', RELATORIO.foco.length, '| sem foco visível:', semFoco.length);
      for (const p of semFoco) console.log(' -', p.acao, '|', p.papel, '|', p.nome);
      return;
    }
  }
  const ids = { sala203: semente.recursos.sala203 };
  const maria = await entrar(semente.usuarios.solicitante.email, env.SOL_SENHA);
  const joao = await entrar(semente.usuarios.solicitante2.email, env.SOL_SENHA);
  if (SO === 'tudo' || SO === 'visual') {
    for (const c of COMBOS) {
      console.log('visual', c.id);
      await fluxoVisual(navegador, c, maria, joao, ids);
    }
  }
  if (SO === 'tudo' || SO === 'teclado') {
    console.log('teclado');
    await fluxoTeclado(navegador, maria);
  }
  fs.writeFileSync(path.join(SAIDA, 'relatorio.json'), JSON.stringify(RELATORIO, null, 1));
  await navegador.close();
  const comViolacao = RELATORIO.axe.filter((a) => a.violacoes.length);
  console.log('estados auditados:', RELATORIO.axe.length, '| com violação:', comViolacao.length);
  const incompletos = {};
  for (const a of RELATORIO.axe) for (const i of a.incompletas) incompletos[i.id] = (incompletos[i.id] || 0) + 1;
  console.log('verificações incompletas (axe não conseguiu decidir), por regra:', JSON.stringify(incompletos));
  for (const a of comViolacao) console.log(' -', a.estado, JSON.stringify(a.violacoes));
  const icone = RELATORIO.foco.filter((p) => !p.visivel && p.tipo === 'datetime-local');
  const semFoco = RELATORIO.foco.filter((p) => !p.visivel && p.tipo !== 'datetime-local');
  console.log('paradas de Tab:', RELATORIO.foco.length, '| sem foco visível:', semFoco.length, '| no ícone do calendário (anel do navegador, verificado por captura):', icone.length);
  for (const p of semFoco) console.log(' -', p.acao, '|', p.papel, '|', p.nome);
})().catch((e) => { console.error('FALHOU:', e.message.split('\n')[0]); process.exit(1); });
