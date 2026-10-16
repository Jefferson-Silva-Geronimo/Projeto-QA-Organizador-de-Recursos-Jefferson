package br.senac.recursos.service;

import br.senac.recursos.model.Notificacao;
import java.time.Instant;

/**
 * Porta do provedor de notificação (RF-11, ADR-007). O serviço depende só desta interface: trocar o
 * provedor altera o adaptador, não o serviço nem o contrato da API (CEN-08).
 */
public interface NotificadorExterno {

    /** Resultado do envio, já classificado. O corpo da resposta do provedor nunca sai do adaptador. */
    enum Resultado {
        /** O provedor aceitou a notificação. */
        ENVIADA,
        /** O provedor recusou de forma definitiva (erro 4xx). Não adianta repetir. */
        RECUSADA,
        /** Falha temporária: erro 5xx, tempo esgotado ou rede. Pode ser reenviada. */
        FALHA_TEMPORARIA
    }

    Resultado enviar(Notificacao notificacao, Instant instante);
}
