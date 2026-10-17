package br.senac.recursos.dto;

import br.senac.recursos.model.Bloqueio;
import java.time.Instant;
import java.util.List;

public record BloqueioResposta(long id, long recursoId, Instant inicio, Instant fim, String motivo, boolean ativo,
                        List<Long> reservasCanceladas) {
    public static BloqueioResposta de(Bloqueio r, List<Long> canceladas) {
        return new BloqueioResposta(r.id(), r.recursoId(), r.inicio(), r.fim(), r.motivo(), r.ativo(),
                canceladas);
    }
}
