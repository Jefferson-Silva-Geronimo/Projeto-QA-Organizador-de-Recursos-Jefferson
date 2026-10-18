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
