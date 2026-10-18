import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lerTemasDeCor } from '@/test/tokens';

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

describe('regras dos temas (F6-09)', () => {
  const temas = lerTemasDeCor();

  it('o tema escuro pela preferência e pela escolha manual têm os mesmos valores', () => {
    expect(temas.escuroPelaEscolha).toEqual(temas.escuroPelaPreferencia);
  });

  it('o tema escuro redefine todos os tokens do tema claro, e só eles', () => {
    expect(Object.keys(temas.escuroPelaEscolha).sort()).toEqual(Object.keys(temas.claro).sort());
  });

  it('o tema claro define os 18 tokens usados pelos pares de contraste', () => {
    expect(Object.keys(temas.claro)).toHaveLength(18);
  });

  it('nenhuma cor fixa fora de tokens.css (componentes e telas usam var(--cor-*))', () => {
    const raiz = resolve(__dirname, '..');
    const fixas = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
    const infratores = arquivos(raiz)
      .filter((f) => /\.(css|ts|tsx)$/.test(f))
      .filter((f) => !/tokens\.css$|schema\.d\.ts$|\.test\.(ts|tsx)$/.test(f) && !f.startsWith(join(raiz, 'test')))
      .filter((f) => fixas.test(readFileSync(f, 'utf-8')));

    expect(infratores).toEqual([]);
  });
});
