import { somarDias } from '@/datas/fuso';
import { descreverDias } from '@/recursos/formatacao';

describe('descreverDias (1 = segunda ... 7 = domingo)', () => {
  it.each([
    [[1, 2, 3, 4, 5], 'de segunda a sexta'],
    [[1, 2, 3, 4, 5, 6, 7], 'todos os dias'],
    [[6, 7], 'sábado e domingo'],
    [[1, 3, 5], 'segunda, quarta e sexta'],
    [[2], 'só terça'],
    [[5, 1, 3, 2, 4], 'de segunda a sexta'],
    [[1, 1, 2, 2, 3], 'de segunda a quarta'],
    [[], ''],
    [[0, 8, 9], ''],
  ])('%j vira "%s"', (dias, esperado) => {
    expect(descreverDias(dias)).toBe(esperado);
  });
});

describe('somarDias (data e hora locais)', () => {
  it.each([
    ['2026-10-20T12:00', 14, '2026-11-03T12:00'],
    ['2026-12-25T08:30', 10, '2027-01-04T08:30'],
    ['2028-02-27T09:00', 2, '2028-02-29T09:00'],
    ['2026-10-20T12:00', 0, '2026-10-20T12:00'],
    ['2026-10-20T12:00', -20, '2026-09-30T12:00'],
  ])('%s mais %i dias é %s, com a mesma hora do relógio', (inicio, dias, esperado) => {
    expect(somarDias(inicio, dias)).toBe(esperado);
  });

  it('texto que não é data e hora volta como veio', () => {
    expect(somarDias('abc', 3)).toBe('abc');
  });
});
