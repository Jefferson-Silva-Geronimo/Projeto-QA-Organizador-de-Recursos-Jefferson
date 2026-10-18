import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { criarCliente, ErroDeApi, executar } from '@/api/cliente';
import { Contexto } from '@/autenticacao/contexto';
import { interpretarProblema } from '@/erros/problema';
import { guardarSessao, lerSessao, type Sessao } from '@/sessao/armazenamento';

interface Props {
  baseUrl: string;
  fetch?: typeof fetch;
  children: ReactNode;
}

/** O contrato não marca campos de resposta como obrigatórios: valida na fronteira antes de confiar. */
function sessaoDoLogin(dados: { token?: string; perfil?: Sessao['perfil']; expiraEm?: string }): Sessao {
  if (!dados.token || !dados.perfil || !dados.expiraEm) {
    throw new ErroDeApi(interpretarProblema(200, null), false);
  }
  return { token: dados.token, perfil: dados.perfil, expiraEm: dados.expiraEm };
}

export function ProvedorDeSessao({ baseUrl, fetch: fetchFalso, children }: Props) {
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());
  const cliente = useMemo(() => criarCliente({ baseUrl, fetch: fetchFalso }), [baseUrl, fetchFalso]);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const dados = await executar(cliente.POST('/api/auth/login', { body: { email, senha } }));
      const nova = sessaoDoLogin(dados);
      guardarSessao(nova);
      setSessao(nova);
    },
    [cliente],
  );

  const sair = useCallback(async () => {}, []);

  const valor = useMemo(() => ({ sessao, cliente, entrar, sair }), [sessao, cliente, entrar, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
