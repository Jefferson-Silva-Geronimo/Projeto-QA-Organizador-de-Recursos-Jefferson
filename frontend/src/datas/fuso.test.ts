import { formatarHora, formatarIntervalo, isoParaLocal, localParaIsoComOffset } from '@/datas/fuso';

const SAO_PAULO = 'America/Sao_Paulo';

describe('localParaIsoComOffset (ADR-005: o campus escolhe a hora, o servidor recebe ISO-8601 com offset)', () => {
  it.each([
    ['2026-10-21T14:00', SAO_PAULO, '2026-10-21T14:00:00-03:00'],
    ['2026-12-31T23:59', SAO_PAULO, '2026-12-31T23:59:00-03:00'],
    ['2026-01-15T08:30', 'UTC', '2026-01-15T08:30:00+00:00'],
    ['2026-07-01T09:00', 'America/New_York', '2026-07-01T09:00:00-04:00'],
    ['2026-01-01T09:00', 'America/New_York', '2026-01-01T09:00:00-05:00'],
    // Trinca na virada do horário de verão de Nova York (08/03/2026, 02:00 vira 03:00): antes, no limite e depois.
    ['2026-03-08T01:59', 'America/New_York', '2026-03-08T01:59:00-05:00'],
    ['2026-03-08T03:00', 'America/New_York', '2026-03-08T03:00:00-04:00'],
    ['2026-03-08T03:01', 'America/New_York', '2026-03-08T03:01:00-04:00'],
  ])('%s em %s vira %s', (local, fuso, esperado) => {
    expect(localParaIsoComOffset(local, fuso)).toBe(esperado);
  });

  it('o instante resultante é o mesmo que o servidor calcula', () => {
    const iso = localParaIsoComOffset('2026-10-21T14:00', SAO_PAULO) as string;

    expect(new Date(iso).toISOString()).toBe('2026-10-21T17:00:00.000Z');
  });

  it('aceita segundos opcionais', () => {
    expect(localParaIsoComOffset('2026-10-21T14:00:30', SAO_PAULO)).toBe('2026-10-21T14:00:30-03:00');
  });

  it.each(['', '21/10/2026 14:00', '2026-10-21', '2026-13-40T25:61', 'abc'])('"%s" não é uma data e hora válida', (texto) => {
    expect(localParaIsoComOffset(texto, SAO_PAULO)).toBeNull();
  });
});

describe('isoParaLocal', () => {
  it('mostra o instante na hora do campus, no formato do campo de data e hora', () => {
    expect(isoParaLocal('2026-10-21T17:00:00Z', SAO_PAULO)).toBe('2026-10-21T14:00');
  });

  it('o ida e volta devolve o mesmo valor', () => {
    const iso = localParaIsoComOffset('2026-11-02T07:05', SAO_PAULO) as string;

    expect(isoParaLocal(iso, SAO_PAULO)).toBe('2026-11-02T07:05');
  });

  it('meia-noite do campus não vira "24:00"', () => {
    expect(isoParaLocal('2026-10-22T03:00:00Z', SAO_PAULO)).toBe('2026-10-22T00:00');
  });
});

describe('formatarIntervalo', () => {
  it('no mesmo dia mostra a data uma vez e as duas horas, no fuso do campus', () => {
    const texto = formatarIntervalo('2026-10-21T17:00:00Z', '2026-10-21T19:00:00Z', SAO_PAULO);

    expect(texto).toContain('21/10');
    expect(texto).toContain('14:00');
    expect(texto).toContain('16:00');
    expect(texto.match(/21\/10/g)).toHaveLength(1);
  });

  it('em dias diferentes mostra a data e a hora de cada ponta', () => {
    const texto = formatarIntervalo('2026-10-21T17:00:00Z', '2026-10-22T13:00:00Z', SAO_PAULO);

    expect(texto).toContain('21/10');
    expect(texto).toContain('22/10');
    expect(texto).toContain('10:00');
  });

  it('usa a hora do campus, não a do navegador', () => {
    expect(formatarIntervalo('2026-10-21T02:30:00Z', '2026-10-21T04:00:00Z', SAO_PAULO)).toContain('20/10');
  });
});

describe('formatarHora', () => {
  it.each([
    ['2026-10-21T17:02:00Z', SAO_PAULO, '14:02'],
    ['2026-10-21T02:05:00Z', SAO_PAULO, '23:05'],
    ['2026-10-21T03:00:00Z', SAO_PAULO, '00:00'],
    ['2026-07-01T13:30:00Z', 'America/New_York', '09:30'],
  ])('mostra só a hora e o minuto na hora do campus: %s em %s -> %s', (iso, fuso, esperado) => {
    expect(formatarHora(iso, fuso)).toBe(esperado);
  });
});
