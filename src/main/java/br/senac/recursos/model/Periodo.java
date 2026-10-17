package br.senac.recursos.model;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import java.time.Instant;
import java.util.Objects;

/**
 * Período semiaberto [início, fim) (RN-11). O término é posterior ao início (RN-01).
 * Vale para reserva e para bloqueio de manutenção. Dois períodos conflitam se, e somente se,
 * {@code inicioA < fimB} e {@code inicioB < fimA}.
 */
public record Periodo(Instant inicio, Instant fim) {

    public Periodo {
        Objects.requireNonNull(inicio, "inicio");
        Objects.requireNonNull(fim, "fim");
        if (!fim.isAfter(inicio)) {
            throw new ErroDeNegocio(CodigoErro.PERIODO_INVALIDO);
        }
    }

    public boolean sobrepoe(Periodo outro) {
        return inicio.isBefore(outro.fim) && outro.inicio.isBefore(fim);
    }
}
