import { useEffect, useRef, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import type { ConfirmacaoDeUso } from '@/paginas/retiradas/CartaoDeUso';
import estilos from '@/paginas/retiradas/DialogoDeUso.module.css';
import { useRecursosDaReserva } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { useRegistrarUso } from '@/reservas/uso';
import { Botao } from '@/ui/Botao';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  tipo: ConfirmacaoDeUso;
  reserva: Reserva;
  aoFechar: () => void;
  aoRegistrado: (texto: string) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

const TEXTOS = {
  concluir: {
    titulo: 'Concluir esta reserva?',
    descricao: (t: string) => `A reserva "${t}" será concluída.`,
    confirmar: 'Confirmar conclusão',
    enviando: 'Concluindo…',
    resultado: (t: string) => `Reserva "${t}" concluída.`,
    acao: 'conclusao',
  },
  'nao-comparecimento': {
    titulo: 'Marcar como não compareceu?',
    descricao: (t: string) => `A reserva "${t}" será marcada como não compareceu.`,
    confirmar: 'Confirmar não comparecimento',
    enviando: 'Marcando…',
    resultado: (t: string) => `Reserva "${t}" marcada como não compareceu.`,
    acao: 'nao-comparecimento',
  },
} as const;

/**
 * Confirmação antes de concluir ou marcar não compareceu, que são irreversíveis (RN-21, RN-23). O servidor continua
 * decidindo: a recusa aparece pela tabela de erros, e MATERIAL_PENDENTE traz o nome dos materiais que faltam devolver.
 */
export function DialogoDeUso({ tipo, reserva, aoFechar, aoRegistrado, retorno, alternativa }: Props) {
  const registro = useRegistrarUso(reserva.id);
  const recursos = useRecursosDaReserva(reserva.recursoIds);
  const alerta = useRef<HTMLDivElement>(null);
  const textos = TEXTOS[tipo];

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (registro.isError) {
      alerta.current?.focus();
    }
  }, [registro.isError, registro.submittedAt]);

  const pendentes =
    registro.error instanceof ErroDeApi && registro.error.problema.code === 'MATERIAL_PENDENTE'
      ? registro.error.problema.itens.map((id) => recursos.find((r) => String(r.id) === id)?.recurso?.nome ?? `Recurso ${id}`)
      : [];

  const confirmar = () => {
    if (registro.isPending) {
      return;
    }
    registro.mutate({ acao: textos.acao }, { onSuccess: () => aoRegistrado(textos.resultado(reserva.titulo)) });
  };

  return (
    <Dialogo
      titulo={textos.titulo}
      descricao={textos.descricao(reserva.titulo)}
      aoFechar={aoFechar}
      ocupado={registro.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <div className={estilos.corpo}>
        {registro.isError && <ErroDaApi erro={registro.error} ref={alerta} />}
        {pendentes.length > 0 && <p className={estilos.pendentes}>Pendentes: {pendentes.join(', ')}</p>}
        <div className={estilos.acoes}>
          <Botao onClick={confirmar} carregando={registro.isPending} textoCarregando={textos.enviando}>
            {textos.confirmar}
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={registro.isPending}>
            Voltar
          </Botao>
        </div>
      </div>
    </Dialogo>
  );
}
