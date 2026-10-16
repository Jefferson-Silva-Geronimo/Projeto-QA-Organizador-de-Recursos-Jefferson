package br.senac.recursos.dto;

import br.senac.recursos.model.Movimentacao;
import br.senac.recursos.model.TipoMovimentacao;
import java.time.Instant;

/** Retirada ou devolução no histórico da reserva. */
public record MovimentacaoResposta(long id, long materialId, TipoMovimentacao tipo, long registradoPorId,
                                   Instant registradoEm) {

    public static MovimentacaoResposta de(Movimentacao m) {
        return new MovimentacaoResposta(m.id(), m.materialId(), m.tipo(), m.registradoPorId(), m.registradoEm());
    }
}
