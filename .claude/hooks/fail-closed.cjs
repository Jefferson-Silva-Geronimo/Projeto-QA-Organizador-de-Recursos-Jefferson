#!/usr/bin/env node
'use strict';

/**
 * Invólucro "falha fechada" do hook de autoridade de publicação (Constituição, Artigo II).
 * Em construção em TDD: por enquanto só entrega o comando canônico e sempre permite.
 */

/** Comando que vai em `.claude/settings.local.json`, para o hook PreToolUse de Bash. */
function comandoDoHook(script) {
  const raiz = '"$CLAUDE_PROJECT_DIR"';
  const alvo = script ? `"${script}"` : `${raiz}/.aiox-core/infrastructure/templates/grok-hooks/enforce-git-push-authority.cjs`;
  const invólucro = `${raiz}/.claude/hooks/fail-closed.cjs`;
  return (
    `node ${invólucro} ${alvo}; c=$?; ` +
    'if [ $c -ne 0 ] && [ $c -ne 2 ]; then echo "Hook de autoridade falhou (codigo $c): bloqueando por seguranca." >&2; exit 2; fi; exit $c'
  );
}

if (require.main === module) {
  process.exit(0);
}

module.exports = { comandoDoHook };
