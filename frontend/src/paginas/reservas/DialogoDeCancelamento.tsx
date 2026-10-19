import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import estilos from '@/paginas/reservas/DialogoDeCancelamento.module.css';
import { useCancelarReserva } from '@/reservas/cancelar';
import type { Reserva } from '@/reservas/criar';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  reserva: Reserva;
  aoFechar: () => void;
  aoCancelada: (reserva: Reserva) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

/** Confirmação antes de cancelar. O motivo é opcional na tela: se o servidor o exigir, a recusa diz isso (RN-18). */
export function DialogoDeCancelamento({ reserva, aoFechar, aoCancelada, retorno, alternativa }: Props) {
  const [motivo, setMotivo] = useState('');
  const cancelar = useCancelarReserva(reserva.id);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (cancelar.isError) {
      alerta.current?.focus();
    }
  }, [cancelar.isError, cancelar.submittedAt]);

  const motivoRecusado =
    cancelar.error instanceof ErroDeApi &&
    (cancelar.error.problema.code === 'MOTIVO_OBRIGATORIO' ||
      (cancelar.error.problema.code === 'VALIDACAO_FALHOU' && cancelar.error.problema.campos.includes('motivo')));

  const confirmar = (evento: FormEvent) => {
    evento.preventDefault();
    if (cancelar.isPending) {
      return;
    }
    const texto = motivo.trim();
    cancelar.mutate(texto ? { motivo: texto } : {}, { onSuccess: (cancelada) => aoCancelada(cancelada) });
  };

  return (
    <Dialogo
      titulo="Cancelar esta reserva?"
      descricao={`A reserva "${reserva.titulo}" continua na lista, como cancelada, para consulta.`}
      aoFechar={aoFechar}
      ocupado={cancelar.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <form onSubmit={confirmar} noValidate className={estilos.formulario}>
        {cancelar.isError && <ErroDaApi erro={cancelar.error} ref={alerta} />}
        <Campo
          rotulo="Motivo"
          ajuda="Obrigatório quando quem cancela é um Responsável ou um Administrador."
          erro={motivoRecusado ? 'Informe o motivo.' : undefined}
        >
          {(c) => <textarea {...c} value={motivo} onChange={(e) => setMotivo(e.target.value)} />}
        </Campo>
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={cancelar.isPending} textoCarregando="Cancelando…">
            Confirmar cancelamento
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={cancelar.isPending}>
            Voltar
          </Botao>
        </div>
      </form>
    </Dialogo>
  );
}
