import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { Estrutura } from '@/layout/Estrutura';
import { NaoEncontrada } from '@/paginas/NaoEncontrada';
import { PaginaDeAprovacoes } from '@/paginas/aprovacoes/PaginaDeAprovacoes';
import { PaginaDeBusca } from '@/paginas/busca/PaginaDeBusca';
import { PaginaDeBloqueios } from '@/paginas/bloqueios/PaginaDeBloqueios';
import { PaginaDoCatalogo } from '@/paginas/catalogo/PaginaDoCatalogo';
import { PaginaDeUsuarios } from '@/paginas/usuarios/PaginaDeUsuarios';
import { PaginaDeEntrada } from '@/paginas/entrada/PaginaDeEntrada';
import { PaginaDeTela } from '@/paginas/PaginaDeTela';
import { PaginaDeAlteracao } from '@/paginas/reserva/PaginaDeAlteracao';
import { PaginaDeNovaReserva } from '@/paginas/reserva/PaginaDeNovaReserva';
import { PaginaDeRelatorios } from '@/paginas/relatorios/PaginaDeRelatorios';
import { PaginaDeReservas } from '@/paginas/reservas/PaginaDeReservas';
import { PaginaDeRetiradas } from '@/paginas/retiradas/PaginaDeRetiradas';
import { destinoDepoisDoLogin } from '@/rotas/destino';
import { rotaInicial } from '@/rotas/navegacao';
import { RotaProtegida } from '@/rotas/RotaProtegida';
import { TELAS, type Tela } from '@/rotas/telas';

/** Telas já construídas (prototipo da etapa 6.C). As demais seguem como marcador de lugar até a aprovação do padrão. */
function ConteudoDaTela({ tela }: { tela: Tela }) {
  if (tela.id === 'T02') return <PaginaDeBusca />;
  if (tela.id === 'T03') return <PaginaDeNovaReserva />;
  if (tela.id === 'T04') return <PaginaDeReservas />;
  if (tela.id === 'T05') return <PaginaDeAprovacoes />;
  if (tela.id === 'T06') return <PaginaDeRetiradas />;
  if (tela.id === 'T08') return <PaginaDeBloqueios />;
  if (tela.id === 'T10') return <PaginaDeRelatorios />;
  if (tela.id === 'T07') return <PaginaDoCatalogo />;
  if (tela.id === 'T11') return <PaginaDeUsuarios />;
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

const ENDERECO_DA_ALTERACAO = /^\/reservas\/[^/]+\/alterar$/;

/** A alteração é parte da T03 (Nova reserva e alteração): quem vê uma, vê a outra. */
const PERFIS_DA_ALTERACAO = TELAS.find((t) => t.id === 'T03')?.perfis;

/**
 * Mapa de rotas por perfil (F6-08). Esconder uma tela é conveniência: o servidor recusa com 403
 * qualquer chamada proibida (ADR-004).
 */
export function Rotas() {
  const { pathname } = useLocation();
  const { sessao } = useSessao();
  const perfil = sessao?.perfil;

  // Título da página: o leitor de tela o anuncia ao trocar de tela (WCAG 2.4.2). Quem não pode ver a tela vê a
  // página de acesso negado, e a aba diz isso em vez de anunciar a tela negada (BUG-018).
  useEffect(() => {
    if (pathname === '/') return;
    const tela = TELAS.find((t) => t.caminho === pathname);
    const alteracao = ENDERECO_DA_ALTERACAO.test(pathname);
    const permitidos = alteracao ? PERFIS_DA_ALTERACAO : tela?.perfis;
    const negado = !!perfil && !!permitidos && !permitidos.includes(perfil);
    const rotulo = negado ? 'Acesso negado' : alteracao ? 'Alterar reserva' : (tela?.rotulo ?? 'Página não encontrada');
    document.title = `${rotulo} · Organização de Recursos`;
  }, [pathname, perfil]);

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
        <Route
          path="/reservas/:id/alterar"
          element={
            <RotaProtegida perfis={PERFIS_DA_ALTERACAO}>
              <PaginaDeAlteracao />
            </RotaProtegida>
          }
        />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
