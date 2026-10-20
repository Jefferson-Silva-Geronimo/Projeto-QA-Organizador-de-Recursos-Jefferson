#!/usr/bin/env node
'use strict';

/**
 * Invólucro "falha fechada" do hook de autoridade de publicação (Constituição, Artigo II).
 *
 * O Claude Code só bloqueia uma ferramenta quando o hook sai com 2; qualquer outro código (1 de um script que não
 * carrega, 127 de um node ausente, exceção, tempo esgotado) é erro "sem bloqueio" e deixa o comando passar. Este
 * invólucro roda o script do AIOX e só deixa o hook terminar de duas formas: 0 (permite) ou 2 (barra). Tudo o mais
 * vira 2, com o motivo em stderr.
 *
 * Uso: node fail-closed.cjs <script-do-hook>
 *
 * Não edita nem copia o script do AIOX (camada protegida): só o executa e olha como ele terminou.
 */

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

/** Abaixo dos 10 s que o Claude Code dá ao hook. Variável de ambiente só para o teste de tempo esgotado. */
const TEMPO_MS = Number(process.env.AIOX_HOOK_TEMPO_MS) || 8000;

/**
 * Comando que vai em `.claude/settings.local.json`, para o hook PreToolUse de Bash. A guarda de shell cobre o que o
 * invólucro não consegue cobrir sozinho: node ausente, NODE_OPTIONS inválido, invólucro ausente.
 */
function comandoDoHook(script) {
  const raiz = '"$CLAUDE_PROJECT_DIR"';
  const alvo = script
    ? `"${script}"`
    : `${raiz}/.aiox-core/infrastructure/templates/grok-hooks/enforce-git-push-authority.cjs`;
  const involucro = `${raiz}/.claude/hooks/fail-closed.cjs`;
  return (
    `node ${involucro} ${alvo}; c=$?; ` +
    'if [ $c -ne 0 ] && [ $c -ne 2 ]; then echo "Hook de autoridade falhou (codigo $c): bloqueando por seguranca." >&2; exit 2; fi; exit $c'
  );
}

function negar(motivo) {
  const razao = `Hook de autoridade nao concluiu (${motivo}). Bloqueando por seguranca (falha fechada); revise o hook antes de repetir.`;
  const payload = {
    decision: 'deny',
    reason: razao,
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: razao },
  };
  fs.writeSync(1, JSON.stringify(payload));
  fs.writeSync(2, razao);
  process.exit(2);
}

function main() {
  const alvo = process.argv[2];
  if (!alvo) {
    negar('sem o caminho do script');
  }
  let entrada = '';
  try {
    entrada = fs.readFileSync(0, 'utf8');
  } catch {
    entrada = '';
  }
  const r = spawnSync(process.execPath, [alvo], { input: entrada, encoding: 'utf8', timeout: TEMPO_MS, env: process.env });
  if (r.error) {
    negar(`${r.error.code || r.error.name}`);
  }
  if (r.signal) {
    negar(`encerrado por ${r.signal}`);
  }
  if (r.status === 0 || r.status === 2) {
    if (r.stdout) fs.writeSync(1, r.stdout);
    if (r.stderr) fs.writeSync(2, r.stderr);
    process.exit(r.status);
  }
  negar(`saiu com codigo ${r.status}`);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    negar(`erro no involucro: ${e && e.name}`);
  }
}

module.exports = { comandoDoHook };
