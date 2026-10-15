package br.senac.recursos.dominio;

import java.time.Instant;
import java.util.Optional;

/** Esqueleto da fatia 4.3: ainda permite tudo. */
public final class PoliticaDeAlteracao {

    private PoliticaDeAlteracao() {
    }

    /** Devolve o código da recusa, ou vazio se a alteração é permitida. */
    public static Optional<CodigoErro> avaliar(EstadoReserva estado, boolean dono, Instant agora, Instant inicio) {
        return Optional.empty();
    }
}
