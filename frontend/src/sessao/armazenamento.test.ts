import { guardarSessao, lerSessao, type Sessao } from '@/sessao/armazenamento';

const AGORA = new Date('2026-10-18T12:00:00Z');
const sessao: Sessao = { token: 'token-de-teste', perfil: 'SOLICITANTE', expiraEm: '2026-10-18T13:00:00Z' };

describe('sessão', () => {
  it('lê a mesma sessão que foi guardada', () => {
    guardarSessao(sessao);

    expect(lerSessao(AGORA)).toEqual(sessao);
  });
});
