import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { mensagemPara } from '@/erros/mensagens';
import type { Perfil } from '@/sessao/armazenamento';

interface Props {
  /** Perfis que veem a tela. Sem a lista, qualquer usuário com sessão vê. */
  perfis?: readonly Perfil[];
  children: ReactNode;
}

/**
 * Esconder a tela de quem não deve vê-la é conveniência de interface (ADR-004, plano mestre 10.3).
 * A segurança é do servidor: ele continua respondendo 403 a qualquer chamada proibida.
 */
export function RotaProtegida({ perfis, children }: Props) {
  const { sessao } = useSessao();
  const local = useLocation();

  if (!sessao) {
    return <Navigate to="/entrar" replace state={{ de: local.pathname + local.search }} />;
  }
  if (perfis && !perfis.includes(sessao.perfil)) {
    const { mensagem, acao } = mensagemPara('ACESSO_NEGADO');
    return (
      <section aria-labelledby="titulo-da-tela">
        <h1 id="titulo-da-tela">Acesso negado</h1>
        <div role="alert">
          <p>{mensagem}</p>
          <p>{acao}</p>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}
