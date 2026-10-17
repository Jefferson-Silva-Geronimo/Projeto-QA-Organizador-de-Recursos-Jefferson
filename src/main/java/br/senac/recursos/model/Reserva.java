package br.senac.recursos.model;

import java.time.Instant;
import java.util.List;

/** Reserva como gravada, com os recursos que ela ocupa. */
public record Reserva(long id, long solicitanteId, String titulo, String descricao, Instant inicio, Instant fim,
                EstadoReserva estado, boolean exigeAprovacao, String motivo, List<Long> recursoIds) {

    public Periodo periodo() {
        return new Periodo(inicio, fim);
    }
}
