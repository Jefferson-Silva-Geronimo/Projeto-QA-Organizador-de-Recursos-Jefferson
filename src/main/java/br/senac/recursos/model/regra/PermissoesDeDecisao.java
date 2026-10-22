package br.senac.recursos.model.regra;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Instant;

/** Esqueleto do cálculo de {@code podeAprovar} e {@code podeRejeitar}; o comportamento nasce no commit verde. */
public record PermissoesDeDecisao(boolean podeAprovar, boolean podeRejeitar) {

    public static PermissoesDeDecisao de(Reserva reserva, Perfil perfil, long atorId, Instant agora) {
        return new PermissoesDeDecisao(false, false);
    }
}
