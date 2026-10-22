import { useEffect, useRef, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import estilos from '@/paginas/catalogo/DialogoDeDesativacao.module.css';
import type { Recurso } from '@/recursos/consulta';
import { useDesativarRecurso } from '@/recursos/gestao';
import { Botao } from '@/ui/Botao';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  recurso: Recurso;
  aoFechar: () => void;
  aoDesativado: (texto: string) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

/**
 * Confirmação antes de desativar, que não tem volta (RF-02). Quando o servidor recusa por reservas futuras, a
 * mensagem vem da tabela de erros e a lista das reservas afetadas vem em `itens`: o front a mostra, não a calcula.
 */
export function DialogoDeDesativacao({ recurso, aoFechar, aoDesativado, retorno, alternativa }: Props) {
  const desativar = useDesativarRecurso(recurso.id);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (desativar.isError) {
      alerta.current?.focus();
    }
  }, [desativar.isError, desativar.submittedAt]);

  const afetadas =
    desativar.error instanceof ErroDeApi && desativar.error.problema.code === 'RECURSO_COM_RESERVA_FUTURA'
      ? desativar.error.problema.itens
      : [];

  const confirmar = () => {
    if (desativar.isPending) {
      return;
    }
    desativar.mutate(undefined, { onSuccess: () => aoDesativado(`Recurso "${recurso.nome}" desativado.`) });
  };

  return (
    <Dialogo
      titulo="Desativar este recurso?"
      descricao={`O recurso "${recurso.nome}" será desativado.`}
      aoFechar={aoFechar}
      ocupado={desativar.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <div className={estilos.corpo}>
        {desativar.isError && <ErroDaApi erro={desativar.error} ref={alerta} />}
        {afetadas.length > 0 && <p className={estilos.afetadas}>Reservas afetadas: {afetadas.map((id) => `nº ${id}`).join(', ')}</p>}
        <div className={estilos.acoes}>
          <Botao onClick={confirmar} carregando={desativar.isPending} textoCarregando="Desativando…">
            Confirmar desativação
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={desativar.isPending}>
            Voltar
          </Botao>
        </div>
      </div>
    </Dialogo>
  );
}
