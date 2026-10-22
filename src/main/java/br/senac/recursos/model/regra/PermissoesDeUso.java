package br.senac.recursos.model.regra;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/** Esqueleto do cálculo de {@code podeIniciar}, {@code podeConcluir} e {@code podeMarcarNaoComparecimento}; o comportamento nasce no commit verde. */
public record PermissoesDeUso(boolean podeIniciar, boolean podeConcluir, boolean podeMarcarNaoComparecimento) {

    public static PermissoesDeUso de(Reserva reserva, Perfil perfil, boolean haMaterialPendente,
                                     Optional<Duration> tolerancia, Instant agora) {
        return new PermissoesDeUso(false, false, false);
    }
}
