import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { FUSO_DO_CAMPUS, localParaIsoComOffset } from '@/datas/fuso';
import estilos from '@/paginas/reserva/PaginaDeNovaReserva.module.css';
import { ReservaCriada } from '@/paginas/reserva/ReservaCriada';
import { SeletorDeRecursos } from '@/paginas/reserva/SeletorDeRecursos';
import { useRecursos, type Recurso } from '@/recursos/consulta';
import { useCriarReserva, type NovaReserva } from '@/reservas/criar';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

/** Valores com que o formulário abre: os que vieram da Busca no endereço, ou vazios. */
export interface Inicial {
  inicio: string;
  fim: string;
  recursos: number[];
}

export const VAZIO: Inicial = { inicio: '', fim: '', recursos: [] };

interface Props {
  inicial: Inicial;
  aoFazerOutra: () => void;
}

export function Formulario({ inicial, aoFazerOutra }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [inicio, setInicio] = useState(inicial.inicio);
  const [fim, setFim] = useState(inicial.fim);
  const [escolhidos, setEscolhidos] = useState<ReadonlySet<number>>(() => new Set(inicial.recursos));
  const criar = useCriarReserva();
  // Recursos como estavam no envio: depois da reserva a lista é refeita e o que foi reservado deixa de estar livre.
  const [enviados, setEnviados] = useState<Recurso[]>([]);
  const alerta = useRef<HTMLDivElement>(null);
  const idErroRecursos = useId();

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (criar.isError) {
      alerta.current?.focus();
    }
  }, [criar.isError, criar.submittedAt]);

  // Campos que o servidor não aceitou. Nome de campo desconhecido é ignorado.
  const recusados =
    criar.error instanceof ErroDeApi && criar.error.problema.code === 'VALIDACAO_FALHOU'
      ? new Set(criar.error.problema.campos)
      : new Set<string>();
  const erroDoCampo = (campo: string, mensagem: string) => (recusados.has(campo) ? mensagem : undefined);

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
    if (criar.isPending || !inicioIso || !fimIso) {
      return;
    }
    const corpo: NovaReserva = {
      titulo: titulo.trim(),
      inicio: inicioIso,
      fim: fimIso,
      recursoIds: [...marcados].sort((a, b) => a - b),
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
    };
    setEnviados((livres.data ?? []).filter((recurso) => marcados.has(recurso.id)));
    criar.mutate(corpo);
  };

  if (criar.isSuccess) {
    return <ReservaCriada reserva={criar.data} recursos={enviados} aoFazerOutra={aoFazerOutra} />;
  }

  return (
    <form onSubmit={enviar} noValidate className={estilos.formulario}>
      {criar.isError && <ErroDaApi erro={criar.error} ref={alerta} />}
      <fieldset className={estilos.bloco}>
        <legend className={estilos.legenda}>Quando</legend>
        <div className={estilos.duplo}>
          <Campo rotulo="Início" obrigatorio erro={erroDoCampo('inicio', 'Informe o início.')}>
            {(c) => <input {...c} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />}
          </Campo>
          <Campo rotulo="Fim" obrigatorio erro={erroDoCampo('fim', 'Informe o fim.')}>
            {(c) => <input {...c} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />}
          </Campo>
        </div>
      </fieldset>

      <fieldset
        className={estilos.bloco}
        aria-describedby={recusados.has('recursoIds') ? idErroRecursos : undefined}
      >
        <legend className={estilos.legenda}>Recursos livres no período</legend>
        {recusados.has('recursoIds') && (
          <p id={idErroRecursos} className={estilos.erroDoGrupo}>
            Escolha ao menos um recurso.
          </p>
        )}
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
            Um recurso que você tinha escolhido não está livre nesse período e foi desmarcado. Escolha outro horário
            ou outro recurso.
          </Aviso>
        )}
        {livres.isSuccess && livres.data.length > 0 && (
          <SeletorDeRecursos recursos={livres.data} marcados={marcados} aoAlternar={alternar} />
        )}
      </fieldset>

      <fieldset className={estilos.bloco}>
        <legend className={estilos.legenda}>Detalhes</legend>
        <Campo rotulo="Título" obrigatorio erro={erroDoCampo('titulo', 'Informe o título.')}>
          {(c) => <input {...c} type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />}
        </Campo>
        <Campo rotulo="Descrição" erro={erroDoCampo('descricao', 'A descrição não foi aceita.')}>
          {(c) => <textarea {...c} value={descricao} onChange={(e) => setDescricao(e.target.value)} />}
        </Campo>
      </fieldset>

      <div className={estilos.acoes}>
        <Botao type="submit" carregando={criar.isPending} textoCarregando="Reservando…">
          Reservar
        </Botao>
      </div>
    </form>
  );
}
