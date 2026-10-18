import { distribuirNoCelular, MAXIMO_NA_BARRA, rotaInicial } from '@/rotas/navegacao';
import { TELAS, telasDoPerfil, type Tela } from '@/rotas/telas';

const ids = (telas: Tela[]) => telas.map((t) => t.id);
const algumas = (quantas: number) => TELAS.slice(1, 1 + quantas) as Tela[];

describe('distribuirNoCelular (F6-08: no máximo 4 itens na barra e "Mais" com o resto)', () => {
  it('o máximo da barra é 4', () => {
    expect(MAXIMO_NA_BARRA).toBe(4);
  });

  it.each([
    [3, 3, 0],
    [4, 4, 0],
    [5, 4, 1],
    [6, 4, 2],
    [10, 4, 6],
  ])('com %i telas: %i na barra e %i em "Mais"', (total, naBarra, emMais) => {
    const barra = distribuirNoCelular(algumas(total));

    expect(barra.principais).toHaveLength(naBarra);
    expect(barra.mais).toHaveLength(emMais);
  });

  it('mantém a ordem e não perde nem repete nenhuma tela', () => {
    const entrada = algumas(7);

    const barra = distribuirNoCelular(entrada);

    expect(ids([...barra.principais, ...barra.mais])).toEqual(ids(entrada));
  });

  it.each([
    ['SOLICITANTE', 4, 0],
    ['RESPONSAVEL', 4, 4],
    ['ADMINISTRADOR', 4, 3],
  ] as const)('o perfil %s tem %i na barra e %i em "Mais"', (perfil, naBarra, emMais) => {
    const barra = distribuirNoCelular(telasDoPerfil(perfil));

    expect(barra.principais).toHaveLength(naBarra);
    expect(barra.mais).toHaveLength(emMais);
  });
});

describe('rotaInicial', () => {
  it.each([
    ['SOLICITANTE', '/buscar'],
    ['RESPONSAVEL', '/aprovacoes'],
    ['ADMINISTRADOR', '/catalogo'],
  ] as const)('o perfil %s começa em %s', (perfil, rota) => {
    expect(rotaInicial(perfil)).toBe(rota);
  });

  it.each(['SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR'] as const)(
    'a rota inicial de %s é uma tela a que o perfil tem acesso',
    (perfil) => {
      expect(telasDoPerfil(perfil).map((t) => t.caminho)).toContain(rotaInicial(perfil));
    },
  );
});
