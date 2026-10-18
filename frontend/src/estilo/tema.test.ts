import { escolherTema, lerEscolhaDeTema } from '@/estilo/tema';

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
});
