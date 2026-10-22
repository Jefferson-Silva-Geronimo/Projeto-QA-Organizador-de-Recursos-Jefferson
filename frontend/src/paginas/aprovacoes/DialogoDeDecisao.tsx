import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { useDecidirReserva, type TipoDeDecisao } from '@/aprovacoes/decidir';
import type { ItemDaFila } from '@/aprovacoes/consulta';
import estilos from '@/paginas/aprovacoes/DialogoDeDecisao.module.css';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  tipo: TipoDeDecisao;
  item: ItemDaFila;
  aoFechar: () => void;
  aoDecidida: () => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

const TEXTOS = {
  aprovar: {
    titulo: 'Aprovar esta solicitação?',
    verbo: 'aprovada',
    confirmar: 'Confirmar aprovação',
    enviando: 'Aprovando…',
  },
  rejeitar: {
    titulo: 'Rejeitar esta solicitação?',
    verbo: 'rejeitada',
    confirmar: 'Confirmar rejeição',
    enviando: 'Rejeitando…',
  },
} as const;

/**
 * Confirmação antes de aprovar ou rejeitar (RF-07). Na rejeição o motivo é obrigatório (RN-24) e a tela não envia o
 * pedido sem ele; o servidor continua decidindo e a recusa dele aparece pela tabela de erros (ADR-004).
 */
export function DialogoDeDecisao({ tipo, item, aoFechar, aoDecidida, retorno, alternativa }: Props) {
  const [motivo, setMotivo] = useState('');
  const [semMotivo, setSemMotivo] = useState(false);
  const decidir = useDecidirReserva(item.id, tipo);
  const alerta = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const textos = TEXTOS[tipo];

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (decidir.isError) {
      alerta.current?.focus();
    }
  }, [decidir.isError, decidir.submittedAt]);

  const motivoRecusado =
    decidir.error instanceof ErroDeApi &&
    (decidir.error.problema.code === 'MOTIVO_OBRIGATORIO' ||
      (decidir.error.problema.code === 'VALIDACAO_FALHOU' && decidir.error.problema.campos.includes('motivo')));

  const confirmar = (evento: FormEvent) => {
    evento.preventDefault();
    if (decidir.isPending) {
      return;
    }
    const texto = motivo.trim();
    if (tipo === 'rejeitar' && !texto) {
      setSemMotivo(true);
      campo.current?.focus();
      return;
    }
    decidir.mutate(texto ? { motivo: texto } : {}, { onSuccess: aoDecidida });
  };

  return (
    <Dialogo
      titulo={textos.titulo}
      descricao={`A solicitação "${item.titulo}", de ${item.solicitanteNome}, será ${textos.verbo}.`}
      aoFechar={aoFechar}
      ocupado={decidir.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <form onSubmit={confirmar} noValidate className={estilos.formulario}>
        {decidir.isError && <ErroDaApi erro={decidir.error} ref={alerta} />}
        <Campo
          rotulo="Motivo"
          obrigatorio={tipo === 'rejeitar'}
          ajuda={tipo === 'aprovar' ? 'Opcional.' : undefined}
          erro={semMotivo || motivoRecusado ? 'Informe o motivo.' : undefined}
        >
          {(c) => (
            <textarea
              {...c}
              ref={campo}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setSemMotivo(false);
              }}
            />
          )}
        </Campo>
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={decidir.isPending} textoCarregando={textos.enviando}>
            {textos.confirmar}
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={decidir.isPending}>
            Voltar
          </Botao>
        </div>
      </form>
    </Dialogo>
  );
}
