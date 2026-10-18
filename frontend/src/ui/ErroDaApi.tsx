import type { Ref } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { mensagemPara } from '@/erros/mensagens';
import estilos from '@/ui/ErroDaApi.module.css';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';

interface Props {
  erro: unknown;
  /** Quando existe, mostra o botão "Tentar de novo". */
  aoTentarDeNovo?: () => void;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Mostra uma falha da API como mensagem compreensível com ação sugerida (RF-13). O texto vem da tabela de códigos
 * estáveis; o texto cru do servidor nunca chega à tela. Falha que não é da API usa a mensagem genérica.
 */
export function ErroDaApi({ erro, aoTentarDeNovo, ref }: Props) {
  const { mensagem, acao } = erro instanceof ErroDeApi ? erro.mensagem : mensagemPara('');
  return (
    <Aviso tipo="erro" ref={ref}>
      <p className={estilos.linha}>{mensagem}</p>
      <p className={estilos.linha}>{acao}</p>
      {aoTentarDeNovo && (
        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={aoTentarDeNovo}>
            Tentar de novo
          </Botao>
        </div>
      )}
    </Aviso>
  );
}
