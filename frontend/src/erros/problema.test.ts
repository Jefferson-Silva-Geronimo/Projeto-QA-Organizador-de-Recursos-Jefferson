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
