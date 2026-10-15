package br.senac.recursos.dominio;

import java.time.Instant;
import java.util.Optional;

/** Esqueleto da fatia 4.3: ainda permite tudo. */
public final class PoliticaDeCancelamento {

    private PoliticaDeCancelamento() {
    }

    /** Devolve o código da recusa, ou vazio se o cancelamento é permitido. */
    public static Optional<CodigoErro> avaliar(EstadoReserva estado, Perfil ator, boolean dono,
                                               Instant agora, Instant inicio, boolean comMotivo) {
        return Optional.empty();
    }
}
