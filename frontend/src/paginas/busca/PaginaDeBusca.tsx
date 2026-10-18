import { useSearchParams } from 'react-router-dom';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import { CartaoDeRecurso } from '@/paginas/busca/CartaoDeRecurso';
import { FiltrosDeBusca } from '@/paginas/busca/FiltrosDeBusca';
import estilos from '@/paginas/busca/PaginaDeBusca.module.css';
import {
  consultaDosFiltros,
  enderecoDosFiltros,
  filtrosDoEndereco,
  type RascunhoDosFiltros,
} from '@/paginas/busca/parametros';
import { useRecursos } from '@/recursos/consulta';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 recurso encontrado' : `${total} recursos encontrados`;
}

/**
 * Busca de recursos (T02, RF-03). Os filtros moram no endereço, então voltar, recarregar e compartilhar o link
 * funcionam. A disponibilidade é decidida pelo servidor; o front só mostra o que vem.
 */
export function PaginaDeBusca() {
  const [params, setParams] = useSearchParams();
  const filtros = filtrosDoEndereco(params);
  const consultaAtual = consultaDosFiltros(filtros);
  const consulta = useRecursos(consultaAtual);
  const recursos = consulta.data ?? [];

  const buscar = (novos: RascunhoDosFiltros) => setParams(enderecoDosFiltros(novos));

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Buscar</h1>
      <FiltrosDeBusca valendo={filtros} aoBuscar={buscar} />
      <p aria-live="polite" className={estilos.contagem}>
        {consulta.isSuccess ? contagem(recursos.length) : ''}
      </p>
      {consultaAtual.inicio && consultaAtual.fim && consulta.isSuccess && (
        <p className={estilos.periodo}>
          Recursos livres em {formatarIntervalo(consultaAtual.inicio, consultaAtual.fim, FUSO_DO_CAMPUS)}.
        </p>
      )}
      {consulta.isPending && <Carregando texto="Buscando recursos…" />}
      {consulta.isError && <ErroDaApi erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />}
      {consulta.isSuccess && recursos.length === 0 && (
        <EstadoVazio titulo="Nenhum recurso encontrado">
          Tente outro período, outro tipo ou tire algum filtro.
        </EstadoVazio>
      )}
      <div className={estilos.grade}>
        {recursos.map((recurso) => (
          <CartaoDeRecurso key={recurso.id} recurso={recurso} />
        ))}
      </div>
    </section>
  );
}
