import { Navigate, Route, Routes } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { Estrutura } from '@/layout/Estrutura';
import { NaoEncontrada } from '@/paginas/NaoEncontrada';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { PaginaDeTela } from '@/paginas/PaginaDeTela';
import { PaginaDeNovaReserva } from '@/paginas/reserva/PaginaDeNovaReserva';
import { rotaInicial } from '@/rotas/navegacao';
import { RotaProtegida } from '@/rotas/RotaProtegida';
import { TELAS, type Tela } from '@/rotas/telas';

/** Telas já construídas (prototipo da etapa 6.C). As demais seguem como marcador de lugar até a aprovação do padrão. */
function ConteudoDaTela({ tela }: { tela: Tela }) {
  if (tela.id === 'T02') return <PaginaDeBusca />;
  if (tela.id === 'T03') return <PaginaDeNovaReserva />;
  return <PaginaDeTela tela={tela} />;
}

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
                <ConteudoDaTela tela={tela} />
              </RotaProtegida>
            }
          />
        ))}
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
