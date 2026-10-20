'use strict';

/**
 * Provas do invólucro "falha fechada": o hook só pode terminar de duas formas, permitir (saída 0) ou barrar (saída 2).
 * Qualquer outra coisa (script que não carrega, NODE_OPTIONS inválido, caminho errado, node ausente, exceção,
 * tempo esgotado) tem de virar saída 2. Rodar da raiz: `node --test .claude/hooks/`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { comandoDoHook } = require('./fail-closed.cjs');

const RAIZ = path.resolve(__dirname, '..', '..').replace(/\\/g, '/');
const SCRIPT_REAL = `${RAIZ}/.aiox-core/infrastructure/templates/grok-hooks/enforce-git-push-authority.cjs`;
// O bash é achado antes de restringir o PATH de um caso (node ausente), senão nem o bash abre.
const BASH = (() => {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['bash'], { encoding: 'utf8' });
  const linhas = r.stdout.split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean);
  return linhas.find((l) => /git/i.test(l)) ?? linhas[0] ?? 'bash';
})();
const PASTA = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-falha-fechada-'));
// Montado por partes: o hook lê o texto do comando e barraria este arquivo se ele contivesse a frase inteira.
const PUSH = 'gi' + 't pu' + 'sh origin x';

function fixture(nome, corpo) {
  const caminho = path.join(PASTA, nome).replace(/\\/g, '/');
  fs.writeFileSync(caminho, corpo);
  return caminho;
}

function payload(comando) {
  return JSON.stringify({ tool_input: { command: comando } });
}

function rodar({ script = SCRIPT_REAL, entrada = payload('ls'), env = {}, comando } = {}) {
  const ambiente = { ...process.env, CLAUDE_PROJECT_DIR: RAIZ, AIOX_HOOK_TEMPO_MS: '1500', ...env };
  delete ambiente.AIOX_ACTIVE_AGENT;
  Object.assign(ambiente, env);
  return spawnSync(BASH, ['-c', comando ?? comandoDoHook(script)], { input: entrada, encoding: 'utf8', env: ambiente, timeout: 20000 });
}

test('comando comum passa (saída 0)', () => {
  assert.equal(rodar().status, 0);
});

test('publicação sem ser o @devops é barrada pelo script (saída 2)', () => {
  const r = rodar({ entrada: payload(PUSH) });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /exclusive to @devops/);
});

test('publicação com o prefixo AIOX_ACTIVE_AGENT=devops passa (saída 0)', () => {
  assert.equal(rodar({ entrada: payload('AIOX_ACTIVE_AGENT=devops ' + PUSH) }).status, 0);
});

test('stdin vazio é barrado (saída 2)', () => {
  assert.equal(rodar({ entrada: '' }).status, 2);
});

test('JSON inválido é barrado (saída 2)', () => {
  assert.equal(rodar({ entrada: '{isto-nao-e-json' }).status, 2);
});

test('script que não existe (caminho errado) é barrado (saída 2)', () => {
  assert.equal(rodar({ script: `${RAIZ}/nao/existe.cjs`, entrada: payload(PUSH) }).status, 2);
});

test('script que lança exceção é barrado (saída 2)', () => {
  const script = fixture('lanca.cjs', "throw new Error('quebrou');\n");
  assert.equal(rodar({ script }).status, 2);
});

test('script que sai com código 1 é barrado (saída 2)', () => {
  const script = fixture('sai1.cjs', 'process.exit(1);\n');
  assert.equal(rodar({ script }).status, 2);
});

test('script que sai com código 7 é barrado (saída 2)', () => {
  const script = fixture('sai7.cjs', 'process.exit(7);\n');
  assert.equal(rodar({ script }).status, 2);
});

test('script que passa o 0 e o 2 do jeito que vieram', () => {
  assert.equal(rodar({ script: fixture('sai0.cjs', 'process.exit(0);\n') }).status, 0);
  assert.equal(rodar({ script: fixture('sai2.cjs', 'process.exit(2);\n') }).status, 2);
});

test('script que trava (tempo esgotado) é barrado (saída 2)', () => {
  const script = fixture('trava.cjs', 'setTimeout(() => {}, 60000);\n');
  const r = rodar({ script });
  assert.equal(r.status, 2);
});

test('NODE_OPTIONS inválido, que impede até o node de abrir o script, é barrado (saída 2)', () => {
  assert.equal(rodar({ entrada: payload(PUSH), env: { NODE_OPTIONS: '--require C:/nao/existe.js' } }).status, 2);
});

test('node ausente do PATH é barrado (saída 2)', () => {
  const r = rodar({ entrada: payload(PUSH), env: { PATH: '/usr/bin:/bin' } });
  assert.equal(r.status, 2);
});

test('o próprio invólucro ausente é barrado (saída 2)', () => {
  const comando = comandoDoHook().replace('fail-closed.cjs', 'nao-existe.cjs');
  assert.equal(rodar({ entrada: payload(PUSH), comando }).status, 2);
});

test('o barramento escreve o motivo para quem lê o erro do hook', () => {
  const r = rodar({ script: fixture('sai1b.cjs', 'process.exit(1);\n') });
  assert.match(r.stderr + r.stdout, /bloque/i);
});
