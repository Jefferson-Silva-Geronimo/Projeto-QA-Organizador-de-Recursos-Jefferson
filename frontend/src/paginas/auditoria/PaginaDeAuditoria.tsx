import { useSearchParams } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import { useAuditoria, useHistoricoDaReserva } from '@/auditoria/consulta';
import { FiltrosDaAuditoria } from '@/paginas/auditoria/FiltrosDaAuditoria';
import { ListaDeEventos } from '@/paginas/auditoria/ListaDeEventos';
import {
  consultaDoFiltro,
  dentroDoPeriodo,
  enderecoDosFiltros,
  filtrosDoEndereco,
  reservaDoFiltro,
  type FiltrosDaAuditoria as Filtros,
} from '@/paginas/auditoria/parametros';
import estilosDaLista from '@/paginas/reservas/PaginaDeReservas.module.css';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 evento' : `${total} eventos`;
}

/**
 * Histórico de auditoria (T09, RF-10), só leitura. O Administrador consulta a auditoria completa; o Responsável, o
 * histórico de uma reserva, e o servidor recusa o que não é do perfil (ADR-004). Os filtros moram no endereço. A consulta
 * não é paginada nem filtra por período (L-03): o período é filtrado aqui, sobre a lista inteira que veio.
 */
export function PaginaDeAuditoria() {
  const { sessao } = useSessao();
  const administrador = sessao?.perfil === 'ADMINISTRADOR';
  const [params, setParams] = useSearchParams();
  const filtros = filtrosDoEndereco(params);
  const reserva = reservaDoFiltro(filtros);

  const auditoria = useAuditoria(consultaDoFiltro(filtros), administrador);
  const historico = useHistoricoDaReserva(administrador ? null : reserva);
  const consulta = administrador ? auditoria : historico;
  const pedirReserva = !administrador && reserva === null;

  const consultar = (novos: Filtros) => setParams(enderecoDosFiltros(novos));

  const eventos = (consulta.data ?? []).filter((e) => dentroDoPeriodo(e, filtros));

  return (
    <section aria-labelledby="titulo-da-tela" className={estilosDaLista.pagina}>
      <h1 id="titulo-da-tela">Histórico</h1>
      <FiltrosDaAuditoria administrador={administrador} valendo={filtros} aoConsultar={consultar} />
      {pedirReserva && <EstadoVazio titulo="Informe a reserva">Digite o número da reserva para ver o histórico dela.</EstadoVazio>}
      {!pedirReserva && (
        <>
          {consulta.isPending && <Carregando texto="Carregando histórico…" />}
          {consulta.isError && <ErroDaApi erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
          {consulta.data && (
            <>
              <p aria-live="polite" className={estilosDaLista.contagem}>
                {contagem(eventos.length)}
              </p>
              {eventos.length === 0 ? (
                <EstadoVazio titulo="Nada registrado">Nenhum evento encontrado com estes filtros.</EstadoVazio>
              ) : (
                <ListaDeEventos eventos={eventos} />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
