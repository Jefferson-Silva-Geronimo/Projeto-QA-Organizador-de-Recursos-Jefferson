import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { criarCliente, ErroDeApi, executar } from '@/api/cliente';
import { Contexto } from '@/autenticacao/contexto';
import { interpretarProblema } from '@/erros/problema';
import { guardarSessao, lerSessao, limparSessao, type Sessao } from '@/sessao/armazenamento';

interface Props {
  baseUrl: string;
  fetch?: typeof fetch;
  children: ReactNode;
}

/**
 * O contrato garante os três campos (F6-10). Um 200 sem eles não vem do servidor do contrato e nunca vira sessão:
 * é o único ponto em que o front confere a resposta em tempo de execução, porque dele depende a autenticação.
 */
function sessaoDoLogin(dados: { token?: string; perfil?: Sessao['perfil']; expiraEm?: string }): Sessao {
  if (!dados.token || !dados.perfil || !dados.expiraEm) {
    throw new ErroDeApi(interpretarProblema(200, null), false);
  }
  return { token: dados.token, perfil: dados.perfil, expiraEm: dados.expiraEm };
}

export function ProvedorDeSessao({ baseUrl, fetch: fetchFalso, children }: Props) {
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());
  const [sessaoExpirou, setSessaoExpirou] = useState(false);
  const cliente = useMemo(
    () => criarCliente({ baseUrl, fetch: fetchFalso, aoExpirarSessao: () => {
          setSessao(null);
          setSessaoExpirou(true);
        },
      }),
    [baseUrl, fetchFalso],
  );

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const dados = await executar(cliente.POST('/api/auth/login', { body: { email, senha } }));
      const nova = sessaoDoLogin(dados);
      guardarSessao(nova);
      setSessao(nova);
      setSessaoExpirou(false);
    },
    [cliente],
  );

  /** Revoga a sessão no servidor (ADR-004) e apaga a local, mesmo que o servidor não responda. */
  const sair = useCallback(async () => {
    try {
      // O contrato declara o cabeçalho como parâmetro; é o mesmo valor que o middleware do cliente envia.
      const token = lerSessao()?.token ?? '';
      await executar(cliente.POST('/api/auth/logout', { params: { header: { Authorization: `Bearer ${token}` } } }));
    } catch {
      // a sessão local é apagada de qualquer forma
    } finally {
      limparSessao();
      setSessao(null);
      setSessaoExpirou(false);
    }
  }, [cliente]);

  const valor = useMemo(
    () => ({ sessao, sessaoExpirou, cliente, entrar, sair }),
    [sessao, sessaoExpirou, cliente, entrar, sair],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
