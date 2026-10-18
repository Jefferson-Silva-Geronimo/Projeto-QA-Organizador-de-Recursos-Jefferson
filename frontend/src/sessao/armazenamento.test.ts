import { guardarSessao, lerSessao, limparSessao, type Sessao } from '@/sessao/armazenamento';
import { vi } from 'vitest';

const AGORA = new Date('2026-10-18T12:00:00Z');
const sessao: Sessao = { token: 'token-de-teste', perfil: 'SOLICITANTE', expiraEm: '2026-10-18T13:00:00Z' };

describe('sessão', () => {
  it('lê a mesma sessão que foi guardada', () => {
    guardarSessao(sessao);

    expect(lerSessao(AGORA)).toEqual(sessao);
  });

  it('sem nada guardado não há sessão', () => {
    expect(lerSessao(AGORA)).toBeNull();
  });

  it('o token fica só no sessionStorage, nunca no localStorage', () => {
    guardarSessao(sessao);

    expect(window.sessionStorage.length).toBe(1);
    expect(window.localStorage.length).toBe(0);
  });

  it('valor corrompido vira "sem sessão" e é apagado', () => {
    window.sessionStorage.setItem('sessao', '{isto não é json');

    expect(() => lerSessao(AGORA)).not.toThrow();
    expect(lerSessao(AGORA)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('valor com formato inesperado vira "sem sessão" e é apagado', () => {
    window.sessionStorage.setItem('sessao', JSON.stringify({ token: 42 }));

    expect(lerSessao(AGORA)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('sessão expirada vira "sem sessão" e é apagada (o servidor continua decidindo)', () => {
    guardarSessao({ ...sessao, expiraEm: '2026-10-18T11:59:59Z' });

    expect(lerSessao(AGORA)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('no instante exato da expiração a sessão já não vale', () => {
    guardarSessao({ ...sessao, expiraEm: AGORA.toISOString() });

    expect(lerSessao(AGORA)).toBeNull();
  });

  it('um segundo antes de expirar a sessão ainda vale', () => {
    guardarSessao({ ...sessao, expiraEm: '2026-10-18T12:00:01Z' });

    expect(lerSessao(AGORA)).not.toBeNull();
  });

  it('limparSessao apaga o token', () => {
    guardarSessao(sessao);

    limparSessao();

    expect(lerSessao(AGORA)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });
});

describe('armazenamento indisponível (modo privado, dados bloqueados)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a sessão continua funcionando na memória da aba e nada lança', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });

    expect(() => guardarSessao(sessao)).not.toThrow();
    expect(lerSessao(AGORA)).toEqual(sessao);
  });
});

