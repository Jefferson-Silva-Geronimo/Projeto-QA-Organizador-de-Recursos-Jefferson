import { razaoDeContraste } from '@/estilo/contraste';

describe('razaoDeContraste', () => {
  it('preto sobre branco é 21:1', () => {
    expect(razaoDeContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('cor igual a si mesma é 1:1', () => {
    expect(razaoDeContraste('#6D28D9', '#6D28D9')).toBeCloseTo(1, 5);
  });

  it('não depende da ordem das cores', () => {
    expect(razaoDeContraste('#6D28D9', '#FFFFFF')).toBeCloseTo(razaoDeContraste('#FFFFFF', '#6D28D9'), 10);
  });

  it('cinza #767676 sobre branco é 4,54:1, o menor cinza que passa AA para texto', () => {
    expect(razaoDeContraste('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
  });

  it('aceita minúsculas e a forma abreviada', () => {
    expect(razaoDeContraste('#fff', '#000')).toBeCloseTo(21, 5);
  });
});
