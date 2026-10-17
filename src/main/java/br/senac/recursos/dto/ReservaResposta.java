package br.senac.recursos.dto;

import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Reserva;
import java.time.Instant;
import java.util.List;

public record ReservaResposta(long id, long solicitanteId, String titulo, String descricao, Instant inicio,
                       Instant fim, EstadoReserva estado, boolean exigeAprovacao, String motivo,
                       List<Long> recursoIds) {
    public static ReservaResposta de(Reserva r) {
        return new ReservaResposta(r.id(), r.solicitanteId(), r.titulo(), r.descricao(), r.inicio(), r.fim(),
                r.estado(), r.exigeAprovacao(), r.motivo(), r.recursoIds());
    }
}
