import { destinoDepoisDoLogin } from '@/rotas/destino';

describe('destinoDepoisDoLogin (a tela que a pessoa tentava abrir, ou a inicial do perfil)', () => {
  it('sem tela de origem, vai para a tela inicial de cada perfil', () => {
    expect(destinoDepoisDoLogin(undefined, 'SOLICITANTE')).toBe('/buscar');
    expect(destinoDepoisDoLogin(null, 'RESPONSAVEL')).toBe('/aprovacoes');
    expect(destinoDepoisDoLogin({}, 'ADMINISTRADOR')).toBe('/catalogo');
  });

  it.each([
    ['/reservas/nova', '/reservas/nova'],
    ['/reservas/nova?recursos=1&inicio=2026-10-21T14%3A00', '/reservas/nova?recursos=1&inicio=2026-10-21T14%3A00'],
    ['/buscar?tipo=SALA', '/buscar?tipo=SALA'],
    ['/reservas', '/reservas'],
  ])('volta para %s, com os filtros do endereço', (de, esperado) => {
    expect(destinoDepoisDoLogin({ de }, 'SOLICITANTE')).toBe(esperado);
  });

  it.each([
    ['https://exemplo-malicioso.test/'],
    ['//exemplo-malicioso.test/'],
    ['/\\exemplo-malicioso.test'],
    ['javascript:alert(1)'],
    ['data:text/html,<script>1</script>'],
    ['reservas/nova'],
    [''],
    ['   '],
  ])('endereço que não é interno ("%s") é ignorado: não há redirecionamento aberto', (de) => {
    expect(destinoDepoisDoLogin({ de }, 'SOLICITANTE')).toBe('/buscar');
  });

  it.each([[42], [true], [['/buscar']], [{ a: 1 }], [null]])('origem que não é texto (%j) é ignorada', (de) => {
    expect(destinoDepoisDoLogin({ de }, 'RESPONSAVEL')).toBe('/aprovacoes');
  });

  it.each([['/entrar'], ['/entrar?x=1'], ['/']])('"%s" não é destino (evita laço e raiz): vai para a tela inicial', (de) => {
    expect(destinoDepoisDoLogin({ de }, 'SOLICITANTE')).toBe('/buscar');
  });

  it('tela que o perfil não vê vai para a tela inicial, e não para um "acesso negado"', () => {
    expect(destinoDepoisDoLogin({ de: '/usuarios' }, 'SOLICITANTE')).toBe('/buscar');
    expect(destinoDepoisDoLogin({ de: '/reservas/nova' }, 'ADMINISTRADOR')).toBe('/catalogo');
    expect(destinoDepoisDoLogin({ de: '/aprovacoes' }, 'SOLICITANTE')).toBe('/buscar');
  });

  it('endereço que não existe vai para a tela inicial', () => {
    expect(destinoDepoisDoLogin({ de: '/nao-existe' }, 'RESPONSAVEL')).toBe('/aprovacoes');
  });

  it('o perfil que vê a tela volta para ela', () => {
    expect(destinoDepoisDoLogin({ de: '/aprovacoes' }, 'RESPONSAVEL')).toBe('/aprovacoes');
    expect(destinoDepoisDoLogin({ de: '/usuarios?x=1' }, 'ADMINISTRADOR')).toBe('/usuarios?x=1');
  });
});
