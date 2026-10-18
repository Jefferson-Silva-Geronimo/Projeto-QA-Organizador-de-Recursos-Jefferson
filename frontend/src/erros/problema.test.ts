import { interpretarProblema } from '@/erros/problema';

describe('interpretarProblema', () => {
  it('lê status, code, itens e campos de um Problem Details do servidor', () => {
    const problema = interpretarProblema(409, {
      status: 409,
      code: 'BLOQUEIO_PENDE_CONFIRMACAO',
      itens: ['41', '44'],
      detail: 'texto cru que não deve ser guardado',
    });

    expect(problema).toEqual({ status: 409, code: 'BLOQUEIO_PENDE_CONFIRMACAO', itens: ['41', '44'], campos: [] });
  });
});

describe('interpretarProblema com corpo fora do formato', () => {
  it.each([
    ['nulo', null],
    ['texto', 'Internal Server Error'],
    ['lista', [1, 2]],
    ['code que não é texto', { code: 42 }],
    ['itens que não é lista', { code: 'X', itens: 'a' }],
  ])('corpo %s não quebra e não inventa código', (_nome, corpo) => {
    const problema = interpretarProblema(500, corpo);

    expect(problema.status).toBe(500);
    expect(problema.itens).toEqual([]);
    expect(problema.campos).toEqual([]);
    expect(typeof problema.code).toBe('string');
  });
});
