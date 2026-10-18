import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FUSO_DO_CAMPUS, localParaIsoComOffset } from '@/datas/fuso';
import estilos from '@/paginas/reserva/PaginaDeNovaReserva.module.css';
import { SeletorDeRecursos } from '@/paginas/reserva/SeletorDeRecursos';
import { useRecursos } from '@/recursos/consulta';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

/**
 * Nova reserva (T03, RF-04, RF-05). O front junta os dados e envia; sobreposição, janela de funcionamento,
 * manutenção e aprovação são decididas pelo servidor, e o resultado volta como mensagem compreensível.
 */
export function PaginaDeNovaReserva() {
  const [params] = useSearchParams();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [inicio, setInicio] = useState(params.get('inicio') ?? '');
  const [fim, setFim] = useState(params.get('fim') ?? '');
  const [escolhidos, setEscolhidos] = useState<ReadonlySet<number>>(
    () => new Set(params.getAll('recursos').map(Number).filter(Number.isInteger)),
  );

  const inicioIso = localParaIsoComOffset(inicio, FUSO_DO_CAMPUS);
  const fimIso = localParaIsoComOffset(fim, FUSO_DO_CAMPUS);
  const periodoCompleto = inicioIso !== null && fimIso !== null;
  const livres = useRecursos({ inicio: inicioIso ?? undefined, fim: fimIso ?? undefined }, periodoCompleto);

  // Só vale a seleção que o servidor ainda mostra como livre neste período.
  const idsLivres = new Set((livres.data ?? []).map((r) => r.id));
  const marcados = new Set([...escolhidos].filter((id) => idsLivres.has(id)));
  const desmarcados = livres.isSuccess && [...escolhidos].some((id) => !idsLivres.has(id));

  const alternar = (id: number) =>
    setEscolhidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
  };

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Nova reserva</h1>
      <form onSubmit={enviar} noValidate className={estilos.formulario}>
        <fieldset className={estilos.bloco}>
          <legend className={estilos.legenda}>Quando</legend>
          <div className={estilos.duplo}>
            <Campo rotulo="Início" obrigatorio>
              {(c) => <input {...c} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />}
            </Campo>
            <Campo rotulo="Fim" obrigatorio>
              {(c) => <input {...c} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />}
            </Campo>
          </div>
        </fieldset>

        <fieldset className={estilos.bloco}>
          <legend className={estilos.legenda}>Recursos livres no período</legend>
          {!periodoCompleto && (
            <Aviso tipo="info">Informe o início e o fim para ver os recursos livres nesse período.</Aviso>
          )}
          {periodoCompleto && livres.isPending && <Carregando texto="Buscando recursos livres…" />}
          {livres.isError && <ErroDaApi erro={livres.error} aoTentarDeNovo={() => void livres.refetch()} />}
          {livres.isSuccess && livres.data.length === 0 && (
            <EstadoVazio titulo="Nenhum recurso livre neste período">Escolha outro horário.</EstadoVazio>
          )}
          {desmarcados && (
            <Aviso tipo="info">
              Um recurso que você tinha escolhido não está livre nesse período e foi desmarcado. Escolha outro
              horário ou outro recurso.
            </Aviso>
          )}
          {livres.isSuccess && livres.data.length > 0 && (
            <SeletorDeRecursos recursos={livres.data} marcados={marcados} aoAlternar={alternar} />
          )}
        </fieldset>

        <fieldset className={estilos.bloco}>
          <legend className={estilos.legenda}>Detalhes</legend>
          <Campo rotulo="Título" obrigatorio>
            {(c) => <input {...c} type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />}
          </Campo>
          <Campo rotulo="Descrição">
            {(c) => <textarea {...c} value={descricao} onChange={(e) => setDescricao(e.target.value)} />}
          </Campo>
        </fieldset>

        <div className={estilos.acoes}>
          <Botao type="submit">Reservar</Botao>
        </div>
      </form>
    </section>
  );
}
