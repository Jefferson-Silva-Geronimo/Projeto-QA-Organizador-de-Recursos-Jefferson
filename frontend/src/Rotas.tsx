import { Navigate, Route, Routes } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { Estrutura } from '@/layout/Estrutura';
import { NaoEncontrada } from '@/paginas/NaoEncontrada';
import { PaginaDeTela } from '@/paginas/PaginaDeTela';
import { rotaInicial } from '@/rotas/navegacao';
import { RotaProtegida } from '@/rotas/RotaProtegida';
import { TELAS } from '@/rotas/telas';

function Entrar() {
  const { sessao } = useSessao();
  if (sessao) {
    return <Navigate to={rotaInicial(sessao.perfil)} replace />;
  }
  const [login] = TELAS;
  return login ? <PaginaDeTela tela={login} /> : null;
}

function Raiz() {
  const { sessao } = useSessao();
  return <Navigate to={sessao ? rotaInicial(sessao.perfil) : '/entrar'} replace />;
}

/**
 * Mapa de rotas por perfil (F6-08). Esconder uma tela é conveniência: o servidor recusa com 403
 * qualquer chamada proibida (ADR-004).
 */
export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />
      <Route
        element={
          <RotaProtegida>
            <Estrutura />
          </RotaProtegida>
        }
      >
        <Route path="/" element={<Raiz />} />
        {TELAS.filter((t) => t.id !== 'T01').map((tela) => (
          <Route
            key={tela.id}
            path={tela.caminho}
            element={
              <RotaProtegida perfis={tela.perfis}>
                <PaginaDeTela tela={tela} />
              </RotaProtegida>
            }
          />
        ))}
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
