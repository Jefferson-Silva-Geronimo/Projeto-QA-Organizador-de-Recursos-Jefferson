import { aplicarTemaGuardado, escolherTema, lerEscolhaDeTema } from '@/estilo/tema';
import { vi } from 'vitest';

const raiz = () => document.documentElement;

describe('tema (claro, escuro ou o do sistema)', () => {
  afterEach(() => {
    raiz().removeAttribute('data-tema');
  });

  it('escolher escuro marca o documento e a escolha é lida de volta', () => {
    escolherTema('escuro');

    expect(raiz().getAttribute('data-tema')).toBe('escuro');
    expect(lerEscolhaDeTema()).toBe('escuro');
  });

  it('sistema devolve o controle ao prefers-color-scheme: sem atributo no documento', () => {
    escolherTema('escuro');

    escolherTema('sistema');

    expect(raiz().hasAttribute('data-tema')).toBe(false);
    expect(lerEscolhaDeTema()).toBe('sistema');
  });

  it('sem escolha guardada o tema é o do sistema', () => {
    expect(lerEscolhaDeTema()).toBe('sistema');
  });

  it('valor guardado fora do esperado é ignorado', () => {
    window.localStorage.setItem('tema', 'roxo');

    expect(lerEscolhaDeTema()).toBe('sistema');
  });

  it('ao abrir a página a escolha guardada é aplicada ao documento', () => {
    window.localStorage.setItem('tema', 'claro');

    aplicarTemaGuardado();

    expect(raiz().getAttribute('data-tema')).toBe('claro');
  });

  it('só a escolha é guardada, sem nenhum outro dado', () => {
    escolherTema('claro');

    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem('tema')).toBe('claro');
  });

  it('armazenamento indisponível não derruba a troca de tema', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });

    expect(() => escolherTema('escuro')).not.toThrow();
    expect(raiz().getAttribute('data-tema')).toBe('escuro');
    vi.restoreAllMocks();
  });
});

