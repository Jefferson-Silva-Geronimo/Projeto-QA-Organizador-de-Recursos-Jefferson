import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilos from '@/paginas/reserva/ReservaCriada.module.css';
import type { Recurso } from '@/recursos/consulta';
import type { Reserva } from '@/reservas/criar';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import botoes from '@/ui/Botao.module.css';

interface Props {
  reserva: Reserva;
  recursos: Recurso[];
  aoFazerOutra: () => void;
}

/** O texto vem do estado que o servidor devolveu. O front não decide se a reserva exigia aprovação. */
function titulo(estado: Reserva['estado'] | undefined): string {
  if (estado === 'APROVADA') return 'Reserva aprovada';
  if (estado === 'SOLICITADA') return 'Reserva enviada para aprovação';
  return 'Reserva registrada';
}

/** Confirmação da reserva. Recebe o foco ao aparecer, para o teclado e o leitor de tela não ficarem no vazio. */
export function ReservaCriada({ reserva, recursos, aoFazerOutra }: Props) {
  const aviso = useRef<HTMLDivElement>(null);
  useEffect(() => {
    aviso.current?.focus();
  }, []);

  const nomes = reserva.recursoIds.map((id) => recursos.find((r) => r.id === id)?.nome ?? `Recurso ${id}`);

  return (
    <div className={estilos.pagina}>
      <Aviso tipo="sucesso" ref={aviso}>
        <strong>{titulo(reserva.estado)}</strong>
        <dl className={estilos.resumo}>
          <div>
            <dt>Título</dt>
            <dd>{reserva.titulo}</dd>
          </div>
          <div>
            <dt>Quando</dt>
            <dd>{formatarIntervalo(reserva.inicio, reserva.fim, FUSO_DO_CAMPUS)}</dd>
          </div>
          <div>
            <dt>Recursos</dt>
            <dd>{nomes.join(', ')}</dd>
          </div>
        </dl>
        {reserva.estado === 'SOLICITADA' && (
          <p className={estilos.linha}>Um Responsável vai analisar o pedido. Acompanhe em Minhas reservas.</p>
        )}
      </Aviso>
      <div className={estilos.acoes}>
        <Link to="/reservas" className={`${botoes.botao} ${botoes.primario}`}>
          Ver minhas reservas
        </Link>
        <Botao variante="secundario" onClick={aoFazerOutra}>
          Fazer outra reserva
        </Botao>
      </div>
    </div>
  );
}
