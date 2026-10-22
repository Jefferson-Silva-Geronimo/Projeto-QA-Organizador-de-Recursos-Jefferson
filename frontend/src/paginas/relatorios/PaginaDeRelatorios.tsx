import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import { FiltrosDoRelatorio } from '@/paginas/relatorios/FiltrosDoRelatorio';
import {
  consultaDoRelatorio,
  enderecoDosFiltros,
  filtrosDoEndereco,
  type RascunhoDoRelatorio,
} from '@/paginas/relatorios/parametros';
import estilos from '@/paginas/relatorios/PaginaDeRelatorios.module.css';
import { TabelaDoRelatorio } from '@/paginas/relatorios/TabelaDoRelatorio';
import estilosDaLista from '@/paginas/reservas/PaginaDeReservas.module.css';
import { useRelatorioDeUtilizacao } from '@/relatorios/consulta';
import { Botao } from '@/ui/Botao';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 recurso no relatório' : `${total} recursos no relatório`;
}

/**
 * Relatórios (T10, RF-12 e RN-31), só leitura. Os filtros moram no endereço, então voltar, recarregar e compartilhar o
 * link funcionam. Os números são os que o servidor calcula; o front os mostra e nunca os recalcula.
 */
export function PaginaDeRelatorios() {
  const [params, setParams] = useSearchParams();
  const filtros = filtrosDoEndereco(params);
  const consulta = consultaDoRelatorio(filtros);
  const relatorio = useRelatorioDeUtilizacao(consulta);
  const resultado = useRef<HTMLHeadingElement>(null);
  const focarNoResultado = useRef(false);

  const gerar = (novos: RascunhoDoRelatorio) => setParams(enderecoDosFiltros(novos));

  const irParaPagina = (pagina: number) => {
    focarNoResultado.current = true;
    setParams(enderecoDosFiltros({ ...filtros, pagina: String(pagina) }));
  };

  // Ao trocar de página o foco vai para o resultado, para o teclado não ficar num botão que mudou de lugar.
  useEffect(() => {
    if (focarNoResultado.current && relatorio.isSuccess && !relatorio.isPlaceholderData) {
      focarNoResultado.current = false;
      resultado.current?.focus();
    }
  }, [relatorio.isSuccess, relatorio.isPlaceholderData, relatorio.data]);

  const dados = relatorio.data;
  const totalDePaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.tamanho)) : 1;
  const paginaAtual = dados ? dados.pagina + 1 : 1;

  return (
    <section aria-labelledby="titulo-da-tela" className={estilosDaLista.pagina}>
      <h1 id="titulo-da-tela">Relatórios</h1>
      <FiltrosDoRelatorio valendo={filtros} aoGerar={gerar} />
      {consulta === null && (
        <EstadoVazio titulo="Informe o período">Escolha o início e o fim para gerar o relatório.</EstadoVazio>
      )}
      {consulta !== null && (
        <>
          <h2 ref={resultado} tabIndex={-1} className={estilos.resultado}>
            Resultado
          </h2>
          {relatorio.isPending && <Carregando texto="Gerando relatório…" />}
          {relatorio.isError && <ErroDaApi erro={relatorio.error} aoTentarDeNovo={() => void relatorio.refetch()} />}
          {dados && (
            <>
              <p aria-live="polite" className={estilosDaLista.contagem}>
                {contagem(dados.total)}
              </p>
              <p className={estilos.periodo}>Período: {formatarIntervalo(consulta.inicio, consulta.fim, FUSO_DO_CAMPUS)}</p>
              {dados.itens.length === 0 ? (
                <EstadoVazio titulo="Nada para mostrar">Nenhum recurso encontrado com estes filtros.</EstadoVazio>
              ) : (
                <TabelaDoRelatorio itens={dados.itens} />
              )}
              {totalDePaginas > 1 && (
                <nav aria-label="Páginas do relatório" className={estilos.paginacao}>
                  <Botao variante="secundario" disabled={paginaAtual <= 1} onClick={() => irParaPagina(paginaAtual - 1)}>
                    Anterior
                  </Botao>
                  <p aria-live="polite" className={estilos.pagina}>
                    Página {paginaAtual} de {totalDePaginas}
                  </p>
                  <Botao variante="secundario" disabled={paginaAtual >= totalDePaginas} onClick={() => irParaPagina(paginaAtual + 1)}>
                    Próxima
                  </Botao>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
