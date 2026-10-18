import { TELAS, telasDoPerfil } from '@/rotas/telas';
import { matrizDeAcessoDaDocumentacao } from '@/test/documentacao';

const PERFIS = ['SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR'] as const;
const matriz = matrizDeAcessoDaDocumentacao();

describe('telas e perfis (docs/prd/navegacao-telas.md, seção 3)', () => {
  it('a documentação define as 11 telas', () => {
    expect([...matriz.keys()]).toEqual(['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']);
  });

  it('o código declara as mesmas telas da documentação', () => {
    expect(TELAS.map((t) => t.id)).toEqual([...matriz.keys()]);
  });

  it.each(PERFIS)('o perfil %s vê exatamente as telas que a matriz permite', (perfil) => {
    const esperadas = [...matriz.entries()].filter(([, acesso]) => acesso[perfil]).map(([id]) => id);

    expect(TELAS.filter((t) => t.perfis.includes(perfil)).map((t) => t.id)).toEqual(esperadas);
  });

  it('a navegação do perfil não inclui o login', () => {
    expect(telasDoPerfil('SOLICITANTE').map((t) => t.id)).not.toContain('T01');
  });
});
