package br.senac.recursos.dto;

import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.ReservaDaFila;
import br.senac.recursos.model.regra.PermissoesDeDecisao;
import java.time.Instant;
import java.util.List;

/**
 * Item da fila de aprovações: a reserva e o nome do solicitante, sem o e-mail (F6-06b), e o que o Responsável logado
 * pode decidir agora.
 */
public record ReservaDaFilaResposta(long id, long solicitanteId, String solicitanteNome, String titulo,
                                    String descricao, Instant inicio, Instant fim, EstadoReserva estado,
                                    boolean exigeAprovacao, String motivo, List<Long> recursoIds,
                                    boolean podeAprovar, boolean podeRejeitar) {
    public static ReservaDaFilaResposta de(ReservaDaFila item, PermissoesDeDecisao permissoes) {
        var r = item.reserva();
        return new ReservaDaFilaResposta(r.id(), r.solicitanteId(), item.solicitanteNome(), r.titulo(),
                r.descricao(), r.inicio(), r.fim(), r.estado(), r.exigeAprovacao(), r.motivo(), r.recursoIds(),
                permissoes.podeAprovar(), permissoes.podeRejeitar());
    }
}
