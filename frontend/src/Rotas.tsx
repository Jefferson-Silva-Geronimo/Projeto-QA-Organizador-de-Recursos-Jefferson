import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { Estrutura } from '@/layout/Estrutura';
import { NaoEncontrada } from '@/paginas/NaoEncontrada';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { PaginaDeEntrada } from '@/paginas/entrada/PaginaDeEntrada';
import { PaginaDeTela } from '@/paginas/PaginaDeTela';
import { PaginaDeNovaReserva } from '@/paginas/reserva/PaginaDeNovaReserva';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { destinoDepoisDoLogin } from '@/rotas/destino';
import { rotaInicial } from '@/rotas/navegacao';
import { RotaProtegida } from '@/rotas/RotaProtegida';
import { TELAS, type Tela } from '@/rotas/telas';

/** Telas já construídas (prototipo da etapa 6.C). As demais seguem como marcador de lugar até a aprovação do padrão. */
function ConteudoDaTela({ tela }: { tela: Tela }) {
  if (tela.id === 'T02') return <PaginaDeBusca />;
  if (tela.id === 'T03') return <PaginaDeNovaReserva />;
  if (tela.id === 'T04') return <PaginaDeReservas />;
  return <PaginaDeTela tela={tela} />;
}

/** Tela de entrada. Com sessão, segue para a tela de origem (validada) ou a inicial do perfil. */
function Entrar() {
  const { sessao } = useSessao();
  const local = useLocation();
  if (sessao) {
    return <Navigate to={destinoDepoisDoLogin(local.state, sessao.perfil)} replace />;
  }
  return <PaginaDeEntrada />;
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
  const { pathname } = useLocation();

  // Título da página: o leitor de tela o anuncia ao trocar de tela (WCAG 2.4.2).
  useEffect(() => {
    if (pathname === '/') return;
    const tela = TELAS.find((t) => t.caminho === pathname);
    document.title = `${tela?.rotulo ?? 'Página não encontrada'} · Organização de Recursos`;
  }, [pathname]);

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
