import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Lê a tabela da seção 5.1 de navegacao-telas.md. Só para testes: liga a documentação ao código. */
export function tabelaDeErrosDaDocumentacao(): Map<string, { http: number; mensagem: string; acao: string }> {
  const texto = readFileSync(resolve(__dirname, '../../../docs/prd/navegacao-telas.md'), 'utf-8').replace(/\r\n/g, '\n');
  const inicio = texto.indexOf('### 5.1');
  const fim = texto.indexOf('### 5.2');
  const tabela = new Map<string, { http: number; mensagem: string; acao: string }>();
  for (const linha of texto.slice(inicio, fim).split('\n')) {
    const celulas = linha.split('|').map((c) => c.trim());
    const codigo = celulas[1];
    if (celulas.length >= 6 && codigo && /^[A-Z_]{5,}$/.test(codigo)) {
      tabela.set(codigo, { http: Number(celulas[2]), mensagem: celulas[3] ?? '', acao: celulas[4] ?? '' });
    }
  }
  return tabela;
}

/** Lê a tabela da seção 5.2 (situações sem código do servidor), indexada pelo início da descrição. */
export function situacoesSemCodigoDaDocumentacao(): { situacao: string; mensagem: string; acao: string }[] {
  const texto = readFileSync(resolve(__dirname, '../../../docs/prd/navegacao-telas.md'), 'utf-8').replace(/\r\n/g, '\n');
  const inicio = texto.indexOf('### 5.2');
  const fim = texto.indexOf('\n## 6.', inicio);
  const linhas: { situacao: string; mensagem: string; acao: string }[] = [];
  for (const linha of texto.slice(inicio, fim).split('\n')) {
    const celulas = linha.split('|').map((c) => c.trim());
    if (celulas.length >= 5 && celulas[1] && !celulas[1].startsWith('---') && celulas[1] !== 'Situação') {
      linhas.push({ situacao: celulas[1], mensagem: celulas[2] ?? '', acao: celulas[3] ?? '' });
    }
  }
  return linhas;
}
