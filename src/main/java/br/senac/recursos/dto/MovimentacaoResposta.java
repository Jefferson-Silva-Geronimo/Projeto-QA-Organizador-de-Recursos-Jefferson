package br.senac.recursos.dto;

import br.senac.recursos.model.Movimentacao;
import br.senac.recursos.model.TipoMovimentacao;
import java.time.Instant;

/**
 * Retirada ou devolução no histórico da reserva, com o nome (nunca o e-mail) de quem registrou. {@code atual} diz se
 * esta é a movimentação mais recente do material: a tela lê o campo e não interpreta a sequência (F6-16).
 */
public record MovimentacaoResposta(long id, long materialId, TipoMovimentacao tipo, boolean atual,
                                   long registradoPorId, String registradoPorNome, Instant registradoEm) {

    public static MovimentacaoResposta de(Movimentacao m, boolean atual) {
        return new MovimentacaoResposta(m.id(), m.materialId(), m.tipo(), atual, m.registradoPorId(),
                m.registradoPorNome(), m.registradoEm());
    }
}
