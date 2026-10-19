import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ErroDeApi } from '@/api/cliente';
import { FUSO_DO_CAMPUS, localParaIsoComOffset } from '@/datas/fuso';
import estilos from '@/paginas/reserva/PaginaDeNovaReserva.module.css';
import { ReservaCriada } from '@/paginas/reserva/ReservaCriada';
import { SeletorDeRecursos } from '@/paginas/reserva/SeletorDeRecursos';
import { useRecursos, type Recurso } from '@/recursos/consulta';
import { useRecursosDaReserva } from '@/reservas/consulta';
import { useAlterarReserva, useCriarReserva, type NovaReserva, type Reserva } from '@/reservas/criar';
import botoes from '@/ui/Botao.module.css';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

/** Valores com que o formulário abre: os da Busca no endereço, os da reserva que se altera, ou vazios. */
export interface Inicial {
  inicio: string;
  fim: string;
  recursos: number[];
  titulo?: string;
  descricao?: string;
}

export const VAZIO: Inicial = { inicio: '', fim: '', recursos: [] };

interface Props {
  inicial: Inicial;
  /** Só na Nova reserva: volta ao formulário vazio depois da confirmação. */
  aoFazerOutra?: () => void;
  /** Reserva que está sendo alterada. Sem ela, o formulário cria uma reserva nova. */
  alteracao?: Reserva;
}

/**
 * Formulário de reserva, o mesmo para criar e para alterar. O tratamento das recusas (conflito, janela, manutenção)
 * é um só: o servidor decide e a tela mostra a mensagem da tabela de erros.
 */
export function Formulario({ inicial, aoFazerOutra, alteracao }: Props) {
  const [titulo, setTitulo] = useState(inicial.titulo ?? '');
  const [descricao, setDescricao] = useState(inicial.descricao ?? '');
  const [inicio, setInicio] = useState(inicial.inicio);
  const [fim, setFim] = useState(inicial.fim);
  const [escolhidos, setEscolhidos] = useState<ReadonlySet<number>>(() => new Set(inicial.recursos));
  const criarReserva = useCriarReserva();
  const alterarReserva = useAlterarReserva(alteracao?.id);
  const envio = alteracao ? alterarReserva : criarReserva;
  const proprios = useRecursosDaReserva(alteracao?.recursoIds ?? []);
  // Recursos como estavam no envio: depois da reserva a lista é refeita e o que foi reservado deixa de estar livre.
  const [enviados, setEnviados] = useState<Recurso[]>([]);
  const alerta = useRef<HTMLDivElement>(null);
  const idErroRecursos = useId();

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (envio.isError) {
      alerta.current?.focus();
    }
  }, [envio.isError, envio.submittedAt]);

  // Campos que o servidor não aceitou. Nome de campo desconhecido é ignorado.
  const recusados =
    envio.error instanceof ErroDeApi && envio.error.problema.code === 'VALIDACAO_FALHOU'
      ? new Set(envio.error.problema.campos)
      : new Set<string>();
  const erroDoCampo = (campo: string, mensagem: string) => (recusados.has(campo) ? mensagem : undefined);

  const inicioIso = localParaIsoComOffset(inicio, FUSO_DO_CAMPUS);
  const fimIso = localParaIsoComOffset(fim, FUSO_DO_CAMPUS);
  const periodoCompleto = inicioIso !== null && fimIso !== null;
  const livres = useRecursos({ inicio: inicioIso ?? undefined, fim: fimIso ?? undefined }, periodoCompleto);

  // O que se pode escolher: o que o servidor mostra como livre neste período e, na alteração, os recursos da própria
  // reserva, que ela mesma ocupa e por isso o servidor não lista como livres.
  const candidatos = [...(livres.data ?? [])];
  for (const { recurso } of proprios) {
    if (recurso && !candidatos.some((c) => c.id === recurso.id)) candidatos.push(recurso);
  }
  const idsDisponiveis = new Set(candidatos.map((r) => r.id));
  const propriosProntos = proprios.every((p) => !p.carregando);
  // Só vale a seleção que ainda se pode escolher neste período.
  const marcados = new Set([...escolhidos].filter((id) => idsDisponiveis.has(id)));
  const desmarcados = livres.isSuccess && propriosProntos && [...escolhidos].some((id) => !idsDisponiveis.has(id));

  const alternar = (id: number) =>
    setEscolhidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (envio.isPending || !inicioIso || !fimIso) {
      return;
    }
    const corpo: NovaReserva = {
      titulo: titulo.trim(),
      inicio: inicioIso,
      fim: fimIso,
      recursoIds: [...marcados].sort((a, b) => a - b),
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
    };
    setEnviados(candidatos.filter((recurso) => marcados.has(recurso.id)));
    envio.mutate(corpo);
  };

  if (envio.isSuccess) {
    return <ReservaCriada reserva={envio.data} recursos={enviados} aoFazerOutra={aoFazerOutra} alterada={alteracao !== undefined} />;
  }

  return (
    <form onSubmit={enviar} noValidate className={estilos.formulario}>
      {envio.isError && <ErroDaApi erro={envio.error} ref={alerta} />}
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
        {livres.isSuccess && candidatos.length === 0 && (
          <EstadoVazio titulo="Nenhum recurso livre neste período">Escolha outro horário.</EstadoVazio>
        )}
        {desmarcados && (
          <Aviso tipo="info">
            Um recurso que você tinha escolhido não está livre nesse período e foi desmarcado. Escolha outro horário
            ou outro recurso.
          </Aviso>
        )}
        {candidatos.length > 0 && (
          <SeletorDeRecursos recursos={candidatos} marcados={marcados} aoAlternar={alternar} />
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
        <Botao
          type="submit"
          carregando={envio.isPending}
          textoCarregando={alteracao ? 'Salvando…' : 'Reservando…'}
        >
          {alteracao ? 'Salvar alterações' : 'Reservar'}
        </Botao>
        {alteracao && (
          <Link to="/reservas" className={`${botoes.botao} ${botoes.secundario}`}>
            Cancelar edição
          </Link>
        )}
      </div>
    </form>
  );
}
