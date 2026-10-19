import { Link, useParams } from 'react-router-dom';
import { isoParaLocal, FUSO_DO_CAMPUS } from '@/datas/fuso';
import { mensagemPara } from '@/erros/mensagens';
import { Formulario } from '@/paginas/reserva/FormularioDeReserva';
import estilos from '@/paginas/reserva/PaginaDeNovaReserva.module.css';
import { useReserva } from '@/reservas/consulta';
import { Aviso } from '@/ui/Aviso';
import botoes from '@/ui/Botao.module.css';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando } from '@/ui/Estados';

function VoltarAsReservas() {
  return (
    <Link to="/reservas" className={`${botoes.botao} ${botoes.secundario}`}>
      Voltar às reservas
    </Link>
  );
}

/** Endereço sem um número de reserva: é o mesmo caso de uma reserva que não existe. */
function ReservaInexistente() {
  const { mensagem, acao } = mensagemPara('NAO_ENCONTRADO');
  return (
    <>
      <Aviso tipo="erro">
        <p>{mensagem}</p>
        <p>{acao}</p>
      </Aviso>
      <VoltarAsReservas />
    </>
  );
}

function Alteracao({ id }: { id: number }) {
  const reserva = useReserva(id);
  if (reserva.isPending) {
    return <Carregando texto="Carregando reserva…" />;
  }
  if (reserva.isError) {
    return (
      <>
        <ErroDaApi erro={reserva.error} aoTentarDeNovo={() => void reserva.refetch()} />
        <VoltarAsReservas />
      </>
    );
  }
  const atual = reserva.data;
  return (
    <Formulario
      key={atual.id}
      alteracao={atual}
      inicial={{
        titulo: atual.titulo,
        descricao: atual.descricao ?? '',
        inicio: isoParaLocal(atual.inicio, FUSO_DO_CAMPUS),
        fim: isoParaLocal(atual.fim, FUSO_DO_CAMPUS),
        recursos: atual.recursoIds,
      }}
    />
  );
}

/**
 * Alterar reserva (T03, RF-04, RN-19). Abre o mesmo formulário da Nova reserva com os dados atuais. Quem pode alterar,
 * em que estado e até quando é decisão do servidor: a recusa volta como mensagem da tabela de erros.
 */
export function PaginaDeAlteracao() {
  const { id } = useParams();
  const numero = Number(id);
  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Alterar reserva</h1>
      {Number.isInteger(numero) && numero > 0 ? <Alteracao id={numero} /> : <ReservaInexistente />}
    </section>
  );
}
