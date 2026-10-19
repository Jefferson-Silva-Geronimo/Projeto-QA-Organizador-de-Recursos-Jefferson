import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartaoDeReserva } from '@/paginas/reservas/CartaoDeReserva';
import estilos from '@/paginas/reservas/PaginaDeReservas.module.css';
import { useReservas } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { Aviso } from '@/ui/Aviso';
import botoes from '@/ui/Botao.module.css';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 reserva' : `${total} reservas`;
}

/**
 * Reservas (T04, RF-04). O servidor decide quais reservas o perfil vê (RN-26) e o front as mostra na ordem recebida.
 * Reserva cancelada continua na lista, com o estado e o motivo (RN-27).
 */
export function PaginaDeReservas() {
  const reservas = useReservas();
  const [cancelada, setCancelada] = useState<Reserva | null>(null);
  const aviso = useRef<HTMLDivElement>(null);

  // O botão que abriu o diálogo deixa de existir quando a reserva é cancelada: o foco vai para a confirmação.
  useEffect(() => {
    if (cancelada) {
      aviso.current?.focus();
    }
  }, [cancelada]);

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Reservas</h1>
      {cancelada && (
        <Aviso tipo="sucesso" ref={aviso}>
          Reserva "{cancelada.titulo}" cancelada.
        </Aviso>
      )}
      {reservas.isPending && <Carregando texto="Carregando reservas…" />}
      {reservas.isError && <ErroDaApi erro={reservas.error} aoTentarDeNovo={() => void reservas.refetch()} />}
      {reservas.isSuccess && (
        <>
          <p className={estilos.contagem}>{contagem(reservas.data.length)}</p>
          {reservas.data.length === 0 ? (
            <EstadoVazio titulo="Nenhuma reserva ainda">
              Busque um recurso livre e faça a sua primeira reserva.{' '}
              <Link to="/buscar" className={`${botoes.botao} ${botoes.primario}`}>
                Buscar recursos
              </Link>
            </EstadoVazio>
          ) : (
            <div className={estilos.grade}>
              {reservas.data.map((reserva) => (
                <CartaoDeReserva key={reserva.id} reserva={reserva} aoCancelada={setCancelada} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
