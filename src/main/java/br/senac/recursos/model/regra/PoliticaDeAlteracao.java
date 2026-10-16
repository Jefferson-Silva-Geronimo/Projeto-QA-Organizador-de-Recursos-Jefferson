package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.model.EstadoReserva;
import java.time.Instant;
import java.util.Optional;

/** Quem altera a reserva, em que estado e até quando (RN-19, D10). */
public final class PoliticaDeAlteracao {

    private PoliticaDeAlteracao() {
    }

    /** Devolve o código da recusa, ou vazio se a alteração é permitida. */
    public static Optional<CodigoErro> avaliar(EstadoReserva estado, boolean dono, Instant agora, Instant inicio) {
        if (estado == EstadoReserva.EM_USO || estado.terminal()) {
            return Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
        }
        if (!dono) {
            return Optional.of(CodigoErro.ACESSO_NEGADO);
        }
        if (!agora.isBefore(inicio)) {
            return Optional.of(CodigoErro.RESERVA_JA_INICIADA);
        }
        return Optional.empty();
    }
}
