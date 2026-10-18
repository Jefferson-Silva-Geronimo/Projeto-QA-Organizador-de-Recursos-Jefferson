import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

describe('mitigações do ADR-015 para o token no sessionStorage', () => {
  const raiz = resolve(__dirname, '..');
  const apoioDeTeste = join(raiz, 'test');
  // Código de produção: sem testes e sem o apoio de teste (src/test), que só limpa o armazenamento entre testes.
  const codigo = arquivos(raiz).filter(
    (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f) && !f.startsWith(apoioDeTeste),
  );

  it('só o módulo de sessão acessa o sessionStorage', () => {
    const infratores = codigo
      .filter((f) => readFileSync(f, 'utf-8').includes('sessionStorage'))
      .map((f) => relative(raiz, f).split(sep).join('/'));

    expect(infratores).toEqual(['sessao/armazenamento.ts']);
  });

  it('nenhum código de produção injeta HTML', () => {
    const infratores = codigo.filter((f) => readFileSync(f, 'utf-8').includes('dangerouslySetInnerHTML'));

    expect(infratores).toEqual([]);
  });
});
